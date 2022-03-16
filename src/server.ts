import { createServer, YogaServer } from "@graphql-yoga/common";
import { initContextCache } from "@pothos/core";
import ddragon from "./ddragon";
import { Env } from "./env";
import schema from "./schema";
import { Summoner } from "./schema/Summoner";
import { ContextType, PlatformPair } from "./schema/types";
import { query as fql } from 'faunadb';
import { createClient } from "./fql";

export class Server {
    server : YogaServer<ContextType, unknown>

    constructor()
    {        
        this.server = createServer({
            schema,
            logging: true,
            maskedErrors: false
        })
    }

    createContext(env: Env) : ContextType {
        return ({
            ...initContextCache(),
    
            server: this,
            env: env,
            get fqlClient() { console.log("building create fql client"); return createClient(this.env) },
            ddragon: ddragon,
            get summonerByName() { console.log("building summoner by name"); return ((p: PlatformPair<string>) => this.server.loadSummonerByName(p, this)); },
        })
    }

    async updateSummoner(name : PlatformPair<string>, context : ContextType) : Promise<Summoner | null> {
        try {
            console.log("updating " + name.value);
            
            const rateLimiter = context.env.RIOT_RATE_LIMIT.get(context.env.RIOT_RATE_LIMIT.idFromName(name.platform));

            console.log("calling rate limiter");
            const response = await rateLimiter.fetch("https://" + name.platform +  ".api.riotgames.com/lol/summoner/v4/summoners/by-name/" + name.value);
            if (response.status == 404)
                return null;
            const json = await response.json<any>();
            return new Summoner(name.platform, 0, json.name, json.puuid, json.summonerLevel, new Date(json.revisionDate), json.profileIconId, json.accountId);
        } 
        catch(e) {
            console.warn("Could not update summoner name: " + e);
            throw new Error("Internal Error during update of summoner");
        }
    }

    async loadSummonerByName(p: PlatformPair<string>, context: ContextType) : Promise<Summoner | null> {
        return this.updateSummoner(p, context);
    }
    
    /*
    async loadSummonerById(id : number, context : ContextType) : Promise<Summoner> {
        console.log("getting" + id);
        const o = await (context.fqlClient.query<any>(fql.Get(fql.Ref(fql.Collection("summoners"), id))));
        return new Summoner(o.data.platform, o.ref.id, o.data.name, o.data.puuid, o.data.summonerLevel, o.data.revisionDate, o.data.profileIconId, o.data.accountId);
    }
    
    async loadSummonerByName(name : PlatformPair<string>, context : ContextType) : Promise<Summoner> {
        console.log("getting " + name.value)
        const o = await (context.fqlClient.query<any>(fql.Get(fql.Match(fql.Index("summoners_name"), name.value, name.platform))));
        return new Summoner(o.data.platform, o.ref.id, o.data.name, o.data.puuid, o.data.summonerLevel, o.data.revisionDate, o.data.profileIconId, o.data.accountId);
    }*/

    handleRequest(request:Request, env : Env) : Promise<Response> {
        return this.server.handleRequest(request, this.createContext(env));
    }
}