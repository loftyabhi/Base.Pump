"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "wagmi/chains";
import { WagmiProvider, createConfig, http } from "wagmi";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";
import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export function Providers({ children }) {
  const [isInFrame, setIsInFrame] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const context = await sdk.context;
        const inside = !!context;
        setIsInFrame(inside);

        if (typeof window !== "undefined" && inside) {
          localStorage.setItem("__onchainkit_wallet_preference__", "smartWallet");
        }

        sdk.actions.ready();
      } catch (err) {
        console.error("Farcaster MiniApp SDK init error:", err);
        setIsInFrame(false);
      } finally {
        setIsSDKReady(true);
      }
    };

    initSDK();
  }, []);

  // ✅ Create config dynamically based on frame status
  const config = createConfig({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    },
    connectors: isInFrame
      ? [
          // Inside Farcaster: prioritize Coinbase Smart Wallet
          coinbaseWallet({
            appName: "BasePump",
            preference: "smartWalletOnly", // Force smart wallet in Farcaster
          }),
        ]
      : [
          // Outside Farcaster: all wallet options
          coinbaseWallet({
            appName: "BasePump",
            preference: "all",
          }),
          injected({ target: "metaMask" }),
          ...(projectId ? [walletConnect({ projectId })] : []),
        ],
  });

  if (!isSDKReady) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#000",
        color: "#00bfff"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "dark",
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}