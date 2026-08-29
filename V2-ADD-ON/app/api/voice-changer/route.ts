import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gemini-2.5-flash";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// UI labels are intentionally decoupled from provider voice names.
const TARGET_VOICES: Record<string, { voice: string; direction: string }> = {
  guru_wanita: {
    voice: "Leda",
    direction: "suara perempuan dewasa, ramah, jelas, hangat, profesional seperti guru",
  },
  guru_pria: {
    voice: "Kore",
    direction: "suara laki-laki dewasa, jelas, tenang, tegas, profesional seperti guru atau dosen",
  },
  anak_perempuan: {
    voice: "Leda",
    direction: "karakter anak perempuan, muda, ceria, ringan, natural dan tidak terdengar seperti orang dewasa",
  },
  anak_lakilaki: {
    voice: "Puck",
    direction: "karakter anak laki-laki, muda, ceria, aktif, ringan, natural dan tidak terdengar seperti orang dewasa",
  },
  kakek: {
    voice: "Gacrux",
    direction: "suara laki-laki lanjut usia, matang, tenang, hangat dan natural seperti kakek",
  },
  nenek: {
    voice: "Vindemiatrix",
    direction: "suara perempuan lanjut usia, lembut, hangat, matang dan natural seperti nenek",
  },
  creator: {
    voice: "Achird",
    direction: "suara laki-laki dewasa muda, ramah, natural, santai dan percaya diri seperti content creator",
  },
  ustadz: {
    voice: "Charon",
    direction: "suara laki-laki dewasa, tenang, berwibawa, reflektif dan hangat untuk penyampaian keislaman",
  },
  ustadzah: {
    voice: "Aoede",
    direction: "suara perempuan dewasa, lembut, tenang, hangat dan berwibawa untuk penyampaian keislaman",
  },
};

function jsonError(message: string, status = 500, detail?: string) {
  return NextResponse.json({ error: message, ...(detail ? { detail } : {}) }, { status });
}

function pcmToWavBuffer(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44 + pcm.length);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + pcm.length, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(pcm.length, 40);
  pcm.copy(buffer, 44);

  return buffer;
}

function extractText(data: any) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim() || ""
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonError("GEMINI_API_KEY belum dipasang.", 500);

    const incoming = await req.formData();
    const audio = incoming.get("audio");
    const targetVoice = String(incoming.get("targetVoice") || "guru_wanita");

    if (!(audio instanceof File)) {
      return jsonError("File audio belum dipilih.", 400);
    }

    if (audio.size > 50 * 1024 * 1024) {
      return jsonError("File terlalu besar. Maksimal 50 MB.", 400);
    }

    const target = TARGET_VOICES[targetVoice];
    if (!target) {
      return jsonError("Karakter suara tujuan tidak dikenal.", 400);
    }

    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
   const mimeType = (audio.type || "audio/wav").split(";")[0].toLowerCase();

    // Step 1: speech-to-text. The audio is converted to text first because
    // Gemini TTS is a text-to-audio model, not a direct voice-cloning model.
  // Step 1: Speech-to-text
// Gunakan Gemini Flash untuk membaca audio.
// Audio dikirim langsung sebagai base64 inlineData.

const transcriptResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Transkripsikan ucapan pada audio ini secara akurat dalam bahasa Indonesia. Pertahankan kata-kata yang diucapkan. Gunakan tanda baca yang wajar. Jangan menambahkan, mengurangi, atau mengubah makna ucapan.",
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
      },
    }),
  }
);

if (!transcriptResponse.ok) {
  const errorText = await transcriptResponse.text();

  console.error("GEMINI TRANSCRIPTION ERROR:", {
    status: transcriptResponse.status,
    response: errorText,
  });

  return jsonError(
    `Gemini gagal membaca audio (${transcriptResponse.status}).`,
    transcriptResponse.status,
    errorText
  );
}

const transcriptData = await transcriptResponse.json();

console.log(
  "GEMINI TRANSCRIPTION RESPONSE:",
  JSON.stringify(transcriptData, null, 2)
);

const transcriptData = await transcriptResponse.json();

console.log(
  "GEMINI TRANSCRIPTION RESPONSE:",
  JSON.stringify(transcriptData, null, 2)
);

const transcript = transcriptData?.candidates?.[0]?.content?.parts
  ?.map((part: { text?: string }) => part.text || "")
  .join("")
  .trim();

if (!transcript) {
  return jsonError(
    "Ucapan tidak berhasil dikenali. Coba rekam atau upload audio yang lebih jelas.",
    422
  );
}
    // Step 2: synthesize the transcript using the selected target character.
    const ttsPrompt = `Bacakan teks berikut dalam bahasa Indonesia. ${target.direction}. Pertahankan isi dan urutan kata. Jangan menambahkan kata pembuka atau penutup. Jangan menyanyikan teks.\n\nTeks:\n${transcript}`;

    const ttsResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ttsPrompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: target.voice,
                },
              },
              languageCode: "id-ID",
            },
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      return jsonError("Suara tujuan gagal dibuat.", ttsResponse.status, await ttsResponse.text());
    }

    const ttsData = await ttsResponse.json();
    const audioPart = ttsData?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.inlineData?.data || part?.inline_data?.data
    );

    const inlineData = audioPart?.inlineData || audioPart?.inline_data;
    if (!inlineData?.data) {
      return jsonError("Server tidak menerima audio hasil dari mesin suara.", 502);
    }

    const outputMime = String(inlineData.mimeType || inlineData.mime_type || "audio/L16;rate=24000");
    const outputPcm = Buffer.from(inlineData.data, "base64");
    const sampleRateMatch = outputMime.match(/rate=(\d+)/i);
    const sampleRate = sampleRateMatch ? Number(sampleRateMatch[1]) : 24000;

    // Gemini TTS commonly returns raw PCM. Wrap it in a standard WAV container
    // so the browser can preview and download it directly.
    const wav = pcmToWavBuffer(outputPcm, sampleRate);

    return new NextResponse(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
        "Content-Disposition": 'inline; filename="voice-to-voice.wav"',
        "Cache-Control": "no-store",
        "X-Voice-Target": targetVoice,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Terjadi kesalahan server.",
      500
    );
  }
}
