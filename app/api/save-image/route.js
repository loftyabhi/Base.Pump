import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    // Path to your images.json file
    const filePath = path.join(process.cwd(), "app", "images.json");

    // Read and update images.json
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data)) data = [];

    data.push(image);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, message: "Image saved." });
  } catch (err) {
    console.error("Save image error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
