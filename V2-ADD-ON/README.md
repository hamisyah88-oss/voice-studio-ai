# Voice Studio AI — Voice-to-Voice Module

Modul ini dibuat sebagai tambahan terpisah agar Voice Library + Gemini TTS lama tetap aman.

## Fitur
- Rekam suara
- Upload audio
- Preview suara asli
- Pilih karakter target
- Voice-to-Voice dengan ElevenLabs Speech-to-Speech
- Noise removal
- Preview hasil
- Download MP3

## Setup lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi `ELEVENLABS_API_KEY` dan Voice ID target di `.env.local`.

## Vercel
Masukkan environment variables yang sama di Project Settings → Environment Variables.

## Penting
`Leda`, `Kore`, `Charon`, `Aoede`, `Zephyr`, dan `Fenrir` adalah nama preset Gemini TTS dari aplikasi lama. Voice-to-Voice membutuhkan Voice ID dari provider speech-to-speech, jadi jangan menganggap nama preset Gemini sebagai Voice ID ElevenLabs.
