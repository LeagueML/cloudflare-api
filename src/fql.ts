import { Client } from 'faunadb';
import { Env } from './env';

export function createClient(env : Env) : Client {
    console.log('creating fql client')
    const client = new Client({
        secret: env.FAUNA_SECRET,
        domain: "db.eu.fauna.com",
        keepAlive: false,
        // fetch: fetch
    });
    console.log('done creating client');
    return client;
}