import { motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'
import { FeedbackCards } from './FeedbackCards'
import { EngagementTimeline } from './EngagementTimeline'

export function SessionReport() {
  const { topic, grade_level, conversation_log, students, reset } = useSessionStore()

  const teacherTurns = conversation_log.filter((e) => e.speaker === 'Teacher')
  const studentTurns = conversation_log.filter((e) => e.speaker !== 'Teacher')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Session Report</h1>
        <p className="text-gray-400 mt-1">
          {topic} · {grade_level} · {teacherTurns.length} teacher turns · {studentTurns.length} student responses
        </p>
      </div>

      {/* Score cards */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Performance Overview</h2>
        <FeedbackCards />
      </section>

      {/* Engagement timeline */}
      <section className="mb-8 bg-classroom-surface border border-classroom-border rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Engagement Over Time</h2>
        <EngagementTimeline />
      </section>

      {/* Per-student summary */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Student Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(students).map((s) => (
            <div
              key={s.id}
              className="bg-classroom-surface border border-classroom-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-classroom-border flex items-center justify-center font-bold text-white">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="text-xs text-gray-400 truncate">{s.persona.split('—')[0].trim()}</p>
              </div>
              <div className="text-right text-xs text-gray-400 space-y-1">
                <div>Eng: <span className="text-white font-medium">{s.engagement}%</span></div>
                <div>Comp: <span className="text-white font-medium">{s.comprehension}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conversation log */}
      <section className="mb-8 bg-classroom-surface border border-classroom-border rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Conversation Log</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
          {conversation_log.map((entry, i) => (
            <div key={i} className={`flex gap-2 text-sm ${entry.speaker === 'Teacher' ? 'text-blue-300' : 'text-gray-300'}`}>
              <span className="font-semibold shrink-0 w-20 truncate">{entry.speaker}</span>
              <span className="text-gray-400">{entry.text}</span>
            </div>
          ))}
          {conversation_log.length === 0 && (
            <p className="text-gray-500 text-sm">No conversation recorded.</p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex-1 py-3 rounded-xl bg-classroom-accent hover:bg-blue-500 text-white font-semibold transition-colors"
        >
          Start New Session
        </button>
      </div>
    </motion.div>
  )
}