import { NextResponse } from "next/server";

export const runtime = "nodejs";

/*
|--------------------------------------------------------------------------
| MODELS
|--------------------------------------------------------------------------
| Flash-Lite digunakan untuk membaca/transkripsi audio.
| Gemini 2.5 Flash TTS digunakan untuk membuat suara target.
|--------------------------------------------------------------------------
*/

const TRANSCRIBE_MODEL = "gemini-2.5-flash-lite";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

/*
|--------------------------------------------------------------------------
| TARGET VOICES
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| MIME TYPE
|--------------------------------------------------------------------------
|
| Browser biasanya merekam audio sebagai:
|
| audio/webm
| audio/webm;codecs=opus
|
| Kita hanya kirim MIME utama.
|--------------------------------------------------------------------------
*/

function normalizeMimeType(audio: File): string {
  const browserType = String(audio.type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (browserType.startsWith("audio/")) {
    return browserType;
  }

  const filename = String(audio.name || "").toLowerCase();

  if (filename.endsWith(".wav")) {
    return "audio/wav";
  }

  if (filename.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  if (filename.endsWith(".m4a")) {
    return "audio/mp4";
  }

  if (filename.endsWith(".aac")) {
    return "audio/aac";
  }

  if (filename.endsWith(".ogg")) {
    return "audio/ogg";
  }

  if (filename.endsWith(".flac")) {
    return "audio/flac";
  }

  if (filename.endsWith(".webm")) {
    return "audio/webm";
  }

  /*
   * Default untuk rekaman browser.
   */
  return "audio/webm";
}

/*
|--------------------------------------------------------------------------
| EXTRACT TEXT
|--------------------------------------------------------------------------
*/

function extractText(data: any): string {
  const parts =
    data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part: any) => {
      if (typeof part?.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("")
    .trim();
}

/*
|--------------------------------------------------------------------------
| PCM -> WAV
|--------------------------------------------------------------------------
|
| Gemini TTS mengembalikan PCM.
| Browser lebih mudah memutar WAV.
|--------------------------------------------------------------------------
*/

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

  const buffer =
    Buffer.alloc(44 + pcm.length);

  buffer.write("RIFF", 0);

  buffer.writeUInt32LE(
    36 + pcm.length,
    4
  );

  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);

  buffer.writeUInt32LE(
    16,
    16
  );

  buffer.writeUInt16LE(
    1,
    20
  );

  buffer.writeUInt16LE(
    channels,
    22
  );

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

/*
|--------------------------------------------------------------------------
| TRANSCRIBE AUDIO
|--------------------------------------------------------------------------
|
| Audio dikirim LANGSUNG sebagai inlineData.
|
| Tidak memakai:
| - Files API
| - resumable upload
| - upload URL
| - Buffer sebagai fetch body
|--------------------------------------------------------------------------
*/

async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const base64Audio =
    Buffer.from(audioBuffer).toString(
      "base64"
    );

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent`;

  console.log(
    "GEMINI TRANSCRIPTION MODEL:",
    TRANSCRIBE_MODEL
  );

  console.log(
    "GEMINI AUDIO MIME:",
    mimeType
  );

  console.log(
    "GEMINI AUDIO SIZE:",
    audioBuffer.byteLength
  );

  const response = await fetch(
    endpoint,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          apiKey,
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Transkripsikan ucapan pada audio ini secara akurat dalam bahasa Indonesia. " +
                  "Tulis hanya ucapan yang terdengar. " +
                  "Pertahankan kata-kata yang diucapkan. " +
                  "Jangan menjelaskan audio. " +
                  "Jangan menambahkan kata atau kalimat. " +
                  "Jangan menerjemahkan. " +
                  "Gunakan tanda baca yang wajar. " +
                  "Jika suara kurang jelas, gunakan kata yang paling sesuai berdasarkan suara yang terdengar.",
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

  const rawResponse =
    await response.text();

  /*
   * SELALU tampilkan response asli Google
   * supaya kalau 404 kita tahu penyebabnya.
   */

  if (!response.ok) {
    console.error(
      "================================================"
    );

    console.error(
      "GEMINI TRANSCRIPTION ERROR"
    );

    console.error(
      "STATUS:",
      response.status
    );

    console.error(
      "MODEL:",
      TRANSCRIBE_MODEL
    );

    console.error(
      "RESPONSE:",
      rawResponse
    );

    console.error(
      "================================================"
    );

    throw new Error(
      `Gemini transcription gagal (${response.status}): ${rawResponse}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(
      rawResponse
    );
  } catch {
    console.error(
      "GEMINI INVALID JSON:",
      rawResponse
    );

    throw new Error(
      "Response Gemini bukan JSON yang valid."
    );
  }

  console.log(
    "GEMINI TRANSCRIPTION RESPONSE:",
    JSON.stringify(
      data,
      null,
      2
    )
  );

  const transcript =
    extractText(data);

  if (!transcript) {
    console.error(
      "GEMINI TIDAK MEMBERIKAN TEXT."
    );

    console.error(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      "Gemini menerima file audio tetapi tidak menghasilkan transkripsi."
    );
  }

  return transcript;
}

