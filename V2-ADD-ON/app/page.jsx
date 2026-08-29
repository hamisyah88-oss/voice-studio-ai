"use client";

import { useState } from "react";
import App from "./Voice-Studio-AI-V1-MASTER.jsx";
import VoiceToVoice from "../voice-to-voice/VoiceToVoice.jsx";

export default function Page() {
  const [mode, setMode] = useState("create");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-lg">
              🎙️
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">
                VOICE STUDIO AI
              </h1>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Studio suara untuk membuat voice over
              </p>
            </div>
          </div>

          <nav className="flex shrink-0 items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900 p-1">

            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                mode === "create"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              ✨ Create
            </button>

            <button
              type="button"
              onClick={() => setMode("voice-to-voice")}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                mode === "voice-to-voice"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🎚️ Voice to Voice
            </button>

          </nav>
        </div>
      </header>

      {mode === "create" ? (
        <App />
      ) : (
        <VoiceToVoice />
      )}
    </div>
  );
}
