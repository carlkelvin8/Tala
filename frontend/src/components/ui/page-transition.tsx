import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"

// ─── Variants ────────────────────────────────────────────────────────────────

export const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const, // expo out — snappy and satisfying
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 0.6] as const },
  },
}

export const itemVariants = {
  initial: { opacity: 0, y: 28, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -32 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const slideInRight = {
  initial: { opacity: 0, x: 32 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.88 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const heroVariants = {
  initial: { opacity: 0, y: 32, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const cardContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

export const cardItemVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const floatVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
      repeat: Infinity,
      repeatType: "reverse" as const,
      repeatDelay: 2,
    },
  },
}

// ─── Components ───────────────────────────────────────────────────────────────

/** Wraps the entire page — handles enter / exit transitions keyed to the route */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={true}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** Hero / page header block */
export function MotionHero({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={heroVariants} className={className}>
      {children}
    </motion.div>
  )
}

/** Generic staggered child item */
export function MotionItem({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Stat / metric card grid — staggers children */
export function MotionCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={cardContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Individual stat card */
export function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Section card / table wrapper */
export function MotionSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Slide in from the left */
export function MotionSlideLeft({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Slide in from the right */
export function MotionSlideRight({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Scale pop-in — great for QR codes, images, modals */
export function MotionScalePop({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Subtle bounce pulse — attention-grabbing badge / icon */
export function MotionPulse({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.06, 1],
        transition: { duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Number counter — animates count from 0 to value */
export function MotionCounter({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className={className}
    >
      {value}
    </motion.span>
  )
}
