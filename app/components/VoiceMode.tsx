"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic } from "lucide-react";

// ── Web Speech API ──────────────────────────────────────────────────────────
// Deliberately typed as `any` here. This API isn't fully standardized yet,
// and TypeScript's bundled DOM lib has its own (often incomplete/differing)
// ambient types for it in some versions — trying to precisely re-type it
// causes cross-file conflicts for no real benefit. `any` sidesteps that.
function getSpeechRecognitionConstructor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block omitted ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*_#>~-]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// Silence gap (ms) after the user stops talking before we treat their turn
// as finished and auto-submit. Long enough to allow natural pauses,
// short enough to feel responsive.
const SILENCE_TIMEOUT_MS = 1200;

type VoiceState = "listening" | "thinking" | "speaking" | "error";

type VoiceModeProps = {
  onClose: () => void;
  // Called with the user's transcribed turn; must resolve with Levi's
  // full reply text once available. The caller (ChatPage) is responsible
  // for actually hitting the backend and updating the visible chat history
  // so the transcript is preserved after voice mode closes.
  onSend: (userText: string) => Promise<string>;
  modelLabel: string;
};

export default function VoiceMode({ onClose, onSend, modelLabel }: VoiceModeProps) {
  const [state, setState] = useState<VoiceState>("listening");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const stateRef = useRef<VoiceState>("listening");
  const closingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startListening = useCallback(() => {
    if (closingRef.current || !recognitionRef.current) return;
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setState("listening");
    try {
      recognitionRef.current.start();
    } catch {
      // start() throws if already started — safe to ignore
    }
  }, []);

  const submitTurn = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        startListening();
        return;
      }

      recognitionRef.current?.stop();
      clearSilenceTimer();
      setState("thinking");

      try {
        const reply = await onSend(trimmed);
        if (closingRef.current) return;

        setLastReply(reply);
        setState("speaking");

        const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(reply));
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => {
          if (!closingRef.current) startListening();
        };
        utterance.onerror = () => {
          if (!closingRef.current) startListening();
        };
        window.speechSynthesis.cancel(); // safety: ensure nothing else queued
        window.speechSynthesis.speak(utterance);
      } catch {
        if (!closingRef.current) {
          setState("error");
          setTimeout(() => { if (!closingRef.current) startListening(); }, 1500);
        }
      }
    },
    [onSend, startListening]
  );

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      // Only accept mic input while we're actually in listening state —
      // guards against any stray results firing during thinking/speaking.
      if (stateRef.current !== "listening") return;

      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) finalTranscriptRef.current += final;
      setLiveTranscript(finalTranscriptRef.current + interim);

      // Reset the silence timer every time speech is detected — the turn
      // only submits once the user has actually stopped talking.
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        submitTurn(finalTranscriptRef.current || interim);
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onerror = () => {
      // "no-speech" fires often and is harmless (just means silence) —
      // recognition restarts naturally via onend in most browsers.
    };

    recognition.onend = () => {
      // If we're still supposed to be listening (e.g. browser auto-stopped
      // after a pause) and we're not mid-turn, restart automatically.
      if (!closingRef.current && stateRef.current === "listening") {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      closingRef.current = true;
      clearSilenceTimer();
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    closingRef.current = true;
    clearSilenceTimer();
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    onClose();
  }

  // Tapping the orb while Levi is speaking interrupts and starts listening immediately.
  function handleOrbTap() {
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      startListening();
    }
  }

  const orbColor =
    state === "listening" ? "#3B82F6" :
    state === "thinking" ? "#D4AF37" :
    state === "speaking" ? "#22C55E" :
    "#EF4444";

  const statusLabel =
    state === "listening" ? "Listening..." :
    state === "thinking" ? "Thinking..." :
    state === "speaking" ? "Speaking..." :
    "Something went wrong — retrying...";

  if (!supported) {
    return (
      <div style={overlayStyle}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Voice mode isn't supported in this browser
          </p>
          <p style={{ color: "#8B9CC4", fontSize: 13, marginBottom: 20 }}>
            Try Levi in Chrome for the full voice experience.
          </p>
          <button onClick={onClose} style={closeButtonStyle}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <button onClick={handleClose} style={{ position: "absolute", top: 24, right: 24, ...closeIconStyle }}>
        <X size={20} />
      </button>

      <p style={{ color: "#3D4F72", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 40 }}>
        {modelLabel.toUpperCase()} · VOICE MODE
      </p>

      <motion.div
        onClick={handleOrbTap}
        animate={{
          scale: state === "listening" ? [1, 1.06, 1] : state === "speaking" ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: state === "thinking" ? 0.3 : 1.4, repeat: state === "thinking" ? 0 : Infinity, ease: "easeInOut" }}
        style={{
          width: 160, height: 160, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${orbColor}55, ${orbColor}15 70%)`,
          border: `1px solid ${orbColor}55`,
          boxShadow: `0 0 60px ${orbColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: state === "speaking" ? "pointer" : "default",
        }}
      >
        {state === "thinking" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: `3px solid ${orbColor}30`,
              borderTopColor: orbColor,
            }}
          />
        ) : (
          <Mic size={40} color={orbColor} />
        )}
      </motion.div>

      <p style={{ color: orbColor, fontSize: 14, fontWeight: 600, marginTop: 28 }}>
        {statusLabel}
      </p>

      <div style={{ maxWidth: 520, textAlign: "center", marginTop: 20, minHeight: 60, padding: "0 24px" }}>
        <AnimatePresence mode="wait">
          {state === "listening" && liveTranscript && (
            <motion.p
              key="transcript"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: "#C9D4EE", fontSize: 15, lineHeight: 1.5 }}
            >
              {liveTranscript}
            </motion.p>
          )}
          {state === "speaking" && lastReply && (
            <motion.p
              key="reply"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: "#8B9CC4", fontSize: 13, lineHeight: 1.5 }}
            >
              {lastReply.length > 200 ? lastReply.slice(0, 200) + "…" : lastReply}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p style={{ color: "#2A3348", fontSize: 11, marginTop: 32 }}>
        Tap the orb to interrupt · Tap ✕ to exit voice mode
      </p>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 100,
  background: "rgba(4,6,12,0.97)",
  backdropFilter: "blur(20px)",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
};

const closeIconStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#8B9CC4", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const closeButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "rgba(59,130,246,0.15)",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 10, color: "#3B82F6",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
