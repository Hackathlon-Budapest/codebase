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

export function EngagementTimeline() {
  const engagementHistory = useSessionStore((s) => s.engagementHistory)

  // Normalize 0-1 floats to 0-100 if needed
  const chartData = engagementHistory.map((snapshot) => ({
    time: `T${snapshot.turn}`,
    maya: snapshot.maya <= 1 ? Math.round(snapshot.maya * 100) : Math.round(snapshot.maya),
    carlos: snapshot.carlos <= 1 ? Math.round(snapshot.carlos * 100) : Math.round(snapshot.carlos),
    jake: snapshot.jake <= 1 ? Math.round(snapshot.jake * 100) : Math.round(snapshot.jake),
    priya: snapshot.priya <= 1 ? Math.round(snapshot.priya * 100) : Math.round(snapshot.priya),
    marcus: snapshot.marcus <= 1 ? Math.round(snapshot.marcus * 100) : Math.round(snapshot.marcus),
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
