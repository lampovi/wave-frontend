// Adopted from https://gist.github.com/davej/44e3bbec414ed4665220
const transitionPromise = (element, trigger) => new Promise(resolve => {
    const transitionEnded = _ => {
        element.removeEventListener('transitionend', transitionEnded);
        resolve();
    };
    element.addEventListener('transitionend', transitionEnded);
    trigger();
});

function makeSearchLink(title, artist) {
    return "https://www.google.com/search?q=" + encodeURI(artist + " " + title);
}

class ContentController {
    constructor() {
        this.message = document.querySelector(".player__message");
        this.lyrics = document.querySelector(".contentController__lyrics");
        this.history = document.querySelector(".contentController__history");
        this.trackAnchor = document.querySelector(".player__track");
        this.trackTitle = document.querySelector(".player__title");
        this.trackArtist = document.querySelector(".player__artist");
        this.cover = document.querySelector(".player__cover");
    }

    async setTrack(title, artist) {
        if (title == this.trackTitle.textContent && artist == this.trackArtist.textContent) return;
        //await transitionPromise(this.trackAnchor, _ => { this.trackAnchor.style.opacity = 0 });
        this.trackAnchor.href = makeSearchLink(title, artist);
        this.trackTitle.textContent = title;
        this.trackArtist.textContent = artist;
        //await transitionPromise(this.trackAnchor, _ => { this.trackAnchor.style.opacity = 1 });
    }

    async setMessage(message) {
        if (message == this.message.textContent) return;
        //await transitionPromise(this.message, _ => { this.message.style.opacity = 0 });
        this.message.textContent = message;
        //await transitionPromise(this.message, _ => { this.message.style.opacity = 1 });
    }

    async setLyrics(text) {
        let html = "";
        for (const line of text.split("\n")) {
            if (line.length > 0) {
                html += "<div>" + line + "</div>";
            }
            else {
                html += "<br/>";
            }
        }
        this.lyrics.innerHTML = html;
    }

    async setHistory(history) {
        // TODO: animation during updating
        this.history.innerHTML = "";
        for (let item of history) {
            const date = new Date(item.time * 1000);
            const time = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
            const template = templateHistory.content.cloneNode(true);
            template.querySelector(".history__element").href = makeSearchLink(item.title, item.artist);
            template.querySelector(".history__title").textContent = item.title;
            template.querySelector(".history__artist").textContent = item.artist;
            template.querySelector(".history__time").textContent = time;
            this.history.append(template);
        }
    }

    async setCover(url) {
        // TODO: animation and fallback
        this.cover.src = url;
    }
}
class MusicController extends HTMLAudioElement {
    constructor() {
        super();
        this.state = "paused";
        this.isTransition = false;
        this.actualVolume = 0;
        this.userVolume = 1;
        this.volumeSynced = false;
    }
    
    async connectedCallback() {
        // TODO: disconnected callback which removing event listeners
        window.addEventListener("keyup", async event => await this._keyboard(event));
        window.addEventListener("keydown", async event => await this._keyboard(event));
        window.addEventListener("DOMContentLoaded", event => {
            this.modules = {};
            this.modules.button = document.querySelector("play-pause-button").connect(this);
            this.modules.snowfall = document.querySelector("canvas[is=\"snowfall\"]");
        });
    }
    
    get actualVolume() {
        return +super.volume.toFixed(2);
    }
    
    set actualVolume(level) {
        if (0 <= level && level <= 1) super.volume = level;
    }
    
    get userVolume() {
        return +this._userVolume.toFixed(2);
    }
    
    set userVolume(level) {
        if (this.volumeSynced) this.actualVolume = level;
        if (0 <= level && level <= 1) this._userVolume = level;
        console.log(this.userVolume);
    }

    async play() {
        super.load();
        super.play();
        try {
            await this._volumeTransition(this.userVolume);
        } catch (e) { return; }
        this.state = "playing";
    }

    async pause() {
        try {
            await this._volumeTransition(0);
        } catch (e) { return; }
        super.pause();
        this.state = "paused";
    }
    
