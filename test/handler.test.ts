import makeServiceWorkerEnv from 'service-worker-mock'
import { handleRequest } from '../src/handler'

declare const global: WorkerGlobalScope

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('handle GET', async () => {
    const headers = new Headers({});
    headers.append("Content-Type", "application/json");
    const result = await handleRequest(new Request('/graphql', { method: 'POST', headers: headers, body: '{ "query": "{ greetings }" }' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    expect(text).toEqual('{"data":{"greetings":"This is the `greetings` field of the root `Query` type"}}')
  })
})
