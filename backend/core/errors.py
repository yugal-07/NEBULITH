from __future__ import annotations

import uuid
from typing import Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from .logging import logger


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: str


class AppException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "internal_error",
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: dict[str, Any] | None = None):
        super().__init__(message=message, code="not_found", status_code=404, details=details)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: dict[str, Any] | None = None):
        super().__init__(message=message, code="validation_error", status_code=422, details=details)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict detected", details: dict[str, Any] | None = None):
        super().__init__(message=message, code="conflict", status_code=409, details=details)


class BadRequestError(AppException):
    def __init__(self, message: str = "Bad request", code: str = "bad_request", details: dict[str, Any] | None = None):
        super().__init__(message=message, code=code, status_code=400, details=details)


class UnsupportedFileTypeError(AppException):
    def __init__(self, message: str = "Unsupported file type", details: dict[str, Any] | None = None):
        super().__init__(message=message, code="unsupported_file_type", status_code=400, details=details)


class FileTooLargeError(AppException):
    def __init__(self, message: str = "File exceeds maximum allowed size", details: dict[str, Any] | None = None):
        super().__init__(message=message, code="file_too_large", status_code=413, details=details)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.warning(f"[{request_id}] AppException: {exc.code} - {exc.message} (status: {exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": request_id,
                }
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        code = "http_error"
        message = str(exc.detail)
        details: dict[str, Any] = {}
        if isinstance(exc.detail, dict):
            code = exc.detail.get("code", code)
            message = exc.detail.get("message", message)
            details = exc.detail.get("details", details)

        logger.warning(f"[{request_id}] HTTPException: {exc.status_code} - {message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details,
                    "request_id": request_id,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        issues = [
            {
                "loc": issue.get("loc", []),
                "msg": issue.get("msg", "Invalid value"),
                "type": issue.get("type", "value_error"),
            }
            for issue in exc.errors()
        ]
        logger.info(f"[{request_id}] RequestValidationError: {issues}")
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request fields did not match the API contract",
                    "details": {"issues": issues},
                    "request_id": request_id,
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.exception(f"[{request_id}] Unhandled error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_error",
                    "message": "An internal server error occurred",
                    "details": {},
                    "request_id": request_id,
                }
            },
        )
