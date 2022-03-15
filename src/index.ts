import { Env } from './env';
import { Server } from './server';

const server = new Server();

export default {
  async fetch(request: Request, env: Env) : Promise<Response> {
    try {
      return await server.handleRequest(request, env);
    } catch (e) {
      return new Response(`${e}`)
    }
  }
}