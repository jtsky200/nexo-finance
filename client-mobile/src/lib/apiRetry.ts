/**
 * API Retry Utilities
 * 
 * Provides retry logic for failed API calls with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'network',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    '500',
    '502',
    '503',
    '504',
  ],
};

/**
 * Checks if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  const errorStatus = error.status?.toString() || '';

  return retryableErrors.some((retryable) => {
    const retryableLower = retryable.toLowerCase();
    return (
      errorMessage.includes(retryableLower) ||
      errorCode.includes(retryableLower) ||
      errorStatus.includes(retryableLower)
    );
  });
}

/**
 * Calculates delay for retry with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise that resolves with the function result
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        break;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, opts);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${delay}ms...`);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed, throw the last error
  throw lastError;
}

/**
 * Wraps a Firebase Cloud Function call with retry logic
 * 
 * @param callable - Firebase Cloud Function callable
 * @param data - Data to pass to the function
 * @param options - Retry options
 * @returns Promise that resolves with the function result
 */
export async function callWithRetry<T = any>(
  callable: (data?: any) => Promise<{ data: T }>,
  data?: any,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(
    async () => {
      const result = await callable(data);
      return result.data;
    },
    options
  );
}

