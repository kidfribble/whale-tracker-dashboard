import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get('network');
    const address = searchParams.get('address');

    // Validate required parameters
    if (!network || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters. Both network and address must be provided.' },
        { status: 400 }
      );
    }

    try {
      // Path to the cached wallet holdings data
      const holdingsDir = path.join(process.cwd(), 'src', 'data', 'wallet-holdings', network);
      
      // Ensure the directory exists
      try {
        await fs.mkdir(holdingsDir, { recursive: true });
      } catch (err) {
        console.log(`Error creating directory for network ${network}: ${err}`);
      }
      
      // Format the wallet file path - handle different address formats for different networks
      let walletFile;
      if (network === 'solana') {
        // Solana addresses don't need special handling for filenames
        walletFile = path.join(holdingsDir, `${address}.json`);
      } else {
        // Ethereum-like addresses
        walletFile = path.join(holdingsDir, `${address}.json`);
      }
      
      try {
        // Try to read the cached data
        const fileData = await fs.readFile(walletFile, 'utf-8');
        const walletHoldings: WalletHoldings = JSON.parse(fileData);
        
        // Check if data is stale (older than 24 hours)
        const now = new Date();
        const lastUpdated = new Date(walletHoldings.last_updated);
        const isStale = now.getTime() - lastUpdated.getTime() > 24 * 60 * 60 * 1000;
        
        if (isStale) {
          console.log(`Wallet data for ${address} is stale. Consider running the indexer.`);
        }
        
        // Return the cached data
        return NextResponse.json({
          address: walletHoldings.address,
          holdings: walletHoldings.holdings,
          total_value_usd: walletHoldings.total_value_usd
        });
      } catch (err) {
        // If file doesn't exist or can't be read, return no cached data message
        console.log(`No cached data found for wallet ${address} on ${network}.`);
        
        return NextResponse.json({
          address,
          holdings: [],
          total_value_usd: 0,
          no_cached_data: true,
          message: "No cached data available for this wallet. Please run the indexer to generate data."
        });
      }
    } catch (apiError) {
      console.error('Error fetching wallet holdings:', apiError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet holdings' },
        { status: 502 }
      );
    }
  } catch (error) {
    // Log the error for debugging
    console.error('Error processing wallet holdings request:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
