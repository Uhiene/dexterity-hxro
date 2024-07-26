import { FC, useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTrader, useManifest } from "contexts/DexterityProviders";
import Button from "../Button";
import { notify } from "utils/notifications";
import { dexterity } from "utils/dexterityTypes"; // Adjust this import based on your actual setup

export const AccountInfo: FC = () => {
  const { publicKey } = useWallet();
  const { manifest, setManifest } = useManifest();
  const { setTrader } = useTrader();
  const [trgsArr, setTrgsArr] = useState<any[]>([]);
  const [selectedTrg, setSelectedTrg] = useState("");

  const mpgPubkey = process.env.NEXT_PUBLIC_MAINNET_MPG;

  const fetchTraderAccounts = useCallback(async () => {
    if (!publicKey) { console.log('publicKey error'); return; }
    if (!manifest) { console.log('manifest error'); return; }

    try {
      const owner = publicKey;
      const marketProductGroup = new PublicKey(mpgPubkey);
      const trgs = await manifest.getTRGsOfOwner(owner, marketProductGroup);
      setTrgsArr(trgs);
    } catch (error: any) {
      notify({ type: 'error', message: `Selecting Trader Account failed!`, description: error?.message });
    }
  }, [publicKey, manifest, mpgPubkey]);

  const handleCreateTRG = useCallback(async () => {
    try {
      const marketProductGroup = new PublicKey(mpgPubkey);
      await manifest.createTrg(marketProductGroup);
      fetchTraderAccounts();
    } catch (error: any) {
      notify({ type: 'error', message: `Creating Trader Account failed!`, description: error?.message });
    }
  }, [fetchTraderAccounts, manifest, mpgPubkey]);

  const handleSelection = useCallback(async (selectedTrgPubkey: string) => {
    if (selectedTrgPubkey === "default") return;

    const trgPubkey = new PublicKey(selectedTrgPubkey);
    const trader = new dexterity.Trader(manifest, trgPubkey);

    try {
      await trader.update();

      const marketProductGroup = new PublicKey(mpgPubkey);
      await manifest.updateOrderbooks(marketProductGroup);

      setTrader(trader);
      setSelectedTrg(selectedTrgPubkey);
    } catch (error: any) {
      notify({ type: 'error', message: `Selecting Trader Account failed!`, description: error?.message });
    }
  }, [manifest, mpgPubkey, setTrader]);

  useEffect(() => {
    fetchTraderAccounts();
  }, [fetchTraderAccounts]);

  

  return (
    <div>
      <h2>Select Trader Account</h2>
      <select onChange={(e) => handleSelection(e.target.value)} value={selectedTrg}>
        <option value="default">Select TRG</option>
        {trgsArr.map((trg: any, index: number) => (
          <option key={index} value={trg.publicKey.toString()}>
            {trg.publicKey.toString()}
          </option>
        ))}
      </select>
      <Button onClick={handleCreateTRG} text="Create New TRG" />
    </div>
  );
};
