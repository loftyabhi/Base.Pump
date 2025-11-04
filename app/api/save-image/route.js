import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    // Path to images.json
    const filePath = path.join(process.cwd(), "app", "images.json");

    // Read + update
    let data = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      data = JSON.parse(fileContent || "[]");
    }

    if (!Array.isArray(data)) data = [];

    // Add new image
    data.push(image);

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, message: "Image saved ✅" });
  } catch (err) {
    console.error("Save image error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
