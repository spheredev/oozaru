import Fido from './fido.js';
import Galileo from './galileo.js';
import { fullURL, isConstructor } from './utilities.js';
import { Version } from './version.js';
export default class Game {
    static manifest;
    static rootPath;
    static async initialize(rootPath) {
        const manifest = await Manifest.fromFile(`${rootPath}/game.sgm`);
        if (manifest.apiVersion < 2)
            throw Error(`'${manifest.name}' is a Sphere 1.x game and won't run in Oozaru.`);
        if (manifest.apiLevel > Version.apiLevel)
            throw Error(`'${manifest.name}' requires API level '${manifest.apiLevel}' or higher.`);
        if (manifest.apiLevel < 4)
            console.warn(`'${manifest.name}' targets Sphere API level ${manifest.apiLevel} and may not run correctly under Oozaru. If this is a problem, consider summoning Big Chungus to fix it.`);
        this.manifest = manifest;
        this.rootPath = rootPath;
    }
    static fullPath(pathName, baseDirName = '@/') {
        if (baseDirName !== '@/')
            baseDirName = this.fullPath(`${baseDirName}/`);
        const inputPath = /^[@#~$%](?:\\|\/)/.test(pathName)
            ? `${pathName}`
            : `${baseDirName}/${pathName}`;
        const input = inputPath.split(/[\\/]+/);
        if (input[0] === '$') {
            input.splice(0, 1, ...this.manifest.mainPath.split(/[\\/]+/).slice(0, -1));
        }
        const output = [input[0]];
        for (let i = 1, len = input.length; i < len; ++i) {
            if (input[i] === '..') {
                if (output.length > 1) {
                    output.pop();
                }
                else {
                    throw new RangeError(`SphereFS sandbox violation '${pathName}'`);
                }
            }
            else if (input[i] !== '.') {
                output.push(input[i]);
            }
        }
        return output.join('/');
    }
    static async launch() {
        document.title = `${Game.manifest.name} - ${Version.engine}`;
        document.getElementById('gameTitle').innerHTML = Game.manifest.name;
        document.getElementById('copyright').innerHTML = `game by ${Game.manifest.author}`;
        Galileo.rerez(Game.manifest.resolution.x, Game.manifest.resolution.y);
        const scriptURL = this.urlOf(this.manifest.mainPath);
        const main = await import(fullURL(scriptURL));
        if (isConstructor(main.default)) {
            const mainObject = new main.default();
            if (typeof mainObject.start === 'function')
                await mainObject.start();
        }
        else {
            await main.default();
        }
    }
    static urlOf(pathName) {
        const hops = pathName.split(/[\\/]+/);
        if (hops[0] !== '@' && hops[0] !== '#' && hops[0] !== '~' && hops[0] !== '$' && hops[0] !== '%')
            hops.unshift('@');
        if (hops[0] === '@') {
            hops.splice(0, 1);
            return `${this.rootPath}/${hops.join('/')}`;
        }
        else if (hops[0] === '#') {
            hops.splice(0, 1);
            return `assets/${hops.join('/')}`;
        }
        else {
            throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
        }
    }
}
export class Manifest {
    apiLevel;
    apiVersion;
    author;
    description;
    mainPath;
    name;
    resolution = { x: 320, y: 240 };
    saveID = "";
    static async fromFile(url) {
        const content = await Fido.fetchText(url);
        const values = {};
        for (const line of content.split(/\r?\n/)) {
            const lineParse = line.match(/(.*)=(.*)/);
            if (lineParse && lineParse.length === 3) {
                const key = lineParse[1];
                const value = lineParse[2];
                values[key] = value;
            }
        }
        return new this(values);
    }
    constructor(values) {
        this.name = values.name ?? "Untitled";
        this.author = values.author ?? "Unknown";
        this.description = values.description ?? "";
        this.apiVersion = parseInt(values.version ?? "1", 10);
        this.apiLevel = parseInt(values.api ?? "0", 10);
        this.mainPath = values.main ?? "";
        if (this.apiLevel > 0 || this.mainPath != "") {
            this.apiVersion = Math.max(this.apiVersion, 2);
            this.apiLevel = Math.max(this.apiLevel, 1);
        }
        if (this.apiVersion >= 2) {
            this.saveID = values.saveID ?? "";
            const resString = values.resolution ?? "";
            const resParse = resString.match(/(\d+)x(\d+)/);
            if (resParse && resParse.length === 3) {
                this.resolution = {
                    x: parseInt(resParse[1], 10),
                    y: parseInt(resParse[2], 10),
                };
            }
        }
        else {
            this.mainPath = values.script ?? "";
            this.resolution = {
                x: parseInt(values.screen_width ?? "320", 10),
                y: parseInt(values.screen_height ?? "240", 10),
            };
        }
        if (this.mainPath === "")
            throw Error("Game manifest doesn't specify a main script.");
    }
}
