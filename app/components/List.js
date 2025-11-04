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

  // Helper to save generated image in /app/images.json (server route)
  async function saveImageToJson(newImageUrl) {
    try {
      const res = await fetch("/api/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImageUrl }),
      });
      if (!res.ok) {
        console.warn("❌ Failed to save image in images.json");
      }
    } catch (err) {
      console.error("Error saving image:", err);
    }
  }

  const listHandler = async (e) => {
    e.preventDefault();
    if (!name || !ticker) return showError("PLEASE FILL IN ALL FIELDS.");

    if (!walletClient || !publicClient) {
      return showError("WALLET NOT CONNECTED");
    }

    try {
      showLoading("CREATING TOKEN ON BASE NETWORK...");

      // 1️⃣ Create token onchain
      const hash = await walletClient.writeContract({
        address: factory.address,
        abi: factory.abi,
        functionName: "create",
        args: [name, ticker],
        value: fee,
      });

      showLoading("WAITING FOR CONFIRMATION...");
      await publicClient.waitForTransactionReceipt({ hash });

      // 2️⃣ Generate image based on token name
      const allImages = await getImages();
      const generatedUrl = `https://picsum.photos/seed/${encodeURIComponent(
        name
      )}/600/600`;
      const finalImage =
        allImages[Math.floor(Math.random() * allImages.length)] || generatedUrl;

      console.log("🖼️ Generated Token Image:", finalImage);

      // 3️⃣ Save image URL persistently in images.json
      await saveImageToJson(finalImage);

      dismissToasts();
      showSuccess(`TOKEN "${name}" CREATED SUCCESSFULLY!`);
      setTimeout(() => toggleCreate(), 1000);
    } catch (error) {
      dismissToasts();
      console.error(error);

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
            <button
              type="button"
              className="btn--fancy"
              onClick={toggleCreate}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
