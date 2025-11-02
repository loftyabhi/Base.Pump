"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";

import Header from "./components/Header";
import List from "./components/List";
import Token from "./components/Token";
import Trade from "./components/Trade";

import Factory from "./abis/Factory.json";
import config from "./config.json";
import images from "./images.json";

import {
  showSuccess,
  showError,
  showInfo,
  showLoading,
  dismissToasts,
} from "@/app/utils/toastUtils";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [factory, setFactory] = useState(null);
  const [fee, setFee] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTrade, setShowTrade] = useState(false);

  const toggleCreate = () => setShowCreate(!showCreate);

  const toggleTrade = (token) => {
    setSelectedToken(token);
    setShowTrade(!showTrade);
  };

  async function loadBlockchainData() {
    try {
      if (!window.ethereum) return showError("INSTALL METAMASK");

      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      console.log("CONNECTED TO CHAIN:", chainId);

      if (!config[chainId]) {
        setFactory(null);
        return showInfo("WRONG NETWORK — SWITCH TO BASE.");
      }

      const factoryContract = new Contract(
        config[chainId].factory.address,
        Factory,
        provider
      );

      setFactory({
        address: config[chainId].factory.address,
        abi: Factory,
        contract: factoryContract,
      });

      const fee = await factoryContract.fee();
      setFee(fee);

      const total = await factoryContract.totalTokens();
      const list = [];

      for (let i = 0; i < total; i++) {
        const t = await factoryContract.getTokenSale(i);

        list.push({
          token: t.token,
          name: t.name,
          creator: t.creator,
          sold: t.sold,
          raised: t.raised,
          isOpen: t.isOpen,
          image: images[i % images.length],
        });
      }

      setTokens(list.reverse());
      showSuccess("CONNECTED ✅");

    } catch (err) {
      console.error(err);
      showError("FAILED TO LOAD BLOCKCHAIN DATA");
      setFactory(null);
    }
  }

  useEffect(() => {
    loadBlockchainData();
  }, [showCreate, showTrade]);

  // Switch network button
  async function switchNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }], // Base Mainnet
      });
      window.location.reload();
    } catch {
      showError("FAILED TO SWITCH NETWORK");
    }
  }

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div className="create">
          <button
            className="btn--fancy"
            onClick={
              !factory
                ? switchNetwork
                : account
                ? toggleCreate
                : () => showInfo("CONNECT WALLET FIRST")
            }
          >
            {!factory
              ? "SWITCH TO BASE"
              : !account
              ? "CONNECT WALLET"
              : "CREATE NEW TOKEN"}
          </button>
        </div>

        <div className="listings">
          <h1>NEW LISTINGS</h1>

          <div className="tokens">
            {!account ? (
              <p>PLEASE CONNECT WALLET</p>
            ) : (
              tokens.map((token, index) => (
                <Token key={index} token={token} toggleTrade={toggleTrade} />
              ))
            )}
          </div>
        </div>

        {showCreate && (
          <List
            toggleCreate={toggleCreate}
            fee={fee}
            provider={provider}
            factory={factory.contract}
          />
        )}

        {showTrade && selectedToken && (
          <Trade
  token={selectedToken}
  factory={factory}
  onClose={() => setShowTrade(false)}   // ✅ FIX
/>

        )}
      </main>
    </div>
  );
}
