import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash-preview-tts";

const VOICES: Record<string, string> = {
  guru_wanita: "Leda",
  guru_pria: "Orus",
  anak_perempuan: "Aoede",
  anak_lakilaki: "Puck",
  kakek: "Charon",
  nenek: "Aoede",
  creator: "Zephyr",
  ustadz: "Charon",
  ustadzah: "Leda",
  pembawa_berita: "Orus",
  narator: "Zephyr",
  storyteller_wanita: "Aoede",
  storyteller_pria: "Fenrir",
  presenter: "Callirrhoe",
  podcast_host: "Orus",
  iklan_promosi: "Despina",
};

function getVoiceName(targetVoice: unknown, voiceName: unknown) {
  const id = String(targetVoice || "").trim();
  if (id && VOICES[id]) return VOICES[id];

  const raw = String(voiceName || "").trim();
  if (raw) return raw;

  return VOICES.guru_wanita;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci layanan suara belum dipasang di Vercel." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const text = String(body.text || "").trim();
    const multiSpeaker = Boolean(body.multiSpeaker);

    if (!text) {
      return NextResponse.json({ error: "Teks belum diisi." }, { status: 400 });
    }

    const speechConfig = multiSpeaker
      ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "GURU",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: getVoiceName(body.speaker1Id, body.speaker1Voice),
                  },
                },
              },
              {
                speaker: "SISWA",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: getVoiceName(body.speaker2Id, body.speaker2Voice),
                  },
                },
              },
            ],
          },
          languageCode: "id-ID",
        }
      : {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: getVoiceName(body.targetVoice, body.voiceName),
            },
          },
          languageCode: "id-ID",
        };

    const prompt = multiSpeaker
      ? `Bacakan percakapan berikut dalam bahasa Indonesia dengan dua pembicara yang berbeda. Pertahankan label GURU dan SISWA sebagai penanda pembicara dan jangan membacakan labelnya. Gunakan suara yang berbeda untuk masing-masing pembicara.

${text}`
      : `Bacakan teks berikut dalam bahasa Indonesia secara natural, jelas, dan ekspresif. Gaya: ${String(body.style || "Natural")}. Emosi: ${String(body.emotion || "Natural")}. Kecepatan: ${String(body.speed || 1)}x. Pitch: ${String(body.pitch || "Normal")}. Jangan menjelaskan instruksi, langsung bacakan teks.

${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig,
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: "Pembuatan audio gagal.", detail },
        { status: response.status }
      );
    }

    const data = await response.json();
    const audioBase64 =
      data?.candidates?.[0]?.content?.parts?.find(
        (part: { inlineData?: { data?: string } }) => part?.inlineData?.data
      )?.inlineData?.data;

    if (!audioBase64) {
      return NextResponse.json(
        { error: "Audio tidak dikembalikan oleh layanan suara." },
        { status: 500 }
      );
    }

    const pcm = Buffer.from(audioBase64, "base64");
    const wav = pcmToWav(pcm, 24000);

    return new Response(wav, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'inline; filename="voice-studio.wav"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

function pcmToWav(pcm: Buffer, sampleRate: number) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
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
