// scripts/index-wallet-holdings.ts

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const RATE_LIMIT_DELAY = 2000; // 2s = 30 calls/minute
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Define types for wallet holdings
type TokenHolding = {
  token: string;
  symbol: string;
  quantity: number;
  value_usd: number;
};

type WalletHoldings = {
  address: string;
  network: string;
  holdings: TokenHolding[];
  total_value_usd: number;
  last_updated: string;
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

type NetworkError = {
  code?: string;
  response?: {
    status?: number;
  };
  message?: string;
};

async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    const error = err as NetworkError;
    if (retryCount < MAX_RETRIES && (
      error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' ||
      error.response?.status === 429
    )) {
      const waitTime = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`🔄 ${operationName}: Retry ${retryCount + 1}/${MAX_RETRIES} after error: ${error.code || error.response?.status}`);
      console.log(`⏳ Waiting ${waitTime/1000} seconds before retry...`);
      await delay(waitTime);
      return fetchWithRetry(operation, operationName, retryCount + 1);
    }
    throw err;
  }
}

// Mock API function to fetch wallet holdings
// In a real implementation, you would replace this with an actual API call
async function fetchWalletHoldings(network: string, address: string): Promise<TokenHolding[]> {
  // This is a mock function that simulates fetching wallet holdings from an API
  // For demonstration purposes, we'll generate different holdings based on the wallet address
  // In a real implementation, you would call an actual blockchain API or explorer
  
  // Use the last 4 characters of the address to seed the random number generator
  const seed = parseInt(address.slice(-4), 16) || 1;
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    const r = x - Math.floor(x);
    return min + r * (max - min);
  };
  
  // Common tokens across networks
  const commonTokens = [
    { token: 'Ethereum', symbol: 'ETH' },
    { token: 'USD Coin', symbol: 'USDC' },
    { token: 'Tether', symbol: 'USDT' },
    { token: 'Wrapped Bitcoin', symbol: 'WBTC' },
  ];
  
  // Network-specific tokens
  const networkTokens: Record<string, Array<{ token: string, symbol: string }>> = {
    eth: [
      { token: 'Chainlink', symbol: 'LINK' },
      { token: 'Uniswap', symbol: 'UNI' },
      { token: 'Aave', symbol: 'AAVE' },
      { token: 'Compound', symbol: 'COMP' },
    ],
    bsc: [
      { token: 'Binance Coin', symbol: 'BNB' },
      { token: 'PancakeSwap', symbol: 'CAKE' },
      { token: 'Venus', symbol: 'XVS' },
      { token: 'Alpaca Finance', symbol: 'ALPACA' },
    ],
    solana: [
      { token: 'Solana', symbol: 'SOL' },
      { token: 'Raydium', symbol: 'RAY' },
      { token: 'Serum', symbol: 'SRM' },
      { token: 'Mango', symbol: 'MNGO' },
      { token: 'Marinade Staked SOL', symbol: 'mSOL' },
      { token: 'Bonk', symbol: 'BONK' },
    ],
    polygon_pos: [
      { token: 'Polygon', symbol: 'MATIC' },
      { token: 'QuickSwap', symbol: 'QUICK' },
      { token: 'Aavegotchi', symbol: 'GHST' },
      { token: 'SushiSwap', symbol: 'SUSHI' },
    ],
    avax: [
      { token: 'Avalanche', symbol: 'AVAX' },
      { token: 'Trader Joe', symbol: 'JOE' },
      { token: 'Pangolin', symbol: 'PNG' },
      { token: 'Benqi', symbol: 'QI' },
    ],
    arbitrum: [
      { token: 'Arbitrum', symbol: 'ARB' },
      { token: 'GMX', symbol: 'GMX' },
      { token: 'Dopex', symbol: 'DPX' },
      { token: 'Camelot', symbol: 'GRAIL' },
    ],
    base: [
      { token: 'Base', symbol: 'BASE' },
      { token: 'Aerodrome', symbol: 'AERO' },
      { token: 'Degen', symbol: 'DEGEN' },
      { token: 'Bald', symbol: 'BALD' },
    ],
  };
  
  // Get tokens for the specified network, or use common tokens if network not found
  const availableTokens = [...commonTokens, ...(networkTokens[network] || [])];
  
  // Determine how many tokens this wallet has (between 2 and 6)
  const numTokens = Math.floor(rand(2, Math.min(6, availableTokens.length)));
  
  // Shuffle the tokens array based on the seed
  const shuffledTokens = [...availableTokens].sort(() => rand(0, 1) - 0.5);
  
  // Select the first numTokens from the shuffled array
  const selectedTokens = shuffledTokens.slice(0, numTokens);
  
  // Generate holdings for each selected token
  return selectedTokens.map(({ token, symbol }) => {
    // Generate quantities based on token type
    let quantity: number;
    let value_usd: number;
    
    if (symbol === 'ETH' || symbol === 'WBTC') {
      // Lower quantities for high-value tokens
      quantity = rand(0.1, 10);
      value_usd = symbol === 'ETH' ? quantity * rand(3000, 5000) : quantity * rand(40000, 60000);
    } else if (symbol === 'SOL') {
      // Solana token
      quantity = rand(1, 100);
      value_usd = quantity * rand(80, 150); // SOL price range
    } else if (symbol === 'USDC' || symbol === 'USDT') {
      // Stablecoins
      quantity = rand(100, 10000);
      value_usd = quantity * rand(0.98, 1.02); // Slight variation around $1
    } else if (network === 'solana') {
      // Other Solana tokens
      quantity = rand(50, 5000);
      value_usd = quantity * rand(0.5, 20); // Solana tokens price range
    } else {
      // Other tokens
      quantity = rand(10, 1000);
      value_usd = quantity * rand(1, 100); // Random price between $1 and $100
    }
    
    return {
      token,
      symbol,
      quantity,
      value_usd
    };
  });
}

