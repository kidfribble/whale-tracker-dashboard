// components/PoolSelector.tsx
import React from 'react';

type WhalePool = {
  network: string;
  name: string;
  address: string;
};

type Props = {
  pools: WhalePool[];
  selectedPool: string;
  onChange: (poolAddress: string) => void;
};

const PoolSelector: React.FC<Props> = ({ pools, selectedPool, onChange }) => (
  <select
    className="p-2 border rounded"
    value={selectedPool}
    onChange={(e) => onChange(e.target.value)}
  >
    {pools.map((pool) => (
      <option
        key={pool.address}
        value={pool.address}
      >
        {pool.name}
      </option>
    ))}
  </select>
);

export default PoolSelector;