"use client";

import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import {
  showSuccess,
  showError,
  showInfo,
  showLoading,
  dismissToasts,
} from "../utils/toastUtils";
import { getImages } from "@/app/utils/getImages";

export default function List({ toggleCreate, factory, fee }) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // ✅ Call your server-side API proxy to generate image safely
  async function generateTokenImage(prompt) {
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Hugging Face proxy failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.warn("⚠️ Hugging Face failed, using fallback image:", error);
      return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/600/600`;
    }
  }

  // ✅ Main Create Handler
  const listHandler = async (e) => {
    e.preventDefault();
    if (!name || !ticker) return showError("PLEASE FILL IN ALL FIELDS.");
    if (!walletClient || !publicClient)
      return showError("WALLET NOT CONNECTED");

    try {
      showLoading("CREATING TOKEN ON BASE NETWORK...");

      const hash = await walletClient.writeContract({
        address: factory.address,
        abi: factory.abi,
        functionName: "create",
        args: [name, ticker],
        value: fee,
      });

      showLoading("WAITING FOR CONFIRMATION...");
      await publicClient.waitForTransactionReceipt({ hash });

      // 🧠 Generate prompt-based image
      const prompt = `A futuristic digital coin called ${name} (${ticker}) with a glowing Base chain cyberpunk theme`;
      const generatedImage = await generateTokenImage(prompt);

      // 🖼️ Fallback safety: use local images if all fail
      const allImages = await getImages();
      const finalImage =
        generatedImage ||
        allImages[Math.floor(Math.random() * allImages.length)];

      dismissToasts();
      showSuccess(`TOKEN "${name}" CREATED SUCCESSFULLY!`);
      console.log("🖼️ Token image used:", finalImage);
      setTimeout(() => toggleCreate(), 1000);
    } catch (error) {
      dismissToasts();
      console.error("Error in token creation:", error);
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected")
      ) {
        showInfo("USER CANCELED TRANSACTION.");
      } else {
        showError("TRANSACTION FAILED.");
      }
    }
  };

  return (
    <div className="overlay">
      <div className="popup">
        <h2>CREATE NEW TOKEN</h2>
        <form onSubmit={listHandler}>
          <input
            type="text"
            placeholder="NAME"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
          />
          <input
            type="text"
            placeholder="TICKER"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
          />
          <div className="buttons">
            <button type="submit" className="btn--fancy">
              LIST
            </button>
            <button type="button" className="btn--fancy" onClick={toggleCreate}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
