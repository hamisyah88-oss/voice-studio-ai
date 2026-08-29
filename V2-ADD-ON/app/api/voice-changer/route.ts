import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
const FALLBACK_TRANSCRIBE_MODEL = "gemini-2.5-flash";
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
 * Gemini TTS mengembalikan raw PCM.
 * Fungsi ini membungkus PCM menjadi WAV agar browser
 * dapat langsung memutar hasilnya.
 */
function pcmToWavBuffer(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
) {
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
 * Ambil teks dari response generateContent.
 */
function extractText(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

/**
 * Upload audio ke Gemini Files API.
 *
 * Penting:
 * Kita TIDAK mengirim Buffer langsung sebagai fetch body.
 * Buffer dikonversi menjadi Uint8Array supaya TypeScript/Vercel
 * tidak memunculkan error BodyInit.
 */
async function uploadAudioToGemini(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const uploadStartUrl =
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(
      apiKey
    )}`;

  /**
   * STEP 1
   * Memulai resumable upload.
   */
  const startResponse = await fetch(uploadStartUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(
        audioBuffer.byteLength
      ),
      "X-Goog-Upload-Header-Content-Type": mimeType,
    },
    body: JSON.stringify({
      file: {
        display_name: `voice-input-${Date.now()}`,
      },
    }),
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();

    console.error("GEMINI FILE START ERROR:", {
      status: startResponse.status,
      response: errorText,
    });

    throw new Error(
      `Gemini gagal memulai upload audio (${startResponse.status}). ${errorText}`
    );
  }

  /**
   * Gemini mengirim URL upload melalui header.
   */
  const uploadUrl =
    startResponse.headers.get("x-goog-upload-url") ||
    startResponse.headers.get("X-Goog-Upload-URL");

  if (!uploadUrl) {
    throw new Error(
      "Gemini tidak mengembalikan URL upload audio."
    );
  }

  /**
   * STEP 2
   * Upload byte audio sebenarnya.
   *
   * Buffer -> Uint8Array
   * agar kompatibel dengan BodyInit pada Vercel/Next.js.
   */
  const uploadBody = new Uint8Array(
    audioBuffer.buffer,
    audioBuffer.byteOffset,
    audioBuffer.byteLength
  );

 const uploadResponse = await fetch(uploadUrl, {
  method: "POST",
  headers: {
    "Content-Length": String(audioBuffer.byteLength),
    "X-Goog-Upload-Offset": "0",
    "X-Goog-Upload-Command": "upload, finalize",
    "Content-Type": mimeType,
  },
  body: audioBuffer as unknown as BodyInit,
});

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error("GEMINI FILE UPLOAD ERROR:", {
      status: uploadResponse.status,
      response: errorText,
    });

    throw new Error(
      `Gemini gagal mengupload audio (${uploadResponse.status}). ${errorText}`
    );
  }

  const fileData = await uploadResponse.json();

  console.log(
    "GEMINI FILE UPLOAD RESPONSE:",
    JSON.stringify(fileData, null, 2)
  );

  const fileUri = fileData?.file?.uri;

  if (!fileUri) {
    throw new Error(
      "Gemini menerima upload tetapi tidak memberikan file URI."
    );
  }

  return fileUri;
}

/**
 * Transkripsi menggunakan Gemini 3.5 Transcribe.
 */
async function transcribeWithGemini35(
  fileUri: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
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
                fileData: {
                  fileUri,
                  mimeType,
                },
              },
            ],
          },
        ],

        generationConfig: {
          audioTranscriptionConfig: {
            languageCodes: ["id-ID"],
          },
        },
      }),
    }
  );

  const responseText = await response.text();

  console.log(
    "GEMINI 3.5 TRANSCRIBE STATUS:",
    response.status
  );

  console.log(
    "GEMINI 3.5 TRANSCRIBE RESPONSE:",
    responseText
  );

  if (!response.ok) {
    throw new Error(
      `Gemini 3.5 Transcribe error ${response.status}: ${responseText}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Response Gemini 3.5 bukan JSON yang valid."
    );
  }

  return extractText(data);
}