    setSource(url, mime) {
        let source = document.createElement("source");
        source.src = url;
        source.type = mime;
        this.append(source);
    }

    async _volumeTransition(toLevel) {
        // TODO: make Exception class
        if (this.isTransition) throw "Transition is already running";
        this.isTransition = true;
        let different = toLevel - this.actualVolume;
        let step = Math.abs(different) / different * 0.01;
        let distance = Math.abs(different) * 100;
        // TODO: make '750' configurable;
        // TODO: delay is too small. Make steps bigger
        let delay = 750 / distance;
        console.log(delay);
        this.volumeSynced = toLevel == this.userVolume;
        for (; distance > 0; distance--) {
            await new Promise(resolve => {
                setTimeout(_ => { this.actualVolume += step; resolve() }, delay);
            });
        };
        this.isTransition = false;
    }

    async _keyboard(event) {
        if (event.altKey || event.ctrlKey || event.shiftKey) return
        if (event.type == "keyup") {
            if (event.code == "KeyP") {
                if (this.state == "playing") {
                    this.modules.button.paused();
                    await this.pause();
                    return;
                }
                if (this.state == "paused") {
                    this.modules.button.playing();
                    await this.play();
                    return;
                }
            }
        }
        if (event.type == "keydown") {
            if (event.code == "NumpadAdd") this.userVolume += 0.05;
            if (event.code == "NumpadSubtract") this.userVolume -= 0.05;
        }
    }

    disconnectedCallback() {}
    static get observedAttributes() { return []; }
    attributeChangedCallback(name, oldValue, newValue) {}
}

class Cover extends HTMLImageElement {
    constructor() {
        super();
    }
    update(src) {
        if (src === null) {
            
        }
    }
}

class PlayPauseButton extends HTMLElement {
    // ppButton XD
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.state = "paused";
        this.blocked = false;
        this.shadowRoot.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
                <style scoped="">
                    .hide {
                        transition: opacity 0.5s ease-out;
                        opacity: 0;
                    }
                    .show {
                        transition: opacity 0.5s ease-out 0.5s;
                        opacity: 1;
                    }
                    #error.show {
                        animation-name: flashing;
                        animation: 1s infinite alternate flashing;
                        animation-timing-function: ease-in;
                    }
                    @keyframes flashing {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                </style>
                <polygon id="play" class="show" points="10 8 16 12 10 16 10 8"></polygon>
                <g id="pause" class="hide">
                    <line x1="10" y1="15" x2="10" y2="9"></line>
                    <line x1="14" y1="15" x2="14" y2="9"></line>
                </g>
                <g id="error" class="hide">
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </g>
            </svg>
        `
        this.elements = {
            play: this.shadowRoot.querySelector("#play"),
            pause: this.shadowRoot.querySelector("#pause"),
            error: this.shadowRoot.querySelector("#error")
        }
    }
    
    connectedCallback() {
        this.addEventListener("click", this.onclick);
    }
    
    disconnectedCallback() {
        this.removeEventListener("click", this.onclick);
    }

    connect(controller) {
        this.controller = controller;
        return this;
    }

    playing() {
        this.elements.play.classList.replace("show", "hide");
        this.elements.pause.classList.replace("hide", "show");
    }
    paused() {
        this.elements.play.classList.replace("hide", "show");
        this.elements.pause.classList.replace("show", "hide");
    }

    async onclick() {
        if (this.blocked) return;
        this.blocked = true;
        if (this.state == "paused") {
            this.playing();
            await this.controller.play();
            this.state = "playing";
        } else {
            this.paused();
            await this.controller.pause();
            this.state = "paused";
        }
        this.blocked = false;
    }
}

customElements.define('music-controller', MusicController, { extends: 'audio' });
customElements.define("play-pause-button", PlayPauseButton);

document.addEventListener("DOMContentLoaded", async (event) => {
    let api = new APIManager("wss://" + window.location.host + "/api/ws");
    let content = new ContentController();
    let music = document.querySelector("audio[is=music-controller]");
    api.addCallbacks(content, music);
    await api.run();
});
