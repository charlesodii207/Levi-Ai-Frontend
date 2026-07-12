"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  useEffect(() => {
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => clearTimeout(finishTimer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 50%, #0A0D14 0%, #050608 75%)",
      }}
    >
      {/* Logo mark */}
      <div style={{ position: "relative", width: 168, height: 168 }}>
        {/* Blue swoosh - settles first, tiny shake, then holds */}
        <motion.img
          src="/logo_blue.png"
          alt=""
          initial={{ opacity: 0, x: -3, rotate: -2 }}
          animate={{
            opacity: 1,
            x: [-3, 2, -1.5, 0.5, 0],
            rotate: [-2, 1.4, -0.8, 0.3, 0],
          }}
          transition={{
            opacity: { duration: 0.3 },
            x: { duration: 0.6, delay: 0.1, ease: "easeOut" },
            rotate: { duration: 0.6, delay: 0.1, ease: "easeOut" },
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 14px rgba(59,130,246,0.35))",
          }}
        />

        {/* Gold swoosh - settles just after the blue one */}
        <motion.img
          src="/logo_gold.png"
          alt=""
          initial={{ opacity: 0, x: 3, rotate: 2 }}
          animate={{
            opacity: 1,
            x: [3, -2, 1.5, -0.5, 0],
            rotate: [2, -1.4, 0.8, -0.3, 0],
          }}
          transition={{
            opacity: { duration: 0.3, delay: 0.35 },
            x: { duration: 0.6, delay: 0.45, ease: "easeOut" },
            rotate: { duration: 0.6, delay: 0.45, ease: "easeOut" },
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 14px rgba(212,175,55,0.35))",
          }}
        />
      </div>
    </motion.div>
  );
}
