# Basic Cronos NFT tutorial

A code sample to create and deploy NFTs to the Cronos chain

## Get started

To install dependencies:

```shell
npm install
```

## Compile contract

To compile:

Standard commands:

```shell
npx hardhat compile
```

To deploy locally:

```shell
npx hardhat run --network ganache scripts/deploy-NFT-dev.script.ts
```

## Test contract

As this tutorial is for informational purposes, there are no automated tests. We will do our best to include tests in a future version. Meanwhile, always develop tests with 100% coverage if you are going to deploy your smart contracts to production!

## Deploy on Cronos testnet or mainnet

See `./scripts/deploy-NFT-full.ts` to comment and uncomment the relevant network configuration lines for your network, then run:

```shell
npx ts-node ./scripts/deploy-NFT-full.ts
```

This will run an end-to-end deployment script including uploading of NFT images and metadata to IPFS. Please pay attention to the prompts in the Terminal. You need to press Enter after each step to make sure that each step completes correctly before triggering the next step.
