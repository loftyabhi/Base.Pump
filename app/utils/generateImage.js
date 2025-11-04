export async function generateImage(prompt) {
  try {
    // 1️⃣ Generate with OpenAI Image API (DALL·E 3)
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Logo for a new crypto token named ${prompt}, vibrant, futuristic, minimalist style, dark background.`,
        size: "512x512",
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API failed: ${res.statusText}`);
    const data = await res.json();
    const imageBase64 = data.data[0].b64_json;
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // 2️⃣ Upload to Pinata
    const uploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append("file", new Blob([imageBuffer]), `${prompt}.png`);
        formData.append(
          "pinataMetadata",
          JSON.stringify({ name: `basepump_${prompt}` })
        );
        return formData;
      })(),
    });

    const uploadData = await uploadRes.json();
if (!uploadRes.ok || !uploadData.IpfsHash) throw new Error("Pinata upload failed");
const imageUrl = `https://pump.mypinata.cloud/ipfs/${uploadData.IpfsHash}`;

    return imageUrl;
  } catch (err) {
    console.error("AI image generation failed:", err.message);
    // Fallback — random placeholder
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512`;
  }
}
