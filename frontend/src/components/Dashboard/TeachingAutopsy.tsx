import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useSessionStore, AutopsyAnnotation, AutopsyStudentImpact } from '../../store/sessionStore'

const STUDENT_COLORS: Record<string, string> = {
  Maya:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Carlos: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Jake:   'bg-cyan-500/20   text-cyan-300   border-cyan-500/30',
  Priya:  'bg-pink-500/20   text-pink-300   border-pink-500/30',
  Marcus: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const STUDENT_INITIALS: Record<string, string> = {
  Maya: 'M', Carlos: 'C', Jake: 'J', Priya: 'P', Marcus: 'Mc',
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-green-400',
  negative: 'bg-red-400',
  neutral:  'bg-gray-500',
}

const IMPACT_BORDER: Record<string, string> = {
  positive: 'border-green-500/50',
  negative: 'border-red-500/50',
  neutral:  'border-gray-600/50',
  mixed:    'border-yellow-500/50',
}

const IMPACT_BADGE: Record<string, string> = {
  positive: 'bg-green-500/15 text-green-400',
  negative: 'bg-red-500/15   text-red-400',
  neutral:  'bg-gray-500/15  text-gray-400',
  mixed:    'bg-yellow-500/15 text-yellow-400',
}

const IMPACT_LABEL: Record<string, string> = {
  positive: 'Positive',
  negative: 'Negative',
  neutral:  'Neutral',
  mixed:    'Mixed',
}

function StudentImpactChip({ impact }: { impact: AutopsyStudentImpact }) {
  const colorClass = STUDENT_COLORS[impact.student] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  const dotClass   = SENTIMENT_DOT[impact.sentiment] ?? 'bg-gray-500'
  const initial    = STUDENT_INITIALS[impact.student] ?? impact.student.charAt(0)

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${colorClass}`}>
      <span className="font-bold w-6 shrink-0">{initial}</span>
      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="leading-relaxed">{impact.impact}</span>
    </div>
  )
}

function TurnCard({ annotation, index }: { annotation: AutopsyAnnotation; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const borderClass = IMPACT_BORDER[annotation.overall_impact] ?? 'border-gray-600/50'
  const badgeClass  = IMPACT_BADGE[annotation.overall_impact]  ?? 'bg-gray-500/15 text-gray-400'
  const badgeLabel  = IMPACT_LABEL[annotation.overall_impact]  ?? annotation.overall_impact

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border rounded-xl overflow-hidden ${borderClass} bg-classroom-surface`}
    >
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        {/* Turn number */}
        <span className="shrink-0 text-xs font-mono text-gray-500 pt-0.5">T{annotation.turn}</span>

        {/* Teacher text */}
        <span className="flex-1 text-sm text-gray-200 leading-snug">
          &ldquo;{annotation.teacher_text}&rdquo;
        </span>

        {/* Impact badge */}
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>

        {/* Chevron */}
        <span className={`shrink-0 text-gray-500 text-xs mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Student impact grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {annotation.student_impacts.map((impact) => (
                  <StudentImpactChip key={impact.student} impact={impact} />
                ))}
              </div>

              {/* Coaching tip */}
              {annotation.tip && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <span className="shrink-0 font-bold">Tip</span>
                  <span className="leading-relaxed">{annotation.tip}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TeachingAutopsy() {
  const autopsy = useSessionStore((s) => s.autopsy)

  if (!autopsy || autopsy.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No autopsy data available. This may happen if the session had no teacher turns.
      </div>
    )
  }

  const positiveCount = autopsy.filter((a) => a.overall_impact === 'positive').length
  const negativeCount = autopsy.filter((a) => a.overall_impact === 'negative').length
  const mixedCount    = autopsy.filter((a) => a.overall_impact === 'mixed').length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-gray-400">{autopsy.length} turns analysed</span>
        <span className="text-green-400">{positiveCount} positive</span>
        <span className="text-yellow-400">{mixedCount} mixed</span>
        <span className="text-red-400">{negativeCount} negative</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        {(['Maya', 'Carlos', 'Jake', 'Priya', 'Marcus'] as const).map((name) => (
          <span
            key={name}
            className={`px-2 py-0.5 rounded border ${STUDENT_COLORS[name]}`}
          >
            {name}
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> positive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> negative
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> neutral
        </span>
      </div>

      {/* Turn cards */}
      <div className="space-y-2">
        {autopsy.map((annotation, i) => (
          <TurnCard key={annotation.turn} annotation={annotation} index={i} />
        ))}
      </div>
    </div>
  )
}
