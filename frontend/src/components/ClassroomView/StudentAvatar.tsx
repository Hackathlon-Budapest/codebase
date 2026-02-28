import { motion } from 'framer-motion'
import type { StudentState, EmotionalState } from '../../store/sessionStore'
import { EngagementBar } from './EngagementBar'

interface Props {
  student: StudentState
  showBubble?: boolean
}

const AVATAR_IMAGE_MAP: Record<string, Partial<Record<EmotionalState, string>>> = {
  maya: {
    eager: 'maya_engaged', engaged: 'maya_engaged', curious: 'maya_engaged',
    confused: 'maya_frustrated', bored: 'maya_bored',
    distracted: 'maya_bored', anxious: 'maya_frustrated', frustrated: 'maya_frustrated',
  },
  carlos: {
    eager: 'carlos_engaged', engaged: 'carlos_engaged', curious: 'carlos_curious',
    confused: 'carlos_confused', bored: 'carlos_engaged',
    distracted: 'carlos_confused', anxious: 'carlos_confused', frustrated: 'carlos_frustrated',
  },
  jake: {
    eager: 'jake_engaged', engaged: 'jake_engaged', curious: 'jake_curious',
    confused: 'jake_curious', bored: 'jake_bored',
    distracted: 'jake_bored', anxious: 'jake_curious', frustrated: 'jake_frustrated',
  },
  priya: {
    eager: 'priya_engaged', engaged: 'priya_engaged', curious: 'priya_curious',
    confused: 'priya_curious', bored: 'priya_engaged',
    distracted: 'priya_engaged', anxious: 'priya_frustrated', frustrated: 'priya_frustrated',
  },
  marcus: {
    eager: 'marcus_engaged', engaged: 'marcus_engaged', curious: 'marcus_curious',
    confused: 'marcus_curious', bored: 'marcus_bored',
    distracted: 'marcus_bored', anxious: 'marcus_curious', frustrated: 'marcus_frustrated',
  },
}

function getAvatarSrc(studentId: string, emotion: EmotionalState): string {
  const file = AVATAR_IMAGE_MAP[studentId]?.[emotion]
  return file ? `/avatars/${file}.webp` : ''
}

// Normalize 0-1 float to 0-100 integer
function normalize(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

export function StudentAvatar({ student, showBubble = false }: Props) {

  const avatarSrc = getAvatarSrc(student.id, student.emotional_state)
  const engagement = normalize(student.engagement)
  const comprehension = normalize(student.comprehension)

  return (
    <motion.div
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-classroom-surface border border-classroom-border w-40"
      animate={showBubble ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <motion.div
        className={`w-40 h-40 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-bold $`}
        animate={showBubble ? {
          boxShadow: ['0 0 0px #ffffff00', '0 0 14px #ffffff99', '0 0 0px #ffffff00'],
          scale: [1, 1.07, 1],
        } : { boxShadow: '0 0 0px #ffffff00', scale: 1 }}
        transition={{ duration: 0.9, repeat: showBubble ? 2 : 0 }}
      >
        {avatarSrc
          ? <img src={avatarSrc} alt={student.name} className="w-full h-full object-cover object-top" />
          : student.name.charAt(0)
        }
      </motion.div>

      {/* Name */}
      <span className="text-sm font-semibold text-white">{student.name}</span>

      {/* Bars */}
      <div className="w-full space-y-1">
        <EngagementBar label="Engagement" value={engagement} emotion={student.emotional_state} />
        <EngagementBar label="Comprehension" value={comprehension} emotion={student.emotional_state} />
      </div>

    </motion.div>
  )
}
