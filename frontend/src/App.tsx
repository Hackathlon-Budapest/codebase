import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from './store/sessionStore'
import { SessionSetup } from './components/TeacherControls/SessionSetup'
import { ClassroomLayout } from './components/ClassroomView/ClassroomLayout'
import { WhisperCoach } from './components/ClassroomView/WhisperCoach'
import { MicButton } from './components/TeacherControls/MicButton'
import { ChaosButton } from './components/ClassroomView/ChaosButton'
import { ChaosOverlay } from './components/ClassroomView/ChaosOverlay'
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
          <ChaosButton />
          <button
            onClick={handleEndSession}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-700 text-red-200 transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Chaos overlay */}
      <ChaosOverlay />

      {/* Error banner */}
      {errorMessage && (
        <div className="bg-red-900 border-b border-red-700 px-6 py-2 flex items-center justify-between">
          <span className="text-red-200 text-sm">{errorMessage}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-6 pt-2">
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

          {/* Whisper Coach */}
          <WhisperCoach />
        </aside>
      </main>
    </motion.div>
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
