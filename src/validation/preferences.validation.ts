import { z } from 'zod';
import { SUPPORTED_CHAINS } from '../constants';
import { chainIdToShortName, resolveChainIdOrShortName, stringUtils } from '../utils';

/**
 * Schema for validating token configurations.
 * Accepts either an array of token symbols (strings) or a comma-separated string of token symbols.
 * Preprocesses the input to always return an array of strings.
 *
 * @example
 * // Valid inputs:
 * ["token1", "token2"]
 * "token1,token2"
 *
 * // Output after preprocessing:
 * ["token1", "token2"]
 */
const TokenConfigSchema = z.preprocess(input => {
  // Handle comma-separated string or array
  if (typeof input === 'string') return stringUtils.commaStringToArray(input);
  return input;
}, z.array(z.string()));

/**
 * Schema for validating chain configurations.
 * Accepts various input types for specifying chains:
 * 1. Array of chain short names (strings): ["eth", "oeth"]
 * 2. Comma-separated string of chain short names: "eth,oeth"
 * 3. Array of chain IDs (numbers): [1, 10]
 * 4. Comma-separated string of chain IDs: "1,10"
 *
 * Preprocesses the input into an array of strings or numbers.
 * Transforms the array by:
 * - Resolving chain short names (strings) to their corresponding chain IDs using `resolveChainIdOrShortName`.
 * - Filtering out invalid or unsupported chain IDs (0, undefined, or not in `SUPPORTED_CHAINS`).
 * The final output is an array of valid, supported chain IDs (numbers).
 *
 * @example
 * // Valid inputs:
 * ["eth", "arb"]
 * "eth,arb"
 * [1, 42161]
 * "1,42161"
 * ["eth", 42161] // Mixed
 *
 * // Output after transformation (assuming eth=1, arb=42161 are supported):
 * [1, 42161]
 */
const ChainConfigSchema = z.preprocess(
  input => {
    // If already an array, use it directly
    if (Array.isArray(input)) return input;

    // If string, convert to array and try to parse numbers
    if (typeof input === 'string') {
      return stringUtils.commaStringToArray(input).map(item => {
        const num = Number(item);
        return isNaN(num) ? item : num;
      });
    }

    return input;
  },
  z.array(z.union([z.string(), z.number()])).transform(chains =>
    chains
      .map(chain => {
        if (typeof chain === 'string') {
          // Use resolveChainIdOrShortName from chains.ts
          return resolveChainIdOrShortName(chain);
        }
        return chain;
      })
      .filter(
        (id): id is (typeof SUPPORTED_CHAINS)[number]['id'] =>
          id !== 0 && id !== undefined && SUPPORTED_CHAINS.some(chain => chain.id === id)
      )
  )
);

/**
 * Converts a preferences object (typically after validation) into a text format suitable for storage,
 * often used for ENS text records. It formats chains and tokens as comma-separated strings
 * and converts chain IDs back to short names.
 *
 * @param preferences - The preferences object, expected to conform partially or fully to the `Preferences` type.
 *                      It should contain `chainIds` (array of numbers) and/or `tokenSymbols` (array of strings).
 * @returns A JSON string representation of the formatted preferences.
 *          Chain IDs are converted to short names and stored under the `chains` key.
 *          Token symbols are stored under the `tokens` key.
 *          Other properties from the input `preferences` object are included as is.
 *
 * @example
 * const prefs = { chainIds: [1, 10], tokenSymbols: ["ETH", "DAI"], redirectUrl: "https://example.com" };
 * convertPreferencesToText(prefs);
 * // Returns: '{"tokens":"ETH,DAI","chains":"eth,oeth","redirectUrl":"https://example.com"}'
 * // (Assuming chainIdToShortName(1) is 'eth' and chainIdToShortName(10) is 'oeth')
 */
export const convertPreferencesToText = (preferences: any) => {
  // Convert chain IDs to chain names using chainIdToShortName from chains.ts
  const processedChains = preferences.chainIds
    ?.map((chain: number) => chainIdToShortName(chain))
    .filter(Boolean);

  // Prepare preferences object
  const formattedPreferences: Record<string, any> = {
    tokens: preferences.tokenSymbols
      ? stringUtils.arrayToCommaString(preferences.tokenSymbols)
      : undefined,
    chains:
      processedChains && processedChains.length > 0
        ? stringUtils.arrayToCommaString(processedChains)
        : undefined,
  };

  // Add other properties
  for (const key in preferences) {
    if (key !== 'chainIds' && key !== 'tokenSymbols') {
      formattedPreferences[key] = preferences[key];
    }
  }

  // Remove undefined keys before stringifying
  Object.keys(formattedPreferences).forEach(key => {
    if (formattedPreferences[key] === undefined) {
      delete formattedPreferences[key];
    }
  });

  return JSON.stringify(formattedPreferences);
};

