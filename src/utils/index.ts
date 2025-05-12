import { CHAIN_SHORT_NAMES } from 'src/constants';
import { z } from 'zod';

export const stringUtils = {
  arrayToCommaString: (array: any[]) => array.join(','),
  commaStringToArray: (array: string) => array.split(',').map(item => item.trim()),
};
``;
export const chainIdToShortName = (chainId: number): string | undefined => {
  return Object.entries(CHAIN_SHORT_NAMES).find(([_, id]) => id === chainId)?.[0];
};

/**
 ```
 "ETH" => 1
 "eth" => 1
 "1" => 1
 foobar = undefined
 ```
*/
export function resolveChainIdOrShortName(chainIdOrShortName: string): number | undefined {
  if (isValidNumber(chainIdOrShortName)) {
    return Number(chainIdOrShortName);
  } else {
    const key = chainIdOrShortName.toLowerCase();

    if (key in CHAIN_SHORT_NAMES) {
      return CHAIN_SHORT_NAMES[key as keyof typeof CHAIN_SHORT_NAMES];
    }

    return undefined;
  }
}

export const isValidNumber = (value?: any): boolean => {
  return z.number().safeParse(value).success;
};
