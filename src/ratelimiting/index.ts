export class RateLimiter implements DurableObject {
    state: DurableObjectState;
  
    constructor(state: DurableObjectState, env: any) {
      this.state = state;
    }
  
    // Handle HTTP requests from clients.
    async fetch(request: Request) : Promise<Response> {
      return this.state.blockConcurrencyWhile(() => this.handle(request));
    }

    getMethodKey(path: string) : string {
      if (path.startsWith("/lol/summoner/v4/summoners"))
        return "summoners-v4";
      throw new Error("Unknown PATH " + path);
    }

    decodeLimitHeader(str: string) : Map<number, number> {
      return str
        .split(',')
        .map(p => p
          .split(':')
          .map(x => Number(x))
        ).filter(p => p.length == 2)
        .reduce((m, p) => m.set(p[1], p[0]), new Map<number, number>());
    }

    parseRetryAfter(text: string) : number {
      const nVal = Number(text);
      if (Number.isFinite(nVal))
        return (nVal || 1) * 1000;

      return Date.parse(text);
    }

    waitMs(time: number) : Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    async handle(request: Request) : Promise<Response> {
      const nextAppSlot : number | undefined = await this.state.storage.get("next-app-slot");
      if (nextAppSlot)
      {
        const diff = nextAppSlot - Date.now();
        if (diff > 0)
          await this.waitMs(diff);
      }

      const url = new URL(request.url);
      const path = url.pathname + url.search;
      const riotUrl = this.state.id + ".riotapi.com" + path;

      const methodKey = this.getMethodKey(url.pathname);
      const nextMethodSlot : number | undefined = await this.state.storage.get(methodKey);
      if (nextMethodSlot)
      {
        const diff = nextMethodSlot - Date.now();
        if (diff > 0)
          await this.waitMs(diff);
      }

      let response : Response;
      do {
        response = await fetch(riotUrl, { cache: "no-cache" });

        if (response.status == 429)
        {
          await this.waitMs(this.parseRetryAfter(response.headers.get("Retry-After") ?? "30"));
        }
      } while(response.status == 429);

      response.headers.get("")

      return response;
    }
}