# NEBULITH Backend API Smoke Test Script
# Usage: powershell -ExecutionPolicy Bypass -File scripts/smoke_api.ps1 -BaseUrl "http://localhost:8000"

param (
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NEBULITH API Smoke Test: $BaseUrl" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Assert-Step([string]$name, [scriptblock]$check) {
    Write-Host "[TEST] $name ... " -NoNewline
    try {
        & $check
        Write-Host "PASS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL: $_" -ForegroundColor Red
        throw $_
    }
}

# 1. Health check
Assert-Step "GET /health" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    if ($res.status -ne "healthy") { throw "Expected status=healthy, got $($res.status)" }
    if (-not $res.version) { throw "Missing version in health response" }
}

# 2. RAG Config
Assert-Step "GET /api/v1/rag/config" {
    $cfg = Invoke-RestMethod -Uri "$BaseUrl/api/v1/rag/config" -Method Get
    if (-not $cfg.embedding_model) { throw "Missing embedding_model in config" }
    Write-Host "(active_llm: $($cfg.active_llm_provider), real_llm: $($cfg.is_real_llm_configured)) " -NoNewline -ForegroundColor Gray
}

# 3. Documents list (initial)
Assert-Step "GET /api/v1/documents?limit=10" {
    $docs = Invoke-RestMethod -Uri "$BaseUrl/api/v1/documents?limit=10" -Method Get
    if ($null -eq $docs) { throw "Documents list returned null" }
}

# 4. Upload multipart documents
$docId = $null
Assert-Step "POST /api/v1/documents (multipart upload)" {
    $tempCsv = [System.IO.Path]::GetTempFileName() + ".csv"
    $csvContent = @"
site_id,latitude,longitude,mean_temp_k,pressure_mbar,lithology
Olympus_Basin,18.65,-133.8,215,6.2,olivine-rich basalt
"@
    Set-Content -Path $tempCsv -Value $csvContent -Encoding utf8

    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        $fileBytes = [System.IO.File]::ReadAllBytes($tempCsv)
        $fileHeader = "--$boundary$LF" +
                      "Content-Disposition: form-data; name=`"files`"; filename=`"olympus_basin.csv`"$LF" +
                      "Content-Type: text/csv$LF$LF"
        $fileFooter = "$LF--$boundary--$LF"

        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($fileHeader)
        $footerBytes = [System.Text.Encoding]::UTF8.GetBytes($fileFooter)

        $bodyBytes = [byte[]]::new($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
        [System.Buffer]::BlockCopy($headerBytes, 0, $bodyBytes, 0, $headerBytes.Length)
        [System.Buffer]::BlockCopy($fileBytes, 0, $bodyBytes, $headerBytes.Length, $fileBytes.Length)
        [System.Buffer]::BlockCopy($footerBytes, 0, $bodyBytes, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)

        $res = Invoke-RestMethod -Uri "$BaseUrl/api/v1/documents" `
                                -Method Post `
                                -ContentType "multipart/form-data; boundary=$boundary" `
                                -Body $bodyBytes

        if (-not $res.documents -or $res.documents.Count -lt 1) {
            throw "No documents returned in upload response"
        }
        $script:docId = $res.documents[0].id
        if (-not $script:docId) {
            $script:docId = $res.documents[0].document_id
        }
        if (-not $script:docId) {
            throw "Failed to obtain document ID from upload response"
        }
    }
    finally {
        if (Test-Path $tempCsv) { Remove-Item $tempCsv -Force }
    }
}

# 5. Document status polling
Assert-Step "GET /api/v1/documents/{id}/status" {
    Start-Sleep -Seconds 1
    $status = Invoke-RestMethod -Uri "$BaseUrl/api/v1/documents/$($script:docId)/status" -Method Get
    if (-not $status.status) { throw "Missing status in status response" }
    Write-Host "(status: $($status.status), progress: $($status.progress)) " -NoNewline -ForegroundColor Gray
}

# 6. RAG Query
Assert-Step "POST /api/v1/rag/query" {
    $queryBody = @{
        question = "What is the surface temperature and pressure?"
        document_ids = @($script:docId)
        top_k = 5
    } | ConvertTo-Json

    $ragRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/rag/query" `
                               -Method Post `
                               -ContentType "application/json" `
                               -Body $queryBody

    if (-not $ragRes.answer) { throw "Missing answer in RAG response" }
    Write-Host "(answer length: $($ragRes.answer.Length), citations: $($ragRes.citations.Count)) " -NoNewline -ForegroundColor Gray
}

# 7. Parameter extraction
Assert-Step "POST /api/v1/documents/{id}/extract" {
    $extractRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/documents/$($script:docId)/extract" `
                                    -Method Post `
                                    -ContentType "application/json"

    if ($null -eq $extractRes.found_parameters_count) {
        throw "Missing found_parameters_count in extraction response"
    }
    Write-Host "(found: $($extractRes.found_parameters_count), missing: $($extractRes.missing_parameters_count)) " -NoNewline -ForegroundColor Gray
}

# 8. Query extracted parameters
Assert-Step "GET /api/v1/documents/{id}/parameters" {
    $params = Invoke-RestMethod -Uri "$BaseUrl/api/v1/documents/$($script:docId)/parameters" -Method Get
    if ($null -eq $params) { throw "Parameters response returned null" }
}

# 9. Delete document cleanup
Assert-Step "DELETE /api/v1/documents/{id}" {
    $del = Invoke-WebRequest -Uri "$BaseUrl/api/v1/documents/$($script:docId)" -Method Delete
    if ($del.StatusCode -ne 204) { throw "Expected status 204, got $($del.StatusCode)" }
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   All NEBULITH API Smoke Tests Passed Successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
