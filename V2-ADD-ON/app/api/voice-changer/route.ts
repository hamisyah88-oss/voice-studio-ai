import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dipasang." },
        { status: 500 }
      );
    }

    const incoming = await req.formData();
    const audio = incoming.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "File audio belum dipilih." },
        { status: 400 }
      );
    }

    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                    "Analyze this audio recording and return a clean Indonesian transcript of exactly what is spoken. Do not add explanations.",
                },
                {
                  inline_data: {
                    mime_type: audio.type || "audio/webm",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      return NextResponse.json(
        {
          error: "Gemini gagal memproses audio.",
          detail,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const transcript =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim() || "";

    return NextResponse.json({
      success: true,
      transcript,
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
