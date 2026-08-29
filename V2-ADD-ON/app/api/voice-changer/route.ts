import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const TARGET_VOICES: Record<
  string,
  { voice: string; direction: string }
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
 * Ambil teks dari response Gemini generateContent.
 */
function extractGeminiText(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

/**
 * Upload audio ke Gemini Files API.
 *
 * Ini sengaja menggunakan Uint8Array dengan ArrayBuffer biasa
 * supaya tidak terkena error TypeScript BodyInit pada Buffer.
 */
async function uploadToGeminiFiles(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
) {
  const numBytes = audioBuffer.byteLength;

  // ------------------------------------------------------------
  // STEP A — START RESUMABLE UPLOAD
  // ------------------------------------------------------------

  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",

      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(numBytes),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        file: {
          display_name: `voice-studio-${Date.now()}`,
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
      `Gagal memulai upload audio ke Gemini (${startResponse.status}). ${errorText}`
    );
  }

  // Header upload URL dari Gemini.
  const uploadUrl =
    startResponse.headers.get("x-goog-upload-url") ||
    startResponse.headers.get("X-Goog-Upload-URL");

  if (!uploadUrl) {
    throw new Error(
      "Gemini tidak mengembalikan URL upload audio."
    );
  }

  // ------------------------------------------------------------
  // STEP B — UPLOAD AUDIO
  // ------------------------------------------------------------

  /**
   * Jangan gunakan:
   *
   * body: audioBuffer
   *
   * karena TypeScript Next.js/Vercel dapat menolak Buffer
   * sebagai BodyInit.
   *
   * Kita buat ArrayBuffer yang benar-benar standalone.
   */

  const uploadArrayBuffer = new ArrayBuffer(audioBuffer.byteLength);

  new Uint8Array(uploadArrayBuffer).set(audioBuffer);

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",

    headers: {
      "Content-Length": String(numBytes),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },

    body: uploadArrayBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error("GEMINI FILE UPLOAD ERROR:", {
      status: uploadResponse.status,
      response: errorText,
    });

    throw new Error(
      `Gagal upload audio ke Gemini (${uploadResponse.status}). ${errorText}`
    );
  }

  const fileData = await uploadResponse.json();

  console.log(
    "GEMINI FILE UPLOAD RESPONSE:",
    JSON.stringify(fileData, null, 2)
  );

  const fileUri = fileData?.file?.uri;

  const uploadedMimeType =
    fileData?.file?.mimeType ||
    fileData?.file?.mime_type ||
    mimeType;

  if (!fileUri) {
    throw new Error(
      "Gemini berhasil menerima upload tetapi tidak memberikan file URI."
    );
  }

  return {
    uri: fileUri,
    mimeType: uploadedMimeType,
  };
}

/**
 * Transkripsi audio menggunakan Gemini 3.5 Transcribe.
 */

/**
 * Transkripsi audio menggunakan Gemini 3.5 Transcribe
 * melalui Interactions API.
 *
 * Ini digunakan khusus untuk speech-to-text agar hasil
 * transkrip diambil langsung dari output_text.
 */
async function transcribeAudio(
  fileUri: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  console.log("START GEMINI TRANSCRIPTION:", {
    fileUri,
    mimeType,
    model: TRANSCRIBE_MODEL,
  });

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: TRANSCRIBE_MODEL,
        input: [
          {
            type: "audio",
            uri: fileUri,
            mime_type: mimeType,
          },
        ],
      }),
    }
  );

  console.log(
    "GEMINI TRANSCRIPTION HTTP STATUS:",
    response.status
  );

  const rawText = await response.text();

  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    console.error(
      "GEMINI TRANSCRIPTION INVALID JSON:",
      rawText
    );

    throw new Error(
      "Gemini mengembalikan response yang bukan JSON."
    );
  }

  console.log(
    "GEMINI INTERACTION RESPONSE:",
    JSON.stringify(data, null, 2)
  );

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      rawText ||
      "Unknown Gemini error";

    throw new Error(
      `Gemini transcription gagal (${response.status}): ${message}`
    );
  }

  /*
   * Gemini 3.5 Transcribe / Interactions API
   *
   * Response:
   * steps[]
   *   -> type: "model_output"
   *   -> content[]
   *      -> type: "text"
   *      -> text: "..."
   */

  const transcriptParts: string[] = [];

  if (Array.isArray(data?.steps)) {
    for (const step of data.steps) {
      if (!Array.isArray(step?.content)) continue;

      for (const content of step.content) {
        if (
          content?.type === "text" &&
          typeof content?.text === "string"
        ) {
          const text = content.text.trim();

          if (text) {
            transcriptParts.push(text);
          }
        }
      }
    }
  }

  /*
   * Fallback jika SDK/API mengembalikan output_text.
   */
  if (
    transcriptParts.length === 0 &&
    typeof data?.output_text === "string"
  ) {
    const text = data.output_text.trim();

    if (text) {
      transcriptParts.push(text);
    }
  }

  const transcript = transcriptParts.join(" ").trim();

  console.log(
    "FINAL TRANSCRIPT:",
    transcript
  );

  if (!transcript) {
    throw new Error(
      "Gemini berhasil memproses audio tetapi tidak menghasilkan teks transkripsi."
    );
  }

  return transcript;
}

  // ============================================================
  // HASIL UTAMA — INTERACTIONS API
  // ============================================================
// ============================================================
// AMBIL HASIL TRANSKRIP DARI RESPONSE GEMINI
// ============================================================

let transcript = "";

// Format output_text
if (typeof data?.output_text === "string") {
  transcript = data.output_text.trim();
}

