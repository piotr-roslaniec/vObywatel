import { DeployFunction } from "hardhat-deploy/types";
// import proverSpec from "../out/WebProofProver.sol/WebProofProver";
// import verifierSpec from "../out/WebProofVerifier.sol/WebProofVerifier";
// import {
//   deployVlayerContracts,
//   writeEnvVariables,
//   getConfig,
// } from "@vlayer/sdk/config";
//
// const { prover, verifier } = await deployVlayerContracts({
//   proverSpec,
//   verifierSpec,
// });

// const config = getConfig();

// writeEnvVariables(".env", {
//   VITE_PROVER_ADDRESS: prover,
//   VITE_VERIFIER_ADDRESS: verifier,
//   VITE_CHAIN_NAME: config.chainName,
//   VITE_PROVER_URL: config.proverUrl,
//   VITE_JSON_RPC_URL: config.jsonRpcUrl,
//   VITE_PRIVATE_KEY: config.privateKey,
// });


declare module "hardhat/types/runtime" {
  interface TypedHardhatDeployNames {
    SimpleAccountFactory: "SimpleAccountFactory";
  }
}

const deploy: DeployFunction = async ({
  typedDeployments,
  safeGetNamedAccounts,
}) => {
  const { deployer } = await safeGetNamedAccounts({ deployer: true });

  const entryPoint = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // 0.7.0
  await typedDeployments.deploy("SimpleAccountFactory", {
    from: deployer,
    log: true,
    args: [entryPoint],
  });
};

export default deploy;
