"use client";

import { useEffect, useState } from "react";

export default function Typewriter({
  text,
  speed = 40,
}: {
  text: string;
  speed?: number;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setDisplay(text.slice(0, i + 1));
      i++;

      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p
      style={{
        color: "#9ca3af",
        letterSpacing: "2px",
        fontSize: 18,
      }}
    >
      {display}
      <span className="animate-pulse">▋</span>
    </p>
  );
}