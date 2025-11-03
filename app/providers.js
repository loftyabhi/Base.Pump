"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "wagmi/chains";
import { WagmiProvider, createConfig, http } from "wagmi";
import { coinbaseWallet, walletConnect, injected } from "wagmi/connectors";
import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const projectId = process.env.WALLETCONNECT_PROJECT_ID || "";

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
  },
  connectors: [
    coinbaseWallet({
      appName: "BasePump",
      preference: "all",
    }),
    injected({ target: "metaMask" }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
});

export function Providers({ children }) {
  const [isInFrame, setIsInFrame] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
  try {
    const context = await sdk.context;
    const inside = !!context;
    setIsInFrame(inside);

    if (typeof window !== "undefined") {
      if (inside) {
        // Auto-set preference for Smart Wallet when inside Farcaster
        localStorage.setItem("__onchainkit_wallet_preference__", "smartWallet");
      } else {
        // Clear preference to allow MetaMask in browser
        localStorage.removeItem("__onchainkit_wallet_preference__");
      }
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

  if (!isSDKReady) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            farcaster: { enabled: isInFrame },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
