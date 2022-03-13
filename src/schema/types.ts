console.log("building base types")

import { YogaInitialContext } from "@graphql-yoga/common";
import type { Client } from "faunadb";
import { DDragonInfo } from "../ddragon";
import builder from "./builder";
import { Summoner } from "./Summoner";

export interface ContextType extends YogaInitialContext {
    summonerById: (p: number) => Promise<Summoner>
    summonerByName: (p: PlatformPair<string>) => Promise<Summoner>
    ddragon: DDragonInfo
    fqlClient: Client
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