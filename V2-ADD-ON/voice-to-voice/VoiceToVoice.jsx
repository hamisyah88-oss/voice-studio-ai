"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, Download, Mic, RefreshCw, Square, Upload, Volume2, Wand2, X } from "lucide-react";

const VOICES = [
  { id: "guru_wanita", label: "Guru Wanita", icon: "👩‍🏫", note: "Hangat & jelas" },
  { id: "guru_pria", label: "Guru Pria / Dosen", icon: "👨‍🏫", note: "Tegas & profesional" },
  { id: "anak_perempuan", label: "Anak Perempuan", icon: "👧", note: "Ceria & ringan" },
  { id: "anak_lakilaki", label: "Anak Laki-laki", icon: "👦", note: "Aktif & ceria" },
  { id: "kakek", label: "Kakek", icon: "👴", note: "Matang & hangat" },
  { id: "nenek", label: "Nenek", icon: "👵", note: "Lembut & hangat" },
  { id: "creator", label: "Content Creator", icon: "🎙️", note: "Natural & santai" },
  { id: "ustadz", label: "Ustadz", icon: "🕌", note: "Tenang & berwibawa" },
  { id: "ustadzah", label: "Ustadzah", icon: "🧕", note: "Lembut & reflektif" },
];

function mergeFloat32(channels) {
  if (channels.length === 1) return channels[0];
  const length = channels[0].length;
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const channel of channels) sum += channel[i] || 0;
    output[i] = sum / channels.length;
  }
  return output;
}

function encodeWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const samples = mergeFloat32(
    Array.from({ length: audioBuffer.numberOfChannels }, (_, i) => audioBuffer.getChannelData(i))
  );
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset, text) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function normalizeToWav(blob) {
  if (blob.type === "audio/wav" || blob.type === "audio/x-wav") return blob;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return blob;
  const context = new AudioContextClass();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    return encodeWav(decoded);
  } finally {
    await context.close();
  }
}

