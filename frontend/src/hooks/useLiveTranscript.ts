import { useState, useRef, useCallback } from 'react'

interface UseLiveTranscriptResult {
  displayText: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => string
}

export function useLiveTranscript(): UseLiveTranscriptResult {
  const [displayText, setDisplayText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTextRef = useRef('')
  const displayTextRef = useRef('')

  // Mirror displayText into a ref so stopListening can read it synchronously
  const updateDisplayText = (text: string) => {
    displayTextRef.current = text
    setDisplayText(text)
  }

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) return

    finalTextRef.current = ''
    updateDisplayText('')
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor: typeof SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      updateDisplayText(finalTextRef.current + interim)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      // Only update listening state if we didn't already stop manually
      if (recognitionRef.current) {
        setIsListening(false)
        recognitionRef.current = null
      }
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }, [isSupported])

  const stopListening = useCallback((): string => {
    const transcript = displayTextRef.current.trim()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    updateDisplayText('')
    finalTextRef.current = ''
    return transcript
  }, [])

  return { displayText, isListening, isSupported, error, startListening, stopListening }
}
