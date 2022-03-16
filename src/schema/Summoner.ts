console.log("building Summoner")

import builder from "./builder";
import './ProfileIcon';
import { ProfileIcon } from "./ProfileIcon";
import { Platform } from './types';

export class Summoner {
    platform: Platform;
    id: number;
    name: string;
    puuid: string;
    level: number;
    revisionDate: Date;
    profileIconId: number;
    accountId: string;

    constructor(platform: Platform, id: number, name: string, puuid: string, level: number, revisionDate: Date, profileIconId: number, accountId: string)
    {
        this.platform = platform;
        this.id = id;
        this.name = name;
        this.puuid = puuid;
        this.level = level;
        this.revisionDate = revisionDate;
        this.profileIconId = profileIconId;
        this.accountId = accountId;
    }
}

builder.objectType(Summoner, {
    name: "Summoner",
    description: "Represents a summoner profile",
    fields: (t) => ({
        id: t.exposeID("id"),
        name: t.exposeString("name"),
        summonerLevel: t.exposeInt("level"),
        platform: t.expose("platform", { type: Platform }),
        profileIcon: t.field({
            type: ProfileIcon,
            resolve: (parent) => { console.log("resolving summoner profile icon"); return new ProfileIcon(parent.profileIconId) }
        })
    })
})

builder.queryField("getSummonerByName", (t) => t.field({
    type: Summoner,
    nullable: true,
    args: {
        name: t.arg.string({ required: true }),
        platform: t.arg({ type: Platform, required: true })
    },
    resolve: (parent, { name, platform }, context) => { console.log("querying summoner by name"); return context.summonerByName({ platform: platform, value: name}); }
}));