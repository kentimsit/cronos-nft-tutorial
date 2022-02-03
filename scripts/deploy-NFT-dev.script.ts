// To run this script locally
// npx hardhat run --network ganache scripts/deploy-NFT-dev.script.ts

import { run, ethers } from "hardhat";
import hre from "hardhat";

import * as dotenv from "dotenv"; // npm install dotenv
dotenv.config();

async function main() {
  console.log("=================================================");
  console.log("Deploying smart contract now...");
  console.log("=================================================");
  await deployAndMint();
}

async function deployAndMint() {
  await run("compile");
  const accounts = await ethers.getSigners();
  const accountAddresses: string[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const x = await accounts[i].getAddress();
    accountAddresses.push(x);
  }

  console.log("Signers", accountAddresses);

  const name = "MyERC721";
  const symbol = "MyERC721";
  const baseURI = "https://ipfs.io/xxx";
  const contractFactory = await ethers.getContractFactory("MyERC721");
  const token = await contractFactory.deploy(name, symbol, baseURI);
  await token.deployed();

  console.log("Contract deployed to:", token.address);

  const txReceipt = await token.deployTransaction.wait();
  console.log(
    "Smart contract deployed with transaction",
    txReceipt.transactionHash,
    "at block",
    txReceipt.blockNumber,
    "and gas used",
    ethers.BigNumber.from(txReceipt.gasUsed).toString()
  );

  let pendingTx: any;
  pendingTx = await token.mintWithURI(
    <string>process.env["OWNER_ADDRESS"],
    "ipfs://xxx"
  );
  await pendingTx.wait();
  console.log("Name", await token.name());
  console.log("Symbol", await token.symbol());
  console.log("Contract URI", await token.contractURI());
  console.log("Owner of contract", await token.owner());
  console.log("Owner of Token 0", await token.ownerOf(0));
  console.log("URI of Token 0", await token.tokenURI(0));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