// Format Gemini Interactions API:
// steps -> content -> text
if (!transcript && Array.isArray(data?.steps)) {
  const texts: string[] = [];

  for (const step of data.steps) {
    if (!Array.isArray(step?.content)) continue;

    for (const content of step.content) {
      if (
        content &&
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        texts.push(content.text.trim());
      }
    }
  }

  transcript = texts.join(" ").trim();
}

// Format alternatif jika response langsung mempunyai text
if (!transcript && typeof data?.text === "string") {
  transcript = data.text.trim();
}

// Format alternatif response nested
if (
  !transcript &&
  typeof data?.response?.text === "string"
) {
  transcript = data.response.text.trim();
}

console.log("FINAL TRANSCRIPT:", transcript);

if (!transcript) {
  throw new Error(
    "Gemini menerima audio tetapi tidak mengembalikan teks transkrip. Periksa response Gemini pada log deployment."
  );
}

  // ============================================================
  // FALLBACK
  // ============================================================

  if (!transcript && Array.isArray(data?.outputs)) {
    transcript = data.outputs
      .map((item: any) => {
        if (typeof item?.text === "string") {
          return item.text;
        }

        if (Array.isArray(item?.content)) {
          return item.content
            .map((part: any) => part?.text || "")
            .join(" ");
        }

        return "";
      })
      .join(" ")
      .trim();
  }

  // ============================================================
  // FALLBACK TAMBAHAN JIKA RESPONSE BERBENTUK CANDIDATES
  // ============================================================

  if (!transcript && Array.isArray(data?.candidates)) {
    transcript = data.candidates
      .flatMap(
        (candidate: any) =>
          candidate?.content?.parts || []
      )
      .map(
        (part: any) =>
          part?.text || ""
      )
      .join(" ")
      .trim();
  }

  console.log(
    "FINAL TRANSCRIPT:",
    transcript
  );

  if (!transcript) {
    throw new Error(
      "Gemini menerima audio tetapi transkrip kosong. Periksa response Gemini pada log deployment."
    );
  }

  return transcript;
}
/**
 * Generate suara baru berdasarkan transcript.
 */
async function generateTargetVoice(
  transcript: string,
  target: { voice: string; direction: string },
  apiKey: string
) {
  const ttsPrompt = `
Synthesize the following Indonesian text as natural spoken Indonesian.

Voice character:
${target.direction}

Performance:
- natural human speech
- clear pronunciation
- natural Indonesian intonation
- conversational pacing
- preserve every word
- do not add words
- do not remove words
- do not translate
- do not sing
- do not read the instructions aloud

Spoken text:
${transcript}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
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

  if (!response.ok) {
    const errorText = await response.text();

    console.error("GEMINI TTS ERROR:", {
      status: response.status,
      response: errorText,
    });

    throw new Error(
      `Suara tujuan gagal dibuat (${response.status}). ${errorText}`
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
      "Gemini tidak mengembalikan audio hasil sintesis."
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

  return pcmToWavBuffer(
    outputPcm,
    sampleRate
  );
}

export async function POST(req: Request) {
  try {
    // ============================================================
    // API KEY
    // ============================================================

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang.",
        500
      );
    }

    // ============================================================
    // FORM DATA
    // ============================================================

    const incoming =
      await req.formData();

    const audio =
      incoming.get("audio");

    const targetVoice = String(
      incoming.get("targetVoice") ||
        "guru_wanita"
    );

    if (!(audio instanceof File)) {
      return jsonError(
        "File audio belum dipilih.",
        400
      );
    }

    // ============================================================
    // VALIDASI SIZE
    // ============================================================

    if (
      audio.size >
      50 * 1024 * 1024
    ) {
      return jsonError(
        "File terlalu besar. Maksimal 50 MB.",
        400
      );
    }

    // ============================================================
    // TARGET VOICE
    // ============================================================

    const target =
      TARGET_VOICES[targetVoice];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    // ============================================================
    // AUDIO INFO
    // ============================================================

    const arrayBuffer =
      await audio.arrayBuffer();

    const audioBuffer =
      Buffer.from(arrayBuffer);

    let mimeType =
      (audio.type ||
        "audio/wav")
        .split(";")[0]
        .toLowerCase();

    /**
     * Beberapa browser kadang mengirim MIME kosong.
     */
    if (!mimeType.startsWith("audio/")) {
      mimeType = "audio/wav";
    }

    console.log("VOICE CHANGER INPUT:", {
      fileName: audio.name,
      size: audio.size,
      mimeType,
      targetVoice,
    });

    // ============================================================
    // STEP 1
    // UPLOAD AUDIO KE GEMINI FILES API
    // ============================================================

    const uploadedFile =
      await uploadToGeminiFiles(
        audioBuffer,
        mimeType,
        apiKey
      );

    console.log(
      "GEMINI FILE URI:",
      uploadedFile.uri
    );

    // ============================================================
    // STEP 2
    // SPEECH TO TEXT
    // ============================================================

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

    // ============================================================
    // STEP 3
    // TEXT TO SPEECH
    // ============================================================

    const wav =
      await generateTargetVoice(
        transcript,
        target,
        apiKey
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    /**
     * Jangan kirim Buffer langsung ke NextResponse.
     *
     * Kita ubah menjadi Uint8Array dengan ArrayBuffer
     * standalone agar kompatibel dengan BodyInit
     * pada Next.js/Vercel.
     */

    const wavArrayBuffer =
      new ArrayBuffer(wav.byteLength);

    new Uint8Array(wavArrayBuffer)
      .set(wav);

    return new NextResponse(
      wavArrayBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Content-Length":
            String(wav.byteLength),

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
      "VOICE CHANGER ERROR:",
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
