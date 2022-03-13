export class DDragonInfo {
    version: string
    baseUrl: string

    constructor(version: string, baseUrl: string)
    {
        this.version = version
        this.baseUrl = baseUrl
    }
}

export default new DDragonInfo("12.5.1", "http://ddragon.leagueoflegends.com/cdn/");