import { motion } from 'framer-motion'
import type { StudentState, EmotionalState } from '../../store/sessionStore'
import { EngagementBar } from './EngagementBar'

interface Props {
  student: StudentState
  showBubble?: boolean
}

const EMOTION_EMOJI: Record<EmotionalState, string> = {
  eager: '🙋',
  confused: '😕',
  curious: '🤔',
  distracted: '😵',
  anxious: '😰',
  bored: '😴',
  engaged: '😊',
  frustrated: '😤',
}

const EMOTION_BORDER: Record<EmotionalState, string> = {
  confused: 'border-yellow-400',
  curious: 'border-cyan-400',
  bored: 'border-gray-500',
  engaged: 'border-green-400',
  frustrated: 'border-red-400',
  eager: 'border-purple-400',
  anxious: 'border-orange-400',
  distracted: 'border-gray-400',
}

const AVATAR_COLORS: Record<string, string> = {
  maya: 'bg-purple-600',
  carlos: 'bg-orange-600',
  jake: 'bg-blue-600',
  priya: 'bg-pink-600',
  marcus: 'bg-teal-600',
}

// Normalize 0-1 float to 0-100 integer
function normalize(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

export function StudentAvatar({ student, showBubble = false }: Props) {

  const borderColor = EMOTION_BORDER[student.emotional_state] ?? 'border-gray-500'
  const avatarBg = AVATAR_COLORS[student.id] ?? 'bg-gray-600'
  const engagement = normalize(student.engagement)
  const comprehension = normalize(student.comprehension)

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
          animate={showBubble ? {
            boxShadow: ['0 0 0px #ffffff00', '0 0 14px #ffffff99', '0 0 0px #ffffff00'],
            scale: [1, 1.07, 1],
          } : { boxShadow: '0 0 0px #ffffff00', scale: 1 }}
          transition={{ duration: 0.9, repeat: showBubble ? 2 : 0 }}
        >
          {student.name.charAt(0)}
        </motion.div>
        {/* Emotion badge */}
        <div className="absolute -bottom-1 -right-1 text-base">
          {EMOTION_EMOJI[student.emotional_state] ?? '😐'}
        </div>
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-white">{student.name}</span>

      {/* Bars */}
      <div className="w-full space-y-1">
        <EngagementBar label="Engagement" value={engagement} emotion={student.emotional_state} />
        <EngagementBar label="Comprehension" value={comprehension} emotion={student.emotional_state} />
      </div>

    </motion.div>
  )
}
