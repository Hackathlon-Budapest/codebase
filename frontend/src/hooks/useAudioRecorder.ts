import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderResult {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(100)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setError(msg)
    }
  }, [])

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64 ?? null)
        }
        reader.readAsDataURL(blob)

        // Stop all tracks to release mic
        recorder.stream.getTracks().forEach((t) => t.stop())
        mediaRecorderRef.current = null
      }

      recorder.stop()
      setIsRecording(false)
    })
  }, [])

  return { isRecording, startRecording, stopRecording, error }
}
