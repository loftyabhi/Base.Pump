"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";
import {
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Avatar, Name, Address, EthBalance } from "@coinbase/onchainkit/identity";
import sdk from "@farcaster/miniapp-sdk";

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
        const context = await sdk.context;
        if (context?.user?.fid) {
          setIsInFrame(true);

          // Fetch Farcaster profile through secure API
          fetch(`/api/farcaster-profile?fid=${context.user.fid}`)
            .then((res) => res.json())
            .then((data) => {
              if (data?.username) setFarcasterProfile(data);
            })
            .catch((err) => console.error("Profile fetch failed:", err));
        }
      } catch {
        setIsInFrame(false);
      }
    };
    checkFrame();
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
        alert("No browser wallet found. Please install MetaMask.");
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

      // 🔄 Force reset OnchainKit internal wallet session
      window.dispatchEvent(new CustomEvent("onchainkit:disconnect"));

      // Optional full reload (clears all provider cache)
      window.location.reload();
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  return (
    <header className="header flex items-center justify-between px-4 py-3 border-b border-gray-800">
      {/* Logo */}
      <h1 className="logo text-blue-400 font-bold text-xl">BASEPUMP</h1>

      {/* Farcaster MiniApp indicator */}
      {mounted && isInFrame && (
        <div className="flex items-center text-sm opacity-80 mr-auto ml-4">
          🔵 Farcaster Mini App
        </div>
      )}

      {/* Farcaster Profile (PFP + username) */}
      {farcasterProfile && (
        <div className="flex items-center gap-2 mr-4">
          <img
            src={farcasterProfile.pfp_url}
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
              className="btn--fancy"
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="connected-info px-3 py-1 rounded-lg bg-[#111] text-sm text-blue-300">
                CONNECTED IN {" "}
                {selectedWallet === "Farcaster"
                  ? "FARCASTER"
                  : "BROWSER"}
              </div>
              <WalletDropdown>
                <div className="px-4 pt-3 pb-2">
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </div>
                {/* ✅ disconnect button now fully works */}
                <WalletDropdownDisconnect onClick={handleDisconnect} />
              </WalletDropdown>
            </div>
          )}
          {/* Hidden OnchainKit trigger */}
          <button ref={connectRef} className="hidden" data-onchainkit-connect />
        </Wallet>
      </div>
    </header>
  );
}
