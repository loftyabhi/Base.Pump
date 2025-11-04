import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/prompthero/openjourney-v4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!hfRes.ok) {
      const text = await hfRes.text();
      console.error("HF API failed:", text);
      return NextResponse.json({ error: "HF API Error" }, { status: 500 });
    }

    // Convert blob to base64 for frontend display
    const arrayBuffer = await hfRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Error generating image:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
