import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'

export function WhisperCoach() {
  const coachingHint = useSessionStore((s) => s.coachingHint)

  return (
    <div className="bg-classroom-surface border border-classroom-border rounded-lg p-3">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Whisper Coach</div>
      <div className="min-h-[3rem] flex items-start">
        {coachingHint === null ? (
          <p className="text-xs text-gray-600 italic">Waiting for class activity…</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={coachingHint}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-sm text-white leading-snug"
            >
              {coachingHint}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
