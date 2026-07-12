"use client";

import { motion } from "framer-motion";

export default function Shine() {
  return (
    <motion.div
      initial={{
        x: -350,
        opacity: 0,
      }}
      animate={{
        x: 350,
        opacity: [0, 0.9, 0],
      }}
      transition={{
        delay: 1.45,
        duration: 0.7,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 70,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,.95), transparent)",
        filter: "blur(10px)",
        transform: "skewX(-20deg)",
        pointerEvents: "none",
      }}
    />
  );
}