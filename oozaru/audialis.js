import { Deque } from './deque.js';
import Game from './game.js';
import { fetchAudioFile } from './utilities.js';
var defaultMixer = null;
export default class Audialis {
    static async initialize() {
        defaultMixer = new Mixer(44100, 16, 2);
    }
}
export class Mixer {
    static get Default() {
        if (defaultMixer === null)
            defaultMixer = new Mixer(44100, 16, 2);
        return defaultMixer;
    }
    context;
    gainer;
    panner;
    constructor(sampleRate, bits, numChannels = 2) {
        this.context = new AudioContext({ sampleRate });
        this.gainer = this.context.createGain();
        this.panner = this.context.createStereoPanner();
        this.gainer.gain.value = 1.0;
        this.gainer.connect(this.panner);
        this.panner.connect(this.context.destination);
    }
    get pan() { return this.panner.pan.value; }
    set pan(value) { this.panner.pan.value = value; }
    get volume() { return this.gainer.gain.value; }
    set volume(value) { this.gainer.gain.value = value; }
}
export class Sound {
    static async fromFile(fileName) {
        const url = Game.urlOf(fileName);
        const element = await fetchAudioFile(url);
        element.loop = true;
        return new this(element);
    }
    audioNode = null;
    currentMixer = null;
    element;
    constructor(source) {
        if (source instanceof HTMLAudioElement)
            this.element = source;
        else if (typeof source === 'string')
            throw TypeError("'new Sound()' with filename is unsupported under Oozaru.");
        else
            throw TypeError(`Invalid value '${source}' passed for 'Sound' source`);
    }
    get length() { return this.element.duration; }
    get playing() { return !this.element.paused; }
    get position() { return this.element.currentTime; }
    get repeat() { return this.element.loop; }
    get speed() { return this.element.playbackRate; }
    get volume() { return this.element.volume; }
    set position(value) { this.element.currentTime = value; }
    set repeat(value) { this.element.loop = value; }
    set speed(value) { this.element.playbackRate = value; }
    set volume(value) { this.element.volume = value; }
    pause() {
        this.element.pause();
    }
    play(mixer = Mixer.Default) {
        if (mixer !== this.currentMixer) {
            this.currentMixer = mixer;
            if (this.audioNode !== null)
                this.audioNode.disconnect();
            this.audioNode = mixer.context.createMediaElementSource(this.element);
            this.audioNode.connect(mixer.gainer);
        }
        this.element.play();
    }
    stop() {
        this.element.pause();
        this.element.currentTime = 0.0;
    }
}
export class SoundStream {
    buffers = new Deque();
    currentMixer = null;
    inputPtr = 0.0;
    node = null;
    numChannels;
    paused = true;
    sampleRate;
    timeBuffered = 0.0;
    constructor(frequency = 22050, bits = 8, numChannels = 1) {
        if (bits != 32)
            throw RangeError("SoundStream bit depth must be 32-bit under Oozaru.");
        this.numChannels = numChannels;
        this.sampleRate = frequency;
    }
    get length() {
        return this.timeBuffered;
    }
    pause() {
        this.paused = true;
    }
    play(mixer = Mixer.Default) {
        this.paused = false;
        if (mixer !== this.currentMixer) {
            if (this.node !== null) {
                this.node.onaudioprocess = null;
                this.node.disconnect();
            }
            this.node = mixer.context.createScriptProcessor(0, 0, this.numChannels);
            this.node.onaudioprocess = (e) => {
                const outputs = [];
                for (let i = 0; i < this.numChannels; ++i)
                    outputs[i] = e.outputBuffer.getChannelData(i);
                if (this.paused || this.timeBuffered < e.outputBuffer.duration) {
                    for (let i = 0; i < this.numChannels; ++i)
                        outputs[i].fill(0.0);
                    return;
                }
                this.timeBuffered -= e.outputBuffer.duration;
                if (this.timeBuffered < 0.0)
                    this.timeBuffered = 0.0;
                const step = this.sampleRate / e.outputBuffer.sampleRate;
                let input = this.buffers.first;
                let inputPtr = this.inputPtr;
                for (let i = 0, len = outputs[0].length; i < len; ++i) {
                    const t1 = Math.floor(inputPtr) * this.numChannels;
                    let t2 = t1 + this.numChannels;
                    const frac = inputPtr % 1.0;
                    if (t2 >= input.length)
                        t2 = t1;
                    for (let j = 0; j < this.numChannels; ++j) {
                        const a = input[t1 + j];
                        const b = input[t2 + j];
                        outputs[j][i] = a + frac * (b - a);
                    }
                    inputPtr += step;
                    if (inputPtr >= Math.floor(input.length / this.numChannels)) {
                        this.buffers.shift();
                        if (!this.buffers.empty) {
                            inputPtr -= Math.floor(input.length / this.numChannels);
                            input = this.buffers.first;
                        }
                        else {
                            for (let j = 0; j < this.numChannels; ++j)
                                outputs[j].fill(0.0, i + 1);
                            return;
                        }
                    }
                }
                this.inputPtr = inputPtr;
            };
            this.node.connect(mixer.gainer);
            this.currentMixer = mixer;
        }
    }
    stop() {
        if (this.node !== null) {
            this.node.onaudioprocess = null;
            this.node.disconnect();
        }
        this.buffers.clear();
        this.inputPtr = 0.0;
        this.currentMixer = null;
        this.node = null;
        this.paused = true;
        this.timeBuffered = 0.0;
    }
    write(data) {
        this.buffers.push(data);
        this.timeBuffered += data.length / (this.sampleRate * this.numChannels);
    }
}
