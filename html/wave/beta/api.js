/**
 * This is very silly realisation. You can't different answer to request and
 * alert, you can't track errors when you do nothing, you can use only JSON
 * TODO: make better realisation like https://github.com/vitalets/websocket-as-promised
 */
class APIManager {
    
    constructor(webSocketUrl, streamsLocationUrl) {
        this.bundle = {};
        this.wsUrl = webSocketUrl;
        this.streamsUrl = streamsLocationUrl;
        this.callbacks = {};
    }
    async run() {
        this.socket = new WebSocket(this.wsUrl);
        this.socket.onopen = _ => { this.socket.send('{"request":"bootstrap"}') };
        this.socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            const data = message["bootstrap"] || message["update"];
            Object.assign(this.bundle, data);
            await this._delegate(data);
        };
        this.socket.onerror = (error) => { console.error(error.message); };
    }
    async _delegate(data) {
        for (const [section, content] of Object.entries(data)) {
            switch (section) {
                case "message":
                    // await this.callbacks.content.setMessage(content);
                    break;
                case "streams":
                    if (content.default.source) {
                        const url = this.streamsUrl + content.default.source.url;
                        await this.callbacks.music.setSource(url)
                    };
                    break;
                case "track":
                    await this.callbacks.content.setTrack(content.title, content.artist);
                    if (content.lyrics) await this.callbacks.content.setLyrics(content.lyrics);
                    if (content.cover) await this.callbacks.content.setCover(content.cover);
                    break;
            }
        }
    }
    addCallbacks(...connectors) {
        for (const connector of connectors) {
            switch (true) {
                case connector instanceof ContentController:
                    this.callbacks.content = connector; break;
                case connector instanceof MusicController:
                    this.callbacks.music = connector; break;
                default:
                    throw Error("Unknown connector")
            }
        }
    }
}