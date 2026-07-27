// lib/motion.ts
// Motion primitives (DG 7.2, 7.3). Springs for anything the user can touch,
// critically damped by default. Bounce is earned: only flicks and drag releases
// use momentum. Presentational reveals use a short spring plus a small rise.
import type { Transition, Variants } from "framer-motion";

// Default spring: critically damped, no overshoot.
export const springUI: Transition = { type: "spring", bounce: 0, duration: 0.35 };

// Momentum spring: a little bounce, reserved for flicks and drag releases.
export const springMomentum: Transition = {
  type: "spring",
  bounce: 0.2,
  duration: 0.4,
};

// Page-load reveal, one orchestrated pass per view (DG 7.3). Parent staggers
// children ~40ms; each child fades in with a 6-10px rise.
export const STAGGER_STEP = 0.04;

export const revealContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 },
  },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: springUI },
};

// Reduced-motion variants: opacity cross-fade only, no rise, no spring overshoot.
export const revealItemReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
};

// Press feedback: instant, subtle scale on pointer-down (DG 7.3).
export const pressScale = { scale: 0.985 };
