import { ethers } from "ethers";

export default function Token({ toggleTrade, token }) {
  return (
    <button onClick={() => toggleTrade(token)} className="token">
      <div className="token__details">
        <img src={token.image} alt="TOKEN IMAGE" width={256} height={256} />
        <p>CREATED BY {token.creator.slice(0, 6)}...{token.creator.slice(38, 42)}</p>
        <p>MARKET CAP: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p className="name">{token.name}</p>
      </div>
    </button>
  );
}
