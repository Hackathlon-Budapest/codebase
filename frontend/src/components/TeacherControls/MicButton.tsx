import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveTranscript } from '../../hooks/useLiveTranscript'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useSessionStore } from '../../store/sessionStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  sendTeacherInput: (text: string) => void
}

export function MicButton({ sendTeacherInput }: Props) {
  const { displayText, isListening, startListening, stopListening, error: speechError } = useLiveTranscript()
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder()
  const isProcessing = useSessionStore((s) => s.isProcessing)
  const isConnected = useSessionStore((s) => s.isConnected)

  const [confirmedText, setConfirmedText] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [textInput, setTextInput] = useState('')
  const confirmedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear confirmed text after 5 seconds
  useEffect(() => {
    if (confirmedText) {
      if (confirmedTimerRef.current) clearTimeout(confirmedTimerRef.current)
      confirmedTimerRef.current = setTimeout(() => setConfirmedText(null), 5000)
    }
    return () => {
      if (confirmedTimerRef.current) clearTimeout(confirmedTimerRef.current)
    }
  }, [confirmedText])

  const handleMicClick = async () => {
    if (isListening) {
      const webSpeechText = stopListening()      // sync — instant Web Speech text
      setConfirmedText(webSpeechText || null)    // show preview immediately

      const audio_base64 = await stopRecording() // finalize audio chunks (~100ms)
      if (!audio_base64) {
        if (webSpeechText) sendTeacherInput(webSpeechText)  // fallback
        return
      }

      setIsSending(true)
      ;(async () => {  // fire-and-forget — doesn't block the UI
        try {
          const res = await fetch(`${API_URL}/stt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_base64 }),
          })
          const data = await res.json()
          const finalText = data.text?.trim() || webSpeechText
          if (finalText) {
            setConfirmedText(finalText)
            sendTeacherInput(finalText)
          }
        } catch {
          if (webSpeechText) sendTeacherInput(webSpeechText)  // fallback on error
        } finally {
          setIsSending(false)
        }
      })()
    } else {
      setConfirmedText(null)
      startListening()
      await startRecording()
    }
  }

  const handleTextSend = () => {
    const trimmed = textInput.trim()
    if (!trimmed) return
    sendTeacherInput(trimmed)
    setTextInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTextSend()
  }

  const busy = isProcessing || isSending
  const disabled = busy || !isConnected

  const label = isListening
    ? 'Recording… tap to send'
    : isSending
    ? 'Sending to class…'
    : isProcessing
    ? 'Processing…'
    : !isConnected
    ? 'Connecting…'
    : 'Tap to speak'

  const showTranscriptBox = isListening || isSending || !!confirmedText

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Mic button */}
      <motion.button
        onClick={handleMicClick}
        disabled={disabled}
        whileTap={{ scale: 0.92 }}
        animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={isListening ? { duration: 1, repeat: Infinity } : {}}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : disabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-classroom-accent hover:bg-blue-500 text-white'
          }
        `}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? '⏹' : '🎤'}
      </motion.button>

      <span className="text-xs text-gray-400">{label}</span>

      {/* Live transcript panel */}
      <AnimatePresence>
        {showTranscriptBox && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <div className="rounded-lg border border-classroom-border bg-classroom-bg p-3 text-sm space-y-1">
              {isListening && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-gray-400">Listening…</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed min-h-[1.25rem]">
                    {displayText ? (
                      <>
                        {displayText}
                        <span className="inline-block w-0.5 h-3.5 bg-gray-300 ml-0.5 align-middle animate-pulse" />
                      </>
                    ) : (
                      <span className="text-gray-600 italic">
                        Waiting for speech
                        <span className="inline-block w-0.5 h-3.5 bg-gray-600 ml-0.5 align-middle animate-pulse" />
                      </span>
                    )}
                  </p>
                </>
              )}

              {confirmedText && !isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-xs text-green-400 font-medium">✓ Sent</span>
                  <p className="text-gray-200 leading-relaxed mt-0.5">{confirmedText}</p>
                </motion.div>
              )}

              {isSending && (
                <div className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    📡
                  </motion.span>
                  <span className="text-xs text-gray-400">Sending to class…</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(micError || speechError) && (
        <p className="text-xs text-red-400">{micError ?? speechError}</p>
      )}

      {/* Text input fallback */}
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Or type here…"
          className="flex-1 min-w-0 bg-classroom-bg border border-classroom-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-classroom-accent transition-colors disabled:opacity-40"
        />
        <button
          onClick={handleTextSend}
          disabled={disabled || !textInput.trim()}
          className="px-3 py-2 rounded-lg bg-classroom-accent hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}
