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
 * Fungsi ini membungkus PCM menjadi WAV standar
 * agar dapat langsung diputar oleh browser.
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
 * Ambil text dari response Gemini.
 */
function extractText(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

/**
 * Normalisasi MIME audio.
 *
 * Browser MediaRecorder sering menghasilkan:
 * audio/webm
 * audio/webm;codecs=opus
 *
 * Gemini membutuhkan MIME utama saja.
 */
function normalizeMimeType(audio: File): string {
  const type = String(audio.type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (type.startsWith("audio/")) {
    return type;
  }

  const name = audio.name.toLowerCase();

  if (name.endsWith(".webm")) return "audio/webm";
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".mp3")) return "audio/mpeg";
  if (name.endsWith(".m4a")) return "audio/mp4";
  if (name.endsWith(".aac")) return "audio/aac";
  if (name.endsWith(".ogg")) return "audio/ogg";
  if (name.endsWith(".flac")) return "audio/flac";

  return "audio/webm";
}

/**
 * Upload audio ke Gemini Files API.
 *
 * Penting:
 * Jangan menggunakan Buffer sebagai body fetch.
 * Kita menggunakan Blob supaya lolos TypeScript/Vercel.
 */
async function uploadAudioToGemini(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  apiKey: string
) {
  const fileSize = audioBuffer.byteLength;

  /**
   * STEP 1
   * Meminta URL upload resumable dari Gemini.
   */
  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",

      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        file: {
          display_name: `voice-input-${Date.now()}`,
        },
      }),
    }
  );

  if (!startResponse.ok) {
    const errorText = await startResponse.text();

    console.error("GEMINI FILE START ERROR:", {
      status: startResponse.status,
      response: errorText,
    });

    throw new Error(
      `Gagal memulai upload audio ke Gemini (${startResponse.status}).`
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
   * Upload file sebenarnya.
   *
   * PENTING:
   * Menggunakan Blob, bukan Buffer.
   */
  const audioBlob = new Blob(
    [audioBuffer],
    {
      type: mimeType,
    }
  );

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",

    headers: {
      "Content-Length": String(fileSize),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },

    body: audioBlob,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error("GEMINI AUDIO UPLOAD ERROR:", {
      status: uploadResponse.status,
      response: errorText,
    });

    throw new Error(
      `Upload audio ke Gemini gagal (${uploadResponse.status}).`
    );
  }

  const uploadData = await uploadResponse.json();

  console.log(
    "GEMINI FILE UPLOAD RESPONSE:",
    JSON.stringify(uploadData, null, 2)
  );

  const file = uploadData?.file;

  if (!file?.uri) {
    throw new Error(
      "Gemini berhasil menerima file tetapi URI file tidak ditemukan."
    );
  }

  return {
    uri: String(file.uri),
    name: String(file.name || ""),
    mimeType: String(file.mimeType || mimeType),
    state: String(file.state || "ACTIVE"),
  };
}

/**
 * Transkripsi audio menggunakan Gemini 2.5 Flash.
 */
async function transcribeAudio(
  fileUri: string,
  mimeType: string,
  apiKey: string
) {
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
                text:
                  "Transkripsikan ucapan pada file audio ini secara akurat dalam bahasa Indonesia. " +
                  "Pertahankan kata-kata yang benar-benar diucapkan. " +
                  "Jangan menjelaskan isi audio. " +
                  "Jangan menambahkan kalimat apa pun. " +
                  "Jangan mengubah makna ucapan. " +
                  "Gunakan tanda baca yang wajar. " +
                  "Jika terdapat jeda atau kata yang kurang jelas, tetap lakukan transkripsi berdasarkan suara yang terdengar.",
              },

              {
                fileData: {
                  mimeType,
                  fileUri,
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

  const rawText = await response.text();

  if (!response.ok) {
    console.error("GEMINI TRANSCRIPTION ERROR:", {
      status: response.status,
      response: rawText,
    });

    throw new Error(
      `Gemini gagal membaca audio (${response.status}).`
    );
  }

  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    console.error(
      "GEMINI TRANSCRIPTION INVALID JSON:",
      rawText
    );

    throw new Error(
      "Response transkripsi Gemini tidak valid."
    );
  }

  console.log(
    "GEMINI TRANSCRIPTION RESPONSE:",
    JSON.stringify(data, null, 2)
  );

  const transcript = extractText(data);

  if (!transcript) {
    console.error(
      "GEMINI MEMBERI RESPONSE TANPA TEXT:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      "Gemini menerima file audio tetapi tidak menemukan ucapan."
    );
  }

  return transcript;
}

