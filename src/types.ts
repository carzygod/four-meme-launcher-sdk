
export interface TokenConfig {
    name: string;
    symbol: string;
    description: string;
    imagePath: string;
    twitter?: string;
    website?: string;
    telegram?: string;
}

export interface TaxConfig {
    /** 
     * Tax Rate in Basis Points (e.g., 500 = 5%) 
     * Default: 0
     */
    taxRateBps?: number;

    /**
     * Percentage of tax allocated to Marketing/Funds Recipient
     * Basis Points (e.g., 9700 = 97%)
     * Default: 0
     */
    fundsBps?: number;

    /**
     * Percentage of tax allocated to Burn
     * Basis Points. Default: 0
     */
    burnBps?: number;

    /**
     * Percentage of tax allocated to Holders (Dividends)
     * Basis Points. Default: 0
     */
    holdersBps?: number;

    /**
     * Percentage of tax allocated to Liquidity Provider
     * Basis Points. Default: 0
     */
    liquidityBps?: number;

    /**
     * Address to receive the 'fundsBps' portion.
     * Required if fundsBps > 0.
     */
    beneficiaryAddress?: string;
}

export interface DeployConfig {
    /**
     * Private Key (without '0x' prefix)
     */
    privateKey: string;

    /**
     * BSC RPC URL. Default: https://bsc-dataseed.binance.org/
     */
    rpcUrl?: string;

    /**
     * If true, performs API calls but skips the on-chain transaction.
     * Useful for verifying payload validity without spending funds.
     * Default: false
     */
    dryRun?: boolean;
}

export interface DeployResult {
    success: boolean;
    txHash?: string;
    tokenAddress?: string; // If parseable from logs
    error?: any;
}
