import React, { useEffect, useState } from 'react';

type TokenHolding = {
  token: string;
  symbol: string;
  quantity: number;
  value_usd: number;
};

type WalletHoldings = {
  address: string;
  holdings: TokenHolding[];
  total_value_usd: number;
  no_cached_data?: boolean;
  message?: string;
};

type WalletHoldingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  network: string;
};

export default function WalletHoldingsModal({
  isOpen,
  onClose,
  walletAddress,
  network,
}: WalletHoldingsModalProps) {
  const [holdings, setHoldings] = useState<WalletHoldings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!isOpen || !walletAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/wallet-holdings?network=${network}&address=${walletAddress}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setHoldings(data);
      } catch (error) {
        console.error('Failed to fetch wallet holdings:', error);
        setError('Failed to fetch wallet holdings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [isOpen, walletAddress, network]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Wallet Holdings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Wallet Address:</h3>
          <p className="font-mono text-sm break-all">{walletAddress}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : holdings ? (
          holdings.no_cached_data ? (
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <div className="text-3xl mb-4">📂</div>
              <h3 className="font-semibold text-lg mb-2">No Cached Data Available</h3>
              <p className="text-gray-600 mb-4">{holdings.message || "Please run the indexer to generate wallet holdings data."}</p>
              <div className="text-sm text-gray-500">
                <code className="bg-gray-200 p-1 rounded">npx ts-node -P tsconfig.scripts.json src/scripts/index-wallet-holdings.ts</code>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold">Total Value:</h3>
                <p className="text-lg">${holdings.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>

              <h3 className="font-semibold mb-2">Token Holdings:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Token</th>
                      <th className="py-2 px-4 text-left">Symbol</th>
                      <th className="py-2 px-4 text-right">Quantity</th>
                      <th className="py-2 px-4 text-right">Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.holdings.map((holding, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{holding.token}</td>
                        <td className="py-2 px-4">{holding.symbol}</td>
                        <td className="py-2 px-4 text-right">
                          {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </td>
                        <td className="py-2 px-4 text-right">
                          ${holding.value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 p-4">No holdings data available</div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
