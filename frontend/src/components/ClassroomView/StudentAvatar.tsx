import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { StudentState, EmotionalState } from '../../store/sessionStore'
import { EngagementBar } from './EngagementBar'

interface Props {
  student: StudentState
  lastMessage?: string
}

const EMOTION_EMOJI: Record<EmotionalState, string> = {
  curious: '🤔',
  confused: '😕',
  bored: '😴',
  frustrated: '😤',
  engaged: '😊',
}

const EMOTION_BORDER: Record<EmotionalState, string> = {
  curious: 'border-blue-400',
  confused: 'border-yellow-400',
  bored: 'border-gray-500',
  frustrated: 'border-red-400',
  engaged: 'border-green-400',
}

// Simple avatar initials with colored background
const AVATAR_COLORS: Record<string, string> = {
  maya: 'bg-purple-600',
  carlos: 'bg-orange-600',
  jake: 'bg-blue-600',
  priya: 'bg-pink-600',
  marcus: 'bg-teal-600',
}

export function StudentAvatar({ student, lastMessage }: Props) {
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    if (lastMessage) {
      setShowBubble(true)
      const timer = setTimeout(() => setShowBubble(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastMessage])

  const borderColor = EMOTION_BORDER[student.emotional_state]
  const avatarBg = AVATAR_COLORS[student.id] ?? 'bg-gray-600'

  return (
    <motion.div
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-classroom-surface border border-classroom-border w-36"
      animate={showBubble ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar circle */}
      <div className="relative">
        <motion.div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2 ${avatarBg} ${borderColor}`}
          animate={showBubble ? { borderColor: ['#ffffff44', '#ffffffcc', '#ffffff44'] } : {}}
          transition={{ duration: 1.5, repeat: showBubble ? 2 : 0 }}
        >
          {student.name.charAt(0)}
        </motion.div>
        {/* Emotion badge */}
        <div className="absolute -bottom-1 -right-1 text-base">
          {EMOTION_EMOJI[student.emotional_state]}
        </div>
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-white">{student.name}</span>

      {/* Bars */}
      <div className="w-full space-y-1">
        <EngagementBar label="Engagement" value={student.engagement} emotion={student.emotional_state} />
        <EngagementBar label="Comprehension" value={student.comprehension} emotion={student.emotional_state} />
      </div>

      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && lastMessage && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 bg-gray-800 text-gray-100 text-xs rounded-lg p-2 shadow-lg border border-gray-600 z-10 pointer-events-none"
          >
            <p className="line-clamp-3">{lastMessage}</p>
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 border-r border-b border-gray-600 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}