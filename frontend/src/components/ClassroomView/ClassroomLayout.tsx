import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import type { StudentId, StudentState } from '../../store/sessionStore'
import { StudentAvatar } from './StudentAvatar'
import { TemperatureGauge } from './TemperatureGauge'

interface SlotProps {
  student: StudentState
  lastMessage?: string
}

function StudentSlot({ student, lastMessage }: SlotProps) {
  const speakingStudentId = useSessionStore((s) => s.speakingStudentId)
  const isCurrentlySpeaking = speakingStudentId === student.id
  const [showBubble, setShowBubble] = useState(false)

  // Show immediately on audio start; linger 3 s after audio ends
  useEffect(() => {
    if (isCurrentlySpeaking) {
      setShowBubble(true)
      return
    }
    const t = setTimeout(() => setShowBubble(false), 3000)
    return () => clearTimeout(t)
  }, [isCurrentlySpeaking])

  return (
    <div className="flex flex-col items-center">
      {/* Reserved bubble area — always 96px tall, bubble anchors to its bottom */}
      <div className="h-24 w-52 flex items-end">
        <AnimatePresence>
          {showBubble && lastMessage && (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full bg-gray-800 text-gray-100 text-xs rounded-lg p-2 shadow-xl border border-gray-600 pointer-events-none"
            >
              <p className="whitespace-normal break-words leading-relaxed">{lastMessage}</p>
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 border-r border-b border-gray-600 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <StudentAvatar student={student} showBubble={showBubble} />
    </div>
  )
}

const STUDENT_ORDER: StudentId[] = ['maya', 'carlos', 'jake', 'priya', 'marcus']

export function ClassroomLayout() {
  const students = useSessionStore((s) => s.students)
  const conversation_log = useSessionStore((s) => s.conversation_log)

  const studentList = Object.values(students)
  const avgEngagement = Math.round(
    studentList.reduce((sum, s) => sum + s.engagement, 0) / studentList.length
  )

  // Get last message per student
  const lastMessages: Partial<Record<StudentId, string>> = {}
  for (const entry of [...conversation_log].reverse()) {
    const id = entry.speaker.toLowerCase() as StudentId
    if (STUDENT_ORDER.includes(id) && !lastMessages[id]) {
      lastMessages[id] = entry.text
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Temperature gauge */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs uppercase tracking-widest text-gray-500">Classroom Temperature</div>
        <TemperatureGauge value={avgEngagement} />
      </div>

      {/* Classroom label */}
      <div className="text-xs uppercase tracking-widest text-gray-500">Classroom</div>

      {/* 5-seat grid: 3 front + 2 back */}
      <div className="flex flex-col gap-4">
        {/* Back row: Maya, Carlos, Jake */}
        <div className="flex gap-4 justify-center">
          {STUDENT_ORDER.slice(0, 3).map((id) => (
            <StudentSlot key={id} student={students[id]} lastMessage={lastMessages[id]} />
          ))}
        </div>
        {/* Front row: Priya, Marcus */}
        <div className="flex gap-4 justify-center">
          {STUDENT_ORDER.slice(3).map((id) => (
            <StudentSlot key={id} student={students[id]} lastMessage={lastMessages[id]} />
          ))}
        </div>
      </div>

      {/* Whiteboard / teacher area indicator */}
      <div className="mt-4 w-72 h-2 rounded-full bg-classroom-border opacity-50" />
      <div className="text-xs text-gray-600 -mt-1">Whiteboard</div>
    </div>
  )
}