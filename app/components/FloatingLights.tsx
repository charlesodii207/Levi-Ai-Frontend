"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
};

export default function FloatingLights() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    setParticles(generated);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{
            x: [0, particle.driftX, 0],
            y: [0, particle.driftY, 0],
            opacity: [
              particle.opacity,
              particle.opacity + 0.35,
              particle.opacity,
            ],
            scale: [1, 1.35, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
          style={{
            position: "absolute",
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: "#D4AF37",
            boxShadow: `
              0 0 8px rgba(212,175,55,.9),
              0 0 18px rgba(212,175,55,.55),
              0 0 32px rgba(212,175,55,.25)
            `,
          }}
        />
      ))}
    </div>
  );
}