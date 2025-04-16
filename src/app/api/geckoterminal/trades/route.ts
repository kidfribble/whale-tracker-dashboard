import { NextRequest, NextResponse } from 'next/server';
import { fetchTrades } from '@/lib/api';
import { readFile } from 'fs/promises';
import path from 'path';

// Define WhaleTrader type
type WhaleTrader = {
  address: string;
  totalVolume: number;
  tradeCount: number;
  lastTradeTimestamp: string;
};

// Define WhalePool type
type WhalePool = {
  network: string;
  name: string;
  address: string;
  whaleTraders: WhaleTrader[];
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get('network');
    const pool = searchParams.get('pool');
    const whaleAddress = searchParams.get('whaleAddress');

    // Validate required parameters
    if (!network || !pool) {
      return NextResponse.json(
        { error: 'Missing required parameters. Both network and pool must be provided.' },
        { status: 400 }
      );
    }

    // Fetch trades from GeckoTerminal
    const trades = await fetchTrades(network, pool);

    // If whaleAddress is provided, filter trades by that address
    if (whaleAddress) {
      const filteredTrades = trades.filter(
        (trade: any) => trade.attributes?.tx_from_address?.toLowerCase() === whaleAddress.toLowerCase()
      );
      return NextResponse.json(filteredTrades);
    }

    // Return all trades if no whale address filter
    return NextResponse.json(trades);
  } catch (error: any) {
    // Log the error for debugging
    console.error('Error fetching trades:', error);
    
    // Return appropriate error response
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to fetch trades';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
