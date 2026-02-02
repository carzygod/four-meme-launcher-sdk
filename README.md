# Four.Meme Token Launcher Library

A TypeScript library for programmatically deploying tokens on the [Four.Meme](https://four.meme) platform (BSC). 

This library wraps the Four.Meme API and Smart Contract interactions, providing a simple interface to launch tokens with support for **Advanced Tax Configurations (V5)**.

## Features

- **Programmatic Deployment**: Launch tokens directly from code.
- **V5 Tax Support**: Configure advanced tax settings including:
    - **Buy/Sell Fee**: Custom tax rates.
    - **Distribution**: Allocate tax to Funds (Beneficiary), Burn, Holders (Dividends), and Liquidity.
- **Safety Mode**: Built-in `dryRun` mode to simulate deployments and verify payloads without spending BNB.
- **Type Safety**: Full TypeScript definitions for configuration and results.

## Installation

```bash
npm install four-meme-token-launcher
```

*(Note: If installing locally during development, use `npm install ../four-meme-token-launcher`)*

## Quick Start

```typescript
import { deployToken, TokenConfig, TaxConfig } from 'four-meme-token-launcher';

// 1. Define Token Metadata
const tokenConfig: TokenConfig = {
    name: "My Meme Token",
    symbol: "MEME",
    description: "The next big thing on BSC",
    imagePath: "./assets/logo.png",
    twitter: "https://x.com/...",
    telegram: "https://t.me/..."
};

// 2. Define Tax Configuration (Optional)
// Example: 5% Tax -> 97% to Dev, 1% Burn, 1% Dividends, 1% LP
const taxConfig: TaxConfig = {
    taxRateBps: 500, // 5%
    fundsBps: 9700, // 97% of the tax
    burnBps: 100,   // 1% of the tax
    holdersBps: 100,// 1% of the tax
    liquidityBps: 100, // 1% of the tax
    beneficiaryAddress: "0x..." // Wallet to receive funds
};

// 3. Deploy
const result = await deployToken(
    tokenConfig,
    {
        privateKey: "YOUR_PRIVATE_KEY", // Without 0x prefix
        dryRun: true // Set to false to actually deploy
    },
    taxConfig
);

if (result.success) {
    console.log("Tx Hash:", result.txHash);
}
```

## API Reference

### `deployToken(tokenConfig, deployConfig, taxConfig?)`

Deploys a new token to the Four.Meme platform.

- **Returns**: `Promise<DeployResult>`

#### `TokenConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Token Name |
| `symbol` | `string` | Yes | Token Ticker Symbol |
| `description` | `string` | Yes | Token Description |
| `imagePath` | `string` | Yes | **Local absolute or relative path** to the token image file (PNG/JPG) |
| `twitter` | `string` | No | Twitter/X URL |
| `telegram` | `string` | No | Telegram Group URL |
| `website` | `string` | No | Website URL |

#### `DeployConfig`

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `privateKey` | `string` | Yes | - | Wallet private key **without** `0x` prefix. |
| `rpcUrl` | `string` | No | `https://bsc-dataseed.binance.org/` | BSC RPC Endpoint. |
| `dryRun` | `boolean` | No | `false` | If `true`, runs API checks and logs contract args **BUT SKIPS** the transaction. |

#### `TaxConfig` (V5)

Advanced tax settings. If `taxRateBps` > 0, the token is deployed as a V5 Tax Token.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `taxRateBps` | `number` | `0` | Total Buy/Sell Tax in Basis Points (e.g. `500` = 5%). |
| `fundsBps` | `number` | `0` | % of Tax going to `beneficiaryAddress` (e.g. `9700` = 97% of the 5% tax). |
| `burnBps` | `number` | `0` | % of Tax effectively burned. |
| `holdersBps` | `number` | `0` | % of Tax distributed to holders (Dividends). |
| `liquidityBps` | `number` | `0` | % of Tax added to LP. |
| `beneficiaryAddress` | `string` | - | **Required** if `fundsBps` > 0. The wallet receiving the marketing/dev tax. |

**Important Note on Tax Distribution:**
The sum of `fundsBps`, `burnBps`, `holdersBps`, and `liquidityBps` MUST equal **10000** (100% of the tax collected).

#### `DeployResult`

```typescript
interface DeployResult {
    success: boolean;
    txHash?: string;     // Transaction Hash (if successful)
    tokenAddress?: string;
    error?: any;         // Error object (if failed)
}
```

## Development

To build the library from source:

```bash
npm install
npm run build
```

The compiled output will be in the `dist/` directory.
