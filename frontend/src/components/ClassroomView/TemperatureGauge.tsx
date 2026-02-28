import { useMemo } from 'react'

interface TemperatureGaugeProps {
  value: number // 0–100
  label?: string
  size?: number
}

// Semi-circle arc parameters.
// CY is near the top so the bottom semi-circle (bowl shape) fits inside the viewBox.
const CX = 100
const CY = 100
const R = 75
const CIRCUMFERENCE = Math.PI * R // half circumference for a 180° arc

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

// sweep-flag=1 → clockwise in SVG (y-down) → arc curves DOWN from left to right = bowl/speedometer shape
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

// Arc from 180° (left endpoint) clockwise through bottom (bowl) to 0° (right endpoint)
const ARC_PATH = arcPath(CX, CY, R, 180, 0)

function valueToColor(value: number): string {
  if (value <= 33) return '#ef4444'   // red
  if (value <= 66) return '#f59e0b'   // orange
  return '#22c55e'                    // green
}

export function TemperatureGauge({ value, label = 'Engagement', size = 200 }: TemperatureGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const height = Math.round(size * 116 / 200)

  const { dashOffset, color } = useMemo(() => {
    // stroke-dashoffset trick: full offset = no arc shown, 0 = full arc shown
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE
    return {
      dashOffset: offset,
      color: valueToColor(clamped),
    }
  }, [clamped])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 200 116"
        width={size}
        height={height}
        aria-label={`${label}: ${clamped}`}
      >
        {/* Background arc */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#2e3548"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease',
          }}
        />

        {/* Center value — inside the bowl, above its deepest point */}
        <text
          x={CX}
          y={80}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="28"
          fontWeight="bold"
          fontFamily="inherit"
        >
          {clamped}
        </text>

        {/* Label — below the number, still inside the bowl */}
        <text
          x={CX}
          y={100}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9ca3af"
          fontSize="10"
          fontFamily="inherit"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
