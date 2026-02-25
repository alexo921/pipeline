import { encoding_for_model, TiktokenModel } from 'tiktoken';

/**
 * Token counting utility for OpenAI models
 * Used to calculate token usage for context window management
 */
export class TokenCounter {
  private encoder: ReturnType<typeof encoding_for_model>;

  constructor(model: TiktokenModel = 'gpt-4o-mini') {
    this.encoder = encoding_for_model(model);
  }

  /**
   * Count tokens in a single text string
   */
  countTokens(text: string): number {
    const tokens = this.encoder.encode(text);
    return tokens.length;
  }

  /**
   * Count tokens in an array of messages (OpenAI chat format)
   */
  countMessageTokens(messages: Array<{ role: string; content: string }>): number {
    // OpenAI's chat format adds some overhead per message
    // See: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb

    let tokenCount = 0;

    for (const message of messages) {
      // Every message follows <|start|>{role/name}\n{content}<|end|>\n
      tokenCount += 4; // Overhead per message
      tokenCount += this.countTokens(message.role);
      tokenCount += this.countTokens(message.content);
    }

    tokenCount += 2; // Overhead for assistant's reply

    return tokenCount;
  }

  /**
   * Cleanup encoder resources
   */
  free(): void {
    this.encoder.free();
  }
}

/**
 * Singleton instance for token counting
 */
let tokenCounterInstance: TokenCounter | null = null;

export function getTokenCounter(): TokenCounter {
  if (!tokenCounterInstance) {
    tokenCounterInstance = new TokenCounter('gpt-4o-mini');
  }
  return tokenCounterInstance;
}

/**
 * Helper function to count tokens in a text string
 */
export function countTokens(text: string): number {
  const counter = getTokenCounter();
  return counter.countTokens(text);
}

/**
 * Helper function to count tokens in messages
 */
export function countMessageTokens(messages: Array<{ role: string; content: string }>): number {
  const counter = getTokenCounter();
  return counter.countMessageTokens(messages);
}
