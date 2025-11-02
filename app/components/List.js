"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { showSuccess, showError, showInfo, showLoading, dismissToasts } from "../utils/toastUtils";

export default function List({ toggleCreate, factory, provider, fee }) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");

  const listHandler = async (e) => {
    e.preventDefault();
    if (!name || !ticker) return showError("PLEASE FILL IN ALL FIELDS.");

    try {
      const signer = await provider.getSigner();
      const factoryWithSigner = factory.connect(signer);

      const tx = await factoryWithSigner.create(name, ticker, { value: fee });
      showLoading("CREATING TOKEN ON BASE NETWORK...");
      await tx.wait();

      dismissToasts();
      showSuccess("TOKEN CREATED SUCCESSFULLY!");
      toggleCreate();
    } catch (error) {
      dismissToasts();
      if (error.code === 4001) showInfo("USER CANCELED TRANSACTION.");
      else showError("TRANSACTION FAILED.");
    }
  };

  return (
    <div className="overlay">
      <div className="popup">
        <h2>CREATE NEW TOKEN</h2>
        <form onSubmit={listHandler}>
          <input type="text" placeholder="NAME" onChange={(e) => setName(e.target.value.toUpperCase())} />
          <input type="text" placeholder="TICKER" onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          <div className="buttons">
            <button type="submit" className="btn--fancy">LIST</button>
            <button type="button" className="btn--fancy" onClick={toggleCreate}>CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}
