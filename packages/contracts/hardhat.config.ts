import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-ethers"
import "hardhat-deploy";
import {HardhatUserConfig} from "hardhat/config";
import envConfig from "./envConfig";
import "./shared/typed-hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000000,
      },
    },
  },
  etherscan: {
    apiKey: {
      sepolia: "BSFWY85F56JH998I6GBM1R4YZJTM6G5WGA",
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${envConfig.INFURA_API_KEY}`,
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
  },
  namedAccounts: {
    deployer: `privatekey://${envConfig.DEPLOYER_PRIVATE_KEY}`,
  },
};

export default config;
