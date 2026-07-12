"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "./components/SplashScreen";
import ChatPage from "./components/ChatPage";
import { isLoggedIn } from "./lib/auth";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handleFinish = () => {
    if (!isLoggedIn()) {
      router.push("/login");
    } else {
      setShowSplash(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleFinish} />;
  }

  return <ChatPage />;
}