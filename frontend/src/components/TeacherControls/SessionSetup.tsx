import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'

const GRADE_OPTIONS = [
  'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
  'Grade 10', 'Grade 11', 'Grade 12',
]

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  Science:     ['The Water Cycle', 'The Solar System', 'States of Matter', 'Ecosystems', 'The Scientific Method'],
  Mathematics: ['Fractions and Decimals', 'Algebra Basics', 'Geometry and Shapes', 'Probability', 'Linear Equations'],
  History:     ['The American Revolution', 'World War II', 'Ancient Rome', 'The Renaissance', 'The Cold War'],
  Biology:     ['DNA and Genetics', 'Photosynthesis', 'Cell Division', 'Evolution', 'The Human Body'],
  Physics:     ["Newton's Laws of Motion", 'Electricity and Circuits', 'Waves and Sound', 'Gravity', 'Energy and Work'],
  Economics:   ['Supply and Demand', 'Inflation and Deflation', 'Markets and Competition', 'GDP and Growth', 'Money and Banking'],
  English:     ['Shakespeare and Drama', 'Essay Writing', 'Poetry Analysis', 'Grammar and Punctuation', 'Novel Study'],
}

const SUBJECT_SUGGESTIONS = Object.keys(TOPICS_BY_SUBJECT)

export function SessionSetup() {
  const { topic, grade_level, subject, setTopic, setGradeLevel, setSubject, startSession } = useSessionStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const topicSuggestions = TOPICS_BY_SUBJECT[subject] ?? []

  const handleSubjectSelect = (s: string) => {
    setSubject(s)
    setTopic('')
  }

  const handleStart = async () => {
    if (!topic.trim() || !grade_level) {
      setError('Please enter a topic and select a grade level.')
      return
    }
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'General',
          topic: topic.trim(),
          grade_level,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      startSession(data.session_id)
    } catch (err) {
      setError('Could not connect to backend. Make sure the server is running on port 8000.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
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

        {/* Subject input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Science"
            className="w-full bg-classroom-bg border border-classroom-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-classroom-accent transition-colors"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {SUBJECT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSubjectSelect(s)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  subject === s
                    ? 'bg-classroom-accent text-white'
                    : 'bg-classroom-border text-gray-400 hover:text-white hover:bg-classroom-accent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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
          {topicSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {topicSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    topic === s
                      ? 'bg-classroom-accent text-white'
                      : 'bg-classroom-border text-gray-400 hover:text-white hover:bg-classroom-accent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
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
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-classroom-accent hover:bg-blue-500 text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Starting...' : 'Start Class'}
        </button>

        {/* Student roster */}
        <div className="mt-6 pt-6 border-t border-classroom-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Student Roster</p>
            <span className="text-xs text-gray-600">5 active · 10 coming soon</span>
          </div>

          {/* Active students */}
          <div className="grid grid-cols-5 gap-2 text-center mb-3">
            {[
              { name: 'Maya',   emoji: '⚡', desc: 'Eager' },
              { name: 'Carlos', emoji: '🌍', desc: 'ESL' },
              { name: 'Jake',   emoji: '🎮', desc: 'Distracted' },
              { name: 'Priya',  emoji: '🌸', desc: 'Anxious' },
              { name: 'Marcus', emoji: '🔍', desc: 'Skeptic' },
            ].map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-classroom-bg border border-classroom-accent/40">
                <span className="text-lg">{s.emoji}</span>
                <span className="text-xs font-semibold text-white">{s.name}</span>
                <span className="text-[10px] text-classroom-accent">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Locked placeholder students */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { name: 'Zara',   emoji: '🎨', desc: 'Visual' },
              { name: 'Leo',    emoji: '🏆', desc: 'Type-A' },
              { name: 'Aisha',  emoji: '🌟', desc: 'Perfectionist' },
              { name: 'Tommy',  emoji: '🤫', desc: 'Observer' },
              { name: 'Sofia',  emoji: '💬', desc: 'Social' },
              { name: 'Ethan',  emoji: '📚', desc: 'Needs support' },
              { name: 'Mia',    emoji: '✈️', desc: 'Transfer' },
              { name: 'Daniel', emoji: '😏', desc: 'Contrarian' },
              { name: 'Nia',    emoji: '💪', desc: 'Overconfident' },
              { name: 'Liam',   emoji: '💡', desc: 'Gifted-bored' },
            ].map((s) => (
              <div key={s.name} className="relative flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-classroom-bg border border-classroom-border opacity-45">
                <span className="text-lg">{s.emoji}</span>
                <span className="text-xs font-medium text-gray-500">{s.name}</span>
                <span className="text-[10px] text-gray-600">{s.desc}</span>
                <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-gray-700 text-gray-400 rounded-full px-1 py-px leading-tight">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
