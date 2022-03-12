import { createServer } from '@graphql-yoga/common'

const server = createServer()

export function handleRequest(request : Request) : Promise<Response> {
    return server.handleRequest(request);
}