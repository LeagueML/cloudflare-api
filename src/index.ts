import { handleRequest } from './handler'
export { RateLimiter } from './ratelimiting';

// test
addEventListener('fetch', (event : FetchEvent) => {
  event.respondWith(handleRequest(event.request));
})