export default function VoiceToVoice() {
  const [sourceBlob, setSourceBlob] = useState(null);
  const [sourceUrl, setSourceUrl] = useState(null);
  const [target, setTarget] = useState("guru_wanita");
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [sourceUrl, resultUrl]);

  const setSource = (blob) => {
    if (!blob) return;
    if (blob.size > 50 * 1024 * 1024) {
      setMessage("File terlalu besar. Maksimal 50 MB.");
      return;
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setSourceBlob(blob);
    setSourceUrl(URL.createObjectURL(blob));
    setResultBlob(null);
    setResultUrl(null);
    setMessage("Audio siap. Pilih karakter suara lalu klik Ubah Suara.");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setSource(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      recorder.start();
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setMessage("Mikrofon tidak dapat digunakan. Periksa izin browser.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  };

  const convert = async () => {
    if (!sourceBlob) return setMessage("Rekam atau upload suara terlebih dahulu.");
    if (seconds > 300) return setMessage("Audio maksimal 5 menit.");
    setBusy(true);
    setMessage("Menyiapkan audio...");
    try {
      const wavBlob = await normalizeToWav(sourceBlob);
      const form = new FormData();
      form.append("audio", wavBlob, "source.wav");
      form.append("targetVoice", target);

      setMessage("Mengenali ucapan dan membuat suara baru...");
      const response = await fetch("/api/voice-changer", { method: "POST", body: form });
      if (!response.ok) {
        let detail = "Konversi suara gagal.";
        try {
          const json = await response.json();
          detail = json.error || detail;
        } catch {}
        throw new Error(detail);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(url);
      setMessage("Selesai. Dengarkan hasilnya di bawah.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Konversi suara gagal.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    stopRecording();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setSourceBlob(null);
    setSourceUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setSeconds(0);
    setMessage("");
  };

  const selected = VOICES.find((item) => item.id === target) || VOICES[0];
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/20"><AudioLines className="w-5 h-5" /></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Voice-to-Voice Studio</h1>
                <p className="text-xs sm:text-sm text-slate-400">Rekam atau upload → pilih karakter → ubah suara</p>
              </div>
            </div>
          </div>
          <a href="/" className="text-xs sm:text-sm text-slate-400 hover:text-white">← Kembali</a>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-5">
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Mic className="w-4 h-4 text-purple-400" /> 1. Suara asli</h2>
              <span className="text-[11px] text-slate-500">maks. 05:00</span>
            </div>

            <div className="rounded-2xl border border-dashed border-purple-700/50 bg-slate-950/80 p-7 text-center">
              <button onClick={recording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white shadow-xl transition active:scale-95 ${recording ? "bg-rose-600 animate-pulse" : "bg-purple-600 hover:bg-purple-500"}`}>
                {recording ? <Square className="w-7 h-7 fill-current" /> : <Mic className="w-8 h-8" />}
              </button>
              <div className="font-mono text-lg mt-3">{time}</div>
              <p className="text-xs text-slate-400 mt-1">{recording ? "Sedang merekam — klik untuk berhenti" : "Klik mikrofon untuk merekam"}</p>

              <label className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-pointer text-xs font-semibold">
                <Upload className="w-4 h-4" /> Upload Audio
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => setSource(e.target.files?.[0])} />
              </label>
            </div>

            {sourceUrl && (
              <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-300 mb-2"><Volume2 className="w-4 h-4 text-purple-400" /> Preview suara asli</div>
                <audio src={sourceUrl} controls className="w-full h-9" />
              </div>
            )}
          </section>

          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Wand2 className="w-4 h-4 text-purple-400" /> 2. Pilih karakter suara</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VOICES.map((voice) => (
                <button key={voice.id} onClick={() => setTarget(voice.id)} className={`rounded-2xl p-3 text-left border transition ${target === voice.id ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/30" : "bg-slate-950 border-slate-800 hover:border-purple-700/50"}`}>
                  <div className="flex items-center justify-between"><span className="text-xl">{voice.icon}</span>{target === voice.id && <Check className="w-4 h-4 text-purple-300" />}</div>
                  <div className="text-[11px] font-bold mt-2">{voice.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{voice.note}</div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <div className="text-xs text-slate-400">Target saat ini</div>
              <div className="flex items-center gap-2 mt-1 font-semibold">{selected.icon} {selected.label}</div>
              <p className="text-[11px] text-slate-500 mt-1">Suara asli tidak disalin; isi ucapan dibuat ulang dengan karakter suara yang dipilih.</p>
            </div>

            <button onClick={convert} disabled={!sourceBlob || busy} className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20">
              {busy ? <><RefreshCw className="w-5 h-5 animate-spin" /> Memproses...</> : <><Wand2 className="w-5 h-5" /> 3. UBAH SUARA</>}
            </button>
            <button onClick={reset} className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300">Reset</button>
          </section>
        </div>

        {message && <div className="mt-5 rounded-2xl border border-purple-800/40 bg-purple-950/20 px-4 py-3 text-xs text-purple-200">{message}</div>}

        {resultUrl && (
          <section className="mt-5 bg-gradient-to-br from-slate-900 to-purple-950/30 border border-purple-700/50 rounded-3xl p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-purple-400 font-mono">Hasil Voice-to-Voice</div>
                <h2 className="font-bold mt-1">{selected.icon} {selected.label}</h2>
              </div>
              <a href={resultUrl} download="voice-to-voice.wav" className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2.5 rounded-xl text-xs font-semibold"><Download className="w-4 h-4" /> Download WAV</a>
            </div>
            <audio src={resultUrl} controls className="w-full" />
          </section>
        )}

        <p className="text-[11px] text-slate-600 text-center mt-6">Voice-to-Voice bekerja dengan transkripsi lalu sintesis suara target. Ini bukan cloning identitas suara asli.</p>
      </div>
    </main>
  );
}
