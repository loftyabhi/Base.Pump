"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getContract } from "viem";
import { base, baseSepolia } from "wagmi/chains";

import Header from "./components/Header";
import List from "./components/List";
import Token from "./components/Token";
import Trade from "./components/Trade";

import Factory from "./abis/Factory.json";
import images from "./images.json";

import { showSuccess, showError, showInfo } from "@/app/utils/toastUtils";

// Your actual deployed contract addresses
const FACTORY_ADDRESSES = {
  [base.id]: "0x92D721c4BfAA0fC797C9d0Db546b748d6498E600", // Base Mainnet
  [baseSepolia.id]: "0xD55c2d7c64Ee8272B6E907ED6F1E8197B25F10B8", // Base Sepolia
};

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [factory, setFactory] = useState(null);
  const [fee, setFee] = useState(0n);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCreate = () => setShowCreate(!showCreate);
  const toggleTrade = (token) => {
    setSelectedToken(token);
    setShowTrade(!showTrade);
  };

  // ✅ Clean fixed version
  async function loadBlockchainData() {
    if (!publicClient || !chain) {
      console.log("Waiting for wallet connection...");
      return;
    }

    setIsLoading(true);

    try {
      const chainId = chain.id;
      console.log("CONNECTED TO CHAIN:", chainId);

      const factoryAddress = FACTORY_ADDRESSES[chainId];

      if (!factoryAddress) {
        setFactory(null);
        setIsLoading(false);
        showInfo("WRONG NETWORK — SWITCH TO BASE OR BASE SEPOLIA.");
        return;
      }

      const factoryContract = getContract({
        address: factoryAddress,
        abi: Factory,
        client: publicClient,
      });

      setFactory({
        address: factoryAddress,
        abi: Factory,
        contract: factoryContract,
      });

      // Read fee
      const feeValue = await factoryContract.read.fee();
      setFee(feeValue);
      console.log("Fee:", feeValue.toString());

      // Get total tokens
      const total = await factoryContract.read.totalTokens();
      console.log("Total tokens:", total.toString());

      const list = [];

      for (let i = 0; i < Number(total); i++) {
        try {
          const t = await factoryContract.read.getTokenSale([BigInt(i)]);
          // In Viem v2+, tuples return as objects with named keys
          if (t?.token && t?.name) {
            list.push({
              token: t.token,
              name: t.name || "Unknown Token",
              creator:
                t.creator ||
                "0x0000000000000000000000000000000000000000",
              sold: t.sold || 0n,
              raised: t.raised || 0n,
              isOpen:
                t.isOpen !== undefined ? t.isOpen : true,
              image: images[i % images.length],
            });
          } else {
            console.warn(`Invalid token data at index ${i}:`, t);
          }
        } catch (error) {
          console.error(`Error loading token ${i}:`, error);
        }
      }

      setTokens(list.reverse());
      showSuccess("CONNECTED ✅");
    } catch (err) {
      console.error("Blockchain data error:", err);
      if (tokens.length > 0) {
        showError("FAILED TO LOAD BLOCKCHAIN DATA");
      }
      setFactory(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Load tokens when connected
  useEffect(() => {
    if (isConnected && publicClient && chain) {
      loadBlockchainData();
    }
  }, [isConnected, publicClient, chain]);

  // Refresh after modals close
  useEffect(() => {
    if (isConnected && publicClient && chain && !showCreate && !showTrade) {
      const timer = setTimeout(() => {
        loadBlockchainData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showCreate, showTrade]);

  // Network switch
  async function switchNetwork() {
    try {
      if (walletClient) {
        await walletClient.switchChain({ id: baseSepolia.id });
        showSuccess("SWITCHED TO BASE SEPOLIA");
      }
    } catch (err) {
      console.error(err);
      showError("FAILED TO SWITCH NETWORK");
    }
  }

  return (
    <div className="page">
      <Header />

      <main>
        <div className="create">
          <button
            className="btn--fancy"
            onClick={
              !factory
                ? switchNetwork
                : !isConnected
                ? () => showInfo("CONNECT WALLET FIRST")
                : toggleCreate
            }
            disabled={isLoading}
          >
            {isLoading
              ? "LOADING..."
              : !factory
              ? "SWITCH TO BASE SEPOLIA"
              : !isConnected
              ? "CONNECT WALLET"
              : "CREATE NEW TOKEN"}
          </button>
        </div>

        <div className="listings">
          <h1>NEW LISTINGS</h1>

          <div className="tokens">
            {!isConnected ? (
              <p>PLEASE CONNECT WALLET</p>
            ) : isLoading ? (
              <p>LOADING TOKENS...</p>
            ) : tokens.length === 0 ? (
              <p>NO TOKENS LISTED YET</p>
            ) : (
              tokens.map((token, index) => (
                <Token key={index} token={token} toggleTrade={toggleTrade} />
              ))
            )}
          </div>
        </div>

        {showCreate && (
          <List toggleCreate={toggleCreate} fee={fee} factory={factory} />
        )}

        {showTrade && selectedToken && (
          <Trade
            token={selectedToken}
            factory={factory}
            onClose={() => setShowTrade(false)}
          />
        )}
      </main>
    </div>
  );
}
