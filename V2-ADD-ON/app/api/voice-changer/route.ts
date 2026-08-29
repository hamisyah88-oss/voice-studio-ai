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
 * Upload audio ke Gemini Files API.
 *
 * Gemini merekomendasikan Files API untuk audio,
 * kemudian file URI digunakan untuk transkripsi.
 */
async function uploadAudioToGemini(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string
) {
  const uploadUrl =
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

  // STEP 1
  // Memulai resumable upload.
  const startResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(
        audioBuffer.length
      ),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: {
        display_name: "voice-studio-input",
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
      `Gagal memulai upload audio ke Gemini (${startResponse.status}).`
    );
  }

  const uploadUrlFromHeader =
    startResponse.headers.get("x-goog-upload-url");

  if (!uploadUrlFromHeader) {
    throw new Error(
      "Gemini tidak memberikan upload URL."
    );
  }

  // STEP 2
  // Mengirim binary audio.
  const uploadResponse = await fetch(
    uploadUrlFromHeader,
    {
      method: "POST",
      headers: {
        "Content-Length": String(audioBuffer.length),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
        "Content-Type": mimeType,
      },
      body: audioBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();

    console.error("GEMINI FILE UPLOAD ERROR:", {
      status: uploadResponse.status,
      response: errorText,
    });

    throw new Error(
      `Gagal upload audio ke Gemini (${uploadResponse.status}).`
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
      "Gemini tidak mengembalikan URI file audio."
    );
  }

  return {
    uri: fileUri,
    mimeType:
      fileData?.file?.mimeType ||
      fileData?.file?.mime_type ||
      mimeType,
  };
}

/**
 * Transkripsi menggunakan Gemini 3.5 Transcribe.
 *
 * Alurnya:
 * audio -> Files API -> file URI
 * -> Interactions API -> transcript
 */
async function transcribeAudio(
  fileUri: string,
  mimeType: string,
  apiKey: string
) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
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

        generation_config: {
          transcription_config: {
            language_codes: ["id-ID"],

            mode: "verbatim",
          },
        },
      }),
    }
  );

  const responseText = await response.text();

  console.log(
    "GEMINI TRANSCRIBE STATUS:",
    response.status
  );

  console.log(
    "GEMINI TRANSCRIBE RESPONSE:",
    responseText
  );

  if (!response.ok) {
    throw new Error(
      `Gemini transcription gagal (${response.status}): ${responseText}`
    );
  }

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Respons transkripsi Gemini bukan JSON yang valid."
    );
  }

  /**
   * Dokumentasi terbaru menyediakan output_text
   * sebagai transcript utama.
   */
  let transcript =
    typeof data?.output_text === "string"
      ? data.output_text.trim()
      : "";

  /**
   * Fallback jika struktur respons berbeda.
   */
  if (!transcript) {
    const possibleSteps = Array.isArray(data?.steps)
      ? data.steps
      : [];

    for (const step of possibleSteps) {
      const contents = Array.isArray(step?.content)
        ? step.content
        : [];

      for (const content of contents) {
        if (
          content?.type === "text" &&
          typeof content?.text === "string"
        ) {
          transcript += `${content.text} `;
        }

        if (
          typeof content?.text === "string"
        ) {
          transcript += `${content.text} `;
        }
      }
    }

    transcript = transcript.trim();
  }

  if (!transcript) {
    throw new Error(
      "Gemini menerima file audio tetapi tidak menghasilkan teks transkripsi."
    );
  }

  return transcript;
}

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. API KEY
    // =========================================================

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "GEMINI_API_KEY belum dipasang.",
        500
      );
    }

    // =========================================================
    // 2. FORM DATA
    // =========================================================

    const incoming = await req.formData();

    const audio = incoming.get("audio");

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

    console.log("AUDIO INFO:", {
      name: audio.name,
      type: audio.type,
      size: audio.size,
    });

    // =========================================================
    // 3. VALIDASI FILE
    // =========================================================

    if (audio.size === 0) {
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

    // =========================================================
    // 4. BACA AUDIO
    // =========================================================

    const arrayBuffer =
      await audio.arrayBuffer();

    const audioBuffer =
      Buffer.from(arrayBuffer);

    /**
     * Pertahankan MIME asli.
     * Jangan lagi memaksa semua file menjadi audio/wav.
     */
    let mimeType =
      (audio.type || "").split(";")[0].toLowerCase();

    if (!mimeType) {
      mimeType = "audio/wav";
    }

    console.log("AUDIO MIME TYPE:", mimeType);

    // =========================================================
    // 5. UPLOAD KE GEMINI FILES API
    // =========================================================

    const uploadedFile =
      await uploadAudioToGemini(
        audioBuffer,
        mimeType,
        apiKey
      );

    console.log(
      "GEMINI AUDIO FILE URI:",
      uploadedFile.uri
    );

    // =========================================================
    // 6. TRANSKRIPSI
    // =========================================================

    let transcript: string;

    try {
      transcript =
        await transcribeAudio(
          uploadedFile.uri,
          uploadedFile.mimeType,
          apiKey
        );
    } catch (error) {
      console.error(
        "TRANSCRIPTION ERROR:",
        error
      );

      return jsonError(
        "Gemini gagal mentranskripsikan audio.",
        422,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    console.log(
      "FINAL TRANSCRIPT:",
      transcript
    );

    // =========================================================
    // 7. TEXT TO SPEECH
    // =========================================================

    const ttsPrompt = `
Bacakan teks berikut dalam bahasa Indonesia.

Karakter suara:
${target.direction}

Instruksi:
- Pertahankan isi dan urutan kata.
- Jangan menambahkan kata pembuka.
- Jangan menambahkan kata penutup.
- Jangan mengubah makna.
- Jangan menyanyikan teks.
- Gunakan intonasi natural.
- Ucapkan dengan jelas.
- Gunakan jeda yang wajar.

Teks:
${transcript}
`.trim();

    const ttsResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
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

    if (!ttsResponse.ok) {
      const errorText =
        await ttsResponse.text();

      console.error(
        "GEMINI TTS ERROR:",
        {
          status:
            ttsResponse.status,
          response:
            errorText,
        }
      );

      return jsonError(
        "Suara tujuan gagal dibuat.",
        ttsResponse.status,
        errorText
      );
    }

    // =========================================================
    // 8. PARSE TTS RESPONSE
    // =========================================================

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

    const audioPart =
      ttsData?.candidates?.[0]
        ?.content?.parts?.find(
          (part: any) =>
            part?.inlineData?.data ||
            part?.inline_data?.data
        );

    if (!audioPart) {
      return jsonError(
        "Gemini tidak mengembalikan audio hasil suara.",
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
    // 9. PCM -> WAV
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
        ? Number(
            sampleRateMatch[1]
          )
        : 24000;

    const wav =
      pcmToWavBuffer(
        outputPcm,
        sampleRate
      );

    // =========================================================
    // 10. RETURN AUDIO
    // =========================================================

    return new NextResponse(
      wav,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Content-Length":
            String(wav.length),

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