/*
|--------------------------------------------------------------------------
| TEXT -> TARGET VOICE
|--------------------------------------------------------------------------
*/

async function synthesizeSpeech(
  transcript: string,
  target: {
    voice: string;
    direction: string;
  },
  apiKey: string
): Promise<Buffer> {
  const ttsPrompt =
    `Bacakan teks berikut dalam bahasa Indonesia. ` +
    `${target.direction}. ` +
    `Pertahankan isi, kata, dan urutan kalimat. ` +
    `Jangan menambahkan kata pembuka. ` +
    `Jangan menambahkan kata penutup. ` +
    `Jangan menerjemahkan. ` +
    `Jangan menyanyikan teks. ` +
    `Bacakan secara natural dan jelas.\n\n` +
    `Teks:\n${transcript}`;

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

  console.log(
    "GEMINI TTS MODEL:",
    TTS_MODEL
  );

  console.log(
    "TARGET VOICE:",
    target.voice
  );

  const response = await fetch(
    endpoint,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          apiKey,
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
          responseModalities: [
            "AUDIO",
          ],

          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName:
                  target.voice,
              },
            },

            languageCode: "id-ID",
          },
        },
      }),
    }
  );

  const rawResponse =
    await response.text();

  if (!response.ok) {
    console.error(
      "GEMINI TTS ERROR:",
      {
        status:
          response.status,
        response:
          rawResponse,
      }
    );

    throw new Error(
      `Gemini TTS gagal (${response.status}): ${rawResponse}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(
      rawResponse
    );
  } catch {
    throw new Error(
      "Response TTS Gemini tidak valid."
    );
  }

  console.log(
    "GEMINI TTS RESPONSE:",
    JSON.stringify(
      data,
      null,
      2
    )
  );

  const parts =
    data?.candidates?.[0]?.content?.parts;

  const audioPart =
    Array.isArray(parts)
      ? parts.find(
          (part: any) =>
            part?.inlineData?.data ||
            part?.inline_data?.data
        )
      : null;

  const inlineData =
    audioPart?.inlineData ||
    audioPart?.inline_data;

  if (!inlineData?.data) {
    throw new Error(
      "Gemini berhasil memproses teks tetapi tidak mengembalikan audio."
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

  return pcmToWavBuffer(
    outputPcm,
    sampleRate
  );
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(
  req: Request
) {
  try {
    /*
     * API KEY
     */

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang di environment variables.",
        500
      );
    }

    /*
     * FORM DATA
     */

    const formData =
      await req.formData();

    const audio =
      formData.get("audio");

    const targetVoice =
      String(
        formData.get(
          "targetVoice"
        ) ||
          "guru_wanita"
      );

    /*
     * VALIDASI FILE
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

    if (
      audio.size >
      50 * 1024 * 1024
    ) {
      return jsonError(
        "File terlalu besar. Maksimal 50 MB.",
        400
      );
    }

    /*
     * TARGET
     */

    const target =
      TARGET_VOICES[
        targetVoice
      ];

    if (!target) {
      return jsonError(
        "Karakter suara tujuan tidak dikenal.",
        400
      );
    }

    /*
     * AUDIO
     */

    const mimeType =
      normalizeMimeType(
        audio
      );

    const audioBuffer =
      await audio.arrayBuffer();

    console.log(
      "================================================"
    );

    console.log(
      "VOICE CHANGER REQUEST"
    );

    console.log(
      "FILE:",
      audio.name
    );

    console.log(
      "TYPE:",
      audio.type
    );

    console.log(
      "NORMALIZED MIME:",
      mimeType
    );

    console.log(
      "SIZE:",
      audio.size
    );

    console.log(
      "TARGET:",
      targetVoice
    );

    console.log(
      "================================================"
    );

    /*
     * STEP 1
     * AUDIO -> TEXT
     */

    const transcript =
      await transcribeAudio(
        audioBuffer,
        mimeType,
        apiKey
      );

    console.log(
      "TRANSCRIPT:",
      transcript
    );

    /*
     * STEP 2
     * TEXT -> TARGET VOICE
     */

    const wav =
      await synthesizeSpeech(
        transcript,
        target,
        apiKey
      );

    /*
     * RESPONSE
     */

    return new NextResponse(
      wav,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Content-Length":
            String(
              wav.length
            ),

          "Content-Disposition":
            'inline; filename="voice-to-voice.wav"',

          "Cache-Control":
            "no-store",

          "X-Voice-Target":
            targetVoice,

          /*
           * Ini berguna untuk debugging
           * di browser/network.
           */
          "X-Transcript":
            encodeURIComponent(
              transcript
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "================================================"
    );

    console.error(
      "VOICE CHANGER FATAL ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================================"
    );

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan server.";

    return jsonError(
      message,
      500
    );
  }
}
