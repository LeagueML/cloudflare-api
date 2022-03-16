import { Env } from "./env";

export class RateLimiter implements DurableObject {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  // Handle HTTP requests from clients.
  async fetch(request: Request): Promise<Response> {
    console.log("entering concurrency");
    return this.state.blockConcurrencyWhile(() => this.handle(request));
    // return this.handle(request);
  } 

  async handle(request: Request): Promise<Response> {
    let response: Response;
    let done = false;

    console.log("setting up rate limiter");
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const methodKey = getMethodKey(url.pathname);
    let requestEnd : number;

    do {
      // wait for app slot
      console.log("waiting for app limit");
      const nextAppSlot: number | undefined = await this.state.storage.get("next-app-slot");
      if (nextAppSlot) {
        const diff = nextAppSlot - Date.now();
        if (diff > 0)
          await waitMs(diff);
      }

      // wait for method slot
      const nextMethodSlot: number | undefined = await this.state.storage.get("next-" + methodKey + "-slot");
      console.log("waiting for method limit");
      if (nextMethodSlot) {
        const diff = nextMethodSlot - Date.now();
        if (diff > 0)
          await waitMs(diff);
      }

      // do response (wait in case of 429)
      console.log("fetching Riot API at %s", request.url);
      const headers = new Headers();
      headers.set("X-Riot-Token", this.env.RIOT_API_KEY);
      response = await fetch(request.url, { headers: headers });
      requestEnd = Date.now();

      if (response.status == 429) {
        const retryMs = parseRetryAfter(response.headers.get("Retry-After") ?? "30");
        console.log("waiting for retry for %s...", retryMs);
        await waitMs(retryMs);
      }

      if (response.status == 404) {
        done = true;
      }
      else if (response.status == 200) {
        done = true;
      }
      else {
        console.log("Unknown Riot error - %s %s", response.status, await response.text());
        await waitMs(30000);
      }

    } while (!done);

    console.log("updating app rate limit");
    const appRateLimit = decodeLimitHeader(response.headers.get("X-App-Rate-Limit")) ?? new Map<number, number>();
    const appRateLimitCount = decodeLimitHeader(response.headers.get("X-App-Rate-Limit-Count")) ?? new Map<number, number>();

    if (appRateLimit.size != appRateLimitCount.size)
      console.warn("App Limits cannot be calculated correctly. %s %s", response.headers.get('X-App-Rate-Limit'), response.headers.get('X-App-Rate-Limit-Count'));

    const appRateLimits : RateLimit[] = [];
    appRateLimit.forEach((v, k) => appRateLimits.push(new RateLimit(appRateLimitCount.get(k)!, v, k)))

    appRateLimits.forEach((x) => console.log('s: %s | %s / %s', x.seconds, x.current, x.limit));

    let appIsBucketStart = true;
    appRateLimits.forEach((p) => { if (p.current != 1) appIsBucketStart = false; });

    let appBucketStart : number;
    if (appIsBucketStart)
    {
      appBucketStart = requestEnd;
      await this.state.storage.put("app-bucket-start", appBucketStart);
    }
    else
    {
      const onlineBucketStart = await this.state.storage.get("app-bucket-start");
      if (!onlineBucketStart) {
        appBucketStart = requestEnd;
        await this.state.storage.put("app-bucket-start", appBucketStart);
      }
      else {
        appBucketStart = Number(onlineBucketStart);
      }
    }

    let nextApp = Number.MIN_SAFE_INTEGER;
    appRateLimits.forEach((p) => {
      const reqPerSec = p.limit / p.seconds;
      const secDone = p.current * reqPerSec;
      const next = appBucketStart + secDone * 1000;
      if (next > nextApp) nextApp = next;
    })
    console.log("Calculated %s as next app slot", new Date(nextApp));

    console.log("updating method rate limit");
    const methodRateLimit = decodeLimitHeader(response.headers.get("X-Method-Rate-Limit")) ?? new Map<number, number>();
    const methodRateLimitCount = decodeLimitHeader(response.headers.get("X-Method-Rate-Limit-Count")) ?? new Map<number, number>();

    if (methodRateLimit.size != methodRateLimitCount.size)
      console.warn("Method %s Limits cannot be calculated correctly. %s %s", methodKey, response.headers.get('X-Method-Rate-Limit'), response.headers.get('X-Method-Rate-Limit-Count'));

    const methodRateLimits : RateLimit[] = [];
    methodRateLimit.forEach((v, k) => methodRateLimits.push(new RateLimit(methodRateLimitCount.get(k)!, v, k)))

    methodRateLimits.forEach((x) => console.log('s: %s | %s / %s', x.seconds, x.current, x.limit));

    let methodIsBucketStart = true;
    methodRateLimits.forEach((p) => { if (p.current != 1) methodIsBucketStart = false; });

    let methodBucketStart : number;
    if (methodIsBucketStart)
    {
      methodBucketStart = requestEnd;
      await this.state.storage.put("method-" + methodKey + "-start", methodBucketStart);
    }
    else
    {
      const onlineBucketStart = await this.state.storage.get("method-" + methodKey + "-start");
      if (!onlineBucketStart) {
        methodBucketStart = requestEnd;
        await this.state.storage.put("method-" + methodKey + "-start", methodBucketStart);
      }
      else {
        methodBucketStart = Number(onlineBucketStart);
      }
    }

    let nextMethod = Number.MIN_SAFE_INTEGER;
    appRateLimits.forEach((p) => {
      const reqPerSec = p.limit / p.seconds;
      const secDone = p.current * reqPerSec;
      const next = appBucketStart + secDone * 1000;
      if (next > nextMethod) nextMethod = next;
    })
    console.log("Calculated %s as next method slot", new Date(nextMethod));

    await this.state.storage.put("next-app-slot", nextApp);
    await this.state.storage.put("next-" + methodKey + "-slot", nextMethod);

    return response;
  }
}

class RateLimit {
  limit: number
  current: number
  seconds: number

  constructor(limit: number, current: number, seconds: number) {
    this.limit = limit;
    this.current = current;
    this.seconds = seconds;
  }
}



export function getMethodKey(path: string): string {
  if (path.startsWith("/lol/summoner/v4/summoners"))
    return "summoners-v4";
  throw new Error("Unknown PATH " + path);
}

export function decodeLimitHeader(str: string | null): Map<number, number> | null {
  if (!str) return null;
  return str
    .split(',')
    .map(p => p
      .split(':')
      .map(x => Number(x))
    ).filter(p => p.length == 2)
    .reduce((m, p) => m.set(p[1], p[0]), new Map<number, number>());
}

export function parseRetryAfter(text: string): number {
  const nVal = Number(text);
  if (Number.isFinite(nVal))
    return (nVal || 1) * 1000;

  return Date.parse(text) - Date.now();
}

export function waitMs(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}