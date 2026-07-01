import type { NormalizedTransaction } from '../types/activity';

const CHAIN_PLATFORM_IDS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum-one',
};

const NATIVE_SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  ETH: 'ethereum',
  'Sepolia ETH': 'ethereum',
  POL: 'matic-network',
  MATIC: 'matic-network',
  WETH: 'weth',
};

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), 5000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
}

export async function fetchUsdPrices(
  chainId: number,
  transactions: NormalizedTransaction[],
): Promise<Map<string, number>> {
  const platformId = CHAIN_PLATFORM_IDS[chainId];

  const priceMap = new Map<string, number>();
  const nativeSymbols = new Set<string>();
  const contractAddresses = new Set<string>();

  for (const tx of transactions) {
    if (tx.type !== 'sent' && tx.type !== 'received') continue;
    if (tx.tokenContractAddress) {
      contractAddresses.add(tx.tokenContractAddress.toLowerCase());
    } else if (NATIVE_SYMBOL_TO_COINGECKO_ID[tx.asset]) {
      nativeSymbols.add(tx.asset);
    }
  }

  const fetches: Promise<void>[] = [];

  if (nativeSymbols.size > 0) {
    const ids = [...nativeSymbols]
      .map((s) => NATIVE_SYMBOL_TO_COINGECKO_ID[s])
      .join(',');

    fetches.push(
      fetchWithTimeout(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      )
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as Record<string, { usd?: number }>;
          for (const symbol of nativeSymbols) {
            const price = data[NATIVE_SYMBOL_TO_COINGECKO_ID[symbol]]?.usd;
            if (price !== undefined) priceMap.set(symbol, price);
          }
        })
        .catch(() => {}),
    );
  }

  if (platformId && contractAddresses.size > 0) {
    const addresses = [...contractAddresses].join(',');
    fetches.push(
      fetchWithTimeout(
        `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addresses}&vs_currencies=usd`,
      )
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as Record<string, { usd?: number }>;
          for (const [address, prices] of Object.entries(data)) {
            if (prices.usd !== undefined) {
              priceMap.set(address.toLowerCase(), prices.usd);
            }
          }
        })
        .catch(() => {}),
    );
  }

  await Promise.all(fetches);
  return priceMap;
}

export function formatUsd(value: number): string {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '< $0.01';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
