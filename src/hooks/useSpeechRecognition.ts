import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'requesting' | 'listening' | 'success' | 'unsupported' | 'error'

const errorMessages: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser settings to use voice.',
  'service-not-allowed': 'The browser speech service is not allowed for this site.',
  'audio-capture': 'No usable microphone was found. Connect or enable a microphone and try again.',
  'no-speech': 'No speech was detected. Try again and speak after listening starts.',
  network: 'The browser speech service could not be reached. Check your connection and try again.',
  aborted: 'Voice input was cancelled.',
  'language-not-supported': 'English speech recognition is not supported by this browser.',
}

export function speechErrorMessage(code: string) {
  return errorMessages[code] ?? 'Voice recognition failed. You can continue using the on-screen controls.'
}

export function useSpeechRecognition(onFinalTranscript: (transcript: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const callbackRef = useRef(onFinalTranscript)
  const mountedRef = useRef(true)
  callbackRef.current = onFinalTranscript

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    setTranscript('')
    setInterimTranscript('')
    setError('')
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setStatus('error')
      setError('Microphone access requires a secure connection (HTTPS).')
      return
    }
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Constructor) {
      setStatus('unsupported')
      setError('Voice recognition is not supported in this browser. Use the keyboard, touch, or mouse controls instead.')
      return
    }
    try {
      setStatus('requesting')
      const recognition = new Constructor()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition
      recognition.onstart = () => {
        if (mountedRef.current) setStatus('listening')
      }
      recognition.onresult = (event) => {
        let interim = ''
        let finalText = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          if (result.isFinal) finalText += result[0].transcript
          else interim += result[0].transcript
        }
        if (!mountedRef.current) return
        setInterimTranscript(interim)
        if (finalText.trim()) {
          const phrase = finalText.trim()
          setTranscript(phrase)
          setInterimTranscript('')
          callbackRef.current(phrase)
        }
      }
      recognition.onerror = (event) => {
        if (!mountedRef.current) return
        if (event.error === 'aborted') {
          setStatus('idle')
          return
        }
        setStatus('error')
        setError(speechErrorMessage(event.error))
      }
      recognition.onend = () => {
        if (!mountedRef.current) return
        recognitionRef.current = null
        setStatus((current) => current === 'listening' || current === 'requesting' ? 'success' : current)
      }
      recognition.start()
    } catch {
      recognitionRef.current = null
      setStatus('error')
      setError('Voice recognition could not start. Check microphone permission and try again.')
    }
  }, [])

  return { status, transcript, interimTranscript, error, start, stop }
}
