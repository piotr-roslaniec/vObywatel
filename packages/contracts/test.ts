import {ethers} from 'hardhat';
import {keccak256, toUtf8Bytes} from 'ethers';
import fs from 'fs';
import path from 'path';
import type {Address, Hex, PublicClient, SignableMessage} from "viem";
import {assert} from "ts-essentials";
import {
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount,
} from "viem/account-abstraction";
import {SimpleAccount__factory, SimpleAccountFactory__factory} from "./typechain-types";

// export async function toJwtSmartAccount(
//     owner: ethers.Signer,
//     govHashId: string,
//     client: PublicClient,
// ) {
//
//     const accountIface = SimpleAccount__factory.createInterface();
//     const unrestrictedSelectors = [accountIface.getFunction("setOwner")].map(
//         (x) => x.selector,
//     );
//
//     const factoryAddress = '0x735A9Df72E99f9367407FFE2Ce1F661a7Db5b0B0';
//     // const factory = await ethers.getContractAt('SimpleAccountFactory', factoryAddress);
//     const factory = SimpleAccountFactory__factory.connect(factoryAddress, owner);
//     const factoryCalldata = factory.interface.encodeFunctionData(
//         "createAccount",
//         [govHashId],
//     ) as Hex;
//
//     const entryPoint = {
//         address: entryPoint07Address,
//         abi: entryPoint07Abi,
//         version: "0.7",
//     } as const;
//
//     async function signMessage({message}: { message: SignableMessage }) {
//         const toSign =
//             typeof message === "string" ? message : ethers.getBytes(message.raw);
//         return (await owner.signMessage(toSign)) as Hex;
//     }
//
//     const account = await toSmartAccount({
//         client,
//         entryPoint,
//         async getFactoryArgs() {
//             return {
//                 factory: (await factory.getAddress()) as Address,
//                 factoryData: factoryCalldata,
//             };
//         },
//         async getStubSignature() {
//             return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
//         },
//         async signMessage({message}) {
//             return await signMessage({message});
//         },
//         async signTypedData(parameters) {
//             return (await owner.signTypedData(
//                 parameters.domain as any,
//                 parameters.types as any,
//                 parameters.message as any,
//             )) as Hex;
//         },
//         async decodeCalls() {
//             throw new Error("decodeCalls not implemented");
//         },
//         async signUserOperation({chainId = client.chain!.id, ...userOperation}) {
//             if (
//                 unrestrictedSelectors.some((sel) =>
//                     userOperation.callData.startsWith(sel),
//                 )
//             ) {
//                 return await this.getStubSignature();
//             }
//
//             const address = await this.getAddress();
//             const hash = getUserOperationHash({
//                 chainId,
//                 entryPointAddress: entryPoint.address,
//                 entryPointVersion: entryPoint.version,
//                 userOperation: {
//                     ...userOperation,
//                     sender: address,
//                 },
//             });
//
//             const sig = await signMessage({message: {raw: hash}});
//             return sig;
//         },
//         async getAddress() {
//             return (await factory.getAccountAddress(
//                 govHashId,
//             )) as Address;
//         },
//         async encodeCalls(calls) {
//             if (calls.length === 1) {
//                 const call = calls[0]!;
//                 if (
//                     utils.isAddressEqual(call.to, account.address) &&
//                     (call.value ?? 0n) === 0n &&
//                     call.data &&
//                     unrestrictedSelectors.some((sel) => call.data?.startsWith(sel))
//                 ) {
//                     return call.data;
//                 }
//             }
//             return accountIface.encodeFunctionData("executeBatch", [
//                 calls.map((x) => ({
//                     target: x.to,
//                     value: x.value ?? 0n,
//                     data: x.data ?? "0x",
//                 })),
//             ]) as Hex;
//         },
//
//         userOperation: {
//             // TODO: is this needed?
//             async estimateGas(userOperation) {
//                 return {
//                     preVerificationGas: BigInt(
//                         Math.max(Number(userOperation.preVerificationGas ?? 0n), 2_000_000),
//                     ),
//                     verificationGasLimit: BigInt(
//                         Math.max(
//                             Number(userOperation.verificationGasLimit ?? 0n),
//                             2_000_000,
//                         ),
//                     ),
//                 };
//             },
//         },
//     });
//
//     return account;
// }

async function main() {
    // Load fixture data
    const fixturePath = path.join(__dirname, './fixtures/twitter.json');
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // Generate a fake govIdHash using keccak256
    const fakeGovIdHash = keccak256(toUtf8Bytes('fakeGovId'));
    console.log({fakeGovIdHash});

    // Use existing SimpleAccountFactory deployment on Sepolia
    const factoryAddress = '0x735A9Df72E99f9367407FFE2Ce1F661a7Db5b0B0';
    const SimpleAccountFactory = await ethers.getContractAt('SimpleAccountFactory', factoryAddress);

    try {
        // Create account using the factory with a manual gas limit
        const tx = await SimpleAccountFactory.createAccount({govIdHash: fakeGovIdHash}, {gasLimit: 2000000});
        const receipt = await tx.wait();
        console.log('Account creation transaction hash:', receipt.transactionHash);
        const accountAddress = receipt.events?.find((event: any) => event.event === 'AccountCreated')?.args?.account;

        if (!accountAddress) {
            throw new Error('Account creation failed');
        }

        console.log('Account created at:', accountAddress);

        // Get the created account contract instance
        const account = await ethers.getContractAt('SimpleAccount', accountAddress);

        // Verify the web proof by calling the setOwner method
        const setOwnerTx = await account.setOwner(fixtureData.webProof, accountAddress);
        await setOwnerTx.wait();

        console.log('Web proof verified and owner set');

        // Perform a transaction with the created account
        const [deployer] = await ethers.getSigners();

        // Send ETH to the created account
        await deployer.sendTransaction({
            to: accountAddress,
            value: ethers.parseEther('1.0'),
        });

        console.log('Sent 1 ETH to the account');

        // Check the balance of the created account
        const balance = await ethers.provider.getBalance(accountAddress);
        console.log('Account balance:', ethers.formatEther(balance));

        // Send ETH from the created account to itself
        const tx2 = await account.sendTransaction({
            to: accountAddress,
            value: ethers.parseEther('0.5'),
        });
        await tx2.wait();

        console.log('Sent 0.5 ETH from the account to itself');

        // Check the balance again
        const finalBalance = await ethers.provider.getBalance(accountAddress);
        console.log('Final account balance:', ethers.formatEther(finalBalance));
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
