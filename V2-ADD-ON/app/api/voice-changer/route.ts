import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gemini-2.5-flash";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const TARGET_VOICES: Record<
  string,
  {
    voice: string;
    direction: string;
  }
> = {
  guru_wanita: {
    voice: "Leda",
    direction:
      "suara perempuan dewasa, ramah, jelas, hangat, profesional seperti guru",
  },

  guru_pria: {
    voice: "Kore",
    direction:
      "suara laki-laki dewasa, jelas, tenang, tegas, profesional seperti guru atau dosen",
  },

  anak_perempuan: {
    voice: "Leda",
    direction:
      "karakter anak perempuan, muda, ceria, ringan, natural dan tidak terdengar seperti orang dewasa",
  },

  anak_lakilaki: {
    voice: "Puck",
    direction:
      "karakter anak laki-laki, muda, ceria, aktif, ringan, natural dan tidak terdengar seperti orang dewasa",
  },

  kakek: {
    voice: "Gacrux",
    direction:
      "suara laki-laki lanjut usia, matang, tenang, hangat dan natural seperti kakek",
  },

  nenek: {
    voice: "Vindemiatrix",
    direction:
      "suara perempuan lanjut usia, lembut, hangat, matang dan natural seperti nenek",
  },

  creator: {
    voice: "Achird",
    direction:
      "suara laki-laki dewasa muda, ramah, natural, santai dan percaya diri seperti content creator",
  },

  ustadz: {
    voice: "Charon",
    direction:
      "suara laki-laki dewasa, tenang, berwibawa, reflektif dan hangat untuk penyampaian keislaman",
  },

  ustadzah: {
    voice: "Aoede",
    direction:
      "suara perempuan dewasa, lembut, tenang, hangat dan berwibawa untuk penyampaian keislaman",
  },
};

function jsonError(
  message: string,
  status = 500,
  detail?: string
) {
  return NextResponse.json(
    {
      error: message,
      ...(detail ? { detail } : {}),
    },
    { status }
  );
}

/**
 * Gemini TTS mengembalikan PCM.
 * Fungsi ini membungkus PCM menjadi WAV standar.
 */
function pcmToWavBuffer(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
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

/**
 * Ambil seluruh text dari response Gemini.
 */
function extractText(data: any): string {
  const parts =
    data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part: any) => part?.text || "")
    .join("")
    .trim();
}

/**
 * POST /api/voice-changer
 *
 * FormData:
 * audio       = File
 * targetVoice = guru_wanita / guru_pria / dll
 */
