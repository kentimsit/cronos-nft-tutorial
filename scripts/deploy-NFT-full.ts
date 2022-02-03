// To run this script locally
// npx ts-node ./scripts/deploy-NFT-full.ts

import { ethers } from "ethers";

import axios from "axios"; // npm install axios
import fs from "fs";
import prompt from "prompt";
import { create as createIPFSClient } from "ipfs-http-client";
import util from "util";
import stream from "stream";

import * as dotenv from "dotenv"; // npm install dotenv
dotenv.config();

import * as ERC721 from "../artifacts/contracts/MyERC721.sol/MyERC721.json";

// NETWORK CONFIGURATION
// UNCOMMENT THE RELEVANT NETWORK AND ONLY THE RELEVANT NETWORK
// Rinkeby (Ethereum testnet)
// const network = {
//   url:
//     "https://eth-rinkeby.alchemyapi.io/v2/" +
//     <string>process.env["ALCHEMY_KEY"],
//   gasPriceGWei: 2,
//   blockExplorerPrefix: "https://rinkeby.etherscan.io/tx/",
// };
// Cronos testnet
// const network = {
//   url: "https://cronos-testnet-3.crypto.org:8545",
//   gasPriceGWei: 5000,
//   blockExplorerPrefix: "https://cronos.crypto.org/explorer/testnet3/tx/",
// };
// Cronos mainnet
const network = {
  url: "https://evm-cronos.crypto.org/",
  gasPriceGWei: 5000,
  blockExplorerPrefix: "https://cronoscan.com/tx/",
};

async function main() {
  prompt.start();
  let userInput = "";
  //
  // Upload token level metadata to IPFS and create contractURI
  //
  console.log("=================================================");
  console.log("Uploading contract level metadata to IPFS now...");
  console.log("=================================================");
  const contractCID = await uploadContractLevelMetadata();
  userInput = <string>(await prompt.get(["ConfirmToProceed"])).ConfirmToProceed;
  //
  // Upload NFTs to IPFS and create tokenURIs
  //
  console.log("=================================================");
  console.log("Uploading token data to IPFS now...");
  console.log("=================================================");
  const tokenCIDs = [];
  for (let i = 0; i < 3; i++) {
    let uri = "";
    uri = await uploadNFTtoIPFS(i);
    tokenCIDs.push(uri);
  }
  console.log("Token CIDs", tokenCIDs);
  userInput = <string>(await prompt.get(["ConfirmToProceed"])).ConfirmToProceed;
  //
  // Optional:
  // Check the Token CIDs
  // This will display data associated with the Token CIDs
  // and save the images in the nft-items/downloads directory
  //
  console.log("=================================================");
  console.log("Checking uploaded data now..");
  console.log("=================================================");
  await checkTokenCIDs(tokenCIDs);
  console.log(
    "The images have been downloaded to the ./nft-items/downloads directory"
  );
  userInput = <string>(await prompt.get(["ConfirmToProceed"])).ConfirmToProceed;

  //
  //
  console.log("=================================================");
  console.log("Deploying smart contract now...");
  console.log("=================================================");
  const contractAddress = await deploy(contractCID);
  console.log(
    "CHECK IN BLOCK EXPLORER THAT THE TRANSACTION IS COMPLETE BEFORE PROCEEDING"
  );
  userInput = <string>(await prompt.get(["ConfirmToProceed"])).ConfirmToProceed;

  //
  //
  console.log("=================================================");
  console.log("Minting NFTs now...");
  console.log("Contract address", contractAddress);
  console.log("=================================================");
  await mint(contractAddress, tokenCIDs);
  console.log(
    "CHECK IN BLOCK EXPLORER THAT THE TRANSACTION IS COMPLETE BEFORE PROCEEDING"
  );
  userInput = <string>(await prompt.get(["ConfirmToProceed"])).ConfirmToProceed;
  //
  //
  console.log("=================================================");
  console.log("Checking contents of smart contract now...");
  console.log("=================================================");
  await read(contractAddress);
}

type Metadata = {
  name: string;
  description: string;
  attributes: string;
  image: string;
  external_url: string;
};

type Nft = {
  path: string;
  filename: string;
  metadata: Metadata;
};

const imageExtension = ".png";
const ipfsUrlPrefix = "https://ipfs.io/ipfs/";
// const ipfsUrlPrefix = "ipfs://";

