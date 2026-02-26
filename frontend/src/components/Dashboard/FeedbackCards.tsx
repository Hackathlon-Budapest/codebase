import { motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'

interface FeedbackDimension {
  label: string
  description: string
  score: number  // 0-100
  color: string
}

// Derive scores from session state — simple heuristics for demo
function useScores(): FeedbackDimension[] {
  const students = useSessionStore((s) => s.students)
  const conversation_log = useSessionStore((s) => s.conversation_log)

  const studentList = Object.values(students)
  const avgEngagement = studentList.reduce((a, s) => a + s.engagement, 0) / studentList.length
  const avgComprehension = studentList.reduce((a, s) => a + s.comprehension, 0) / studentList.length

  // Count teacher turns
  const teacherTurns = conversation_log.filter((e) => e.speaker === 'Teacher').length
  const studentTurns = conversation_log.filter((e) => e.speaker !== 'Teacher').length
  const participationRate = teacherTurns > 0 ? Math.min(100, (studentTurns / teacherTurns) * 40) : 0

  // Inclusivity: how many distinct students spoke
  const studentSpeakers = new Set(
    conversation_log.filter((e) => e.speaker !== 'Teacher').map((e) => e.speaker)
  ).size
  const inclusivity = Math.round((studentSpeakers / 5) * 100)

  return [
    {
      label: 'Engagement',
      description: 'Average student engagement across the session',
      score: Math.round(avgEngagement),
      color: '#4f8ef7',
    },
    {
      label: 'Comprehension',
      description: 'How well students understood the material',
      score: Math.round(avgComprehension),
      color: '#22c55e',
    },
    {
      label: 'Participation',
      description: 'Student response rate relative to teacher turns',
      score: Math.round(participationRate),
      color: '#a78bfa',
    },
    {
      label: 'Inclusivity',
      description: 'How many different students participated',
      score: inclusivity,
      color: '#f472b6',
    },
  ]
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="28" fill="none" stroke="#2e3548" strokeWidth="6" />
      <motion.circle
        cx="36"
        cy="36"
        r="28"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {score}
      </text>
    </svg>
  )
}

export function FeedbackCards() {
  const scores = useScores()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {scores.map((dim) => (
        <motion.div
          key={dim.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * scores.indexOf(dim) }}
          className="bg-classroom-surface border border-classroom-border rounded-xl p-4 flex flex-col items-center gap-2"
        >
          <ScoreRing score={dim.score} color={dim.color} />
          <span className="text-sm font-semibold text-white">{dim.label}</span>
          <p className="text-xs text-gray-400 text-center">{dim.description}</p>
        </motion.div>
      ))}
    </div>
  )
}