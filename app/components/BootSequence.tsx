"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const commands = [
  "Initializing Intelligence",
  "Authenticating Core",
  "Loading Memory",
  "Establishing Neural Link",
];

export default function BootSequence() {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    if (currentLine >= commands.length) return;

    const text = commands[currentLine];
    let index = 0;

    setTyping("");

    const interval = setInterval(() => {
      index++;

      setTyping(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);

        setTimeout(() => {
          setDisplayed((prev) => [...prev, text]);
          setTyping("");
          setCurrentLine((prev) => prev + 1);
        }, 350);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentLine]);

  return (
    <div
      style={{
        marginTop: 50,
        width: 420,
        fontFamily: "monospace",
        color: "#67ff8b",
        fontSize: 18,
        lineHeight: 2,
      }}
    >
      {displayed.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          ✓ {line}
        </motion.div>
      ))}

      <AnimatePresence>
        {typing && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            &gt; {typing}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
              }}
            >
              █
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}