// This function returns some manually entered data
// for the 3 NFTs that we are going to mint
function getNFTData(): Nft[] {
  return [
    {
      path: "./nft-items/images/",
      filename: "i0",
      metadata: {
        name: "Test NFT #0",
        description: "Description of my test NFT #0",
        attributes: "",
        image: "xxx",
        external_url: "https://cronos.crypto.org",
      },
    },
    {
      path: "./nft-items/images/",
      filename: "i1",
      metadata: {
        name: "Test NFT #1",
        description: "Description of my test NFT #1",
        attributes: "",
        image: "xxx",
        external_url: "https://cronos.crypto.org",
      },
    },
    {
      path: "./nft-items/images/",
      filename: "i2",
      metadata: {
        name: "Test NFT #2",
        description: "Description of my test NFT # 2",
        attributes: "",
        image: "xxx",
        external_url: "https://cronos.crypto.org",
      },
    },
  ];
}

// Script to upload contract-level metadata to IPFS
// then returns the CID of the contract-level metadata JSON
async function uploadContractLevelMetadata(): Promise<string> {
  // Create metadata
  const metadata = {
    name: "My test collection",
    description: "Just creating a test collection on Cronos chain",
    image:
      "https://pbs.twimg.com/profile_images/1417359604623679488/CGzQIEVX_400x400.png",
    external_link: "https://cronos.crypto.org",
    seller_fee_basis_points: 0,
    fee_recipient: "",
  };
  console.log("Metadata", metadata);
  // Upload metadata
  const ipfsClient = createIPFSClient({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization:
        "Basic " +
        <string>process.env["INFURA_IPFS_PROJECT_ID"] +
        ":" +
        <string>process.env["INFURA_IPFS_SECRET"],
    },
  });
  const file_metadata = {
    path: "/mynft/contract_metadata.json",
    content: JSON.stringify(metadata),
  };
  const cid_metadata = (await ipfsClient.add(file_metadata)).cid;
  console.log("Metadata CID (folder)", cid_metadata);
  // Pin metadata
  const pinResponse = await axios.request<any>({
    url:
      "https://ipfs.infura.io:5001/api/v0/pin/add?arg=" +
      cid_metadata +
      "/" +
      "contract_metadata.json",
    auth: {
      username: <string>process.env["INFURA_IPFS_PROJECT_ID"],
      password: <string>process.env["INFURA_IPFS_SECRET"],
    },
  });
  console.log("Metadata pin response", pinResponse.data);
  // Return CID
  return cid_metadata + "/contract_metadata.json";
}

// Script to upload the NFT image to IPFS,
// then create the MetaData JSON and upload it to IPFS
// then return the CID o fhe token's metadata JSON
async function uploadNFTtoIPFS(id: number): Promise<string> {
  const nft: Nft = getNFTData()[id];
  console.log("NFT", nft.metadata.name);
  const ipfsClient = createIPFSClient({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization:
        "Basic " +
        <string>process.env["INFURA_IPFS_PROJECT_ID"] +
        ":" +
        <string>process.env["INFURA_IPFS_SECRET"],
    },
  });
  // First let's upload the image
  const file_image = {
    path: "/mynft/" + nft.filename + imageExtension,
    content: fs.readFileSync(nft.path + nft.filename + imageExtension),
  };
  const cid_image = (await ipfsClient.add(file_image)).cid;
  console.log("Image CID (folder)", cid_image);
  // Pin the image in Infura, this will make it more persistent
  // than your average IPFS data
  const pinResponse = await axios.request<any>({
    url:
      "https://ipfs.infura.io:5001/api/v0/pin/add?arg=" +
      cid_image +
      "/" +
      nft.filename +
      imageExtension,
    auth: {
      username: <string>process.env["INFURA_IPFS_PROJECT_ID"],
      password: <string>process.env["INFURA_IPFS_SECRET"],
    },
  });
  console.log("Image pin response", pinResponse.data);
  // Then let's update the metadata
  const newMetadata = {
    ...nft.metadata,
    image: ipfsUrlPrefix + cid_image + "/" + nft.filename + imageExtension,
  };
  console.log("Metadata", newMetadata);
  // Let's upload the metadata
  const file_metadata = {
    path: "/mynft/" + nft.filename + ".json",
    content: JSON.stringify(newMetadata),
  };
  const cid_metadata = (await ipfsClient.add(file_metadata)).cid;
  console.log("Metadata CID (folder)", cid_metadata);
  // Pin the image in Infura
  const pinResponse2 = await axios.request<any>({
    url:
      "https://ipfs.infura.io:5001/api/v0/pin/add?arg=" +
      cid_metadata +
      "/" +
      nft.filename +
      ".json",
    auth: {
      username: <string>process.env["INFURA_IPFS_PROJECT_ID"],
      password: <string>process.env["INFURA_IPFS_SECRET"],
    },
  });
  console.log("Metadata pin response", pinResponse2.data);
  // Return the Token URI
  console.log("Token URI", ipfsUrlPrefix + cid_metadata);
  return cid_metadata + "/" + nft.filename + ".json";
}

