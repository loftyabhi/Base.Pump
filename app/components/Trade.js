"use client";

import { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseEther, formatEther } from "ethers";
import { showSuccess, showError } from "@/app/utils/toastUtils";
import factoryArtifact from "@/app/abis/Factory.json";
import config from "@/app/config.json";
import { useRouter } from "next/navigation";

export default function Trade({ token, factory, onClose }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const tokenAddress = token?.token ?? token?.tokenAddress ?? token?.address;

  async function buildFactoryContract(signerOrProvider) {
    if (factory?.contract) return factory.contract.connect(signerOrProvider);
    if (factory?.address && factory?.abi) return new Contract(factory.address, factory.abi, signerOrProvider);

    if (factoryArtifact.address) return new Contract(factoryArtifact.address, factoryArtifact.abi, signerOrProvider);

    const ethereum = window.ethereum;
    if (!ethereum) return null;
    const provider = new BrowserProvider(ethereum);
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);

    if (config?.[chainId]?.factory?.address) {
      return new Contract(config[chainId].factory.address, factoryArtifact.abi, signerOrProvider);
    }
    return null;
  }

  useEffect(() => {
    const computeCost = async () => {
      if (!amount || Number(amount) <= 0) return setEstimatedCost("");

      try {
        const ethereum = window.ethereum;
        if (!ethereum) return;

        const provider = new BrowserProvider(ethereum);
        const factoryContract = await buildFactoryContract(provider);
        if (!factoryContract) return;

        const sale = await factoryContract.tokenToSale(tokenAddress);
        const sold = sale?.sold ?? sale?.[3] ?? sale?.[2];
        const costPerToken = await factoryContract.getCost(sold);

        const amountWei = parseEther(String(amount));
        const totalCost = (BigInt(costPerToken) * BigInt(amountWei)) / 10n ** 18n;
        setEstimatedCost(formatEther(totalCost.toString()));
      } catch {
        setEstimatedCost("");
      }
    };
    computeCost();
  }, [amount, tokenAddress]);

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 250);
  };

  // BUY HANDLER (final)
  const buyHandler = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) return showError("ENTER A VALID TOKEN AMOUNT");
    if (!tokenAddress) return showError("INVALID TOKEN");

    setLoading(true);

    try {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error("NO WALLET");

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const factoryContract = await buildFactoryContract(signer);

      const sale = await factoryContract.tokenToSale(tokenAddress);
      const sold = sale?.sold ?? sale?.[3] ?? sale?.[2];
      const costPerToken = await factoryContract.getCost(sold);

      const amountWei = parseEther(String(amount));
      const totalCost = (BigInt(costPerToken) * BigInt(amountWei)) / 10n ** 18n;

      const tx = await factoryContract.buy(tokenAddress, amountWei, { value: totalCost });

      showSuccess("✅ Transaction Sent... Waiting...");
      await tx.wait();

      showSuccess("✅ Purchase Successful!");

      // fade close
      setClosing(true);

      setTimeout(() => {
        onClose?.();
        router.refresh();
      }, 350);

    } catch (err) {
      console.error("BUY ERROR:", err);

      let msg = err?.reason || err?.error?.message || err?.message || "";

      if (err?.code === 4001 || msg.toLowerCase().includes("user denied"))
        return showError("❌ Transaction Cancelled");

      msg = msg.replace("Factory: ", "");
      showError(`⚠️ ${msg || "Transaction Failed"}`);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: closing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        transition: "background 0.25s ease"
      }}
    >
      <div
        style={{
          width: 720,
          maxWidth: "96vw",
          background: "#000",
          border: "2px solid #00aaff",
          padding: 28,
          borderRadius: 10,
          color: "#fff",
          textAlign: "center",
          transform: closing ? "scale(0.92)" : "scale(1)",
          opacity: closing ? 0 : 1,
          transition: "transform 0.25s ease, opacity 0.25s ease"
        }}
      >
        <h2>BUY TOKEN</h2>
        <p style={{ opacity: 0.85 }}>{token?.name}</p>

        {token?.image && (
          <img src={token.image} width="180" height="180" style={{ margin: "12px auto", border: "1px solid #00aaff" }} />
        )}

        <input
          type="number"
          min="0"
          step="0.0001"
          placeholder="TOKEN AMOUNT"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "80%", padding: 10, background: "#050505", color: "#fff", border: "1px solid #00aaff", borderRadius: 6 }}
        />

        <p style={{ marginTop: 10 }}>{estimatedCost ? `Estimated Cost: ${estimatedCost} ETH` : " "}</p>

        {/* === REPLACED BUTTONS (only these two changed) === */}
        <div className="buttons" style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.2rem" }}>
          {/* BUY - filled bright blue, rounded, white text */}
          <button
    onClick={buyHandler}
    disabled={loading}
    className="btn--fancy"
    style={{
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "not-allowed" : "pointer",
      minWidth: "120px"
    }}
  >
    {loading ? "PROCESSING..." : "BUY"}
  </button>

          {/* CANCEL - transparent with cyan border */}
          <button
    onClick={onClose}
    disabled={loading}
    className="btn--outline"
    style={{
      border: "1px solid #00bfff",
      padding: "0.7em 1.6em",
      borderRadius: "12px",
      background: "transparent",
      color: "#00bfff",
      fontWeight: "600",
      cursor: "pointer",
      minWidth: "120px"
    }}
  >
    CANCEL
  </button>
        </div>
        {/* === end replaced buttons === */}

      </div>
    </div>
  );
}