export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. API KEY
    // =========================================================

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang di environment variables.",
        500
      );
    }

    // =========================================================
    // 2. BACA FORM DATA
    // =========================================================

    const incoming = await req.formData();

    const audio = incoming.get("audio");

    const targetVoice = String(
      incoming.get("targetVoice") || "guru_wanita"
    );

    if (!(audio instanceof File)) {
      return jsonError(
        "File audio belum dipilih.",
        400
      );
    }

    if (audio.size === 0) {
      return jsonError(
        "File audio kosong.",
        400
      );
    }

    if (audio.size > 50 * 1024 * 1024) {
      return jsonError(
        "File terlalu besar. Maksimal 50 MB.",
        400
      );
    }

    // =========================================================
    // 3. CEK TARGET VOICE
    // =========================================================

    const target = TARGET_VOICES[targetVoice];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    // =========================================================
    // 4. BACA AUDIO
    // =========================================================

    const arrayBuffer = await audio.arrayBuffer();

    const audioBuffer = Buffer.from(arrayBuffer);

    let mimeType =
      (audio.type || "audio/wav")
        .split(";")[0]
        .trim()
        .toLowerCase();

    // Beberapa browser dapat memberikan MIME kosong.
    if (!mimeType) {
      mimeType = "audio/wav";
    }

    console.log("VOICE CHANGER INPUT:", {
      filename: audio.name,
      size: audio.size,
      mimeType,
      targetVoice,
    });

    // =========================================================
    // 5. KONVERSI AUDIO KE BASE64
    // =========================================================

    const base64Audio =
      audioBuffer.toString("base64");

    // =========================================================
    // 6. STEP 1 — SPEECH TO TEXT
    //
    // PENTING:
    // Jangan gunakan model "gemini-3.5-transcribe".
    // Kita gunakan Gemini 2.5 Flash untuk memahami audio.
    // =========================================================

    const transcriptPrompt = `
Transkripsikan ucapan manusia dari audio berikut.

Bahasa utama: Bahasa Indonesia.

ATURAN:
- Tuliskan hanya kata-kata yang benar-benar diucapkan.
- Jangan menambahkan kalimat.
- Jangan mengurangi kata.
- Jangan menjelaskan isi audio.
- Jangan membuat ringkasan.
- Jangan menebak kalimat yang tidak terdengar.
- Pertahankan urutan ucapan.
- Gunakan tanda baca yang wajar.
- Jika terdapat jeda, tetap tuliskan kalimat secara natural.
- Hasil akhir harus berupa transkrip ucapan saja.
`;

    const transcriptUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

    console.log(
      "TRANSCRIPTION MODEL:",
      TRANSCRIBE_MODEL
    );

    const transcriptResponse = await fetch(
      transcriptUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",

              parts: [
                {
                  text: transcriptPrompt,
                },

                {
                  inlineData: {
                    mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    // =========================================================
    // 7. CEK RESPONSE TRANSKRIPSI
    // =========================================================

    if (!transcriptResponse.ok) {
      const errorText =
        await transcriptResponse.text();

      console.error(
        "GEMINI TRANSCRIPTION ERROR:",
        {
          status: transcriptResponse.status,
          response: errorText,
        }
      );

      return jsonError(
        `Gemini gagal membaca audio (${transcriptResponse.status}).`,
        transcriptResponse.status,
        errorText
      );
    }

    const transcriptData =
      await transcriptResponse.json();

    console.log(
      "GEMINI TRANSCRIPTION RESPONSE:",
      JSON.stringify(
        transcriptData,
        null,
        2
      )
    );

    const transcript =
      extractText(transcriptData);

    console.log(
      "TRANSCRIPT:",
      transcript
    );

    // =========================================================
    // 8. JIKA TRANSKRIP KOSONG
    // =========================================================

    if (!transcript) {
      return jsonError(
        "Gemini menerima file audio tetapi tidak menemukan ucapan. Pastikan audio berisi suara manusia yang jelas.",
        422
      );
    }

    // =========================================================
    // 9. STEP 2 — TEXT TO SPEECH
    // =========================================================

    const ttsPrompt = `
Bacakan teks berikut dalam bahasa Indonesia.

Karakter suara:
${target.direction}

ATURAN:
- Pertahankan isi teks.
- Pertahankan urutan kata.
- Jangan menambahkan kata pembuka.
- Jangan menambahkan kata penutup.
- Jangan mengubah makna.
- Jangan menyanyikan teks.
- Gunakan intonasi natural.
- Berikan artikulasi yang jelas.
- Sesuaikan ekspresi suara dengan karakter yang dipilih.

TEKS:
${transcript}
`;

    console.log(
      "TTS TARGET:",
      targetVoice,
      target.voice
    );

    const ttsUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

    const ttsResponse = await fetch(
      ttsUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",

              parts: [
                {
                  text: ttsPrompt,
                },
              ],
            },
          ],

          generationConfig: {
            responseModalities: ["AUDIO"],

            speechConfig: {
              languageCode: "id-ID",

              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: target.voice,
                },
              },
            },
          },
        }),
      }
    );

    // =========================================================
    // 10. CEK RESPONSE TTS
    // =========================================================

    if (!ttsResponse.ok) {
      const errorText =
        await ttsResponse.text();

      console.error(
        "GEMINI TTS ERROR:",
        {
          status: ttsResponse.status,
          response: errorText,
        }
      );

      return jsonError(
        `Suara tujuan gagal dibuat (${ttsResponse.status}).`,
        ttsResponse.status,
        errorText
      );
    }

    const ttsData =
      await ttsResponse.json();

    console.log(
      "GEMINI TTS RESPONSE:",
      JSON.stringify(
        ttsData,
        null,
        2
      )
    );

    // =========================================================
    // 11. CARI AUDIO HASIL
    // =========================================================

    const parts =
      ttsData?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return jsonError(
        "Response Gemini TTS tidak memiliki parts.",
        502
      );
    }

    const audioPart =
      parts.find(
        (part: any) =>
          part?.inlineData?.data ||
          part?.inline_data?.data
      );

    if (!audioPart) {
      return jsonError(
        "Server tidak menerima audio hasil dari mesin suara.",
        502
      );
    }

    const inlineData =
      audioPart.inlineData ||
      audioPart.inline_data;

    if (!inlineData?.data) {
      return jsonError(
        "Data audio hasil Gemini kosong.",
        502
      );
    }

    // =========================================================
    // 12. AMBIL MIME AUDIO HASIL
    // =========================================================

    const outputMime = String(
      inlineData.mimeType ||
        inlineData.mime_type ||
        "audio/L16;rate=24000"
    );

    const outputPcm =
      Buffer.from(
        inlineData.data,
        "base64"
      );

    const sampleRateMatch =
      outputMime.match(
        /rate=(\d+)/i
      );

    const sampleRate =
      sampleRateMatch
        ? Number(sampleRateMatch[1])
        : 24000;

    // =========================================================
    // 13. PCM → WAV
    // =========================================================

    const wav =
      pcmToWavBuffer(
        outputPcm,
        sampleRate,
        1,
        16
      );

    console.log(
      "WAV GENERATED:",
      {
        bytes: wav.length,
        sampleRate,
      }
    );

    // =========================================================
    // 14. FIX UTAMA ERROR TYPESCRIPT
    //
    // Jangan:
    // return new NextResponse(wav)
    //
    // Buffer Node.js kadang tidak diterima sebagai BodyInit
    // oleh TypeScript versi Next.js tertentu.
    //
    // Kita buat ArrayBuffer MURNI.
    // =========================================================

    const wavArrayBuffer =
      new ArrayBuffer(wav.length);

    const wavUint8 =
      new Uint8Array(
        wavArrayBuffer
      );

    wavUint8.set(wav);

    // =========================================================
    // 15. KIRIM WAV KE BROWSER
    // =========================================================

    return new NextResponse(
      wavArrayBuffer,
      {
        status: 200,

        headers: {
          "Content-Type": "audio/wav",

          "Content-Length":
            String(wavArrayBuffer.byteLength),

          "Content-Disposition":
            'inline; filename="voice-to-voice.wav"',

          "Cache-Control":
            "no-store",

          "X-Voice-Target":
            targetVoice,

          "X-Transcript":
            encodeURIComponent(
              transcript
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "VOICE CHANGER FATAL ERROR:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan server.",
      500
    );
  }
}
