import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import type { StudentId } from '../store/sessionStore'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

// Message shapes from backend (per SETUP.md)
interface StudentResponseMsg {
  type: 'student_response'
  student_id: StudentId
  student_name: string
  text: string
  emotional_state: string
  engagement: number
  comprehension: number
  audio_base64: string | null
}

interface StateUpdateMsg {
  type: 'state_update'
  students: Partial<Record<StudentId, { engagement: number; comprehension: number; emotional_state: string }>>
  coaching_hint?: string | null
}

interface SessionEndMsg {
  type: 'session_end'
  session_id: string
}

interface ErrorMsg {
  type: 'error'
  message: string
}

interface ChaosResolvedMsg {
  type: 'chaos_resolved'
  coaching_hint?: string | null
}

type BackendMessage = StudentResponseMsg | StateUpdateMsg | SessionEndMsg | ErrorMsg | ChaosResolvedMsg

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)

  // Tracks whether any student responded in the current turn
  const hadResponseThisTurnRef = useRef(false)

  // Sequential audio queue — prevents overlapping student voices
  const audioQueueRef = useRef<{ studentId: StudentId; audio: string }[]>([])
  const isPlayingRef = useRef(false)
  // Stored in a ref so the closure inside Audio callbacks always sees the latest version
  const playNextRef = useRef<() => void>()

  const {
    session_id,
    setConnected,
    setProcessing,
    setError,
    updateStudentState,
    applyStateUpdate,
    addConversationEntry,
    endSession,
    setCoachingHint,
    setSpeakingStudent,
    setChaosActive,
    setChaosEvent,
  } = useSessionStore()

  playNextRef.current = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    const item = audioQueueRef.current.shift()!
    isPlayingRef.current = true
    setSpeakingStudent(item.studentId)
    const audio = new Audio(`data:audio/mp3;base64,${item.audio}`)
    const onDone = () => {
      isPlayingRef.current = false
      setSpeakingStudent(null)
      playNextRef.current?.()
    }
    audio.onended = onDone
    audio.onerror = onDone
    audio.play().catch(onDone)
  }

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let msg: BackendMessage
      try {
        msg = JSON.parse(event.data as string) as BackendMessage
      } catch {
        console.error('[WS] Failed to parse message', event.data)
        return
      }

      switch (msg.type) {
        case 'student_response': {
          hadResponseThisTurnRef.current = true
          setProcessing(false)
          updateStudentState(msg.student_id, {
            emotional_state: msg.emotional_state as never,
            engagement: Math.round(msg.engagement * 100),
            comprehension: Math.round(msg.comprehension * 100),
          })
          addConversationEntry({
            timestamp: new Date().toISOString(),
            speaker: msg.student_name,
            text: msg.text,
            emotion: msg.emotional_state as never,
            engagement: Math.round(msg.engagement * 100),
          })
          // Enqueue audio — plays sequentially to prevent overlapping voices
          if (msg.audio_base64) {
            audioQueueRef.current.push({ studentId: msg.student_id, audio: msg.audio_base64 })
            playNextRef.current?.()
          }
          break
        }
        case 'state_update': {
          const scaled: Partial<Record<StudentId, { engagement: number; comprehension: number; emotional_state: string }>> = {}
          for (const [id, s] of Object.entries(msg.students)) {
            if (s) {
              scaled[id as StudentId] = {
                engagement: Math.round(s.engagement * 100),
                comprehension: Math.round(s.comprehension * 100),
                emotional_state: s.emotional_state,
              }
            }
          }
          applyStateUpdate(scaled)
          if (msg.coaching_hint !== undefined) {
            setCoachingHint(msg.coaching_hint ?? null)
          }
          if (!hadResponseThisTurnRef.current) {
            addConversationEntry({
              timestamp: new Date().toISOString(),
              speaker: '—',
              text: 'No one responded.',
            })
          }
          hadResponseThisTurnRef.current = false
          setProcessing(false)
          break
        }
        case 'session_end': {
          endSession()
          break
        }
        case 'error': {
          setError(msg.message)
          setProcessing(false)
          break
        }
        case 'chaos_resolved': {
          setChaosActive(false)
          setChaosEvent(null)
          if (msg.coaching_hint) {
            setCoachingHint(msg.coaching_hint)
          }
          break
        }
      }
    },
    [setProcessing, updateStudentState, addConversationEntry, applyStateUpdate, endSession, setError, setCoachingHint, setSpeakingStudent, setChaosActive, setChaosEvent]
  )

  useEffect(() => {
    if (!session_id) return

    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function open() {
      if (cancelled) return
      const ws = new WebSocket(`${WS_URL}/${session_id}`)

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        setConnected(true)
        setError(null)
      }

      ws.onclose = () => {
        if (cancelled) return
        setConnected(false)
        setProcessing(false)
        reconnectTimer = setTimeout(open, 2000)
      }

      ws.onerror = () => {
        if (cancelled) return
        setError('WebSocket connection error')
      }

      ws.onmessage = handleMessage
      wsRef.current = ws
    }

    open()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [session_id, handleMessage, setConnected, setProcessing, setError])

  const sendTeacherInput = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError('Not connected to backend')
        return
      }
      hadResponseThisTurnRef.current = false
      setProcessing(true)
      setError(null)
      addConversationEntry({
        timestamp: new Date().toISOString(),
        speaker: 'Teacher',
        text,
      })
      wsRef.current.send(
        JSON.stringify({ type: 'teacher_input', session_id, text })
      )
    },
    [session_id, setProcessing, setError, addConversationEntry]
  )

  const sendSessionEnd = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'session_end', session_id }))
    }
  }, [session_id])

  return { sendTeacherInput, sendSessionEnd }
}
