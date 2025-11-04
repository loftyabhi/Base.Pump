import fs from "fs/promises";
import path from "path";

export async function getImages() {
  const jsonPath = path.resolve(process.cwd(), "app/images.json");

  // 1️⃣ Load current local images.json
  let localImages = [];
  try {
    const file = await fs.readFile(jsonPath, "utf8");
    localImages = JSON.parse(file);
  } catch {
    console.warn("⚠️ No existing images.json found — starting fresh");
  }

  // 2️⃣ Try fetching pinned images from Pinata
  try {
    const res = await fetch(
      "https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Pinata API error: ${res.status}`);

    const data = await res.json();

    const pinataImages =
      data?.rows
        ?.filter((f) => f?.metadata?.name?.toLowerCase()?.includes("basepump"))
        ?.map((f) => `https://pump.mypinata.cloud/ipfs/${f.ipfs_pin_hash}`) || [];

    // 3️⃣ If Pinata returned new images, merge and update local JSON
    if (pinataImages.length > 0) {
      const newOnes = pinataImages.filter((url) => !localImages.includes(url));

      if (newOnes.length > 0) {
        const updatedList = [...newOnes, ...localImages].slice(0, 100); // keep max 100
        await fs.writeFile(
          jsonPath,
          JSON.stringify(updatedList, null, 2),
          "utf8"
        );
        console.log(`✅ Added ${newOnes.length} new images to images.json`);
        return updatedList;
      }

      console.log("✅ All Pinata images already in images.json");
      return localImages.length ? localImages : pinataImages;
    }

    throw new Error("No BasePump images found on Pinata");
  } catch (err) {
    console.warn("⚠️ Falling back — Pinata fetch failed:", err.message);

    // 4️⃣ Fallback — generate placeholder images (25 unique)
    const fallbackImages = Array.from({ length: 25 }).map(
      (_, i) => `https://picsum.photos/seed/basepump_${i}/600/600`
    );

    // If local JSON has images, use them first
    if (localImages.length > 0) {
      console.log("✅ Using existing images.json as fallback");
      return localImages;
    }

    // Write fallback to file (optional)
    await fs.writeFile(jsonPath, JSON.stringify(fallbackImages, null, 2), "utf8");
    return fallbackImages;
  }
}
