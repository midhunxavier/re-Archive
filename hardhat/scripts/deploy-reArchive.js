const hre = require("hardhat");
const fs = require("fs");
const fse = require("fs-extra");
const { verify } = require("../utils/verify");

const LOCAL_NETWORKS = ["localhost", "ganache"];

async function deployMock() {
  const DECIMALS = "8";
  const INITIAL_PRICE = "200000000000";

  const Mock = await hre.ethers.getContractFactory("MockV3Aggregator");

  console.log("Deploying price feed mock");
  const mockContract = await Mock.deploy(DECIMALS, INITIAL_PRICE);

  await mockContract.deployed();
  console.log("Price feed mock deployed to:", mockContract.address);

  return mockContract.address;
}

async function main() {
  /* these two lines deploy the contract to the network */
  let listingFee = hre.ethers.utils.parseEther("0.001", "ether");
  var priceFeedAddress;
  if (LOCAL_NETWORKS.includes(hre.network.name)) {
    priceFeedAddress = await deployMock();
  }
  // For deploying to polygon mainnet or testnet
  // const priceFeedAddress = ""

  const DecentralreArchive = await hre.ethers.getContractFactory(
    "DecentralreArchive"
  );
  const reArchiveContract = await DecentralreArchive.deploy(
    listingFee,
    priceFeedAddress
  );
  await reArchiveContract.deployed();
  console.log("Decentral reArchive deployed to:", reArchiveContract.address);
  console.log("Network deployed to :", hre.network.name);

  /* transfer contracts addresses & ABIs to the front-end */
  if (fs.existsSync("../src")) {
    fs.rmSync("../src/artifacts", { recursive: true, force: true });
    fse.copySync("./artifacts/contracts", "../src/artifacts");
    fs.writeFileSync(
      "../src/utils/contracts-config.js",
      `
      export const contractAddress = "${reArchiveContract.address}"
      export const ownerAddress = "${reArchiveContract.signer.address}"
      export const networkDeployedTo = "${hre.network.config.chainId}"
    `
    );
  }

  if (
    !LOCAL_NETWORKS.includes(hre.network.name) &&
    hre.config.etherscan.apiKey !== ""
  ) {
    await reArchiveContract.deployTransaction.wait(6);
    await verify(reArchiveContract.address, [listingFee, priceFeedAddress]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
