import { HardhatUserConfig } from "hardhat/config";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import * as dotenv from "dotenv";
dotenv.config();

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

const config: HardhatUserConfig = {
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
    },
    hardhat: {},
    rinkeby: {
      url:
        "https://eth-rinkeby.alchemyapi.io/v2/" +
        <string>process.env["ALCHEMY_KEY"],
      accounts: [<string>process.env["OWNER_PRIVATE_KEY"]],
    },
  },
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
