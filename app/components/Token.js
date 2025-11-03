"use client";

import { formatEther } from "viem";

export default function Token({ toggleTrade, token }) {
  // Early return if token is invalid
  if (!token) {
    return null;
  }

  // Safe creator display - handle undefined/null/invalid addresses
  const displayCreator = () => {
    try {
      if (!token.creator || typeof token.creator !== 'string') {
        return "Unknown";
      }
      if (token.creator.length < 10) {
        return "Unknown";
      }
      return `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`;
    } catch (error) {
      console.error("Error displaying creator:", error);
      return "Unknown";
    }
  };

  // Safe market cap display
  const displayMarketCap = () => {
    try {
      if (!token.raised) {
        return "0";
      }
      return formatEther(token.raised);
    } catch (error) {
      console.error("Error displaying market cap:", error);
      return "0";
    }
  };

  // Safe image URL
  const imageUrl = token.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2300aaff' font-size='20' font-family='monospace'%3ETOKEN%3C/text%3E%3C/svg%3E";

  return (
    <button onClick={() => toggleTrade(token)} className="token">
      <div className="token__details">
        <img 
          src={imageUrl} 
          alt="TOKEN IMAGE" 
          width={256} 
          height={256}
          onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2300aaff' font-size='20' font-family='monospace'%3ETOKEN%3C/text%3E%3C/svg%3E";
          }}
        />
        <p>CREATED BY {displayCreator()}</p>
        <p>MARKET CAP: {displayMarketCap()} ETH</p>
        <p className="name">{token.name || "Unknown Token"}</p>
      </div>
    </button>
  );
}