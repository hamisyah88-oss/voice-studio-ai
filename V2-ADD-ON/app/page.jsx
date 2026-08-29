"use client";

import { useEffect, useRef, useState } from "react";

const VOICES = [
  { key: "guru_wanita", icon: "👩‍🏫", name: "Guru Wanita" },
  { key: "guru_pria", icon: "👨‍🏫", name: "Guru Pria" },
  { key: "anak_perempuan", icon: "👧", name: "Anak Perempuan" },
  { key: "anak_lakilaki", icon: "👦", name: "Anak Laki-laki" },
  { key: "kakek", icon: "👴", name: "Kakek" },
  { key: "nenek", icon: "👵", name: "Nenek" },
  { key: "creator", icon: "🎙️", name: "Content Creator" },
  { key: "ustadz", icon: "🕌", name: "Ustadz" },
  { key: "ustadzah", icon: "🧕", name: "Ustadzah" },
];

export default function Page() {
  const [audioFile, setAudioFile] = useState(null);
  const [targetVoice, setTargetVoice] = useState("guru_wanita");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [message, setMessage] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setAudioFile(file);
    setResultUrl("");
    setMessage(`Audio siap: ${file.name}`);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const file = new File(
          [blob],
          `voice-recording-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        setAudioFile(file);
        setMessage("Rekaman selesai dan siap diubah.");
      };

      recorder.start();

      setRecording(true);
      setMessage("🎙️ Sedang merekam suara...");
    } catch (error) {
      console.error(error);
      setMessage(
        "Mikrofon tidak dapat digunakan. Izinkan akses mikrofon browser."
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setRecording(false);
  }

  async function generateVoice() {
    if (!audioFile) {
      setMessage("Silakan upload atau rekam suara terlebih dahulu.");
      return;
    }

    setProcessing(true);
    setResultUrl("");
    setMessage("✨ Sedang mengubah suara...");

    try {
      const formData = new FormData();

      formData.append("audio", audioFile);
      formData.append("targetVoice", targetVoice);
      formData.append("removeBackgroundNoise", "true");

      const response = await fetch("/api/voice-changer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Voice conversion gagal.";

        try {
          const data = await response.json();

          if (data.error) {
            errorMessage = data.error;
          }

          if (data.detail) {
            errorMessage += ` ${data.detail}`;
          }
        } catch {
          // Abaikan jika server tidak mengirim JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setMessage("✅ Berhasil! Suara baru siap digunakan.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengubah suara."
      );
    } finally {
      setProcessing(false);
    }
  }

  const selectedVoice = VOICES.find(
    (voice) => voice.key === targetVoice
  );

  return (
    <main className="voice-page">
      <div className="voice-container">

        <header className="hero">
          <div className="version">V2 • VOICE TO VOICE</div>

          <h1>Voice Studio AI</h1>

          <p>
            Ubah suara Anda menjadi berbagai karakter suara
            untuk kebutuhan konten, pembelajaran, dan voice over.
          </p>
        </header>

        <section className="card">

          <div className="section-title">
            <span>01</span>
            <div>
              <h2>Masukkan Suara</h2>
              <p>Upload audio atau rekam langsung dari mikrofon.</p>
            </div>
          </div>

          <label className="upload-box">

            <input
              type="file"
              accept="audio/*"
              onChange={handleUpload}
            />

            <div className="upload-icon">🎧</div>

            <strong>
              {audioFile
                ? audioFile.name
                : "Klik untuk upload audio"}
            </strong>

            <small>
              MP3 • WAV • M4A • WEBM
            </small>

          </label>

          <div className="separator">
            <span>ATAU</span>
          </div>

          {!recording ? (
            <button
              className="record-button"
              onClick={startRecording}
            >
              🎙️ Rekam Suara
            </button>
          ) : (
            <button
              className="stop-button"
              onClick={stopRecording}
            >
              ⏹ Berhenti Merekam
            </button>
          )}

          {audioFile && (
            <div className="audio-source">

              <div>
                <span className="check">✓</span>

                <div>
                  <strong>Audio siap</strong>
                  <small>{audioFile.name}</small>
                </div>
              </div>

              <audio
                controls
                src={URL.createObjectURL(audioFile)}
              />

            </div>
          )}

        </section>

        <section className="card">

          <div className="section-title">
            <span>02</span>

            <div>
              <h2>Pilih Karakter Suara</h2>
              <p>
                Pilih karakter yang ingin digunakan untuk hasil voice over.
              </p>
            </div>
          </div>

          <div className="voice-grid">

            {VOICES.map((voice) => (

              <button
                key={voice.key}
                onClick={() => setTargetVoice(voice.key)}
                className={
                  targetVoice === voice.key
                    ? "voice-item active"
                    : "voice-item"
                }
              >

                <span className="voice-icon">
                  {voice.icon}
                </span>

                <span>{voice.name}</span>

                {targetVoice === voice.key && (
                  <span className="selected">✓</span>
                )}

              </button>

            ))}

          </div>

        </section>

        <section className="selected-info">

          <span>{selectedVoice.icon}</span>

          <div>
            <small>SUARA TERPILIH</small>
            <strong>{selectedVoice.name}</strong>
          </div>

        </section>

        <button
          className="generate-button"
          disabled={processing || !audioFile}
          onClick={generateVoice}
        >

          {processing
            ? "⏳ Sedang Mengubah Suara..."
            : "✨ Generate Voice-to-Voice"}

        </button>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {resultUrl && (
          <section className="result-card">

            <div className="result-header">
              <div>
                <small>HASIL VOICE-TO-VOICE</small>
                <h2>Suara Berhasil Dibuat</h2>
              </div>

              <span>✓</span>
            </div>

            <audio
              className="result-audio"
              controls
              src={resultUrl}
            />

            <a
              className="download-button"
              href={resultUrl}
              download="voice-to-voice-result.mp3"
            >
              ⬇️ Download MP3
            </a>

          </section>
        )}

        <footer>
          Voice Studio AI V2 • Voice-to-Voice
        </footer>

      </div>

      <style jsx>{`

        .voice-page {
          min-height: 100vh;
          padding: 40px 18px 70px;
          box-sizing: border-box;
          background:
            radial-gradient(
              circle at 50% 0%,
              #172554 0%,
              #020617 48%,
              #000 100%
            );
          color: #f8fafc;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .voice-container {
          width: min(920px, 100%);
          margin: auto;
        }

        .hero {
          text-align: center;
          margin-bottom: 28px;
        }

        .version {
          display: inline-block;
          padding: 7px 13px;
          border-radius: 999px;
          background: rgba(59,130,246,.14);
          border: 1px solid rgba(96,165,250,.2);
          color: #93c5fd;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .hero h1 {
          margin: 14px 0 7px;
          font-size: clamp(34px, 7vw, 58px);
          line-height: 1;
        }

        .hero p {
          max-width: 620px;
          margin: auto;
          color: #94a3b8;
          line-height: 1.65;
        }

        .card {
          margin-top: 16px;
          padding: 22px;
          border-radius: 24px;
          background: rgba(15,23,42,.82);
          border: 1px solid rgba(148,163,184,.14);
          box-shadow: 0 20px 70px rgba(0,0,0,.25);
          box-sizing: border-box;
        }

        .section-title {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .section-title > span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 10px;
          background: #1d4ed8;
          font-size: 12px;
          font-weight: 900;
        }

        .section-title h2 {
          margin: 0 0 4px;
          font-size: 18px;
        }

        .section-title p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .upload-box {
          min-height: 145px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 7px;
          border: 1px dashed #475569;
          border-radius: 18px;
          cursor: pointer;
          text-align: center;
          transition: .2s;
        }

        .upload-box:hover {
          border-color: #60a5fa;
          background: rgba(30,64,175,.08);
        }

        .upload-box input {
          display: none;
        }

        .upload-icon {
          font-size: 36px;
        }

        .upload-box small {
          color: #64748b;
          font-size: 11px;
        }

        .separator {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 15px 0;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
        }

        .separator::before,
        .separator::after {
          content: "";
          height: 1px;
          flex: 1;
          background: #1e293b;
        }

        .record-button,
        .stop-button {
          width: 100%;
          border: 0;
          padding: 14px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 800;
          color: white;
          background: #111827;
          border: 1px solid #334155;
        }

        .stop-button {
          background: #450a0a;
          border-color: #ef4444;
          color: #fecaca;
        }

        .audio-source {
          margin-top: 14px;
          padding: 14px;
          border-radius: 14px;
          background: #020617;
          border: 1px solid #1e293b;
        }

        .audio-source > div {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .check {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #166534;
          color: #bbf7d0;
          font-weight: 900;
        }

        .audio-source strong,
        .audio-source small {
          display: block;
        }

        .audio-source small {
          color: #64748b;
          margin-top: 2px;
          word-break: break-all;
        }

        audio {
          width: 100%;
        }

        .voice-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(145px, 1fr)
          );
          gap: 10px;
        }

        .voice-item {
          position: relative;
          min-height: 100px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid #334155;
          background: #0f172a;
          color: #e2e8f0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-weight: 750;
          transition: .2s;
        }

        .voice-item:hover {
          transform: translateY(-2px);
          border-color: #475569;
        }

        .voice-item.active {
          border: 2px solid #60a5fa;
          background: #172554;
        }

        .voice-icon {
          font-size: 31px;
        }

        .selected {
          position: absolute;
          top: 8px;
          right: 9px;
          color: #93c5fd;
          font-weight: 900;
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding: 15px 18px;
          border-radius: 17px;
          background: rgba(30,41,59,.72);
          border: 1px solid #1e3a8a;
        }

        .selected-info > span {
          font-size: 31px;
        }

        .selected-info small,
        .selected-info strong {
          display: block;
        }

        .selected-info small {
          color: #64748b;
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .selected-info strong {
          margin-top: 3px;
        }

        .generate-button {
          width: 100%;
          margin-top: 16px;
          padding: 18px;
          border: 0;
          border-radius: 16px;
          background: #2563eb;
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 900;
          box-shadow: 0 12px 35px rgba(37,99,235,.2);
        }

        .generate-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .message {
          margin-top: 12px;
          padding: 13px;
          border-radius: 13px;
          background: #0f172a;
          color: #cbd5e1;
          text-align: center;
          font-size: 13px;
        }

        .result-card {
          margin-top: 16px;
          padding: 20px;
          border-radius: 22px;
          background: #0f172a;
          border: 1px solid #1e3a8a;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .result-header small {
          color: #60a5fa;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .result-header h2 {
          margin: 4px 0 0;
          font-size: 19px;
        }

        .result-header > span {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #166534;
          color: #bbf7d0;
          font-weight: 900;
        }

        .download-button {
          display: block;
          margin-top: 12px;
          padding: 13px;
          border-radius: 13px;
          background: #1e293b;
          color: white;
          text-decoration: none;
          text-align: center;
          font-weight: 850;
        }

        footer {
          padding-top: 25px;
          text-align: center;
          color: #475569;
          font-size: 11px;
        }

        @media (max-width: 520px) {

          .voice-page {
            padding: 24px 12px 50px;
          }

          .card {
            padding: 16px;
            border-radius: 19px;
          }

          .voice-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .voice-item {
            min-height: 88px;
          }

        }

      `}</style>
    </main>
  );
}