// Optional function to read the Metadata from IPFS
// and check it
async function checkTokenCIDs(cids: string[]) {
  for (let i = 0; i < cids.length; i++) {
    console.log("For i =", i);
    // Read metadata
    const readResponse_metadata = await axios.request<any>({
      url: "https://ipfs.infura.io:5001/api/v0/cat?arg=" + cids[i],
      auth: {
        username: <string>process.env["INFURA_IPFS_PROJECT_ID"],
        password: <string>process.env["INFURA_IPFS_SECRET"],
      },
    });
    const metadata: any = readResponse_metadata.data;
    console.log("Metadata", metadata);
    // Download the image and save it in downloads
    const cid_image = metadata.image.replace("https://ipfs.io/ipfs/", "");
    console.log("Image CID", cid_image);
    const pipeline = util.promisify(stream.pipeline);
    const readResponse = await axios.request<any>({
      url: "https://ipfs.infura.io:5001/api/v0/cat?arg=" + cid_image,
      auth: {
        username: <string>process.env["INFURA_IPFS_PROJECT_ID"],
        password: <string>process.env["INFURA_IPFS_SECRET"],
      },
      responseType: "stream",
    });
    await pipeline(
      readResponse.data,
      fs.createWriteStream("./nft-items/downloads/i" + i + imageExtension)
    );
  }
}

async function deploy(contractCID: string): Promise<string> {
  // Deployment configuration variables
  const name = "MyERC721";
  const symbol = "MyERC721";
  const baseURI = "https://ipfs.io/" + contractCID;
  const endpoint = network.url;
  const gasPrice = network.gasPriceGWei * 1000000000;
  const signingKey = <string>process.env["OWNER_PRIVATE_KEY"];
  // Deploy smart contract
  const ethersProvider = new ethers.providers.JsonRpcProvider(endpoint);
  const fromWallet = new ethers.Wallet(signingKey);
  const fromSigner = fromWallet.connect(ethersProvider);
  const contractAbi = ERC721.abi;
  const contractBytecode = ERC721.bytecode;
  const ethersFactory = new ethers.ContractFactory(
    contractAbi,
    contractBytecode,
    fromSigner
  );
  const deployTx = await ethersFactory.deploy(name, symbol, baseURI, {
    gasPrice: gasPrice,
  });
  console.log("Pending transaction", deployTx.deployTransaction);
  await deployTx.deployTransaction.wait();
  console.log(
    "Contract deployment transaction hash",
    deployTx.deployTransaction.hash
  );
  console.log("Contract address", deployTx.address);
  console.log(
    "Block explorer URL",
    network.blockExplorerPrefix + deployTx.deployTransaction.hash
  );
  return deployTx.address;
}

async function mint(contractAddress: string, tokenCIDs: string[]) {
  // Transaction configuration variables
  const recipients = [];
  const tokenURIs = [];
  for (let i = 0; i < tokenCIDs.length; i++) {
    recipients.push(<string>process.env["OWNER_ADDRESS"]);
    tokenURIs.push("ipfs://" + tokenCIDs[i]);
  }
  console.log("Batch mint parameters", recipients, tokenURIs);
  const endpoint = network.url;
  const gasPrice = network.gasPriceGWei * 1000000000;
  const signingKey = <string>process.env["OWNER_PRIVATE_KEY"];
  // Execute transaction
  const ethersProvider = new ethers.providers.JsonRpcProvider(endpoint);
  const fromWallet = new ethers.Wallet(signingKey);
  const fromSigner = fromWallet.connect(ethersProvider);
  const contractAbi = ERC721.abi;
  const readContractInstance = new ethers.Contract(
    contractAddress,
    contractAbi,
    ethersProvider
  );
  const writeContractInstance = readContractInstance.connect(fromSigner);
  const pendingTx = await writeContractInstance["mintBatchWithURI"](
    recipients,
    tokenURIs,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("Pending transaction hash", pendingTx.hash);
  console.log(
    "Block explorer URL",
    network.blockExplorerPrefix + pendingTx.hash
  );
}

async function read(contractAddress: string) {
  // Chain variables
  const endpoint = network.url;
  // Read smart contract
  const ethersProvider = new ethers.providers.JsonRpcProvider(endpoint);
  const contractAbi = ERC721.abi;
  const readContractInstance = new ethers.Contract(
    contractAddress,
    contractAbi,
    ethersProvider
  );
  console.log("Name", await readContractInstance["name"]());
  console.log("Symbol", await readContractInstance["symbol"]());
  console.log("Contract URI", await readContractInstance["contractURI"]());
  console.log("Owner of contract", await readContractInstance["owner"]());
  console.log("Owner of Token 0", await readContractInstance["ownerOf"](0));
  console.log("URI of Token 0", await readContractInstance["tokenURI"](0));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
