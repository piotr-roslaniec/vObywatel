import {
    keccak256,
    createPublicClient,
    http,
    Address,
    Hex,
    isAddressEqual,
    SignableMessage,
    PublicClient
} from 'viem';
import {createVlayerClient} from '@vlayer/sdk';
import {entryPoint07Abi, entryPoint07Address, getUserOperationHash, toSmartAccount} from 'viem/account-abstraction';
import {SimpleAccount__factory, SimpleAccountFactory__factory} from '../../../contracts/typechain-types';
import webProofProver from '../../../contracts/artifacts/src/WebProofProver.sol/WebProofProver.json';
import fixtureData from  '../../../contracts/fixtures/gov.json';

const factoryAddress = '0x735A9Df72E99f9367407FFE2Ce1F661a7Db5b0B0';

export async function toProofSmartAccount(
    owner: SignableMessage,
    govIdHash: string,
    client: PublicClient,
) {
    const accountIface = SimpleAccount__factory.createInterface();
    const unrestrictedSelectors = [accountIface.getFunction("setOwner")].map(
        (x) => x.selector,
    );

    const factory = SimpleAccountFactory__factory.connect(factoryAddress, owner);
    const factoryCalldata = SimpleAccountFactory__factory.createInterface().encodeFunctionData(
        "createAccount",
        [{govIdHash}],
    ) as Hex;

    const entryPoint = {
        address: entryPoint07Address,
        abi: entryPoint07Abi,
        version: "0.7",
    } as const;

    async function signMessage({message}: { message: SignableMessage }) {
        const toSign = typeof message === "string" ? message : message.raw;
        return (await owner.signMessage(toSign)) as Hex;
    }

    const account = await toSmartAccount({
        client,
        entryPoint,
        async getFactoryArgs() {
            return {
                factory: (await factory.getAddress()) as Address,
                factoryData: factoryCalldata,
            };
        },
        async getStubSignature() {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
        },
        async signMessage({message}) {
            return await signMessage({message});
        },
        async signTypedData(parameters) {
            return (await owner.signTypedData(
                parameters.domain,
                parameters.types,
                parameters.message,
            )) as Hex;
        },
        async decodeCalls() {
            throw new Error("decodeCalls not implemented");
        },
        async signUserOperation({chainId = client.chain!.id, ...userOperation}) {
            if (
                unrestrictedSelectors.some((sel) =>
                    userOperation.callData.startsWith(sel),
                )
            ) {
                return await this.getStubSignature();
            }

            const address = await this.getAddress();
            const hash = getUserOperationHash({
                chainId,
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                userOperation: {
                    ...userOperation,
                    sender: address,
                },
            });

            const sig = await signMessage({message: {raw: hash}});
            return sig;
        },
        async getAddress() {
            return (await factory.getAccountAddress(
                {govIdHash},
            )) as Address;
        },
        async encodeCalls(calls) {
            if (calls.length === 1) {
                const call = calls[0]!;
                if (
                    isAddressEqual(call.to, account.address) &&
                    (call.value ?? 0n) === 0n &&
                    call.data &&
                    unrestrictedSelectors.some((sel) => call.data?.startsWith(sel))
                ) {
                    return call.data;
                }
            }
            return accountIface.encodeFunctionData("executeBatch", [
                calls.map((x) => ({
                    target: x.to,
                    value: x.value ?? 0n,
                    data: x.data ?? "0x",
                })),
            ]) as Hex;
        },

        userOperation: {
            async estimateGas(userOperation) {
                return {
                    preVerificationGas: BigInt(
                        Math.max(Number(userOperation.preVerificationGas ?? 0n), 2_000_000),
                    ),
                    verificationGasLimit: BigInt(
                        Math.max(
                            Number(userOperation.verificationGasLimit ?? 0n),
                            2_000_000,
                        ),
                    ),
                };
            },
        },
    });

    return account;
}

export async function main() {
    const govIdHash = keccak256('fakeGovId');

    const vlayer = createVlayerClient({
        url: "http://localhost:7047",
    });

    console.log("Generating proof...");
    const hash = await vlayer.prove({
        address: factoryAddress,
        functionName: "main",
        proverAbi: webProofProver.abi,
        args: [
            {
                webProofJson: JSON.stringify(fixtureData),
            },
            govIdHash,
        ],
        chainId: 11155111,
    });
    const provingResult = await vlayer.waitForProvingResult(hash);

    const INFURA_API_KEY = "d4b8aabed94f4b82b04be8a2a23f829f";
    const rpcUrl = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
    const client = createPublicClient({transport: http(rpcUrl)});
    const signer = await client.getSigner();
    const account = await toProofSmartAccount(signer, govIdHash, client);

    const accountAddress = account.address;
    console.log({accountAddress});

    if (!accountAddress) {
        throw new Error('Account creation failed');
    }

    try {
        console.log('Account created at:', accountAddress);

        const SimpleAccount = await client.getContractAt('SimpleAccount', accountAddress);

        const setOwnerTx = await SimpleAccount.setOwner(provingResult, toUtf8Bytes(govIdHash), accountAddress);
        await setOwnerTx.wait();

        console.log('Web proof verified and owner set');

        const [deployer] = await client.getSigners();

        await deployer.sendTransaction({
            to: accountAddress,
            value: BigInt(1e18),
        });

        console.log('Sent 1 ETH to the account');

        const balance = await client.getBalance(accountAddress);
        console.log('Account balance:', balance);

        const tx2 = await account.sendTransaction({
            to: accountAddress,
            value: BigInt(0.5e18),
        });
        await tx2.wait();

        console.log('Sent 0.5 ETH from the account to itself');

        const finalBalance = await client.getBalance(accountAddress);
        console.log('Final account balance:', finalBalance);
    } catch (error) {
        console.error('Error:', error);
    }
}
