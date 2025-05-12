import { arbitrum, base, gnosis, mainnet, optimism, polygon } from 'viem/chains';

export const SUPPORTED_CHAINS = [mainnet, polygon, arbitrum, optimism, gnosis, base] as const;

export const CHAIN_SHORT_NAMES = {
  eth: mainnet.id,
  oeth: optimism.id,
  op: optimism.id,
  pol: polygon.id,
  gno: gnosis.id,
  arb1: arbitrum.id,
  base: base.id,
} as const;
