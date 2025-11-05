"use client";

import { useState, useEffect } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import { showSuccess, showError, showLoading, dismissToasts } from "@/app/utils/toastUtils";
import { trackEvent } from "@/lib/analytics";

export default function Trade({ token, factory, onClose }) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const tokenAddress = token?.token ?? token?.tokenAddress ?? token?.address;

  // ✅ Estimate cost dynamically
  useEffect(() => {
    const computeCost = async () => {
      if (!amount || Number(amount) <= 0) {
        setEstimatedCost("");
        return;
      }

      try {
        if (!publicClient || !factory?.contract) return;

        const sale = await factory.contract.read.tokenToSale([tokenAddress]);
        const sold = sale[3];
        const costPerToken = await factory.contract.read.getCost([sold]);
        const amountWei = parseEther(String(amount));
        const totalCost = (costPerToken * amountWei) / parseEther("1");

        setEstimatedCost(formatEther(totalCost));
      } catch (err) {
        console.error("Cost calculation error:", err);
        setEstimatedCost("");
      }
    };

    computeCost();
  }, [amount, tokenAddress, publicClient, factory]);

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 250);
  };

  const buyHandler = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0)
      return showError("ENTER A VALID TOKEN AMOUNT");
    if (!tokenAddress) return showError("INVALID TOKEN");
    if (!walletClient || !publicClient)
      return showError("WALLET NOT CONNECTED");

    setLoading(true);

    try {
      const sale = await factory.contract.read.tokenToSale([tokenAddress]);
      const sold = sale[3];
      const costPerToken = await factory.contract.read.getCost([sold]);

      const amountWei = parseEther(String(amount));
      const totalCost = (costPerToken * amountWei) / parseEther("1");

      showLoading("SENDING TRANSACTION...");

      const hash = await walletClient.writeContract({
        address: factory.address,
        abi: factory.abi,
        functionName: "buy",
        args: [tokenAddress, amountWei],
        value: totalCost,
      });

      showLoading("WAITING FOR CONFIRMATION...");
      await publicClient.waitForTransactionReceipt({ hash });

      dismissToasts();
      showSuccess("✅ PURCHASE SUCCESSFUL!");

      // ✅ Track successful transaction in Google Analytics
      trackEvent("transaction_success", {
        token_name: token?.name || "unknown",
        tx_hash: hash,
        amount,
        network: "Base",
      });

      setClosing(true);
      setTimeout(() => {
        onClose?.();
      }, 350);
    } catch (err) {
      console.error("BUY ERROR:", err);
      dismissToasts();

      // ✅ Track failed transaction in Google Analytics
      trackEvent("transaction_failed", {
        token_name: token?.name || "unknown",
        error: err?.message || "unknown_error",
      });

      let msg = err?.message || "";
      if (
        err?.message?.includes("User rejected") ||
        msg.toLowerCase().includes("user denied")
      ) {
        return showError("❌ TRANSACTION CANCELLED");
      }

      msg = msg.replace("Factory: ", "");
      showError(`⚠️ ${msg || "TRANSACTION FAILED"}`);
    } finally {
      setLoading(false);
    }
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
        transition: "background 0.25s ease",
      }}
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
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
          transition: "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        <h2>BUY TOKEN</h2>
        <p style={{ opacity: 0.85 }}>{token?.name || "Unknown Token"}</p>

        {token?.image && (
          <img
            src={token.image}
            alt="Token"
            width="180"
            height="180"
            style={{
              margin: "12px auto",
              border: "1px solid #00aaff",
              borderRadius: "8px",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}

        <input
          type="number"
          min="0"
          step="0.0001"
          placeholder="TOKEN AMOUNT"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "80%",
            padding: 10,
            background: "#050505",
            color: "#fff",
            border: "1px solid #00aaff",
            borderRadius: 6,
            fontSize: "1rem",
          }}
        />

        <p style={{ marginTop: 10, minHeight: "24px" }}>
          {estimatedCost ? `ESTIMATED COST: ${estimatedCost} ETH` : " "}
        </p>

        <div
          className="buttons"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1.2rem",
          }}
        >
          <button
            onClick={buyHandler}
            disabled={loading}
            className="btn--fancy"
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              minWidth: "120px",
            }}
          >
            {loading ? "PROCESSING..." : "BUY"}
          </button>

          <button
            onClick={closeModal}
            disabled={loading}
            className="btn--outline"
            style={{
              border: "1px solid #00bfff",
              padding: "0.7em 1.6em",
              borderRadius: "12px",
              background: "transparent",
              color: "#00bfff",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              minWidth: "120px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
