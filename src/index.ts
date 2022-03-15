import { handleRequest } from './handler'

// test
addEventListener('fetch', (event : FetchEvent) => {
  event.respondWith(handleRequest(event.request));
})

export { RateLimiter } from './ratelimiting';