import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
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

function pcmToWavBuffer(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const blockAlign =
    (channels * bitsPerSample) / 8;

  const byteRate =
    sampleRate * blockAlign;

  const buffer = Buffer.alloc(
    44 + pcm.length
  );

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(
    36 + pcm.length,
    4
  );

  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(
    sampleRate,
    24
  );

  buffer.writeUInt32LE(
    byteRate,
    28
  );

  buffer.writeUInt16LE(
    blockAlign,
    32
  );

  buffer.writeUInt16LE(
    bitsPerSample,
    34
  );

  buffer.write("data", 36);

  buffer.writeUInt32LE(
    pcm.length,
    40
  );

  pcm.copy(buffer, 44);

  return buffer;
}

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

export async function POST(req: Request) {
  try {
    // =====================================================
    // 1. API KEY
    // =====================================================

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang.",
        500
      );
    }

    // =====================================================
    // 2. FORM DATA
    // =====================================================

    const formData =
      await req.formData();

    const audio =
      formData.get("audio");

    const targetVoice =
      String(
        formData.get("targetVoice") ||
          "guru_wanita"
      );

    if (!(audio instanceof File)) {
      return jsonError(
        "File audio belum dipilih.",
        400
      );
    }

    if (audio.size <= 0) {
      return jsonError(
        "File audio kosong.",
        400
      );
    }

    if (
      audio.size >
      50 * 1024 * 1024
    ) {
      return jsonError(
        "File terlalu besar. Maksimal 50 MB.",
        400
      );
    }

    const target =
      TARGET_VOICES[targetVoice];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    // =====================================================
    // 3. AUDIO INFORMATION
    // =====================================================

    const audioArrayBuffer =
      await audio.arrayBuffer();

    const audioBuffer =
      Buffer.from(
        audioArrayBuffer
      );

    let mimeType =
      (
        audio.type ||
        "audio/wav"
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    // Normalisasi MIME browser
    if (
      mimeType === "audio/x-wav"
    ) {
      mimeType = "audio/wav";
    }

    if (
      mimeType ===
      "audio/mpeg"
    ) {
      mimeType = "audio/mp3";
    }

    console.log(
      "========== VOICE CHANGER =========="
    );

    console.log(
      "Filename:",
      audio.name
    );

    console.log(
      "Size:",
      audio.size
    );

    console.log(
      "MIME:",
      mimeType
    );

    console.log(
      "Target:",
      targetVoice
    );

    // =====================================================
    // 4. UPLOAD KE GEMINI FILES API
    //
    // Ini penting.
    // gemini-3.5-transcribe menggunakan file URI.
    // =====================================================

    const uploadStartResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",

          headers: {
            "X-Goog-Upload-Protocol":
              "resumable",

            "X-Goog-Upload-Command":
              "start",

            "X-Goog-Upload-Header-Content-Length":
              String(audioBuffer.length),

            "X-Goog-Upload-Header-Content-Type":
              mimeType,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            file: {
              display_name:
                audio.name ||
                "voice-input",
            },
          }),
        }
      );

    if (
      !uploadStartResponse.ok
    ) {
      const errorText =
        await uploadStartResponse.text();

      console.error(
        "FILES START ERROR:",
        errorText
      );

      return jsonError(
        "Gemini gagal memulai upload audio.",
        uploadStartResponse.status,
        errorText
      );
    }

    // =====================================================
    // 5. AMBIL UPLOAD URL
    // =====================================================

    const uploadUrl =
      uploadStartResponse.headers.get(
        "x-goog-upload-url"
      );

    if (!uploadUrl) {
      return jsonError(
        "Gemini tidak mengembalikan URL upload audio.",
        502
      );
    }

    console.log(
      "Gemini upload URL berhasil diperoleh."
    );

    // =====================================================
    // 6. UPLOAD AUDIO
    //
    // Gunakan Blob agar tidak terkena error BodyInit
    // Buffer / Uint8Array pada TypeScript Next.js.
    // =====================================================

    const uploadBlob =
      new Blob(
        [audioBuffer],
        {
          type: mimeType,
        }
      );

    const uploadResponse =
      await fetch(
        uploadUrl,
        {
          method: "POST",

          headers: {
            "Content-Length":
              String(audioBuffer.length),

            "X-Goog-Upload-Offset":
              "0",

            "X-Goog-Upload-Command":
              "upload, finalize",

            "Content-Type":
              mimeType,
          },

          body: uploadBlob,
        }
      );

    if (
      !uploadResponse.ok
    ) {
      const errorText =
        await uploadResponse.text();

      console.error(
        "FILES UPLOAD ERROR:",
        errorText
      );

      return jsonError(
        "Gemini gagal mengupload audio.",
        uploadResponse.status,
        errorText
      );
    }

    const uploadData =
      await uploadResponse.json();

    console.log(
      "FILES RESPONSE:",
      JSON.stringify(
        uploadData,
        null,
        2
      )
    );

    const fileUri =
      uploadData?.file?.uri;

    const uploadedMimeType =
      uploadData?.file?.mimeType ||
      mimeType;

    if (!fileUri) {
      return jsonError(
        "Gemini tidak memberikan file URI setelah upload.",
        502
      );
    }

    console.log(
      "FILE URI:",
      fileUri
    );

    // =====================================================
    // 7. TRANSKRIPSI
    // MODEL KHUSUS: gemini-3.5-transcribe
    // =====================================================

    const transcriptResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                role: "user",

                parts: [
                  {
                    text:
                      "Transkripsikan seluruh ucapan manusia dalam audio ini secara akurat dalam bahasa Indonesia. Pertahankan kata-kata yang diucapkan, urutan kata, dan makna. Jangan membuat ringkasan. Jangan menambahkan penjelasan. Hasilkan hanya transkrip ucapan.",
                  },

                  {
                    fileData: {
                      fileUri:
                        fileUri,

                      mimeType:
                        uploadedMimeType,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

    if (
      !transcriptResponse.ok
    ) {
      const errorText =
        await transcriptResponse.text();

      console.error(
        "TRANSCRIPTION ERROR:",
        {
          status:
            transcriptResponse.status,

          response:
            errorText,
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
      "TRANSCRIPTION RESPONSE:",
      JSON.stringify(
        transcriptData,
        null,
        2
      )
    );

    const transcript =
      extractText(
        transcriptData
      );

    console.log(
      "TRANSCRIPT:",
      transcript
    );

    if (!transcript) {
      return jsonError(
        "Gemini menerima audio tetapi transkrip kosong.",
        422
      );
    }

    // =====================================================
    // 8. TEXT → SPEECH
    // =====================================================

    const ttsPrompt = `
Bacakan teks berikut dalam bahasa Indonesia.

Karakter:
${target.direction}

ATURAN:
- Pertahankan semua kata.
- Jangan menambahkan kata.
- Jangan mengurangi kata.
- Jangan membuat pembukaan.
- Jangan membuat penutup.
- Jangan menyanyikan teks.
- Gunakan intonasi natural.
- Artikulasi harus jelas.

TEKS:
${transcript}
`;

    const ttsResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                role: "user",

                parts: [
                  {
                    text:
                      ttsPrompt,
                  },
                ],
              },
            ],

            generationConfig: {
              responseModalities: [
                "AUDIO",
              ],

              speechConfig: {
                languageCode:
                  "id-ID",

                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName:
                      target.voice,
                  },
                },
              },
            },
          }),
        }
      );

    if (
      !ttsResponse.ok
    ) {
      const errorText =
        await ttsResponse.text();

      console.error(
        "TTS ERROR:",
        errorText
      );

      return jsonError(
        `Suara tujuan gagal dibuat (${ttsResponse.status}).`,
        ttsResponse.status,
        errorText
      );
    }

    // =====================================================
    // 9. BACA AUDIO HASIL TTS
    // =====================================================

    const ttsData =
      await ttsResponse.json();

    console.log(
      "TTS RESPONSE:",
      JSON.stringify(
        ttsData,
        null,
        2
      )
    );

    const parts =
      ttsData?.candidates?.[0]
        ?.content?.parts;

    if (!Array.isArray(parts)) {
      return jsonError(
        "Response TTS tidak memiliki audio.",
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
        "Gemini tidak mengembalikan data audio.",
        502
      );
    }

    const inlineData =
      audioPart.inlineData ||
      audioPart.inline_data;

    if (!inlineData?.data) {
      return jsonError(
        "Data audio TTS kosong.",
        502
      );
    }

    const outputMime =
      String(
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
        ? Number(
            sampleRateMatch[1]
          )
        : 24000;

    // =====================================================
    // 10. PCM → WAV
    // =====================================================

    const wav =
      pcmToWavBuffer(
        outputPcm,
        sampleRate,
        1,
        16
      );

    // =====================================================
    // 11. FIX BODYINIT TYPESCRIPT
    // =====================================================

    const wavArrayBuffer =
      new ArrayBuffer(
        wav.length
      );

    const wavUint8 =
      new Uint8Array(
        wavArrayBuffer
      );

    wavUint8.set(wav);

    // =====================================================
    // 12. KIRIM AUDIO KE BROWSER
    // =====================================================

    return new NextResponse(
      wavArrayBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Content-Length":
            String(
              wavArrayBuffer.byteLength
            ),

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
