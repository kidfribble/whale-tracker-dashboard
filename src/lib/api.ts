import axios from 'axios';

const GECKO_TERMINAL_BASE = 'https://api.geckoterminal.com/api/v2';

export const fetchNetworks = async () => {
  const res = await axios.get(`${GECKO_TERMINAL_BASE}/networks`);
  return res.data.data;
};

export const fetchTrades = async (network: string, poolAddress: string) => {
  const res = await axios.get(
    `${GECKO_TERMINAL_BASE}/networks/${network}/pools/${poolAddress}/trades`
  );
  return res.data.data;
};

export const fetchPoolsByNetwork = async (network: string) => {
    const res = await axios.get(`${GECKO_TERMINAL_BASE}/networks/${network}/pools`);
    return res.data.data;
  }
