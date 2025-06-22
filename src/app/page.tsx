'use client';

import { useEffect, useState } from 'react';
import NetworkSelector from '@/components/NetworkSelector';
import PoolSelector from '@/components/PoolSelector';
import WhaleTraderSelector from '@/components/WhaleTraderSelector';
import TradeCardSkeleton from '@/components/TradeCardSkeleton';
import Shimmer from '@/components/Shimmer';
import WalletHoldingsModal from '@/components/WalletHoldingsModal';

type Network = {
  id: string;
  attributes: {
    name: string;
  };
};

type WhaleTrader = {
  address: string;
  totalVolume: number;
  tradeCount: number;
  lastTradeTimestamp: string;
};

type WhalePool = {
  network: string;
  name: string;
  address: string;
  whaleTraders: WhaleTrader[];
};

type Trade = {
  attributes: {
    volume_in_usd: string;
    block_timestamp: string;
    kind: string;
    tx_from_address: string;
  };
  id?: string;
  type?: string;
};

export default function Dashboard() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('eth');
  const [pools, setPools] = useState<WhalePool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [selectedWhaleTrader, setSelectedWhaleTrader] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState<boolean>(false);
  const [isLoadingPools, setIsLoadingPools] = useState<boolean>(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>('');

  // Load available networks
  useEffect(() => {
    const loadNetworks = async () => {
      setIsLoadingNetworks(true);
      try {
        const res = await fetch('/api/whale-pools');
        const data: WhalePool[] = await res.json();

        const uniqueNetworks = Array.from(
          new Set(data.map((p) => p.network))
        ).map((id) => ({ id, attributes: { name: id } }));

        setNetworks(uniqueNetworks);
        if (!selectedNetwork && uniqueNetworks.length > 0) {
          setSelectedNetwork(uniqueNetworks[0].id);
        }
      } catch (error) {
        console.error('Failed to load networks from API', error);
      } finally {
        setIsLoadingNetworks(false);
      }
    };

    loadNetworks();
  }, [selectedNetwork]);

  // Load pools for selected network
  useEffect(() => {
    const loadPools = async () => {
      setIsLoadingPools(true);
      try {
        const res = await fetch('/api/whale-pools');
        const allPools: WhalePool[] = await res.json();

        const filtered = allPools.filter((p) => p.network === selectedNetwork);
        setPools(filtered);

        // Only set selected pool if we have pools and current selection is invalid
        if (filtered.length > 0 && !filtered.some(p => p.address === selectedPool)) {
          setSelectedPool(filtered[0].address);
        } else if (filtered.length === 0) {
          // Clear selected pool if no pools available
          setSelectedPool('');
        }
      } catch (error) {
        console.error('Failed to load pools', error);
        setPools([]);
        setSelectedPool('');
      } finally {
        setIsLoadingPools(false);
      }
    };

    if (selectedNetwork) loadPools();
  }, [selectedNetwork, selectedPool]);

  // Load trades for selected pool
  useEffect(() => {
    const loadTrades = async () => {
      // Clear any existing error first
      setError(null);
      
      // Only proceed if we have both network and pool
      if (!selectedNetwork || !selectedPool || !pools.length) {
        setTrades([]);
        return;
      }

      setIsLoadingTrades(true);
      try {
        // Build the API URL with optional whale address filter
        let apiUrl = `/api/geckoterminal/trades?network=${selectedNetwork}&pool=${selectedPool}`;
        if (selectedWhaleTrader) {
          apiUrl += `&whaleAddress=${selectedWhaleTrader}`;
        }
        
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const responseData = await res.json();
        // Check if the response has the expected structure
        if (!responseData || !Array.isArray(responseData)) {
          console.error('Unexpected response format:', responseData);
          setTrades([]);
          setError('Invalid response format from API');
          return;
        }

        // Safely filter and sort trades with null checks
        const sorted = responseData
          .filter((t: Trade) => {
            // Safely check if the trade has the required attributes
            if (!t?.attributes?.volume_in_usd) return false;
            const volume = parseFloat(t.attributes.volume_in_usd);
            return !isNaN(volume) && volume > 10000;
          })
          .sort((a: Trade, b: Trade) => {
            const volumeA = parseFloat(a.attributes?.volume_in_usd || '0') || 0;
            const volumeB = parseFloat(b.attributes?.volume_in_usd || '0') || 0;
            return volumeB - volumeA;
          });

        setTrades(sorted);
        
        // Only show error if no trades were found
        if (sorted.length === 0) {
          setError('No whale trades found for this pool.');
        } else {
          setError(null);
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        setTrades([]);
        setError(error instanceof Error ? error.message : 'Failed to fetch trades');
      } finally {
        setIsLoadingTrades(false);
      }
    };

    loadTrades();
  }, [selectedNetwork, selectedPool, selectedWhaleTrader, pools]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">🐋 Whale Trades Dashboard</h1>

      <div>
        <label className="font-semibold mr-2">Select Network:</label>
        {isLoadingNetworks ? (
          <Shimmer className="w-32 h-10 rounded" />
        ) : (
          <NetworkSelector
            networks={networks}
            selectedNetwork={selectedNetwork}
            onChange={setSelectedNetwork}
          />
        )}
      </div>

      <div>
        <label className="font-semibold mr-2">Select Pool:</label>
        {isLoadingPools ? (
          <Shimmer className="w-64 h-10 rounded" />
        ) : (
          <PoolSelector
            pools={pools}
            selectedPool={selectedPool}
            onChange={(pool) => {
              setSelectedPool(pool);
              setSelectedWhaleTrader(''); // Reset whale trader when pool changes
            }}
          />
        )}
      </div>

      <div>
        <label className="font-semibold mr-2">Select Whale Trader:</label>
        {isLoadingPools || isLoadingTrades ? (
          <Shimmer className="w-64 h-10 rounded" />
        ) : (
          <WhaleTraderSelector
            whaleTraders={pools.find(p => p.address === selectedPool)?.whaleTraders || []}
            selectedWhaleTrader={selectedWhaleTrader}
            onChange={setSelectedWhaleTrader}
          />
        )}
      </div>

      {error ? (
        <p className="text-red-600">{error}</p>
      ) : isLoadingTrades ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <TradeCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {trades.map((trade, i) => (
            <li key={i} className="border p-4 rounded shadow bg-white text-black">
              <div><strong>Type:</strong> {trade.attributes.kind}</div>
              <div><strong>Amount:</strong> ${parseFloat(trade.attributes.volume_in_usd).toFixed(2)}</div>
              <div><strong>Time:</strong> {new Date(trade.attributes.block_timestamp).toLocaleString()}</div>
              <div className="mt-2">
                <strong>Wallet:</strong> 
                <button 
                  onClick={() => {
                    setSelectedWalletAddress(trade.attributes.tx_from_address);
                    setModalOpen(true);
                  }}
                  className="font-mono text-sm break-all text-blue-600 hover:text-blue-800 hover:underline text-left"
                >
                  {trade.attributes.tx_from_address}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Wallet Holdings Modal */}
      <WalletHoldingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        walletAddress={selectedWalletAddress}
        network={selectedNetwork}
      />
    </main>
  );
}
