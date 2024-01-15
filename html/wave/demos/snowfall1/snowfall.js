"use strict"

// Utils
Math.randomInt = (min, max) => {
    return Math.random() * (max - min) + min;
}

/**
 * FPS - must be "auto" (recommended) or any positive number
 */
class Precipitation extends HTMLCanvasElement {

    constructor() {
        if (new.target === Precipitation) {
            // TODO: add more letters
            throw new TypeError("Precipitation is pseudo-abstract class. Use inherited classes.");
        }
        super();
        // Default values
        this.amount = 2;
        this.maxr = 1;
        this.minr = 0.5;
        this.maxv = 1;
        this.minv = 0.5;
        this.fps = "auto";
        this.match = "window";
        this.particles = [];
        this.resize = this.resize.bind(this);
    }

    attributeChangedCallback(attributeName, oldValue, newValue)	{
        console.log(attributeName);
        switch(attributeName) {
            // TODO: monitor "minV", "maxV", "amount", etc. changes
            // TODO: test what if "amount" is null, but "match" case is fired
            case "match":
                this[attributeName] = newValue;
                this.resize();
                break;
            case "amount":
            case "minv":
            case "maxv":
            case "minr":
            case "maxr":
                this[attributeName] = +newValue;
                break;
            case "fps":
                if (newValue == "auto") this[attributeName] = newValue
                else this[attributeName] = +newValue;
        }
    }

    static get observedAttributes() {
        // Must be lower-case. IDK why, but that's sad
        return ["amount", "maxr", "minr", "maxv", "minv", "fps", "match"];
    }

    connectedCallback() {
        window.addEventListener("resize", this.resize);
        if (this.fps == "auto") {
            this.draw();
        }
        else {
            this.interval = setInterval(this.draw, Math.round(1000 / +this.fps));
        }
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.resize);
        if (this.interval) clearInterval(this.interval);
    }

    setupContext() {
        throw TypeError("Method setupContext() is not implemented")
    }
    
    createParticles() {
        throw TypeError("Method createParticles() is not implemented")
    }

    draw() {
        throw TypeError("Method draw() is not implemented")
    }

    resize() { 
        switch(this.match) {
            case "window":
                [this.width, this.height] = [window.innerWidth, window.innerHeight];
                break;
            case "parent":
                let parent = this.parentElement;
                [this.width, this.height] = [parent.width, parent.height];
        }
        // Changing canvas size resets the context.
        // Behavior specified: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions
        this.setupContext();
        this.number = Math.round(this.width * this.height / 10000 * this.amount);
        if (this.particles.length > this.number) {
            this.particles.splice(0, this.particles.length - this.number);
        }
        else if (this.particles.length < this.number) {
            this.createParticles(this.number - this.particles.length);
        }
    }

    start() {
        
    }

    stop() {
        
    }
}

class Snowfall extends Precipitation {

    constructor() {
        super();
        this.draw = this.draw.bind(this);
        this.createParticles = this.createParticles.bind(this);
    }

    setupContext() {
        this.context = this.getContext("2d");
        this.context.fillStyle = "white";
    }

    createParticles(number, fromTop = false) {
        for (; number > 0; number--) {
            let particle = {};
            particle.radius = Math.randomInt(this.minr, this.maxr);
            particle.speed = Math.randomInt(this.minv, this.maxv);
            particle.xAxis = Math.randomInt(particle.radius, this.width - particle.radius);
            if (fromTop) {
                particle.yAxis = -particle.radius;
            }
            else {
                particle.yAxis = Math.randomInt(particle.radius, this.height - particle.radius);
            }
            this.particles.push(particle);
        }
    }

    draw() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.particles.forEach((particle, index, array) => {
            particle.yAxis += particle.speed;
            this.context.beginPath();
            this.context.arc(particle.xAxis, particle.yAxis, particle.radius, 0, 2 * Math.PI);
            this.context.fill();
            if (particle.yAxis - particle.radius > this.height) {
                array.splice(index, 1);
                this.createParticles(1, true);
            }
        });
        if (this.fps == "auto") {
            window.requestAnimationFrame(this.draw);
        }
    }

}

customElements.define("precipitation-snowfall", Snowfall, { extends: "canvas" });