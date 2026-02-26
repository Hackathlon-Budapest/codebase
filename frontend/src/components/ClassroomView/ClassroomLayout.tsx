import { useSessionStore } from '../../store/sessionStore'
import type { StudentId } from '../../store/sessionStore'
import { StudentAvatar } from './StudentAvatar'

const STUDENT_ORDER: StudentId[] = ['maya', 'carlos', 'jake', 'priya', 'marcus']

export function ClassroomLayout() {
  const students = useSessionStore((s) => s.students)
  const conversation_log = useSessionStore((s) => s.conversation_log)

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
      {/* Classroom label */}
      <div className="text-xs uppercase tracking-widest text-gray-500">Classroom</div>

      {/* 5-seat grid: 3 front + 2 back */}
      <div className="flex flex-col gap-4">
        {/* Back row: Maya, Carlos, Jake */}
        <div className="flex gap-4 justify-center">
          {STUDENT_ORDER.slice(0, 3).map((id) => (
            <div key={id} className="relative">
              <StudentAvatar student={students[id]} lastMessage={lastMessages[id]} />
            </div>
          ))}
        </div>
        {/* Front row: Priya, Marcus */}
        <div className="flex gap-4 justify-center">
          {STUDENT_ORDER.slice(3).map((id) => (
            <div key={id} className="relative">
              <StudentAvatar student={students[id]} lastMessage={lastMessages[id]} />
            </div>
          ))}
        </div>
      </div>

      {/* Whiteboard / teacher area indicator */}
      <div className="mt-4 w-72 h-2 rounded-full bg-classroom-border opacity-50" />
      <div className="text-xs text-gray-600 -mt-1">Whiteboard</div>
    </div>
  )
}