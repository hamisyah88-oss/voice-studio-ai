import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TARGET_ENV: Record<string, string> = {
  guru_wanita: "V2V_VOICE_GURU_WANITA",
  guru_pria: "V2V_VOICE_GURU_PRIA",
  anak_perempuan: "V2V_VOICE_ANAK_PEREMPUAN",
  anak_lakilaki: "V2V_VOICE_ANAK_LAKI_LAKI",
  kakek: "V2V_VOICE_KAKEK",
  nenek: "V2V_VOICE_NENEK",
  creator: "V2V_VOICE_CREATOR",
  ustadz: "V2V_VOICE_USTADZ",
  ustadzah: "V2V_VOICE_USTADZAH",
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY belum dipasang di environment." },
        { status: 500 }
      );
    }

    const incoming = await req.formData();
    const audio = incoming.get("audio");
    const targetVoice =
      String(incoming.get("targetVoice") || incoming.get("voiceKey") || "");
    const removeNoise =
      String(
        incoming.get("removeBackgroundNoise") ?? incoming.get("removeNoise") ?? "true"
      ) === "true";

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "File audio belum dipilih." },
        { status: 400 }
      );
    }

    if (!TARGET_ENV[targetVoice]) {
      return NextResponse.json(
        { error: `Target voice "${targetVoice}" tidak dikenali.` },
        { status: 400 }
      );
    }

    const voiceId = process.env[TARGET_ENV[targetVoice]];
    if (!voiceId) {
      return NextResponse.json(
        {
          error:
            `Voice ID untuk "${targetVoice}" belum dipasang. ` +
            `Isi ${TARGET_ENV[targetVoice]} di Vercel Environment Variables.`,
        },
        { status: 400 }
      );
    }

    const form = new FormData();
    form.append("audio", audio, audio.name || "recording.webm");
    form.append("model_id", "eleven_multilingual_sts_v2");
    form.append("remove_background_noise", String(removeNoise));

    const response = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${encodeURIComponent(
        voiceId
      )}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: form,
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: "Voice conversion gagal.", detail },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="voice-to-voice-result.mp3"',
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
