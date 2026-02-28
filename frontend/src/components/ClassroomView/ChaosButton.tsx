import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'
import type { StudentId } from '../../store/sessionStore'

function playAudioSequentially(clips: { studentId: StudentId; audio: string }[], setSpeaking: (id: StudentId | null) => void) {
  let index = 0
  function playNext() {
    if (index >= clips.length) {
      setSpeaking(null)
      return
    }
    const { studentId, audio } = clips[index++]
    setSpeaking(studentId)
    const el = new Audio(`data:audio/mp3;base64,${audio}`)
    const onDone = () => { setSpeaking(null); playNext() }
    el.onended = onDone
    el.onerror = onDone
    el.play().catch(onDone)
  }
  playNext()
}

export function ChaosButton() {
  const session_id = useSessionStore((s) => s.session_id)
  const addConversationEntry = useSessionStore((s) => s.addConversationEntry)
  const applyStateUpdate = useSessionStore((s) => s.applyStateUpdate)
  const chaosActive = useSessionStore((s) => s.chaosActive)
  const setChaosActive = useSessionStore((s) => s.setChaosActive)
  const setChaosEvent = useSessionStore((s) => s.setChaosEvent)
  const setSpeakingStudent = useSessionStore((s) => s.setSpeakingStudent)

  const [isLoading, setIsLoading] = useState(false)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const injectChaos = async () => {
    if (!session_id || isLoading || chaosActive) return
    setIsLoading(true)

    try {
      const response = await fetch(`http://localhost:8000/session/${session_id}/chaos?event_id=jake_phone`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Chaos injection failed')
      const data = await response.json()

      // Show the event description as a toast
      setLastEvent(data.event.description)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)

      // Set chaos active state
      setChaosActive(true)
      setChaosEvent(data.event.description)

      // Add chaos event to conversation log
      addConversationEntry({
        timestamp: new Date().toISOString(),
        speaker: '[CHAOS]',
        text: data.event.description,
      })

      // Add student reactions to conversation log
      if (data.responders) {
        for (const r of data.responders) {
          if (r.text?.trim()) {
            addConversationEntry({
              timestamp: new Date().toISOString(),
              speaker: r.student_name,
              text: r.text,
            })
          }
        }
      }

      // Apply state updates from chaos reactions
      if (data.responders) {
        const stateUpdate: Record<string, any> = {}
        for (const r of data.responders) {
          stateUpdate[r.student_id] = {
            emotional_state: r.emotional_state,
          }
        }
        applyStateUpdate(stateUpdate)
      }

      // Play student audio clips sequentially
      const audioClips = (data.responders ?? [])
        .filter((r: any) => r.audio_base64)
        .map((r: any) => ({ studentId: r.student_id as StudentId, audio: r.audio_base64 }))
      if (audioClips.length > 0) {
        playAudioSequentially(audioClips, setSpeakingStudent)
      }

    } catch (err) {
      console.error('Chaos injection error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || !session_id || chaosActive

  return (
    <div className="relative">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && lastEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-64 bg-red-900 border border-red-500 text-red-100 text-xs rounded-xl p-3 shadow-xl z-50"
          >
            <p className="font-semibold text-red-300 mb-1">Chaos injected</p>
            <p>{lastEvent}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The button */}
      <motion.button
        onClick={injectChaos}
        disabled={isDisabled}
        whileHover={isDisabled ? {} : { scale: 1.05 }}
        whileTap={isDisabled ? {} : { scale: 0.95 }}
        animate={isLoading ? { opacity: [1, 0.6, 1] } : {}}
        transition={isLoading ? { duration: 0.8, repeat: Infinity } : {}}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg border border-red-400 transition-colors"
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Injecting...
          </>
        ) : chaosActive ? (
          'Chaos Active!'
        ) : (
          'Inject Chaos'
        )}
      </motion.button>
    </div>
  )
}
