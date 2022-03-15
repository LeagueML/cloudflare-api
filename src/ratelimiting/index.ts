export class RateLimiter implements DurableObject {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  // Handle HTTP requests from clients.
  async fetch(request: Request): Promise<Response> {
    return this.state.blockConcurrencyWhile(() => this.handle(request));
  }

  async handle(request: Request): Promise<Response> {
    let response: Response;
    let done = false;

    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const riotUrl = this.state.id + ".api.riotgames.com" + path;
    const methodKey = getMethodKey(url.pathname);

    do {
      // wait for app slot
      const nextAppSlot: number | undefined = await this.state.storage.get("next-app-slot");
      if (nextAppSlot) {
        const diff = nextAppSlot - Date.now();
        if (diff > 0)
          await waitMs(diff);
      }

      // wait for method slot
      const nextMethodSlot: number | undefined = await this.state.storage.get(methodKey);
      if (nextMethodSlot) {
        const diff = nextMethodSlot - Date.now();
        if (diff > 0)
          await waitMs(diff);
      }

      // do response (wait in case of 429)
      const headers = new Headers();
      headers.set("X-Riot-Token", this.env.RIOT_API_KEY);
      response = await fetch(riotUrl, { cache: "no-cache", headers: headers });

      if (response.status == 429) {
        await waitMs(parseRetryAfter(response.headers.get("Retry-After") ?? "30"));
      }

      if (response.status == 200) {
        done = true;
      }

    } while (!done);

    const appRateLimit = decodeLimitHeader(response.headers.get("X-App-Rate-Limit")) ?? new Map<number, number>();
    const appRateLimitCount = decodeLimitHeader(response.headers.get("X-App-Rate-Limit-Count")) ?? new Map<number, number>();

    if (appRateLimit.size != appRateLimitCount.size)
      console.warn("App Limits cannot be calculated correctly. %s %s", response.headers.get('X-App-Rate-Limit'), response.headers.get('X-App-Rate-Limit-Count'));

    const appRateLimits : RateLimit[] = [];
    appRateLimit.forEach((v, k) => appRateLimits.push(new RateLimit(appRateLimitCount.get(k)!, v, k)))

    appRateLimits.forEach((x) => console.log('s: %s | %s / %s', x.seconds, x.current, x.limit));

    

    const methodRateLimit = decodeLimitHeader(response.headers.get("X-Method-Rate-Limit")) ?? new Map<number, number>();
    const methodRateLimitCount = decodeLimitHeader(response.headers.get("X-Method-Rate-Limit-Count")) ?? new Map<number, number>();

    if (methodRateLimit.size != methodRateLimitCount.size)
      console.warn("Method %s Limits cannot be calculated correctly. %s %s", methodKey, response.headers.get('X-Method-Rate-Limit'), response.headers.get('X-Method-Rate-Limit-Count'));

    const methodRateLimits : RateLimit[] = [];
    methodRateLimit.forEach((v, k) => methodRateLimits.push(new RateLimit(methodRateLimitCount.get(k)!, v, k)))

    methodRateLimits.forEach((x) => console.log('s: %s | %s / %s', x.seconds, x.current, x.limit));

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