/**
 * Fallback:
 * Gemini 2.5 Flash membaca audio melalui fileData.
 */
async function transcribeWithGemini25(
  fileUri: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_TRANSCRIBE_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
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
                text:
                  "Transkripsikan seluruh ucapan pada audio ini secara akurat dalam bahasa Indonesia. Pertahankan kata-kata yang benar-benar diucapkan. Jangan menjelaskan audio. Jangan membuat ringkasan. Hanya keluarkan teks ucapan.",
              },
              {
                fileData: {
                  fileUri,
                  mimeType,
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

  const responseText = await response.text();

  console.log(
    "GEMINI 2.5 FALLBACK STATUS:",
    response.status
  );

  console.log(
    "GEMINI 2.5 FALLBACK RESPONSE:",
    responseText
  );

  if (!response.ok) {
    throw new Error(
      `Gemini 2.5 Flash error ${response.status}: ${responseText}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Response Gemini 2.5 bukan JSON yang valid."
    );
  }

  return extractText(data);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang di Vercel.",
        500
      );
    }

    /**
     * Ambil FormData.
     */
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

    const target = TARGET_VOICES[targetVoice];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    /**
     * MIME audio.
     */
    let mimeType =
      (audio.type || "audio/wav")
        .split(";")[0]
        .trim()
        .toLowerCase();

    /**
     * Gemini Transcribe mendukung format audio tertentu.
     */
    const supportedMimeTypes = [
      "audio/wav",
      "audio/x-wav",
      "audio/mp3",
      "audio/mpeg",
      "audio/aiff",
      "audio/aac",
      "audio/ogg",
      "audio/flac",
    ];

    /**
     * Normalisasi beberapa MIME umum.
     */
    if (mimeType === "audio/x-wav") {
      mimeType = "audio/wav";
    }

    if (mimeType === "audio/mpeg") {
      mimeType = "audio/mp3";
    }

    console.log("AUDIO INFO:", {
      name: audio.name,
      size: audio.size,
      type: audio.type,
      mimeType,
    });

    /**
     * Browser MediaRecorder sering menghasilkan audio/webm.
     *
     * Gemini Audio Transcription mendokumentasikan WAV, MP3,
     * AIFF, AAC, OGG Vorbis, dan FLAC.
     */
    if (!supportedMimeTypes.includes(mimeType)) {
      return jsonError(
        `Format audio "${mimeType}" belum didukung oleh jalur transkripsi ini. Gunakan WAV, MP3, AAC, OGG, FLAC, atau AIFF.`,
        415,
        `File: ${audio.name}`
      );
    }

    /**
     * Baca audio.
     */
    const arrayBuffer = await audio.arrayBuffer();

    const audioBuffer = Buffer.from(arrayBuffer);

    console.log("AUDIO BUFFER:", {
      bytes: audioBuffer.length,
      mimeType,
    });

    /**
     * =========================================================
     * STEP 1 — UPLOAD AUDIO KE GEMINI FILES API
     * =========================================================
     */
    const fileUri = await uploadAudioToGemini(
      audioBuffer,
      mimeType,
      apiKey
    );

    console.log("GEMINI FILE URI:", fileUri);

    /**
     * =========================================================
     * STEP 2 — SPEECH TO TEXT
     * =========================================================
     *
     * Utama:
     * Gemini 3.5 Transcribe
     *
     * Fallback:
     * Gemini 2.5 Flash
     */
    let transcript = "";

    try {
      transcript = await transcribeWithGemini35(
        fileUri,
        mimeType,
        apiKey
      );
    } catch (error) {
      console.error(
        "GEMINI 3.5 TRANSCRIBE FAILED:",
        error
      );
    }

    /**
     * Kalau Gemini 3.5 tidak menghasilkan teks,
     * coba Gemini 2.5 Flash.
     */
    if (!transcript) {
      console.log(
        "Gemini 3.5 tidak menghasilkan transcript. Menggunakan fallback Gemini 2.5 Flash..."
      );

      try {
        transcript = await transcribeWithGemini25(
          fileUri,
          mimeType,
          apiKey
        );
      } catch (error) {
        console.error(
          "GEMINI 2.5 FALLBACK FAILED:",
          error
        );
      }
    }

    transcript = transcript.trim();

    console.log("FINAL TRANSCRIPT:", transcript);

    if (!transcript) {
      return jsonError(
        "Gemini menerima file audio tetapi tidak menemukan ucapan. Pastikan file berupa WAV/MP3/AAC/OGG/FLAC/AIFF dan berisi suara manusia yang jelas.",
        422
      );
    }

    /**
     * =========================================================
     * STEP 3 — TEXT TO SPEECH
     * =========================================================
     */
    const ttsPrompt = `
Bacakan teks berikut dalam bahasa Indonesia.

Karakter suara:
${target.direction}

Instruksi:
- Pertahankan seluruh isi teks.
- Jangan mengubah kata.
- Jangan menambahkan kata pembuka.
- Jangan menambahkan kata penutup.
- Jangan menjelaskan teks.
- Jangan menyanyikan teks.
- Gunakan intonasi natural.
- Artikulasi harus jelas.
- Jangan terdengar seperti robot.

Teks yang harus dibacakan:

${transcript}
`.trim();

    const ttsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
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
                  text: ttsPrompt,
                },
              ],
            },
          ],

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

    const ttsResponseText = await ttsResponse.text();

    console.log(
      "GEMINI TTS STATUS:",
      ttsResponse.status
    );

    if (!ttsResponse.ok) {
      console.error(
        "GEMINI TTS ERROR:",
        ttsResponseText
      );

      return jsonError(
        "Suara tujuan gagal dibuat.",
        ttsResponse.status,
        ttsResponseText
      );
    }

    let ttsData: any;

    try {
      ttsData = JSON.parse(ttsResponseText);
    } catch {
      return jsonError(
        "Response Gemini TTS bukan JSON yang valid.",
        502,
        ttsResponseText
      );
    }

    console.log(
      "GEMINI TTS RESPONSE:",
      JSON.stringify(ttsData, null, 2)
    );

    /**
     * Cari bagian audio.
     */
    const audioPart =
      ttsData?.candidates?.[0]?.content?.parts?.find(
        (part: any) =>
          part?.inlineData?.data ||
          part?.inline_data?.data
      );

    const inlineData =
      audioPart?.inlineData ||
      audioPart?.inline_data;

    if (!inlineData?.data) {
      return jsonError(
        "Server tidak menerima audio hasil dari mesin suara.",
        502,
        JSON.stringify(ttsData)
      );
    }

    /**
     * MIME output Gemini.
     */
    const outputMime = String(
      inlineData.mimeType ||
        inlineData.mime_type ||
        "audio/L16;rate=24000"
    );

    /**
     * PCM hasil TTS.
     */
    const outputPcm = Buffer.from(
      inlineData.data,
      "base64"
    );

    /**
     * Ambil sample rate dari MIME.
     */
    const sampleRateMatch =
      outputMime.match(/rate=(\d+)/i);

    const sampleRate = sampleRateMatch
      ? Number(sampleRateMatch[1])
      : 24000;

    /**
     * PCM -> WAV.
     */
    const wav = pcmToWavBuffer(
      outputPcm,
      sampleRate,
      1,
      16
    );

    console.log("FINAL WAV:", {
      bytes: wav.length,
      sampleRate,
      transcript,
      targetVoice,
    });

    /**
     * =========================================================
     * RESPONSE
     * =========================================================
     */
    return new NextResponse(wav, {
      status: 200,

      headers: {
        "Content-Type": "audio/wav",

        "Content-Length": String(
          wav.length
        ),

        "Content-Disposition":
          'inline; filename="voice-to-voice.wav"',

        "Cache-Control": "no-store",

        "X-Voice-Target": targetVoice,

        /**
         * Supaya frontend bisa mengetahui transcript
         * jika diperlukan.
         */
        "X-Transcript":
          encodeURIComponent(transcript),
      },
    });
  } catch (error) {
    console.error(
      "VOICE CHANGER SERVER ERROR:",
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
