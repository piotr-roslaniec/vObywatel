import webProofProver from "../../../contracts/artifacts/src/WebProofProver.sol/WebProofProver.json"

import { sepolia } from "viem/chains";
// import webProofFixture from "./fixtures";

import {
    createVlayerClient,
    type WebProof,
    type Proof,
    isDefined,
} from "@vlayer/sdk";

import {
    createExtensionWebProofProvider,
    expectUrl,
    notarize,
    startPage,
} from "@vlayer/sdk/web_proof";

// import webProofVerifier from "../../out/WebProofVerifier.sol/WebProofVerifier";
import { Hex } from "viem";

const chain = {
    id: sepolia.id,
}
const chainName = "sepolia"
const proverUrl = "http://127.0.0.1:3000"
const jsonRpcUrl = "http://127.0.0.1:8545"
const examplesTestPrivate_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const twitterUserAddress = "0x13k3..."
const account = "0xbc37f27ad26fcb393e181bbf76521c6916f56583db51d22347f620b773e9ed09"

export const generateWebProof = async (setWalletAddress: (address: string) => void) => {
    const provider = createExtensionWebProofProvider({
        wsProxyUrl: "ws://localhost:55688",
        notaryUrl: "http://localhost:7047",
    });
    const webProof = await provider.getWebProof({
        proverCallCommitment: {
            address: process.env.NEXT_PUBLIC_PROVER_ADDRESS,
            proverAbi: webProofProver.abi,
            chainId: chain.id,
            functionName: "main",
            commitmentArgs: ["0x"],
        },
        logoUrl: "https://www.mobywatel.gov.pl/assets/img/godlo-RP.svg",
        steps: [
            startPage("https://konto.biznes.gov.pl/pl/moje-konto", "Go to gov.pl"),
            expectUrl("https://konto.biznes.gov.pl/pl/moje-konto", "Log in"),
            notarize(
                "https://konfigurator.biznes.gov.pl/api/v2/ceidg/my-business/",
                "GET",
                "Generate Proof of National ID",
            ),
        ],
    });

    console.log("WebProof generated!", webProof);
    await generateProof(webProof)
}

export const generateProof = async (providerWebProof: WebProof) => {
    const notaryPubKey =
        "-----BEGIN PUBLIC KEY-----\n" +
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEBv36FI4ZFszJa0DQFJ3wWCXvVLFr\n" +
        "cRzMG5kaTeHGoSzDu6cFqx3uEWYpFGo6C0EOUgf+mEgbktLrXocv5yHzKg==\n" +
        "-----END PUBLIC KEY-----"

    const webProof = {
        tls_proof: providerWebProof,
        notary_pub_key: notaryPubKey,
    };
    const vlayer = createVlayerClient({
        url: proverUrl,
    });

    console.log("Generating proof...");
    const hash = await vlayer.prove({
        address: process.env.NEXT_PUBLIC_PROVER_ADDRESS,
        functionName: "main",
        proverAbi: webProofProver.abi,
        args: [
            {
                webProofJson: JSON.stringify(webProof),
            },
            twitterUserAddress,
        ],
        chainId: chain.id,
    });
    const provingResult = await vlayer.waitForProvingResult(hash);
    console.log("Proof generated!", provingResult);

    await createAccount(provingResult)
};

export const createAccount = async (provingResult: [Proof, string, Hex] | undefined) => {
    isDefined(provingResult, "Proving result is undefined");

    const txHash = await ethClient.writeContract({
        address: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS,
        abi: "abi", // webProofVerifier.abi,
        functionName: "verify",
        args: provingResult,
        chain,
        account: account,
    });

    const verification = await ethClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
        retryCount: 60,
        retryDelay: 1000,
    });
    console.log("Verified!", verification);
};
