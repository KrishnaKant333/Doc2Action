/**
 * Provider-independent rolling token budget & rate limiter.
 * Protects against exceeding tokens-per-minute (TPM) limits across sequential chunks and retries
 * without creating artificial multi-minute stalls.
 */

export interface UsageRecord {
  id: string;
  timestamp: number;
  tokens: number;
}

export class TokenRateLimiter {
  private readonly windowMs: number;
  private readonly maxTpm: number;
  private records: UsageRecord[] = [];
  private inFlightTokens = 0;

  constructor(maxTpm = 7000, windowMs = 60000) {
    this.maxTpm = maxTpm;
    this.windowMs = windowMs;
  }

  /**
   * Removes records older than the rolling window (60 seconds).
   */
  private cleanExpired(now = Date.now()): void {
    const cutoff = now - this.windowMs;
    const initialCount = this.records.length;
    this.records = this.records.filter((r) => r.timestamp > cutoff);
    if (this.records.length < initialCount) {
      console.log(
        `[TokenRateLimiter] Expired ${initialCount - this.records.length} entry(ies) older than 60s. Active window entries: ${this.records.length}`
      );
    }
  }

  /**
   * Returns completed tokens consumed within the current 60-second window.
   */
  public getCurrentUsage(now = Date.now()): number {
    this.cleanExpired(now);
    return this.records.reduce((sum, r) => sum + r.tokens, 0);
  }

  /**
   * Returns total committed usage (completed in last 60s + currently in-flight).
   */
  public getEffectiveUsage(now = Date.now()): number {
    return this.getCurrentUsage(now) + this.inFlightTokens;
  }

  /**
   * Checks whether the upcoming request can proceed immediately without exceeding the TPM limit.
   * If budget is insufficient, calculates the exact future time when enough records will have expired.
   */
  public async waitForBudget(estimatedTokens: number): Promise<void> {
    while (true) {
      const now = Date.now();
      this.cleanExpired(now);
      const effectiveUsage = this.getEffectiveUsage(now);

      // Print debug trace of active window entries
      console.log(
        `[TokenRateLimiter] Budget check: Request=${estimatedTokens}, InFlight=${this.inFlightTokens}, WindowUsage=${this.getCurrentUsage(
          now
        )}, Effective=${effectiveUsage} / Max=${this.maxTpm}`
      );

      // If request fits in budget, or there are no historical records to wait for, proceed
      if (effectiveUsage + estimatedTokens <= this.maxTpm || this.records.length === 0) {
        this.inFlightTokens += estimatedTokens;
        return;
      }

      // Calculate how many tokens must expire to make room
      const tokensToFree = effectiveUsage + estimatedTokens - this.maxTpm;
      let freed = 0;
      let targetExpiryTime = now;

      // Sort records chronologically (oldest first)
      const sortedRecords = [...this.records].sort((a, b) => a.timestamp - b.timestamp);

      for (const rec of sortedRecords) {
        freed += rec.tokens;
        targetExpiryTime = rec.timestamp + this.windowMs;
        if (freed >= tokensToFree) {
          break;
        }
      }

      const waitTimeMs = Math.max(200, targetExpiryTime - now + 50);

      console.warn(
        `[TokenRateLimiter] TPM approaching limit (${effectiveUsage} + ${estimatedTokens} > ${
          this.maxTpm
        }). Pausing for ${Math.ceil(
          waitTimeMs / 1000
        )}s to let ${freed} tokens expire from rolling window...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
    }
  }

  /**
   * Records token usage for a completed request and releases in-flight reservation.
   */
  public recordUsage(
    actualTokens: number,
    estimatedReserved: number,
    timestamp = Date.now()
  ): void {
    // Release in-flight reservation
    this.inFlightTokens = Math.max(0, this.inFlightTokens - estimatedReserved);

    this.cleanExpired(timestamp);
    const id = `rec_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;
    this.records.push({ id, timestamp, tokens: actualTokens });

    console.log(
      `[TokenRateLimiter] Recorded completed request: ${actualTokens} tokens. Window total now: ${this.getCurrentUsage(
        timestamp
      )} / ${this.maxTpm}`
    );
  }

  /**
   * Releases an in-flight reservation without recording usage (e.g. if rejected before network).
   */
  public releaseReservation(estimatedReserved: number): void {
    this.inFlightTokens = Math.max(0, this.inFlightTokens - estimatedReserved);
  }

  /**
   * Resets usage records (useful for testing).
   */
  public reset(): void {
    this.records = [];
    this.inFlightTokens = 0;
  }
}

// Global singleton rate limiter calibrated for the ~8,000 TPM limit (using 7,600 as practical threshold)
const configuredTpm = parseInt(process.env.PROVIDER_TPM_LIMIT || "7600", 10);
export const globalTokenLimiter = new TokenRateLimiter(configuredTpm);
