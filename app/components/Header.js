"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { showSuccess, showError, showInfo } from "../utils/toastUtils";

export default function Header({ account, setAccount }) {
  const [isConnected, setIsConnected] = useState(false);

  async function connectHandler() {
    if (!window.ethereum) return showError("METAMASK NOT FOUND. INSTALL IT FIRST.");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(ethers.getAddress(accounts[0]));
      setIsConnected(true);
      showSuccess("WALLET CONNECTED SUCCESSFULLY!");
    } catch (error) {
      if (error.code === 4001) showInfo("USER CANCELED CONNECTION REQUEST.");
      else showError("FAILED TO CONNECT WALLET.");
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsConnected(false);
          showInfo("WALLET DISCONNECTED.");
        } else {
          setAccount(ethers.getAddress(accounts[0]));
          setIsConnected(true);
          showSuccess("ACCOUNT CHANGED SUCCESSFULLY!");
        }
      });

      window.ethereum.on("chainChanged", () => {
        showInfo("NETWORK CHANGED. RELOADING...");
        window.location.reload();
      });
    }
  }, [setAccount]);

  const truncate = (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

  return (
    <header className="header">
      <h1 className="logo">BASEPUMP</h1>
      {isConnected && account ? (
        <button className="btn--fancy">{truncate(account)}</button>
      ) : (
        <button onClick={connectHandler} className="btn--fancy">
          CONNECT WALLET
        </button>
      )}
    </header>
  );
}
