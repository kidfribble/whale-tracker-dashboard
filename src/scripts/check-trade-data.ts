// scripts/check-trade-data.ts

import { fetchTrades } from '../lib/api';

async function checkTradeData() {
  try {
    // Use a known network and pool address
    const network = 'eth';
    const poolAddress = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'; // USDC-ETH pool on Uniswap v3
    
    console.log(`Fetching trades for network: ${network}, pool: ${poolAddress}`);
    
    const trades = await fetchTrades(network, poolAddress);
    
    if (trades && trades.length > 0) {
      console.log('Sample trade data structure:');
      console.log(JSON.stringify(trades[0], null, 2));
      
      // Check if wallet address is included
      const hasWalletAddress = JSON.stringify(trades[0]).includes('wallet') || 
                              JSON.stringify(trades[0]).includes('address') ||
                              JSON.stringify(trades[0]).includes('account');
      
      console.log(`\nDoes the trade data include wallet address? ${hasWalletAddress}`);
      
      // Log all available attributes
      console.log('\nAvailable attributes in trade data:');
      if (trades[0].attributes) {
        Object.keys(trades[0].attributes).forEach(key => {
          console.log(`- ${key}: ${typeof trades[0].attributes[key]}`);
        });
      }
    } else {
      console.log('No trades found for this pool');
    }
  } catch (error) {
    console.error('Error fetching trade data:', error);
  }
}

// Run the function
checkTradeData();
