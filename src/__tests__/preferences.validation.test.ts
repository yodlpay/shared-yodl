import { PreferencesSchema } from '../validation/preferences.validation';

describe('PreferencesSchema', () => {
  it('should validate preferences with tokens and chains', () => {
    const input = {
      tokens: ['USDC', 'USDT', 'USDGLO'],
      chains: [8453, 137, 10],
    };

    const result = PreferencesSchema.parse(input);

    // Check that the result contains the expected structure
    expect(result).toHaveProperty('tokenSymbols');
    expect(result).toHaveProperty('chainIds');

    // Verify the token symbols are preserved
    expect(result.tokenSymbols).toEqual(['USDC', 'USDT', 'USDGLO']);

    // Verify the chain IDs are preserved
    expect(result.chainIds).toEqual([8453, 137, 10]);
  });

  it('should handle string input for tokens and chains', () => {
    const input = {
      tokens: 'USDC,USDT,USDGLO',
      chains: '8453,137,10',
    };

    const result = PreferencesSchema.parse(input);

    // Check that the result contains the expected structure
    expect(result).toHaveProperty('tokenSymbols');
    expect(result).toHaveProperty('chainIds');

    // Verify the token symbols are parsed correctly
    expect(result.tokenSymbols).toEqual(['USDC', 'USDT', 'USDGLO']);

    // Verify the chain IDs are parsed correctly
    expect(result.chainIds).toEqual([8453, 137, 10]);
  });

  it('should handle JSON string input', () => {
    const input = JSON.stringify({
      tokens: ['USDC', 'USDT', 'USDGLO'],
      chains: [8453, 137, 10],
    });

    const result = PreferencesSchema.parse(input);

    // Check that the result contains the expected structure
    expect(result).toHaveProperty('tokenSymbols');
    expect(result).toHaveProperty('chainIds');

    // Verify the token symbols are preserved
    expect(result.tokenSymbols).toEqual(['USDC', 'USDT', 'USDGLO']);

    // Verify the chain IDs are preserved
    expect(result.chainIds).toEqual([8453, 137, 10]);
  });
});
