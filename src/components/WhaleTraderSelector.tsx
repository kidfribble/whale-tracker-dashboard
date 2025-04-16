import React from 'react';

type WhaleTrader = {
  address: string;
  totalVolume: number;
  tradeCount: number;
  lastTradeTimestamp: string;
};

type WhaleTraderSelectorProps = {
  whaleTraders: WhaleTrader[];
  selectedWhaleTrader: string;
  onChange: (address: string) => void;
};

export default function WhaleTraderSelector({
  whaleTraders,
  selectedWhaleTrader,
  onChange,
}: WhaleTraderSelectorProps) {
  if (!whaleTraders || whaleTraders.length === 0) {
    return <div className="text-gray-500 italic">No whale traders found for this pool</div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <select
        className="p-2 border rounded bg-white text-black"
        value={selectedWhaleTrader}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Whale Traders</option>
        {whaleTraders.map((trader) => (
          <option key={trader.address} value={trader.address}>
            {`${trader.address.substring(0, 6)}...${trader.address.substring(
              trader.address.length - 4
            )} (${trader.tradeCount} trades, $${trader.totalVolume.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })})`}
          </option>
        ))}
      </select>
      
      {selectedWhaleTrader && (
        <div className="text-sm bg-blue-100 text-blue-800 p-2 rounded">
          <div className="font-bold">Selected Whale:</div>
          <div className="font-mono break-all">{selectedWhaleTrader}</div>
          <div className="mt-1">
            {whaleTraders.find(t => t.address === selectedWhaleTrader)?.tradeCount} trades | 
            ${whaleTraders.find(t => t.address === selectedWhaleTrader)?.totalVolume.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })} total volume
          </div>
        </div>
      )}
    </div>
  );
}