/**
 * Buat suara target menggunakan Gemini TTS.
 */
async function synthesizeSpeech(
  transcript: string,
  target: {
    voice: string;
    direction: string;
  },
  apiKey: string
) {
  const ttsPrompt =
    `Bacakan teks berikut dalam bahasa Indonesia. ` +
    `${target.direction}. ` +
    `Pertahankan isi, kata, dan urutan kalimat. ` +
    `Jangan menambahkan kata pembuka atau penutup. ` +
    `Jangan menyanyikan teks. ` +
    `Jangan menerjemahkan teks. ` +
    `Bacakan secara natural.\n\n` +
    `Teks:\n${transcript}`;

  const response = await fetch(
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

  if (!response.ok) {
    const errorText = await response.text();

    console.error("GEMINI TTS ERROR:", {
      status: response.status,
      response: errorText,
    });

    throw new Error(
      `Suara tujuan gagal dibuat (${response.status}).`
    );
  }

  const data = await response.json();

  console.log(
    "GEMINI TTS RESPONSE:",
    JSON.stringify(data, null, 2)
  );

  const audioPart =
    data?.candidates?.[0]?.content?.parts?.find(
      (part: any) =>
        part?.inlineData?.data ||
        part?.inline_data?.data
    );

  const inlineData =
    audioPart?.inlineData ||
    audioPart?.inline_data;

  if (!inlineData?.data) {
    throw new Error(
      "Server tidak menerima audio hasil dari mesin suara."
    );
  }

  const outputMime = String(
    inlineData.mimeType ||
      inlineData.mime_type ||
      "audio/L16;rate=24000"
  );

  const outputPcm = Buffer.from(
    inlineData.data,
    "base64"
  );

  const sampleRateMatch =
    outputMime.match(/rate=(\d+)/i);

  const sampleRate = sampleRateMatch
    ? Number(sampleRateMatch[1])
    : 24000;

  const wav = pcmToWavBuffer(
    outputPcm,
    sampleRate
  );

  return wav;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang.",
        500
      );
    }

    /**
     * Ambil multipart/form-data.
     */
    const incoming = await req.formData();

    const audio = incoming.get("audio");

    const targetVoice = String(
      incoming.get("targetVoice") ||
        "guru_wanita"
    );

    /**
     * Validasi audio.
     */
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

    if (audio.size > 50 * 1024 * 1024) {
      return jsonError(
        "File terlalu besar. Maksimal 50 MB.",
        400
      );
    }

    /**
     * Validasi target voice.
     */
    const target =
      TARGET_VOICES[targetVoice];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    /**
     * Tentukan MIME audio.
     */
    const mimeType =
      normalizeMimeType(audio);

    console.log("VOICE CHANGER INPUT:", {
      name: audio.name,
      size: audio.size,
      originalType: audio.type,
      normalizedMimeType: mimeType,
      targetVoice,
    });

    /**
     * Ambil bytes audio.
     *
     * Kita sengaja menggunakan ArrayBuffer,
     * bukan Node Buffer untuk request upload.
     */
    const audioArrayBuffer =
      await audio.arrayBuffer();

    /**
     * STEP 1
     * Upload audio ke Gemini Files API.
     */
    const uploadedFile =
      await uploadAudioToGemini(
        audioArrayBuffer,
        mimeType,
        apiKey
      );

    console.log(
      "GEMINI AUDIO FILE:",
      uploadedFile
    );

    /**
     * STEP 2
     * Baca ucapan dari audio.
     */
    const transcript =
      await transcribeAudio(
        uploadedFile.uri,
        uploadedFile.mimeType,
        apiKey
      );

    console.log(
      "TRANSCRIPT:",
      transcript
    );

    if (!transcript.trim()) {
      return jsonError(
        "Ucapan tidak berhasil dikenali. Audio diterima tetapi teks kosong.",
        422
      );
    }

    /**
     * STEP 3
     * Buat suara target.
     */
    const wav =
      await synthesizeSpeech(
        transcript,
        target,
        apiKey
      );

    /**
     * STEP 4
     * Kirim WAV ke browser.
     */
    return new NextResponse(wav, {
      status: 200,

      headers: {
        "Content-Type": "audio/wav",

        "Content-Length":
          String(wav.length),

        "Content-Disposition":
          'inline; filename="voice-to-voice.wav"',

        "Cache-Control":
          "no-store",

        "X-Voice-Target":
          targetVoice,

        /**
         * Ini membantu frontend jika nanti
         * ingin menampilkan transcript.
         */
        "X-Transcript":
          encodeURIComponent(transcript),
      },
    });
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
