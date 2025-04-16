// scripts/index-whale-pools.ts

import { fetchNetworks, fetchPoolsByNetwork, fetchTrades } from '../lib/api';
import fs from 'fs/promises';
import path from 'path';

const RATE_LIMIT_DELAY = 2000; // 2s = 30 calls/minute
const POOL_LIMIT = 30;
const MIN_WHALE_VOLUME = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Trade = {
    attributes: {
      volume_in_usd: string;
      block_timestamp: string;
      kind: string;
      tx_from_address: string;
    };
};

// Define a whale trader type
type WhaleTrader = {
  address: string;
  totalVolume: number;
  tradeCount: number;
  lastTradeTimestamp: string;
};

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    if (retryCount < MAX_RETRIES && (
      err.code === 'ECONNRESET' || 
      err.code === 'ETIMEDOUT' ||
      err.response?.status === 429
    )) {
      const waitTime = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`🔄 ${operationName}: Retry ${retryCount + 1}/${MAX_RETRIES} after error: ${err.code || err.response?.status}`);
      console.log(`⏳ Waiting ${waitTime/1000} seconds before retry...`);
      await delay(waitTime);
      return fetchWithRetry(operation, operationName, retryCount + 1);
    }
    throw err;
  }
}

async function indexWhalePools() {
  const whalePools: {
    network: string;
    name: string;
    address: string;
    whaleTraders: WhaleTrader[];
  }[] = [];

  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'src', 'data');
    await ensureDirectoryExists(dataDir);

    // Fetch networks with retry
    const networks = await fetchWithRetry(
      () => fetchNetworks(),
      'Fetching networks'
    );
    console.log(`📊 Found ${networks.length} networks to process`);

    for (const network of networks) {
      const networkId = network.id;
      console.log(`\n🔍 Processing network: ${networkId}`);

      try {
        // Fetch pools with retry
        const pools = await fetchWithRetry(
          () => fetchPoolsByNetwork(networkId),
          `Fetching pools for ${networkId}`
        );
        const topPools = pools.slice(0, POOL_LIMIT);
        console.log(`📊 Found ${topPools.length} pools to check in ${networkId}`);

        for (const pool of topPools) {
          const poolName = pool.attributes.name;
          const poolAddress = pool.attributes.address;

          try {
            // Fetch trades with retry
            const trades = await fetchWithRetry(
              () => fetchTrades(networkId, poolAddress),
              `Fetching trades for ${poolName}`
            ) as Trade[];
            
            // Track whale traders by address
            const whaleTraders: Map<string, WhaleTrader> = new Map();
            
            // Process trades to identify whale traders
            trades.forEach((t: Trade) => {
              const volume = parseFloat(t.attributes.volume_in_usd);
              const address = t.attributes.tx_from_address;
              
              if (volume > MIN_WHALE_VOLUME && address) {
                if (whaleTraders.has(address)) {
                  const trader = whaleTraders.get(address)!;
                  trader.totalVolume += volume;
                  trader.tradeCount += 1;
                  trader.lastTradeTimestamp = t.attributes.block_timestamp;
                } else {
                  whaleTraders.set(address, {
                    address,
                    totalVolume: volume,
                    tradeCount: 1,
                    lastTradeTimestamp: t.attributes.block_timestamp
                  });
                }
              }
            });
            
            const hasWhales = whaleTraders.size > 0;

            if (hasWhales) {
              // Convert Map to array and sort by total volume
              const sortedWhaleTraders = Array.from(whaleTraders.values())
                .sort((a, b) => b.totalVolume - a.totalVolume);
              
              whalePools.push({
                network: networkId,
                name: poolName,
                address: poolAddress,
                whaleTraders: sortedWhaleTraders
              });
              console.log(`✅ Whale pool found: ${networkId} - ${poolName} with ${whaleTraders.size} whale traders`);
            } else {
              console.log(`⏩ No whales in pool: ${networkId} - ${poolName}`);
            }
          } catch (err) {
            console.warn(`⚠️ Failed to process pool ${poolName} after all retries:`, err);
            // Continue with next pool
          }

          // Always wait between requests to respect rate limits
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (err) {
        console.error(`❌ Failed to process network ${networkId}:`, err);
        // Continue with next network
      }

      // Save progress after each network
      const outputPath = path.join(dataDir, 'whalePools.json');
      await fs.writeFile(outputPath, JSON.stringify(whalePools, null, 2));
      console.log(`💾 Progress saved: ${whalePools.length} whale pools found so far`);
    }

    // Final save
    const outputPath = path.join(dataDir, 'whalePools.json');
    await fs.writeFile(outputPath, JSON.stringify(whalePools, null, 2));
    console.log(`\n✨ Indexing complete! Stored ${whalePools.length} whale pools to ${outputPath}`);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

// Start the indexing process
console.log('🚀 Starting whale pool indexer...');
indexWhalePools().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
