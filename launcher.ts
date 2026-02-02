import dotenv from 'dotenv';
import { deployToken, TokenConfig, TaxConfig } from 'four-meme-token-launcher';
import { privateKeyToAccount } from 'viem/accounts';
import { Hex } from 'viem';

dotenv.config();

// Token Details Configuration - EDIT THIS FOR YOUR TOKEN
const TOKEN_CONFIG: TokenConfig = {
    name: "Test Token Package",
    symbol: "TTP",
    description: "Launched via four-meme-token-launcher NPM",
    imagePath: "./token.png", // Ensure this file exists
    twitter: "https://x.com/test",
    website: "",
    telegram: ""
};

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

    const rpcUrl = process.env.RPC_URL || 'https://bsc-dataseed.binance.org/';

    // Derive account from private key to use as default beneficiary
    const account = privateKeyToAccount(`0x${privateKey}` as Hex);
    console.log(`🔷 Wallet Address: ${account.address}`);

    // Tax Configuration (V5) with auto-derived beneficiary
    const TAX_CONFIG: TaxConfig = {
        taxRateBps: 500, // 5%
        fundsBps: 9700, // 97%
        burnBps: 100, // 1%
        holdersBps: 100, // 1%
        liquidityBps: 100, // 1%
        // Use Env value OR fallback to wallet address
        beneficiaryAddress: process.env.BENEFICIARY_ADDRESS || account.address
    };

    console.log(`💰 Beneficiary: ${TAX_CONFIG.beneficiaryAddress}`);
    console.log("📦 Using 'four-meme-token-launcher' package...");

    const result = await deployToken(
        TOKEN_CONFIG,
        {
            privateKey,
            rpcUrl,
            // SAFETY: Controlled by .env. Defaults to TRUE if not strictly 'false'.
            dryRun: process.env.DRY_RUN !== 'false'
        },
        TAX_CONFIG
    );

    if (result.success) {
        console.log("✅ Token Deployed Successfully!");
        console.log(`📜 Transaction Hash: ${result.txHash}`);
        console.log(`🔗 View on Scan: https://bscscan.com/tx/${result.txHash}`);
    } else {
        console.error("❌ Deployment Failed:", result.error);
    }
}

main().catch(console.error);
