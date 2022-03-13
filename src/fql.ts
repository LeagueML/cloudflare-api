import { Client } from 'faunadb';

declare const FAUNA_SECRET : string;

export function createClient() : Client {
    console.log('creating fql client')
    const client = new Client({
        secret: FAUNA_SECRET,
        domain: "db.eu.fauna.com",
        keepAlive: false,
        // fetch: fetch
    });
    console.log('done creating client');
    return client;
}