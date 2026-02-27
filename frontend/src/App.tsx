import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from './store/sessionStore'
import { SessionSetup } from './components/TeacherControls/SessionSetup'
import { ClassroomLayout } from './components/ClassroomView/ClassroomLayout'
import { MicButton } from './components/TeacherControls/MicButton'
import { SessionReport } from './components/Dashboard/SessionReport'
import { useWebSocket } from './hooks/useWebSocket'

function ClassroomView() {
  const { topic, grade_level, isConnected, errorMessage, endSession, setError } = useSessionStore()
  const { sendSessionEnd, sendTeacherInput } = useWebSocket()

  const handleEndSession = () => {
    sendSessionEnd()
    endSession()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-classroom-border bg-classroom-surface">
        <div>
          <span className="text-white font-semibold">{topic}</span>
          <span className="text-gray-400 text-sm ml-2">· {grade_level}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-400">{isConnected ? 'Connected' : 'Connecting…'}</span>
          </div>
          <button
            onClick={handleEndSession}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-700 text-red-200 transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Error banner */}
      {errorMessage && (
        <div className="bg-red-900 border-b border-red-700 px-6 py-2 flex items-center justify-between">
          <span className="text-red-200 text-sm">{errorMessage}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Classroom */}
        <div className="flex-1 flex items-center justify-center">
          <ClassroomLayout />
        </div>

        {/* Teacher controls sidebar */}
        <aside className="w-full lg:w-64 bg-classroom-surface border border-classroom-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Teacher Controls</h2>

          <div className="flex flex-col items-center gap-4 flex-1">
            <MicButton sendTeacherInput={sendTeacherInput} />
          </div>

          {/* Quick stats */}
          <QuickStats />
        </aside>
      </main>
    </motion.div>
  )
}

function QuickStats() {
  const students = useSessionStore((s) => s.students)
  const studentList = Object.values(students)
  const avgEng = Math.round((studentList.reduce((a, s) => a + s.engagement, 0) / studentList.length) * (studentList[0]?.engagement <= 1 ? 100 : 1))
  const avgComp = Math.round((studentList.reduce((a, s) => a + s.comprehension, 0) / studentList.length) * (studentList[0]?.comprehension <= 1 ? 100 : 1))

  return (
    <div className="border-t border-classroom-border pt-4 space-y-2 text-sm">
      <div className="flex justify-between text-gray-400">
        <span>Avg Engagement</span>
        <span className="text-white font-medium">{avgEng}%</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>Avg Comprehension</span>
        <span className="text-white font-medium">{avgComp}%</span>
      </div>
    </div>
  )
}

export default function App() {
  const view = useSessionStore((s) => s.view)

  return (
    <AnimatePresence mode="wait">
      {view === 'setup' && <SessionSetup key="setup" />}
      {view === 'classroom' && <ClassroomView key="classroom" />}
      {view === 'dashboard' && <SessionReport key="dashboard" />}
    </AnimatePresence>
  )
}
