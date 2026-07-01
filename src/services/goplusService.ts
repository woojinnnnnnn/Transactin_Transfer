const GOPLUS_SUPPORTED_CHAINS: Record<number, string> = {
  1: '1',
  8453: '8453',
  42161: '42161',
};

type GoPlusTokenFlags = {
  is_honeypot?: string;
  is_blacklisted?: string;
  cannot_sell_all?: string;
  buy_tax?: string;
  sell_tax?: string;
  is_open_source?: string;
};

type GoPlusResponse = {
  code: number;
  result: Record<string, GoPlusTokenFlags>;
};

export type TokenSecurityFlags = {
  isHoneypot: boolean;
  isBlacklisted: boolean;
  cannotSell: boolean;
  hasHighTax: boolean;
  isClosedSource: boolean;
};

type GoPlusAddressSecurityFlags = {
  cybercrime?: string;
  money_laundering?: string;
  financial_crime?: string;
  darkweb_transactions?: string;
  phishing_activities?: string;
  blackmail_activities?: string;
  stealing_attack?: string;
  fake_kyc?: string;
  blacklist_doubt?: string;
  malicious_mining_activities?: string;
  mixer?: string;
  sanctioned?: string;
  honeypot_related_address?: string;
};

type GoPlusAddressSecurityResponse = {
  code: number;
  result?: GoPlusAddressSecurityFlags;
};

export type AddressSecurityFlags = {
  isMalicious: boolean;
  reasons: string[];
};

const ADDRESS_SECURITY_LABELS: Record<keyof GoPlusAddressSecurityFlags, string> = {
  cybercrime: 'linked to cybercrime',
  money_laundering: 'linked to money laundering',
  financial_crime: 'linked to financial crime',
  darkweb_transactions: 'linked to dark web transactions',
  phishing_activities: 'linked to phishing activity',
  blackmail_activities: 'linked to blackmail activity',
  stealing_attack: 'linked to theft/drainer activity',
  fake_kyc: 'linked to fake KYC activity',
  blacklist_doubt: 'flagged as a suspected blacklisted address',
  malicious_mining_activities: 'linked to malicious mining activity',
  mixer: 'a known mixer/tumbler address',
  sanctioned: 'a sanctioned address',
  honeypot_related_address: 'linked to honeypot scams',
};

/**
 * GoPlus address_security has no batch endpoint, so each address is fetched
 * individually; each request carries its own timeout so one slow lookup
 * can't block the rest.
 */
export async function fetchAddressSecurity(
  addresses: string[],
): Promise<Map<string, AddressSecurityFlags>> {
  const uniqueAddresses = [...new Set(addresses.map((a) => a.toLowerCase()))];
  const result = new Map<string, AddressSecurityFlags>();

  if (uniqueAddresses.length === 0) {
    return result;
  }

  await Promise.all(
    uniqueAddresses.map(async (address) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(
          `https://api.gopluslabs.io/api/v1/address_security/${address}`,
          { signal: controller.signal },
        );

        if (!response.ok) return;

        const data = (await response.json()) as GoPlusAddressSecurityResponse;
        if (data.code !== 1 || !data.result) return;

        const reasons = (
          Object.keys(ADDRESS_SECURITY_LABELS) as Array<keyof GoPlusAddressSecurityFlags>
        )
          .filter((key) => data.result?.[key] === '1')
          .map((key) => ADDRESS_SECURITY_LABELS[key]);

        if (reasons.length > 0) {
          result.set(address, { isMalicious: true, reasons });
        }
      } catch {
        // ignore — leave address unflagged on error/timeout
      } finally {
        window.clearTimeout(timeoutId);
      }
    }),
  );

  return result;
}

export async function fetchTokenSecurity(
  chainId: number,
  contractAddresses: string[],
): Promise<Map<string, TokenSecurityFlags>> {
  const goplusChainId = GOPLUS_SUPPORTED_CHAINS[chainId];

  if (!goplusChainId || contractAddresses.length === 0) {
    return new Map();
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);

  try {
    const addresses = contractAddresses.map((a) => a.toLowerCase()).join(',');
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${goplusChainId}?contract_addresses=${addresses}`,
      { signal: controller.signal },
    );

    if (!response.ok) return new Map();

    const data = (await response.json()) as GoPlusResponse;

    if (data.code !== 1 || !data.result) return new Map();

    const result = new Map<string, TokenSecurityFlags>();

    for (const [address, flags] of Object.entries(data.result)) {
      result.set(address.toLowerCase(), {
        isHoneypot: flags.is_honeypot === '1',
        isBlacklisted: flags.is_blacklisted === '1',
        cannotSell: flags.cannot_sell_all === '1',
        hasHighTax:
          Number(flags.sell_tax ?? '0') > 0.1 ||
          Number(flags.buy_tax ?? '0') > 0.1,
        isClosedSource: flags.is_open_source === '0',
      });
    }

    return result;
  } catch {
    return new Map();
  } finally {
    window.clearTimeout(timeoutId);
  }
}
