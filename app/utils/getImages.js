export async function getImages(prompt) {
  try {
    // ✅ Load static images from /app/images.json
    const localImages = (await import("@/app/images.json")).default;

    if (Array.isArray(localImages) && localImages.length > 0) {
      console.log("✅ Loaded images from /app/images.json");
      return localImages;
    }

    throw new Error("Empty image list");
  } catch (err) {
    console.warn("⚠️ Local image load failed:", err.message);
  }

  // 1️⃣ Try loading from Pinata Cloud
  try {
    const res = await fetch(
      "https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=50",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Pinata request failed: ${res.statusText}`);

    const data = await res.json();
    const pinataImages = (data.rows || [])
      .filter((f) => f.ipfs_pin_hash)
      .map((f) => `https://pump.mypinata.cloud/ipfs/${f.ipfs_pin_hash}`);

    if (pinataImages.length > 0) {
      console.log("✅ Loaded images dynamically from Pinata");
      return pinataImages;
    }

    throw new Error("No valid images from Pinata");
  } catch (pinErr) {
    console.warn("⚠️ Pinata fetch failed:", pinErr.message);
  }

  // 2️⃣ Hugging Face AI fallback — via server route to avoid CORS
try {
  if (prompt) {
    console.log("🤖 Generating AI image via server proxy...");

    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `A futuristic token logo for ${prompt}, holographic glowing Base theme`,
      }),
    });

    if (!res.ok) throw new Error("Server-side generation failed");

    const data = await res.json();
    if (data.imageUrl) {
      console.log("✅ AI-generated image ready:", prompt);
      return [data.imageUrl];
    }
  }
} catch (hfErr) {
  console.warn("⚠️ AI generation failed, using fallback:", hfErr.message);
}

  

  // 3️⃣ Final fallback — random placeholders
  console.log("⚙️ Using fallback placeholder images...");
  return Array.from({ length: 25 }).map(
    (_, i) => `https://picsum.photos/seed/basepump_${i}/600/600`
  );
}
