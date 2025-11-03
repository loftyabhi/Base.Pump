"use client";

import { useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { showSuccess, showError, showInfo, showLoading, dismissToasts } from "../utils/toastUtils";

export default function List({ toggleCreate, factory, fee }) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const listHandler = async (e) => {
    e.preventDefault();
    if (!name || !ticker) return showError("PLEASE FILL IN ALL FIELDS.");

    if (!walletClient || !publicClient) {
      return showError("WALLET NOT CONNECTED");
    }

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

      // Wait for transaction using publicClient
      await publicClient.waitForTransactionReceipt({ hash });

      dismissToasts();
      showSuccess("TOKEN CREATED SUCCESSFULLY!");
      
      setTimeout(() => {
        toggleCreate();
      }, 1000);

    } catch (error) {
      dismissToasts();
      console.error(error);
      
      if (error.message?.includes("User rejected") || error.message?.includes("user rejected")) {
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
            <button type="submit" className="btn--fancy">LIST</button>
            <button type="button" className="btn--fancy" onClick={toggleCreate}>CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}