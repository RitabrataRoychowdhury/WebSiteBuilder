// Rate limiter utility for API calls

export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // in milliseconds

  constructor(maxRequests: number, timeWindowMinutes: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000; // Convert to milliseconds
  }

  async canMakeRequest(): Promise<boolean> {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  async waitForAvailability(): Promise<void> {
    while (!(await this.canMakeRequest())) {
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }
    
    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.timeWindow);
  }
}