import { DeployFunction } from "hardhat-deploy/types";

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
