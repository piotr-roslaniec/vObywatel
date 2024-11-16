import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";
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
  namedAccounts: {
    deployer: `privatekey://${envConfig.DEPLOYER_PRIVATE_KEY}`,
  },
};

export default config;
