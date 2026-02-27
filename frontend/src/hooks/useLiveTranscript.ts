import { useState, useRef, useCallback } from 'react'

interface UseLiveTranscriptResult {
  interimText: string
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
}

export function useLiveTranscript(): UseLiveTranscriptResult {
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!isSupported) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor: typeof SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript
      }
      setInterimText(interim)
    }

    recognition.onerror = () => {
      setInterimText('')
    }

    recognitionRef.current = recognition
    setInterimText('')
    recognition.start()
  }, [isSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  return { interimText, isSupported, startListening, stopListening }
}
