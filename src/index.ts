import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { createWalletClient, createPublicClient, http, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { DeployConfig, DeployResult, TaxConfig, TokenConfig } from './types';

export * from './types'; // Add this line to export types


// Constants
const API_URL = 'https://four.meme/meme-api/v1';
const FACTORY_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
const FACTORY_ABI = [
    {
        "inputs": [
            { "internalType": "bytes", "name": "args", "type": "bytes" },
            { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "createToken",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

/**
 * Deploys a new token to Four.Meme platform.
 * 
 * @param tokenConfig - Basic token metadata (name, symbol, image, etc.)
 * @param deployConfig - Wallet and network configuration
 * @param taxConfig - Optional tax settings (V5)
 * @returns DeployResult
 */
export async function deployToken(
    tokenConfig: TokenConfig,
    deployConfig: DeployConfig,
    taxConfig: TaxConfig = {}
): Promise<DeployResult> {
    try {
        // 1. Setup Wallet
        const account = privateKeyToAccount(`0x${deployConfig.privateKey}` as Hex);
        const client = createWalletClient({
            account,
            chain: bsc,
            transport: http(deployConfig.rpcUrl || 'https://bsc-dataseed.binance.org/')
        });

        console.log(`🔷 Wallet: ${account.address}`);

        // 2. Login & Get Access Token
        console.log("🔄 Logging in...");
        const nonceRes = await axios.post(`${API_URL}/private/user/nonce/generate`, {
            accountAddress: account.address,
            networkCode: "BSC",
            verifyType: "LOGIN"
        });

        const nonce = (nonceRes.data as any).data;
        const message = `You are sign in Meme ${nonce}`;
        const signature = await account.signMessage({ message });

        const loginRes = await axios.post(`${API_URL}/private/user/login/dex`, {
            inviteCode: "",
            langType: "EN",
            region: "WEB",
            verifyInfo: {
                address: account.address,
                networkCode: "BSC",
                signature,
                verifyType: "LOGIN"
            },
            walletName: "MetaMask"
        });

        const accessToken = (loginRes.data as any).data;
        console.log("✅ Logged in successfully");

        // 3. Upload Image
        console.log("🔄 Uploading image...");
        if (!fs.existsSync(tokenConfig.imagePath)) {
            throw new Error(`Image file not found at ${tokenConfig.imagePath}`);
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(tokenConfig.imagePath));

        const uploadRes = await axios.post(`${API_URL}/private/token/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Meme-Web-Access': accessToken
            }
        });

        const imageUrl = (uploadRes.data as any).data;

        console.log(`✅ Image uploaded: ${imageUrl}`);

        // 4. Construct Metadata Payload
        // Default to V5 if tax rate is present, otherwise standard
        const isTaxToken = (taxConfig.taxRateBps || 0) > 0;

        const metadataPayload: any = {
            clickFun: false,
            desc: tokenConfig.description,
            funGroup: false,
            imgUrl: imageUrl,
            label: "Meme",
            launchTime: Date.now(),
            lpTradingFee: 0.0025,
            name: tokenConfig.name,
            preSale: 0,
            raisedAmount: 24,
            raisedToken: {
                b0Amount: "8",
                buyFee: isTaxToken ? ((taxConfig.taxRateBps || 0) / 10000).toString() : "0.01",
                nativeSymbol: "BNB",
                networkCode: "BSC",
                platform: "MEME",
                saleRate: "0.8",
                sellFee: isTaxToken ? ((taxConfig.taxRateBps || 0) / 10000).toString() : "0.01",
                status: "PUBLISH",
                symbol: "BNB",
                symbolAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
                totalAmount: "1000000000",
                totalBAmount: "24",
                // Inject V5 Tax Config into raisedToken as well
                ...(isTaxToken ? {
                    template: 5,
                    // SDK might look for these here too as fallback, or just relies on tokenTaxInfo
                } : {})
            },
            reserveRate: 0,
            saleRate: 0.8,
            shortName: tokenConfig.symbol,
            symbol: "BNB",
            totalSupply: 1000000000,
            twitterUrl: tokenConfig.twitter || "",
            websiteUrl: tokenConfig.website || "",
            telegramUrl: tokenConfig.telegram || ""
        };

        // Add V5 Tax Configuration (Corrected based on User Payload)
        if (isTaxToken) {
            console.log("⚙️  Applying Verified Tax Configuration (tokenTaxInfo)...");

            // Validate Tax Sum
            const totalBps = (taxConfig.fundsBps || 0) +
                (taxConfig.burnBps || 0) +
                (taxConfig.holdersBps || 0) +
                (taxConfig.liquidityBps || 0);

            if (totalBps !== 10000) {
                throw new Error(`Tax distribution must sum to 10000 (100%). Current sum: ${totalBps}`);
            }

            if ((taxConfig.fundsBps || 0) > 0 && !taxConfig.beneficiaryAddress) {
                throw new Error("Beneficiary address required when Funds Bps > 0");
            }

            // Convert Basis Points (500) to Integer Rate (5)
            const feeRateInt = (taxConfig.taxRateBps || 0) / 100;

            // Convert Distribution Basis Points (9700) to Integer Rate (97)
            const burnRate = (taxConfig.burnBps || 0) / 100;
            const divideRate = (taxConfig.holdersBps || 0) / 100; // Dividends
            const liquidityRate = (taxConfig.liquidityBps || 0) / 100;
            const recipientRate = (taxConfig.fundsBps || 0) / 100;

            Object.assign(metadataPayload, {
                tokenTaxInfo: {
                    burnRate: burnRate,
                    divideRate: divideRate,
                    feeRate: feeRateInt, // e.g. 5 for 5%
                    liquidityRate: liquidityRate,
                    recipientAddress: taxConfig.beneficiaryAddress || account.address,
                    recipientRate: recipientRate,
                    minSharing: 1000000 // Default from observed payload
                },
                // Ensure template 5 is set if needed, though user payload showed template 0? 
                // Wait, user payload response data had template 0. Request payload didn't have template.
                // But SDK `newTokenV5` implies a specific contract path. 
                // We'll keep raisedToken params consistent.
            });
        }

        // 5. Submit to API & Get Signature
        console.log("🔄 Submitting token metadata...");

        // DEBUG: Verify Payload Structure
        if (deployConfig.dryRun) {
            console.log("🐛 [DEBUG] Full Metadata Payload:");
            console.log(JSON.stringify(metadataPayload, null, 2));
        }

        const createRes = await axios.post(`${API_URL}/private/token/create`, metadataPayload, {
            headers: { 'Meme-Web-Access': accessToken }
        });

        if ((createRes.data as any).code !== 200 && (createRes.data as any).code !== 0) {
            throw new Error(`API Error: ${JSON.stringify(createRes.data)}`);
        }

        const { createArg, signature: contractSignature } = (createRes.data as any).data;
        console.log("✅ Metadata registered, received contract signature");

        // 6. Submit Transaction (or Dry Run)
        if (deployConfig.dryRun) {
            console.warn("⚠️  DRY RUN MODE ENABLED: Skipping on-chain transaction.");
            console.log("📝 Contract Arguments that would be sent:");
            console.log(`   - createArg: ${createArg}`);
            console.log(`   - signature: ${contractSignature}`);

            return {
                success: true,
                txHash: "DRY_RUN_SIMULATION",
                tokenAddress: "0x0000000000000000000000000000000000000000"
            };
        }

        console.log("🚀 Submitting transaction to BSC...");
        const hash = await client.writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createToken',
            args: [createArg, contractSignature]
            // No value needed - deployment fee removed by Four.Meme
        });

        console.log(`📝 Transaction sent! Hash: ${hash}`);
        console.log(`⏳ Waiting for transaction confirmation...`);

        // Create public client to read transaction receipt
        const publicClient = createPublicClient({
            chain: bsc,
            transport: http(deployConfig.rpcUrl || 'https://bsc-dataseed.binance.org/')
        });

        // Wait for transaction receipt to get token address
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Parse token address from logs
        // The factory emits a TokenCreated event with the token address
        let tokenAddress: string | undefined;

        if (receipt.logs && receipt.logs.length > 0) {
            // The token address is typically in the first log as the contract address
            // or we can parse from the event data
            for (const log of receipt.logs) {
                // Token creation events usually have the token address as a topic or in data
                if (log.address && log.address !== FACTORY_ADDRESS) {
                    tokenAddress = log.address;
                    break;
                }
            }
        }

        if (!tokenAddress) {
            console.warn("⚠️  Could not parse token address from receipt, using fallback");
            // Fallback: token address might be in the first log
            tokenAddress = receipt.logs[0]?.address || undefined;
        }

        console.log(`🎉 Token deployed at: ${tokenAddress || 'Unknown'}`);

        return {
            success: true,
            txHash: hash,
            tokenAddress: tokenAddress
        };


    } catch (error: any) {
        console.error("❌ Deployment Failed:", error.message || error);
        return {
            success: false,
            error: error
        };
    }
}
