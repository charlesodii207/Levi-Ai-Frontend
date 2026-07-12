"use client";

import { motion } from "framer-motion";

function Glow({
  size,
  opacity,
  duration,
  blur,
}: {
  size: number;
  opacity: number;
  duration: number;
  blur: number;
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.08, 1],
        opacity: [opacity, opacity + 0.08, opacity],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.10) 40%, transparent 75%)",
        filter: `blur(${blur}px)`,
      }}
    />
  );
}

export default function BackgroundGlow() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Glow size={250} opacity={0.28} duration={3} blur={40} />
      <Glow size={500} opacity={0.18} duration={5} blur={70} />
      <Glow size={850} opacity={0.08} duration={7} blur={120} />
    </div>
  );
}