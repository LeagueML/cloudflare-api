import makeServiceWorkerEnv from 'service-worker-mock'
import * as ratelimiting from '../src/ratelimiting';

declare const global: WorkerGlobalScope

describe('ratelimiting', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('headers are parsed correctly', () => {
      const result = ratelimiting.decodeLimitHeader("1:10,2:30,3:60")
      expect(result).not.toBeNull();
      if (!result) throw new Error("Jest isn't working properly");
      expect(result.size).toBe(3)

      expect(result.get(10)).toBe(1)
      expect(result.get(30)).toBe(2)
      expect(result.get(60)).toBe(3)
  })

  test('Retry After with ms is parsed correctly', () => {
      expect(ratelimiting.parseRetryAfter("Sun, 1 Jan 2024 00:00:00 GMT")).toBeGreaterThan(0);
      expect(ratelimiting.parseRetryAfter("50")).toBe(50000);
  })
})
