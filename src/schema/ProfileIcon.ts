console.log("building ProfileIcon")

import { DDragonInfo } from "../ddragon";
import builder from "./builder";

export class ProfileIcon {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

function getUrl(ddragon: DDragonInfo, key : number) : string {
    return ddragon.baseUrl + ddragon.version + '/img/profileicon/' + key + '.png';
}

/*async function loadProfileIcon(ddragon: DDragonInfo, key: number) : Promise<ProfileIcon> {
    const request = new Request(getUrl(ddragon, key));

    const cacheResult = await caches.default.match(request);
    if (cacheResult) return cacheResult.json<ProfileIcon>();
}*/

builder.objectType(ProfileIcon, {
    name: "ProfileIcon",
    description: "Represents a Profile Icon, as commonly seen next to a summoners name",
    fields: (t) => ({
        id: t.exposeInt("id"),
        url: t.string({
            resolve: (parent, _args, context) => getUrl(context.ddragon, parent.id)
        })
    })
})

builder.queryField("profileIconById", (t) => t.field({
    type: ProfileIcon,
    args: {
        id: t.arg.int({ required: true }),
    },
    resolve: (parent, { id }, _context) => new ProfileIcon(id)
}))