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

  private providerResetTime: number | null = null;
  private providerRemainingTokens: number | null = null;

  constructor(maxTpm = 7000, windowMs = 60000) {
    this.maxTpm = maxTpm;
    this.windowMs = windowMs;
  }

  /**
   * Updates provider token limit telemetry from official response headers.
   */
  public updateProviderCapacity(
    remainingTokens: number | null,
    resetMs: number | null
  ): void {
    if (remainingTokens !== null) {
      this.providerRemainingTokens = remainingTokens;
    }
    if (resetMs !== null) {
      this.providerResetTime = Date.now() + resetMs;
    }
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
   * Leverages official provider reset headers to prevent unnecessary full 60-second pauses.
   */
  public async waitForBudget(estimatedTokens: number): Promise<void> {
    while (true) {
      const now = Date.now();
      this.cleanExpired(now);
      const effectiveUsage = this.getEffectiveUsage(now);

      // If provider has reset capacity and reports plenty of remaining tokens, proceed
      const providerCapacityAvailable =
        this.providerRemainingTokens !== null &&
        this.providerRemainingTokens >= estimatedTokens + 500 &&
        (this.providerResetTime === null || now >= this.providerResetTime);

      // Print debug trace of active window entries
      console.log(
        `[TokenRateLimiter] Budget check: Request=${estimatedTokens}, InFlight=${this.inFlightTokens}, WindowUsage=${this.getCurrentUsage(
          now
        )}, Effective=${effectiveUsage} / Max=${this.maxTpm} (ProviderRemaining=${
          this.providerRemainingTokens ?? "unknown"
        })`
      );

      // If request fits in budget, or there are no historical records to wait for, proceed
      if (
        effectiveUsage + estimatedTokens <= this.maxTpm ||
        this.records.length === 0 ||
        providerCapacityAvailable
      ) {
        this.inFlightTokens += estimatedTokens;
        if (this.providerRemainingTokens !== null) {
          this.providerRemainingTokens = Math.max(
            0,
            this.providerRemainingTokens - estimatedTokens
          );
        }
        return;
      }

      // Calculate how many tokens must expire to make room from window
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

      // Check if provider reset header reports a shorter wait time
      let waitTimeMs = Math.max(200, targetExpiryTime - now + 50);
      if (this.providerResetTime && this.providerResetTime > now) {
        const providerWait = this.providerResetTime - now + 100;
        if (providerWait < waitTimeMs) {
          console.log(
            `[TokenRateLimiter] Using provider reset header (${Math.ceil(
              providerWait / 1000
            )}s) instead of full window wait (${Math.ceil(waitTimeMs / 1000)}s)`
          );
          waitTimeMs = Math.max(200, providerWait);
        }
      }

      console.warn(
        `[TokenRateLimiter] TPM approaching limit (${effectiveUsage} + ${estimatedTokens} > ${
          this.maxTpm
        }). Pausing for ${Math.ceil(
          waitTimeMs / 1000
        )}s before starting next chunk...`
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
    if (this.providerRemainingTokens !== null) {
      this.providerRemainingTokens += estimatedReserved;
    }
  }

  /**
   * Resets usage records (useful for testing).
   */
  public reset(): void {
    this.records = [];
    this.inFlightTokens = 0;
    this.providerResetTime = null;
    this.providerRemainingTokens = null;
  }
}

// Global singleton rate limiter calibrated for the ~8,000 TPM limit (using 7,600 as practical threshold)
const configuredTpm = parseInt(process.env.PROVIDER_TPM_LIMIT || "7600", 10);
export const globalTokenLimiter = new TokenRateLimiter(configuredTpm);
