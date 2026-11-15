import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'requesting' | 'listening' | 'processing' | 'success' | 'unsupported' | 'error'

const errorMessages: Record<string, string> = {
  'not-allowed': 'Microphone access was denied or blocked. Allow microphone access for this site in your browser and operating-system settings, then try again.',
  'service-not-allowed': 'This browser does not allow its speech service for this site. Check browser privacy settings or try Chrome or Edge.',
  'audio-capture': 'No usable microphone was found. Connect or enable a microphone and try again.',
  'no-speech': 'No speech was detected. Try again and speak after listening starts.',
  network: 'The browser could not reach its speech service. Check your connection; a VPN, proxy, firewall, or privacy extension may also block it. Try Chrome or Edge.',
  aborted: 'Voice recognition was cancelled before it finished.',
  'language-not-supported': 'This browser speech service does not support English (United States).',
  'bad-grammar': 'The browser speech service could not process the recognition grammar.',
  'phrases-not-supported': 'This browser speech service does not support the requested recognition phrases.',
}

export function speechErrorMessage(code: string) {
  return errorMessages[code] ?? `Voice recognition failed (${code || 'unknown error'}). Check microphone access and try again.`
}

function detachRecognition(recognition: SpeechRecognition, abort: boolean) {
  recognition.onstart = null
  recognition.onresult = null
  recognition.onerror = null
  recognition.onend = null
  if (abort) {
    try {
      recognition.abort()
    } catch {
      // The browser may already have ended this recognition session.
    }
  }
}

export function useSpeechRecognition(onFinalTranscript: (transcript: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const callbackRef = useRef(onFinalTranscript)
  const mountedRef = useRef(true)
  const generationRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const attemptTimesRef = useRef<number[]>([])
  callbackRef.current = onFinalTranscript

  const clearRecognitionTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try {
      recognition.stop()
    } catch (caught) {
      const errorName = caught instanceof DOMException ? caught.name : ''
      if (errorName !== 'InvalidStateError') {
        setStatus('error')
        setError('Voice recognition could not stop cleanly. Close the voice panel and try again.')
      }
    }
  }, [])

  const dismiss = useCallback(() => {
    // Invalidate callbacks first, then detach and abort so closing cannot reopen the panel.
    generationRef.current += 1
    clearRecognitionTimeout()
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) detachRecognition(recognition, true)
    setStatus('idle')
    setTranscript('')
    setInterimTranscript('')
    setError('')
  }, [clearRecognitionTimeout])

  const start = useCallback(() => {
    clearRecognitionTimeout()
    const previous = recognitionRef.current
    recognitionRef.current = null
    generationRef.current += 1
    if (previous) detachRecognition(previous, true)

    setTranscript('')
    setInterimTranscript('')
    setError('')
    if (!window.isSecureContext) {
      setStatus('error')
      setError('Microphone access requires a secure connection (HTTPS or localhost).')
      return
    }

    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Constructor) {
      setStatus('unsupported')
      setError('Speech recognition is unavailable in this browser or has been disabled. Try current Chrome or Edge and allow microphone access for the site.')
      return
    }

    const now = Date.now()
    const recentAttempts = attemptTimesRef.current.filter((attempt) => now - attempt < 5000)
    if (recentAttempts.length >= 3) {
      attemptTimesRef.current = recentAttempts
      setStatus('error')
      setError('Too many quick retries. Wait a few seconds before trying voice input again.')
      return
    }
    recentAttempts.push(now)
    attemptTimesRef.current = recentAttempts

    setStatus('requesting')
    try {
      const recognition = new Constructor()
      const generation = generationRef.current
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      const isCurrent = () => mountedRef.current && generation === generationRef.current && recognitionRef.current === recognition
      const armTimeout = () => {
        clearRecognitionTimeout()
        timeoutRef.current = window.setTimeout(() => {
          if (!isCurrent()) return
          generationRef.current += 1
          recognitionRef.current = null
          detachRecognition(recognition, true)
          setStatus('error')
          setError('Voice recognition timed out. Check microphone permission and try again.')
        }, 30000)
      }

      recognition.onstart = () => {
        if (!isCurrent()) return
        setStatus('listening')
        armTimeout()
      }
      recognition.onresult = (event) => {
        if (!isCurrent()) return
        let interim = ''
        let finalText = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          if (result.isFinal) finalText += result[0].transcript
          else interim += result[0].transcript
        }
        setInterimTranscript(interim)
        if (finalText.trim()) {
          const phrase = finalText.trim()
          setTranscript(phrase)
          setInterimTranscript('')
          setStatus('processing')
          callbackRef.current(phrase)
        }
      }
      recognition.onerror = (event) => {
        if (!isCurrent()) return
        console.info('[voice-input] SpeechRecognition error:', event.error)
        clearRecognitionTimeout()
        recognitionRef.current = null
        detachRecognition(recognition, false)
        setStatus('error')
        setError(speechErrorMessage(event.error))
      }
      recognition.onend = () => {
        if (!isCurrent()) return
        clearRecognitionTimeout()
        recognitionRef.current = null
        detachRecognition(recognition, false)
        setStatus((current) => current === 'error' || current === 'unsupported' || current === 'idle' ? current : 'success')
      }

      armTimeout()
      recognition.start()
    } catch (caught) {
      clearRecognitionTimeout()
      const recognition = recognitionRef.current
      recognitionRef.current = null
      if (recognition) detachRecognition(recognition, true)
      const errorName = caught instanceof DOMException ? caught.name : ''
      setStatus('error')
      setError(errorName === 'NotAllowedError'
        ? errorMessages['not-allowed']
        : errorName === 'InvalidStateError'
          ? 'Voice recognition is already starting. Wait a moment and try again.'
          : 'Voice recognition could not start. Check the microphone permission and browser settings, then try again.')
    }
  }, [clearRecognitionTimeout])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      generationRef.current += 1
      clearRecognitionTimeout()
      const recognition = recognitionRef.current
      recognitionRef.current = null
      if (recognition) detachRecognition(recognition, true)
    }
  }, [clearRecognitionTimeout])

  return { status, transcript, interimTranscript, error, start, stop, dismiss }
}
