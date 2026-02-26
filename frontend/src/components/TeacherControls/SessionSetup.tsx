import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'

const GRADE_OPTIONS = [
  'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
  'Grade 10', 'Grade 11', 'Grade 12',
]

const TOPIC_SUGGESTIONS = [
  'The Water Cycle',
  'Fractions and Decimals',
  'The American Revolution',
  'Photosynthesis',
  'The Solar System',
  'World War II',
  'Supply and Demand',
  'DNA and Genetics',
]

export function SessionSetup() {
  const { topic, grade_level, setTopic, setGradeLevel, startSession } = useSessionStore()
  const [error, setError] = useState<string | null>(null)

  const handleStart = () => {
    if (!topic.trim() || !grade_level) {
      setError('Please enter a topic and select a grade level.')
      return
    }
    setError(null)
    // TODO: replace with real API call once backend is running
    startSession('test-session-123')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-8"
    >
      <div className="w-full max-w-lg bg-classroom-surface border border-classroom-border rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">TeachLab</h1>
          <p className="text-gray-400">AI Classroom Simulator — practice teaching with 5 virtual students</p>
        </div>

        {/* Topic input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lesson Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Water Cycle"
            className="w-full bg-classroom-bg border border-classroom-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-classroom-accent transition-colors"
          />
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mt-2">
            {TOPIC_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="text-xs px-2 py-1 rounded-full bg-classroom-border text-gray-400 hover:text-white hover:bg-classroom-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grade level */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Grade Level
          </label>
          <div className="flex flex-wrap gap-2">
            {GRADE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGradeLevel(g)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  grade_level === g
                    ? 'bg-classroom-accent border-classroom-accent text-white'
                    : 'bg-classroom-bg border-classroom-border text-gray-400 hover:border-gray-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-3 rounded-xl bg-classroom-accent hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
        >
          Start Class
        </button>

        {/* Student preview */}
        <div className="mt-6 pt-6 border-t border-classroom-border">
          <p className="text-xs text-gray-500 mb-3">Your 5 students today:</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { name: 'Maya', emoji: '⚡', desc: 'Eager' },
              { name: 'Carlos', emoji: '🌍', desc: 'ESL' },
              { name: 'Jake', emoji: '🎮', desc: 'Distracted' },
              { name: 'Priya', emoji: '🌸', desc: 'Anxious' },
              { name: 'Marcus', emoji: '🔍', desc: 'Skeptic' },
            ].map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-1">
                <span className="text-xl">{s.emoji}</span>
                <span className="text-xs font-medium text-gray-300">{s.name}</span>
                <span className="text-xs text-gray-500">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}