import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash-preview-tts";

const VOICES: Record<string, string> = {
  guru_wanita: "Leda",
  guru_pria: "Orus",
  anak_perempuan: "Kore",
  anak_lakilaki: "Puck",
  kakek: "Charon",
  nenek: "Aoede",
  creator: "Zephyr",
  ustadz: "Charon",
  ustadzah: "Leda",
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dipasang di Vercel." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const text = String(body.text || "").trim();
    const targetVoice = String(body.targetVoice || "guru_wanita");

    if (!text) {
      return NextResponse.json(
        { error: "Teks belum diisi." },
        { status: 400 }
      );
    }

    const voiceName = VOICES[targetVoice] || VOICES.guru_wanita;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
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
                  text: `Speak naturally in Indonesian. Voice style: warm, clear, friendly, expressive, suitable for educational content.

Text to speak:
${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
              languageCode: "id-ID",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      return NextResponse.json(
        {
          error: "Gemini TTS gagal.",
          detail,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const audioBase64 =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      return NextResponse.json(
        { error: "Gemini tidak mengembalikan audio." },
        { status: 500 }
      );
    }

    const pcm = Buffer.from(audioBase64, "base64");

    const wav = pcmToWav(pcm, 24000);

    return new Response(wav, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition":
          'inline; filename="gemini-voice-studio.wav"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

function pcmToWav(pcm: Buffer, sampleRate: number) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate =
    sampleRate * channels * (bitsPerSample / 8);
  const blockAlign =
    channels * (bitsPerSample / 8);

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
