# Four.Meme Launcher Script

A ready-to-use script for deploying meme tokens on Four.Meme using the `four-meme-token-launcher` library.

## Prerequisites

- Node.js (v18+)
- A BSC Wallet with at least **0.02 BNB** (for creation fee + gas).
- A transparent PNG image for your token logo.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   *Note: This projects depends on the local `../four-meme-token-launcher` package.*

2. **Configure Environment**:
   Copy the example configuration (or create `.env`):
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your details:
   ```ini
   PRIVATE_KEY=your_wallet_private_key_without_0x
   RPC_URL=https://bsc-dataseed.binance.org/
   # Wallet to receive the 97% tax funds (defaults to sender if empty)
   BENEFICIARY_ADDRESS=0x...
   # Set to true to simulate only. Set to false to SPEND MONEY.
   DRY_RUN=true
   ```

3. **Configure Token**:
   Open `launcher.ts` and modify `TOKEN_CONFIG`:
   ```typescript
   const TOKEN_CONFIG: TokenConfig = {
       name: "Your Token Name",
       symbol: "TICKER",
       description: "...",
       imagePath: "./token.png", // Ensure this file exists!
       // ... social links
   };
   ```

## Usage

### 1. Dry Run (Simulation)
Ensure `DRY_RUN=true` is set in your `.env`.
```bash
npm start
```
Check the logs. The script will:
- derive your wallet address
- upload the image
- **Print the JSON Payload** and Contract Arguments
- **SKIP** the actual transaction

### 2. Live Deployment (Real Money)
**WARNING: This costs ~0.015 BNB.**

1. Change `DRY_RUN=false` in `.env`.
2. Run the script:
   ```bash
   npm start
   ```
3. Wait for the transaction confirmation (Hash) and success message.

## Troubleshooting

- **Image not found**: Check `imagePath` in `launcher.ts`.
- **API Error**: Check your internet connection or if Four.Meme API is down.
- **Insufficient Funds**: Ensure your wallet has BNB for gas and the 0.01 BNB platform fee.
