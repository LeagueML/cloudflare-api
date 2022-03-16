console.log("building base types")

// import type { Client } from "faunadb";
import { DDragonInfo } from "../ddragon";
import { Env } from "../env";
import { Server } from "../server";
import builder from "./builder";
import { Summoner } from "./Summoner";

export interface ContextType {
    summonerByName: (p: PlatformPair<string>) => Promise<Summoner | null>
    ddragon: DDragonInfo
//    fqlClient: Client
    server: Server
    env: Env
}

export enum Platform { 
    EUW1 = 'EUW1',
    NA1 = 'NA1'
     // TODO: Add rest of platforms
}

builder.enumType(Platform, {
    name: "Platform"
})

export type PlatformPair<T> = {
    platform: Platform,
    value: T
}