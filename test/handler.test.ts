import makeServiceWorkerEnv from 'service-worker-mock'
import { handleRequest } from '../src/handler'

declare const global: WorkerGlobalScope

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  /*test('get a single profile icon', async () => {
    const headers = new Headers({});
    headers.append("Content-Type", "application/json");
    const result = await handleRequest(new Request('/graphql', { method: 'POST', headers: headers, body: '{ "query": "{ profileIconById(id: 685) { id } }" }' }))
    const text = await result.text()
    expect(text).toEqual('{"data":{"profileIconById":{"id":685}}}')
    expect(result.status).toEqual(200)
  })

  test('get Joschmosch334', async () => {
    const headers = new Headers({});
    headers.append("Content-Type", "application/json");
    const result = await handleRequest(new Request('/graphql', { method: 'POST', headers: headers, body: '{ "query": "{ getSummonerByName(name: \\"Joschmosch334\\", platform: EUW1) { name } }" }' }))
    const text = await result.text()
    expect(text).toEqual('{"data":{"getSummonerByName":{"name":"Joschmosch334"}}}')
    expect(result.status).toEqual(200)
  })*/
})
