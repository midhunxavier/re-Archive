import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";

const KEY = "";
const PROOF = "";

export const StoreContent = async (files) => {
  console.log(process.env.KEY);
  const principal = Signer.parse(KEY);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  console.log("Uploading files to IPFS with web3.storage....t1");
  const cid = await client.uploadDirectory([files]);
  console.log("Stored files with cid:", cid.toString());
  return cid.toString();
};
