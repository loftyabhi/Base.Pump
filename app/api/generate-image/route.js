export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!process.env.HF_API_KEY) {
      console.error("❌ Missing HF_API_KEY");
      return NextResponse.json(
        { error: "Missing Hugging Face API Key" },
        { status: 500 }
      );
    }

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
          parameters: { width: 512, height: 512, num_inference_steps: 25 },
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
