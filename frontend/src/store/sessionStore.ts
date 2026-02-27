import { create } from 'zustand'

export type EmotionalState = 'eager' | 'confused' | 'distracted' | 'anxious' | 'bored' | 'engaged' | 'frustrated'

export type StudentId = 'maya' | 'carlos' | 'jake' | 'priya' | 'marcus'

export interface StudentState {
  id: StudentId
  name: string
  persona: string
  comprehension: number   // 0-100
  engagement: number      // 0-100
  emotional_state: EmotionalState
  voice_id: string
  response_history: ConversationEntry[]
}

export interface EngagementSnapshot {
  turn: number
  maya: number
  carlos: number
  jake: number
  priya: number
  marcus: number
}

export interface ConversationEntry {
  timestamp: string
  speaker: string
  text: string
  emotion?: EmotionalState
  engagement?: number
}

export type AppView = 'setup' | 'classroom' | 'dashboard'

export interface SessionStore {
  // Session metadata
  session_id: string | null
  topic: string
  grade_level: string
  view: AppView

  // Students
  students: Record<StudentId, StudentState>

  // Conversation log
  conversation_log: ConversationEntry[]
  timeline: ConversationEntry[]
  engagementHistory: EngagementSnapshot[]
  turnCount: number

  // Connection state
  isConnected: boolean
  isProcessing: boolean
  errorMessage: string | null

  // Actions
  setTopic: (topic: string) => void
  setGradeLevel: (grade: string) => void
  startSession: (sessionId: string) => void
  endSession: () => void
  setView: (view: AppView) => void
  setConnected: (connected: boolean) => void
  setProcessing: (processing: boolean) => void
  setError: (message: string | null) => void
  updateStudentState: (studentId: StudentId, updates: Partial<StudentState>) => void
  addConversationEntry: (entry: ConversationEntry) => void
  applyStateUpdate: (students: Partial<Record<StudentId, Partial<StudentState>>>) => void
  addEngagementSnapshot: (snapshot: EngagementSnapshot) => void
  reset: () => void
}

const INITIAL_STUDENTS: Record<StudentId, StudentState> = {
  maya: {
    id: 'maya',
    name: 'Maya',
    persona: 'Eager overachiever — always answers first, asks advanced questions. Gets bored if the pace is too slow.',
    comprehension: 90,
    engagement: 85,
    emotional_state: 'engaged',
    voice_id: 'en-US-JennyNeural',
    response_history: [],
  },
  carlos: {
    id: 'carlos',
    name: 'Carlos',
    persona: 'ESL student — asks for clarification, prefers simpler language. Shuts down if vocabulary is too complex.',
    comprehension: 55,
    engagement: 60,
    emotional_state: 'confused',
    voice_id: 'es-MX-JorgeNeural',
    response_history: [],
  },
  jake: {
    id: 'jake',
    name: 'Jake',
    persona: 'Distracted / ADHD — goes off-topic, needs frequent re-engagement. Responds to enthusiasm and direct callouts.',
    comprehension: 50,
    engagement: 40,
    emotional_state: 'bored',
    voice_id: 'en-US-BrandonNeural',
    response_history: [],
  },
  priya: {
    id: 'priya',
    name: 'Priya',
    persona: 'Anxious / quiet — rarely speaks unless directly called on. Blooms with encouragement, shuts down under pressure.',
    comprehension: 75,
    engagement: 50,
    emotional_state: 'anxious',
    voice_id: 'en-IN-NeerjaNeural',
    response_history: [],
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus',
    persona: 'Skeptical critical thinker — challenges assumptions, tends to debate. Engages when given agency to question things.',
    comprehension: 80,
    engagement: 65,
    emotional_state: 'engaged',
    voice_id: 'en-US-DavisNeural',
    response_history: [],
  },
}

export const useSessionStore = create<SessionStore>((set) => ({
  session_id: null,
  topic: '',
  grade_level: '',
  view: 'setup',
  students: INITIAL_STUDENTS,
  conversation_log: [],
  timeline: [],
  engagementHistory: [],
  turnCount: 0,
  isConnected: false,
  isProcessing: false,
  errorMessage: null,

  setTopic: (topic) => set({ topic }),
  setGradeLevel: (grade_level) => set({ grade_level }),

  startSession: (sessionId) =>
    set({ session_id: sessionId, view: 'classroom', conversation_log: [], timeline: [] }),

  endSession: () => set({ view: 'dashboard', isProcessing: false }),

  setView: (view) => set({ view }),

  setConnected: (isConnected) => set({ isConnected }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (errorMessage) => set({ errorMessage }),

  updateStudentState: (studentId, updates) =>
    set((state) => ({
      students: {
        ...state.students,
        [studentId]: { ...state.students[studentId], ...updates },
      },
    })),

  addConversationEntry: (entry) =>
    set((state) => ({
      conversation_log: [...state.conversation_log, entry],
      timeline: [...state.timeline, entry],
    })),

  applyStateUpdate: (updates) =>
    set((state) => {
      const nextStudents = { ...state.students }
      for (const [id, patch] of Object.entries(updates)) {
        const sid = id as StudentId
        if (nextStudents[sid]) {
          nextStudents[sid] = { ...nextStudents[sid], ...patch }
        }
      }
      const newTurn = state.turnCount + 1
      const snapshot: EngagementSnapshot = {
        turn: newTurn,
        maya: nextStudents.maya.engagement,
        carlos: nextStudents.carlos.engagement,
        jake: nextStudents.jake.engagement,
        priya: nextStudents.priya.engagement,
        marcus: nextStudents.marcus.engagement,
      }
      return {
        students: nextStudents,
        turnCount: newTurn,
        engagementHistory: [...state.engagementHistory, snapshot],
      }
    }),

  addEngagementSnapshot: (snapshot) =>
    set((state) => ({ engagementHistory: [...state.engagementHistory, snapshot] })),

  reset: () =>
    set({
      session_id: null,
      topic: '',
      grade_level: '',
      view: 'setup',
      students: INITIAL_STUDENTS,
      conversation_log: [],
      timeline: [],
      engagementHistory: [],
      turnCount: 0,
      isConnected: false,
      isProcessing: false,
      errorMessage: null,
    }),
}))
