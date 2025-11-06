import React, { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Header() {
  const [isInFrame, setIsInFrame] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [farcasterProfile, setFarcasterProfile] = useState(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Try Coinbase wallet first, then MetaMask, then injected
      const metaMask = connectors.find((c) => c.id === "metaMask");
      const injected = connectors.find((c) => c.id === "injected");
      const coinbase = connectors.find((c) => c.id === "coinbaseWalletSDK");

      const connector = injected || metaMask || coinbase;

      if (!connector) {
        alert("No wallet found. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.");
        return;
      }

      await connect({ connector });
      setSelectedWallet(connector.name);
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSelectedWallet(null);
      setFarcasterProfile(null);
      setShowWalletMenu(false);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!mounted) return null;

  return (
    <header className="header">
      {/* Logo */}
      <h1 className="logo">BASEPUMP</h1>

      {/* Farcaster MiniApp indicator */}
      {isInFrame && (
        <div className="farcaster-badge">
          🔵 Farcaster Mini App
        </div>
      )}

      {/* Farcaster Profile */}
      {farcasterProfile && (
        <div className="farcaster-profile">
          <img
            src={farcasterProfile.pfp?.url || "/default-avatar.png"}
            alt="Farcaster avatar"
            className="farcaster-avatar"
          />
          <span className="farcaster-username">
            @{farcasterProfile.username || farcasterProfile.fid}
          </span>
        </div>
      )}

      {/* Wallet connect / disconnect */}
      <div className="wallet-section">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn--fancy wallet-connect-btn"
          >
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
          </button>
        ) : (
          <div className="wallet-connected">
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="btn--fancy wallet-status-btn"
            >
              {selectedWallet ? selectedWallet.toUpperCase() : "CONNECTED"}
            </button>

            {showWalletMenu && (
              <div className="wallet-dropdown">
                <div className="wallet-info">
                  <p className="wallet-label">Connected Address</p>
                  <p className="wallet-address">{formatAddress(address)}</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="btn-disconnect"
                >
                  DISCONNECT
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #1e2a3a;
          background: transparent;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .logo {
          font-family: "Nabla", sans-serif;
          font-size: 2rem;
          background: linear-gradient(90deg, #0052ff, #00d2ff);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 1px;
          margin: 0;
          white-space: nowrap;
        }

        .farcaster-badge {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          opacity: 0.8;
          margin-left: auto;
          white-space: nowrap;
        }

        .farcaster-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: 1rem;
        }

        .farcaster-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #1e2a3a;
        }

        .farcaster-username {
          font-size: 0.9rem;
          color: #e4e8f0;
        }

        .wallet-section {
          position: relative;
          display: flex;
          align-items: center;
        }

        .wallet-connect-btn,
        .wallet-status-btn {
          padding: 0.7rem 1.6rem;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 1px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(90deg, #0052ff, #00d2ff);
          color: #fff;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 0 8px rgba(0, 82, 255, 0.4);
          white-space: nowrap;
        }

        .wallet-connect-btn:hover:not(:disabled),
        .wallet-status-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.7);
        }

        .wallet-connect-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wallet-connected {
          position: relative;
        }

        .wallet-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: #000;
          border: 1px solid #00bfff;
          border-radius: 12px;
          padding: 1rem;
          min-width: 200px;
          box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
          z-index: 1000;
        }

        .wallet-info {
          margin-bottom: 1rem;
        }

        .wallet-label {
          font-size: 0.8rem;
          color: #888;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .wallet-address {
          font-size: 0.95rem;
          color: #00d2ff;
          margin: 0.5rem 0 0 0;
          font-family: monospace;
        }

        .btn-disconnect {
          width: 100%;
          padding: 0.6rem;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 1px;
          border: 1px solid #00bfff;
          background: transparent;
          color: #00bfff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
        }

        .btn-disconnect:hover {
          background: rgba(0, 191, 255, 0.1);
          box-shadow: 0 0 8px rgba(0, 191, 255, 0.3);
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 0;
          }

          .farcaster-badge {
            margin-left: 0;
          }

          .wallet-dropdown {
            position: fixed;
            top: auto;
            bottom: 20px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: 90%;
            max-width: 300px;
          }
        }
      `}</style>
    </header>
  );
}