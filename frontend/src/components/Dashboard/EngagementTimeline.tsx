import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { useSessionStore } from '../../store/sessionStore'
import type { StudentId } from '../../store/sessionStore'

const STUDENT_COLORS: Record<StudentId, string> = {
  maya: '#a78bfa',
  carlos: '#fb923c',
  jake: '#60a5fa',
  priya: '#f472b6',
  marcus: '#34d399',
}

interface DataPoint {
  time: string
  maya?: number
  carlos?: number
  jake?: number
  priya?: number
  marcus?: number
}

export function EngagementTimeline() {
  const timeline = useSessionStore((s) => s.timeline)

  // Build chart data: one point per timeline entry that has engagement data
  const chartData: DataPoint[] = timeline
    .filter((e) => e.engagement !== undefined)
    .map((e, i) => ({
      time: `T${i + 1}`,
      [e.speaker.toLowerCase()]: e.engagement,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No engagement data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3548" />
        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#242938', border: '1px solid #2e3548', borderRadius: 8 }}
          labelStyle={{ color: '#e5e7eb' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {(Object.keys(STUDENT_COLORS) as StudentId[]).map((id) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={STUDENT_COLORS[id]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
