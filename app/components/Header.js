"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Avatar,
  Name,
  Address,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import sdk from "@farcaster/miniapp-sdk";
import { trackEvent } from "@/lib/analytics";

export default function Header() {
  const [isInFrame, setIsInFrame] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [farcasterProfile, setFarcasterProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const connectRef = useRef(null);

  // ✅ Detect Farcaster MiniApp
  useEffect(() => {
    const checkFrame = async () => {
      try {
        const context = await sdk.context(); // ✅ Correct: sdk.context() is a function
        if (context?.user?.fid) {
          setIsInFrame(true);

          // Fetch Farcaster profile through your API
          const res = await fetch(`/api/farcaster-profile?fid=${context.user.fid}`);
          const data = await res.json();
          if (data) setFarcasterProfile(data);
        }
      } catch (err) {
        console.error("Error detecting Farcaster frame:", err);
        setIsInFrame(false);
      }
    };

    checkFrame();
  }, []);

  useEffect(() => {
  const detectFarcaster = async () => {
    try {
      const ctx = await sdk.context();
      if (ctx?.user?.fid) {
        trackEvent("miniapp_open", {
          fid: ctx.user.fid,
          username: ctx.user.username || "unknown",
          source: "warpcast",
        });
      } else {
        trackEvent("miniapp_open", { source: "browser" });
      }
    } catch {
      trackEvent("miniapp_open", { source: "unknown" });
    }
  };
  detectFarcaster();
}, []);

  useEffect(() => setMounted(true), []);

  // ✅ Handle connect logic
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (isInFrame) {
        setSelectedWallet("Farcaster");
        connectRef.current?.click();
        return;
      }

      const injected =
        connectors.find((c) => c.id === "metaMask") ||
        connectors.find((c) => c.id === "injected");

      if (!injected) {
        alert("No browser wallet found. Please install MetaMask or Coinbase Wallet.");
        return;
      }

      await connect({ connector: injected });
      setSelectedWallet("Browser Wallet");
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // ✅ Handle disconnect logic
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSelectedWallet(null);
      setFarcasterProfile(null);
      window.dispatchEvent(new CustomEvent("onchainkit:disconnect"));
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  if (!mounted) return null;

  return (
    <header className="header flex items-center justify-between px-4 py-3 border-b border-gray-800">
       {/* Logo */} 
       <h1 className="logo text-blue-400 font-bold text-xl">BASEPUMP</h1>

      {/* Farcaster MiniApp indicator */}
      {isInFrame && (
        <div className="flex items-center text-sm opacity-80 mr-auto ml-4">
          🔵 Farcaster Mini App
        </div>
      )}

      {/* Farcaster Profile */}
      {farcasterProfile && (
        <div className="flex items-center gap-2 mr-4">
          <img
            src={farcasterProfile.pfp?.url || "/default-avatar.png"}
            alt="Farcaster avatar"
            className="h-8 w-8 rounded-full border border-gray-700"
          />
          <span className="text-sm text-gray-300">
            @{farcasterProfile.username || farcasterProfile.fid}
          </span>
        </div>
      )}

      {/* Wallet connect / disconnect */}
      <div className="wallet-container">
        <Wallet>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium"
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 rounded-lg bg-[#111] text-sm text-blue-300">
                CONNECTED IN{" "}
                {selectedWallet === "Farcaster" ? "FARCASTER" : "BROWSER"}
              </div>
              <WalletDropdown>
                <div className="px-4 pt-3 pb-2">
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </div>
                <WalletDropdownDisconnect onClick={handleDisconnect} />
              </WalletDropdown>
            </div>
          )}
          {/* Hidden OnchainKit trigger */}
          <button ref={connectRef} className="relative" data-onchainkit-connect />
        </Wallet>
      </div>
    </header>
  );
}
