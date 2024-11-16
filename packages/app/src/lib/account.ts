import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'

async function main() {
    try {
        const newAccount = await createNewAccount()
        console.log('New Account Created:')
        console.log('Address:', newAccount.address)
        console.log('Private Key:', newAccount.privateKey)

    } catch (error) {
        console.error('Failed to create account:', error)
    }
}

async function createNewAccount() {
    try {
        // Generate a random private key
        const privateKey = generatePrivateKey()
        console.log('Generated Private Key:', privateKey)

        // Create an account from the private key
        const account = privateKeyToAccount(privateKey)
        console.log('Account Address:', account.address)

        // Create a wallet client (optional - for interacting with the blockchain)
        const client = createWalletClient({
            account,
            chain: sepolia,
            transport: http()
        })

        // Return the account details
        return {
            address: account.address,
            privateKey: privateKey,
            // Never expose private keys in production!
            // This is just for demonstration
        }
    } catch (error) {
        console.error('Error creating account:', error)
        throw error
    }
}