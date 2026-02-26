import { motion } from 'framer-motion'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useSessionStore } from '../../store/sessionStore'

export function MicButton() {
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder()
  const { sendTeacherInput } = useWebSocket()
  const isProcessing = useSessionStore((s) => s.isProcessing)
  const isConnected = useSessionStore((s) => s.isConnected)

  const handleClick = async () => {
    if (isRecording) {
      const audio_base64 = await stopRecording()
      if (audio_base64) {
        // Send audio to backend (backend will do STT)
        // For now send as a placeholder — Dev 2 integrates STT here
        sendTeacherInput('[audio]')
      }
    } else {
      await startRecording()
    }
  }

  const disabled = isProcessing || !isConnected

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
        {isRecording ? '⏹' : '🎤'}
      </motion.button>

      <span className="text-xs text-gray-400">
        {isRecording ? 'Recording… tap to send' : isProcessing ? 'Processing…' : !isConnected ? 'Connecting…' : 'Tap to speak'}
      </span>

      {micError && (
        <p className="text-xs text-red-400">{micError}</p>
      )}
    </div>
  )
}