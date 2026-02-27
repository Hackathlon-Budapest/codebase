import { motion } from 'framer-motion'
import type { EmotionalState } from '../../store/sessionStore'

interface Props {
  label: string
  value: number  // 0-100
  emotion: EmotionalState
}

const EMOTION_COLORS: Record<EmotionalState, string> = {
  eager: '#facc15',
  confused: '#f59e0b',
  distracted: '#f97316',
  anxious: '#a78bfa',
  bored: '#6b7280',
  engaged: '#22c55e',
  frustrated: '#ef4444',
}

export function EngagementBar({ label, value, emotion }: Props) {
  const color = EMOTION_COLORS[emotion]

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-classroom-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
