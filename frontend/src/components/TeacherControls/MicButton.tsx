import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useSessionStore } from '../../store/sessionStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function MicButton() {
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder()
  const { sendTeacherInput } = useWebSocket()
  const isProcessing = useSessionStore((s) => s.isProcessing)
  const isConnected = useSessionStore((s) => s.isConnected)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)

  const handleClick = async () => {
    if (isRecording) {
      const audio_base64 = await stopRecording()
      if (!audio_base64) return

      setSttError(null)
      setIsTranscribing(true)
      try {
        const res = await fetch(`${API_URL}/stt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_base64 }),
        })
        const data = await res.json()
        if (data.text?.trim()) {
          sendTeacherInput(data.text.trim())
        } else {
          setSttError('Could not transcribe — please try again')
        }
      } catch {
        setSttError('STT request failed')
      } finally {
        setIsTranscribing(false)
      }
    } else {
      setSttError(null)
      await startRecording()
    }
  }

  const busy = isProcessing || isTranscribing
  const disabled = busy || !isConnected

  const label = isRecording
    ? 'Recording… tap to send'
    : isTranscribing
    ? 'Transcribing…'
    : isProcessing
    ? 'Processing…'
    : !isConnected
    ? 'Connecting…'
    : 'Tap to speak'

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.92 }}
        animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : disabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-classroom-accent hover:bg-blue-500 text-white'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? '⏹' : isTranscribing ? '…' : '🎤'}
      </motion.button>

      <span className="text-xs text-gray-400">{label}</span>

      {(micError || sttError) && (
        <p className="text-xs text-red-400">{micError ?? sttError}</p>
      )}
    </div>
  )
}