/**
 * The main schema for validating user or application preferences.
 *
 * Preprocessing:
 * - Attempts to parse the input if it's a JSON string. If parsing fails, it defaults to an empty object
 *   to allow validation to proceed (and likely fail gracefully on required fields if any).
 *
 * Schema Definition:
 * - Defines expected preference fields like `redirectUrl`, `currency`, `amount`, `webhooks`, and `og` settings.
 * - Includes support for both legacy (`chainIds`, `tokenSymbols`) and new (`chains`, `tokens`) ways of specifying
 *   chain and token preferences, utilizing `ChainConfigSchema` and `TokenConfigSchema` respectively.
 * - Uses `.catchall(z.unknown())` to allow any other arbitrary properties to exist without causing validation errors.
 *
 * Transformation:
 * - Merges the legacy and new chain/token fields:
 *   - `chains` takes precedence over `chainIds`. The result is stored in `chainIds`.
 *   - `tokens` takes precedence over `tokenSymbols`. The result is stored in `tokenSymbols`.
 * - Consolidates the data into a final structure containing `chainIds`, `tokenSymbols`, and other defined fields.
 * - Preserves any additional properties captured by `catchall`.
 *
 * The final output object will have a consistent structure with `chainIds` (array of numbers) and
 * `tokenSymbols` (array of strings), along with other validated preference fields and any extra properties.
 */
export const PreferencesSchema = z.preprocess(
  input => {
    try {
      // If input is a string, try to parse it as JSON
      if (typeof input === 'string' && input.trim() !== '') {
        return JSON.parse(input);
      }
      // If input is already an object or not a string, return as is
      return input;
    } catch (error) {
      console.error('Failed to parse preferences JSON:', error);
      // Return an empty object if parsing fails, allows schema validation to proceed
      // Zod will then report missing fields if they are required, or provide defaults/optionals.
      return {};
    }
  },
  z
    .object({
      // Legacy fields (still supported for backward compatibility)
      /** @deprecated Use `chains` instead. Array of chain IDs or comma-separated string of IDs/names. */
      chainIds: ChainConfigSchema.optional(),
      /** @deprecated Use `tokens` instead. Array of token symbols or comma-separated string. */
      tokenSymbols: TokenConfigSchema.optional(),

      // New fields (preferred way)
      /** Array of chain IDs/short names or a comma-separated string of IDs/short names. Validated and transformed into an array of supported chain IDs. */
      chains: ChainConfigSchema.optional(),
      /** Array of token symbols or a comma-separated string of symbols. Validated into an array of strings. */
      tokens: TokenConfigSchema.optional(),

      // Other optional fields
      /** A URL to redirect the user to after an action. Must be a valid URL. */
      redirectUrl: z.string().url().optional(),
      /** The preferred currency code (e.g., "USD", "EUR"). */
      currency: z.string().optional(),
      /** A default amount, must be a non-negative number. */
      amount: z.number().nonnegative().optional(),
      /** An array of URLs to send webhook notifications to. Each must be a valid URL. */
      webhooks: z
        .array(
          z
            .string()
            .url()
            .refine(url => url.startsWith('https://'), {
              message: 'Only secure URLs (https) are allowed for webhooks',
            })
        )
        .max(15)
        .optional(),
      /** Open Graph settings, primarily for customizing social media previews. */
      og: z
        .object({
          /** A base URL for constructing Open Graph image URLs. Must be a valid URL. */
          baseUrl: z.string().url().optional(),
        })
        .optional(),
    })
    .catchall(z.unknown()) // Allow any other properties not explicitly defined
    .transform(data => {
      // Calculate merged chainIds and tokenSymbols
      const chainIds = data.chains ?? data.chainIds ?? [];
      const tokenSymbols = data.tokens ?? data.tokenSymbols ?? [];

      // Separate known and unknown properties from data
      const {
        chains, // Don't include original 'chains'
        tokens, // Don't include original 'tokens'
        chainIds: _originalChainIds, // Don't include original 'chainIds' (use _ prefix to avoid shadowing)
        tokenSymbols: _originalTokenSymbols, // Don't include original 'tokenSymbols'
        redirectUrl,
        currency,
        amount,
        webhooks,
        og,
        ...otherProps // Capture all other properties (catchall)
      } = data;

      // Construct the result object with known properties first, then add unknown ones
      // Use type assertion for the initial object to guide TS inference
      const result: {
        chainIds: number[];
        tokenSymbols: string[];
        redirectUrl?: string;
        currency?: string;
        amount?: number;
        webhooks?: string[];
        og?: { baseUrl?: string };
        [key: string]: unknown; // Allow additional properties
      } = {
        chainIds,
        tokenSymbols,
        redirectUrl,
        currency,
        amount,
        webhooks,
        og,
        ...otherProps, // Spread the unknown properties
      };

      // Clean up undefined optional fields from the result (important for known optional fields)
      // Note: otherProps from catchall might include undefined values if they were explicitly set so
      Object.keys(result).forEach(key => {
        // Type assertion needed because TS doesn't know the keys perfectly here
        if (result[key as keyof typeof result] === undefined) {
          delete result[key as keyof typeof result];
        }
      });

      return result;
    })
);

/**
 * Represents the type inferred from the `PreferencesSchema` after validation and transformation.
 * This type defines the structured preferences object used within the application.
 * It includes consolidated `chainIds` and `tokenSymbols` arrays, standard preference fields,
 * and potentially any additional custom properties.
 */
export type Preferences = z.infer<typeof PreferencesSchema>;
