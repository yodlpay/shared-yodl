import { convertPreferencesToText } from '@/validation/preferences.validation';

import { PreferencesSchema } from '@/validation/preferences.validation';

const CONFIG = {
  tokens: ['USDC', 'USDT'],
  chains: [1, 137],
  webhooks: ['https://example.com/webhook1', 'https://example.com/webhook2'],
};

describe('Validation exports', () => {
  it('should export PreferencesSchema', () => {
    expect(PreferencesSchema).toBeDefined();
  });

  it('should export convertPreferencesToText', () => {
    expect(convertPreferencesToText).toBeDefined();
  });

  it('should validate basic preferences', () => {
    const result = PreferencesSchema.parse(CONFIG);
    expect(result).toHaveProperty('tokenSymbols');
    expect(result).toHaveProperty('chainIds');
    expect(result.tokenSymbols).toEqual(['USDC', 'USDT']);
    expect(result.chainIds).toEqual([1, 137]);
  });

  it('should handle JSON input', () => {
    const input = JSON.stringify(CONFIG);

    const result = PreferencesSchema.parse(input);
    expect(result).toHaveProperty('tokenSymbols');
    expect(result).toHaveProperty('chainIds');
    expect(result.tokenSymbols).toEqual(['USDC', 'USDT']);
    expect(result.chainIds).toEqual([1, 137]);
  });

  it('should handle webhooks', () => {
    const input = JSON.stringify(CONFIG);

    const result = PreferencesSchema.parse(input);
    expect(result).toHaveProperty('webhooks');
    expect(result.webhooks).toEqual([
      'https://example.com/webhook1',
      'https://example.com/webhook2',
    ]);
  });

  it('should reject invalid URLs in webhooks', () => {
    const invalidConfig = {
      ...CONFIG,
      webhooks: ['http://example.com/webhook', 'ftp://example.com/webhook'],
    };

    expect(() => {
      PreferencesSchema.parse(invalidConfig);
    }).toThrow();
  });

  it('should accept only secure URLs in webhooks', () => {
    const secureConfig = {
      ...CONFIG,
      webhooks: ['https://example.com/webhook1', 'https://api.service.com/hook'],
    };

    const result = PreferencesSchema.parse(secureConfig);
    expect(result.webhooks).toEqual([
      'https://example.com/webhook1',
      'https://api.service.com/hook',
    ]);
  });

  it('should reject non-secure URLs in redirectUrl', () => {
    const invalidConfig = {
      ...CONFIG,
      redirectUrl: 'http://example.com/redirect',
    };

    expect(() => {
      PreferencesSchema.parse(invalidConfig);
    }).toThrow();
  });
});
