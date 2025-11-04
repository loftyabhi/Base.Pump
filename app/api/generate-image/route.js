export const runtime = "nodejs"; // ensures server runtime on Vercel
import { NextResponse } from "next/server";

// Test route
export async function GET() {
  return NextResponse.json({ status: "✅ generate-image route active" });
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.HF_API_KEY) {
      console.error("❌ Missing HF_API_KEY");
      return NextResponse.json(
        { error: "Missing Hugging Face API Key" },
        { status: 500 }
      );
    }

    // ✅ Official router endpoint (required since November 2024)
    const res = await fetch(
      "https://router.huggingface.co/hf-inference/models/prompthero/openjourney-v4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 512,
            height: 512,
            num_inference_steps: 25,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("HF API failed:", errText);
      return NextResponse.json(
        { error: "Hugging Face request failed", details: errText },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ image: dataUrl });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
