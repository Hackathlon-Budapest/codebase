import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'

export function ChaosOverlay() {
  const chaosActive = useSessionStore((s) => s.chaosActive)
  const chaosEvent = useSessionStore((s) => s.chaosEvent)

  return (
    <AnimatePresence>
      {chaosActive && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-4 z-80 w-100 rounded-xl border-2 p-5 shadow-2xl"
          style={{ borderColor: '#ef4444', backgroundColor: 'rgba(127, 29, 29, 0.9)' }}
        >
          <motion.div
            animate={{ borderColor: ['#ef4444', '#fca5a5', '#ef4444'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-lg border-2 p-4"
            style={{ borderColor: '#ef4444' }}
          >
            <p className="text-red-300 font-bold text-sm tracking-wide">
              🔴 CHAOS MODE
            </p>
            <p className="text-red-200 text-xs mt-1">
              Speak to restore order.
            </p>
            {chaosEvent && (
              <p className="text-red-400 text-xs mt-1 italic leading-tight">{chaosEvent}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
