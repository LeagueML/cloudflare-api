import { createServer, YogaInitialContext } from '@graphql-yoga/common'
import schema from './schema';
import { initContextCache } from '@pothos/core';
import type { ContextType, PlatformPair } from './schema/types';
import ddragon from './ddragon';
import { Summoner } from './schema/Summoner';
import { createClient } from './fql';
import { query as fql, Sum } from 'faunadb';

declare const RIOT_RATE_LIMIT : DurableObjectNamespace;

async function updateSummoner(name : PlatformPair<string>, context : ContextType) : Promise<Summoner> {
    console.log("updating " + name.value);
    
    const rateLimiter = RIOT_RATE_LIMIT.get(RIOT_RATE_LIMIT.idFromName(name.platform));
    await rateLimiter.fetch("dont_care.com/lol/summoner/v4/summoners/by-name/" + name.value);
    throw new Error("AA");
}

async function loadSummonerById(id : number, context : ContextType) : Promise<Summoner> {
    console.log("getting" + id);
    const o = await (context.fqlClient.query<any>(fql.Get(fql.Ref(fql.Collection("summoners"), id))));
    return new Summoner(o.data.platform, o.ref.id, o.data.name, o.data.puuid, o.data.summonerLevel, o.data.revisionDate, o.data.profileIconId, o.data.accountId);
}

async function loadSummonerByName(name : PlatformPair<string>, context : ContextType) : Promise<Summoner> {
    console.log("getting " + name.value)
    const o = await (context.fqlClient.query<any>(fql.Get(fql.Match(fql.Index("summoners_name"), name.value, name.platform))));
    return new Summoner(o.data.platform, o.ref.id, o.data.name, o.data.puuid, o.data.summonerLevel, o.data.revisionDate, o.data.profileIconId, o.data.accountId);
}

const server = createServer({
    schema,
    logging: true,
    context: (context : YogaInitialContext) : ContextType => ({
        ...context,
        ...initContextCache(),

        get fqlClient() { console.log("building create fql client"); return createClient() },
        ddragon: ddragon,
        get summonerById() { console.log("building summoner by id"); return ((p: number) => loadSummonerById(p, this)); },
        get summonerByName() { console.log("building summoner by name"); return ((p: PlatformPair<string>) => loadSummonerByName(p, this)); },
    }),
    maskedErrors: false
})

export function handleRequest(request : Request) : Promise<Response> {
    return server.handleRequest(request);
}