async function indexWalletHoldings() {
  // Get whale pools data to extract wallet addresses
  const dataDir = path.join(process.cwd(), 'src', 'data');
  await ensureDirectoryExists(dataDir);
  
  // Create a directory for wallet holdings
  const holdingsDir = path.join(dataDir, 'wallet-holdings');
  await ensureDirectoryExists(holdingsDir);
  
  try {
    // Read whale pools data
    const whalePoolsPath = path.join(dataDir, 'whalePools.json');
    const whalePoolsData = await fs.readFile(whalePoolsPath, 'utf-8');
    const whalePools = JSON.parse(whalePoolsData);
    
    console.log(`📊 Found ${whalePools.length} whale pools to process`);
    
    // Extract unique wallet addresses across all networks
    const walletsByNetwork: Record<string, string[]> = {};
    
    whalePools.forEach((pool: any) => {
      const network = pool.network;
      
      if (!walletsByNetwork[network]) {
        walletsByNetwork[network] = [];
      }
      
      pool.whaleTraders.forEach((trader: any) => {
        if (!walletsByNetwork[network].includes(trader.address)) {
          walletsByNetwork[network].push(trader.address);
        }
      });
    });
    
    // Process each network
    for (const [network, wallets] of Object.entries(walletsByNetwork)) {
      console.log(`\n🔍 Processing network: ${network} with ${wallets.length} unique wallets`);
      
      // Create a network-specific directory
      const networkDir = path.join(holdingsDir, network);
      await ensureDirectoryExists(networkDir);
      
      // Process each wallet
      for (let i = 0; i < wallets.length; i++) {
        const address = wallets[i];
        
        // Format wallet file path based on network
        let walletFile;
        if (network === 'solana') {
          // Solana addresses don't need special handling for filenames
          walletFile = path.join(networkDir, `${address}.json`);
        } else {
          // Ethereum-like addresses
          walletFile = path.join(networkDir, `${address}.json`);
        }
        
        try {
          // Check if we already have data for this wallet
          let existingData: WalletHoldings | null = null;
          
          try {
            const fileData = await fs.readFile(walletFile, 'utf-8');
            existingData = JSON.parse(fileData);
          } catch (err) {
            // File doesn't exist or can't be read, continue with fetching
          }
          
          // If data exists and is less than 24 hours old, skip
          const now = new Date();
          if (existingData && new Date(existingData.last_updated).getTime() > now.getTime() - 24 * 60 * 60 * 1000) {
            console.log(`⏩ Skipping wallet ${address} - data is less than 24 hours old`);
            continue;
          }
          
          // Fetch wallet holdings
          console.log(`🔍 Fetching holdings for wallet ${address} on ${network} (${i + 1}/${wallets.length})`);
          const holdings = await fetchWithRetry(
            () => fetchWalletHoldings(network, address),
            `Fetching holdings for ${address}`
          );
          
          // Calculate total value
          const total_value_usd = holdings.reduce((total, holding) => total + holding.value_usd, 0);
          
          // Create wallet holdings object
          const walletHoldings: WalletHoldings = {
            address,
            network,
            holdings,
            total_value_usd,
            last_updated: now.toISOString()
          };
          
          // Save to file
          await fs.writeFile(walletFile, JSON.stringify(walletHoldings, null, 2));
          console.log(`💾 Saved holdings for wallet ${address}`);
          
          // Respect rate limits
          await delay(RATE_LIMIT_DELAY);
        } catch (err) {
          console.warn(`⚠️ Failed to process wallet ${address}:`, err);
          // Continue with next wallet
        }
      }
      
      console.log(`✅ Completed processing ${wallets.length} wallets for network ${network}`);
    }
    
    console.log('\n✨ Indexing complete!');
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

// Start the indexing process
console.log('🚀 Starting wallet holdings indexer...');
indexWalletHoldings().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
