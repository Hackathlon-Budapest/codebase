import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useSessionStore } from '../../store/sessionStore'
import { FeedbackCards } from './FeedbackCards'
import { EngagementTimeline } from './EngagementTimeline'
import { TeachingAutopsy } from './TeachingAutopsy'

export function SessionReport() {
  const { topic, grade_level, subject, conversation_log, students, reset, session_id, feedbackText, feedbackSummary, setFeedback, setAutopsy } = useSessionStore()
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const teacherTurns = conversation_log.filter((e) => e.speaker === 'Teacher')
  const studentTurns = conversation_log.filter((e) => e.speaker !== 'Teacher')

  // Normalize engagement/comprehension: backend sends 0-1, we need 0-100
  const normalizedStudents = Object.fromEntries(
    Object.entries(students).map(([id, s]) => [
      id,
      {
        ...s,
        engagement: s.engagement <= 1 ? Math.round(s.engagement * 100) : Math.round(s.engagement),
        comprehension: s.comprehension <= 1 ? Math.round(s.comprehension * 100) : Math.round(s.comprehension),
      },
    ])
  )

  const fetchFeedback = async () => {
    if (!session_id || feedbackText) return
    setIsFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const response = await fetch(`http://localhost:8000/session/${session_id}/end`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      setFeedback(
        data.feedback?.feedback ?? null,
        data.feedback?.summary ?? null,
      )
      setAutopsy(data.autopsy ?? null)
    } catch (err) {
      setFeedbackError('Could not load feedback from backend.')
      console.error(err)
    } finally {
      setIsFeedbackLoading(false)
    }
  }

  // Auto-fetch feedback on mount if not already loaded
  if (!feedbackText && !isFeedbackLoading && !feedbackError && session_id) {
    fetchFeedback()
  }

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
          {subject ? `${subject} · ` : ''}{topic} · {grade_level} · {teacherTurns.length} teacher turns · {studentTurns.length} student responses
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
          {Object.values(normalizedStudents).map((s) => (
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

      {/* GPT Coaching Feedback */}
      <section className="mb-8 bg-classroom-surface border border-classroom-border rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">AI Coaching Feedback</h2>
        {isFeedbackLoading && (
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-classroom-accent border-t-transparent rounded-full animate-spin" />
            Generating feedback...
          </div>
        )}
        {feedbackError && (
          <p className="text-red-400 text-sm">{feedbackError}</p>
        )}
        {feedbackText && (
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-semibold
            prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1
            prose-strong:text-white prose-strong:font-semibold
            prose-li:text-gray-300 prose-ul:my-1 prose-ol:my-1
            prose-ol:list-decimal prose-ul:list-disc">
            <ReactMarkdown>{feedbackText}</ReactMarkdown>
          </div>
        )}
        {!isFeedbackLoading && !feedbackText && !feedbackError && (
          <p className="text-gray-500 text-sm">No feedback available.</p>
        )}
      </section>

      {/* Teaching Autopsy */}
      <section className="mb-8 bg-classroom-surface border border-classroom-border rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-300 mb-1">Teaching Autopsy</h2>
        <p className="text-xs text-gray-500 mb-4">Turn-by-turn breakdown of what each utterance did to each student.</p>
        {isFeedbackLoading ? (
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-classroom-accent border-t-transparent rounded-full animate-spin" />
            Analysing your lesson...
          </div>
        ) : (
          <TeachingAutopsy />
        )}
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
