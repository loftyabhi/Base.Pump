import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { image } = await req.json();
    if (!image) return new Response("Missing image", { status: 400 });

    const filePath = path.join(process.cwd(), "app/images.json");
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : [];

    if (!existing.includes(image)) {
      existing.push(image);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Failed to save image:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
