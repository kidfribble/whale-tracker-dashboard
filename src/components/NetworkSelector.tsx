// components/NetworkSelector.tsx
import React from 'react';

type Network = {
  id: string;
  attributes: {
    name: string;
  };
};

type Props = {
  networks: Network[];
  selectedNetwork: string;
  onChange: (networkId: string) => void;
};

const NetworkSelector: React.FC<Props> = ({ networks, selectedNetwork, onChange }) => (
  <select
    className="p-2 border rounded"
    value={selectedNetwork}
    onChange={(e) => onChange(e.target.value)}
  >
    {networks.map((network) => (
      <option key={network.id} value={network.id}>
        {network.attributes.name}
      </option>
    ))}
  </select>
);

export default NetworkSelector;