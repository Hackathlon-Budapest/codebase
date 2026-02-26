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
}

interface SessionEndMsg {
  type: 'session_end'
  session_id: string
}

interface ErrorMsg {
  type: 'error'
  message: string
}

type BackendMessage = StudentResponseMsg | StateUpdateMsg | SessionEndMsg | ErrorMsg

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    session_id,
    setConnected,
    setProcessing,
    setError,
    updateStudentState,
    applyStateUpdate,
    addConversationEntry,
    endSession,
  } = useSessionStore()

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
          // Play audio if provided
          if (msg.audio_base64) {
            const audio = new Audio(`data:audio/mp3;base64,${msg.audio_base64}`)
            audio.play().catch(console.error)
          }
          break
        }
        case 'state_update': {
          applyStateUpdate(msg.students)
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
      }
    },
    [setProcessing, updateStudentState, addConversationEntry, applyStateUpdate, endSession, setError]
  )

  const connect = useCallback(() => {
    if (!session_id) return
    const url = `${WS_URL}/${session_id}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }

    ws.onclose = () => {
      setConnected(false)
      // Attempt reconnect after 2s
      reconnectRef.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      setError('WebSocket connection error')
    }

    ws.onmessage = handleMessage

    wsRef.current = ws
  }, [session_id, handleMessage, setConnected, setError])

  useEffect(() => {
    if (session_id) {
      connect()
    }
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [session_id, connect])

  const sendTeacherInput = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError('Not connected to backend')
        return
      }
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
