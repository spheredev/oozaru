import { Mixer, Sound, SoundStream } from './audialis.js';
import { DataStream } from './data-stream.js';
import Fido from './fido.js';
import { Font } from './fontso.js';
import Game from './game.js';
import Galileo, { BlendOp, Color, DepthOp, IndexList, Model, Shader, Shape, ShapeType, Surface, Texture, Transform, VertexList } from './galileo.js';
import { Joystick, Key, Keyboard, Mouse, MouseKey } from './input-engine.js';
import JobQueue, { Dispatch, JobToken, JobType } from './job-queue.js';
import { Version } from './version.js';
var DataType;
(function (DataType) {
    DataType[DataType["Bytes"] = 0] = "Bytes";
    DataType[DataType["JSON"] = 1] = "JSON";
    DataType[DataType["Lines"] = 2] = "Lines";
    DataType[DataType["Raw"] = 3] = "Raw";
    DataType[DataType["Text"] = 4] = "Text";
})(DataType || (DataType = {}));
var FileOp;
(function (FileOp) {
    FileOp[FileOp["Read"] = 0] = "Read";
    FileOp[FileOp["Update"] = 1] = "Update";
    FileOp[FileOp["Write"] = 2] = "Write";
})(FileOp || (FileOp = {}));
const console = globalThis.console;
var mainObject;
export default class Pegasus {
    static initialize() {
        Object.defineProperty(globalThis, 'global', {
            writable: false,
            enumerable: false,
            configurable: false,
            value: globalThis,
        });
        Object.assign(globalThis, {
            BlendOp,
            DataType,
            DepthOp,
            FileOp,
            JobType,
            Key,
            MouseKey,
            ShapeType,
            Sphere,
            Color,
            Dispatch,
            FS,
            FileStream,
            Font,
            IndexList,
            JobToken,
            Joystick,
            Keyboard,
            Mixer,
            Model,
            Mouse,
            RNG,
            SSj,
            Shader,
            Shape,
            Sound,
            SoundStream,
            Surface,
            Texture,
            Transform,
            VertexList,
        });
        Object.defineProperty(JSON, 'fromFile', {
            writable: true,
            enumerable: false,
            configurable: true,
            value: async function fromFile(fileName) {
                const url = Game.urlOf(fileName);
                const text = await Fido.fetchText(url);
                return JSON.parse(text);
            },
        });
    }
    static async launchGame(rootPath) {
        await Game.initialize(rootPath);
        Dispatch.onRender(() => {
            if (Fido.numJobs === 0)
                return;
            const status = Fido.progress < 1.0
                ? `${Math.floor(100.0 * Fido.progress)}% - ${Fido.numJobs} files`
                : `loading ${Fido.numJobs} files`;
            const textSize = Font.Default.getTextSize(status);
            const x = Surface.Screen.width - textSize.width - 5;
            const y = Surface.Screen.height - textSize.height - 5;
            Font.Default.drawText(Surface.Screen, x + 1, y + 1, status, Color.Black);
            Font.Default.drawText(Surface.Screen, x, y, status, Color.Silver);
        }, {
            inBackground: true,
            priority: Infinity,
        });
        JobQueue.start();
        await Game.launch();
    }
}
class Sphere {
    static get APILevel() {
        return Version.apiLevel;
    }
    static get Compiler() {
        return undefined;
    }
    static get Engine() {
        return `${Version.engine} ${Version.version}`;
    }
    static get Game() {
        return Game.manifest;
    }
    static get Version() {
        return Version.apiVersion;
    }
    static get frameRate() {
        return 60;
    }
    static get frameSkip() {
        return 0;
    }
    static get fullScreen() {
        return false;
    }
    static set frameRate(_value) {
        throw new Error(`Oozaru doesn't support setting the frame rate`);
    }
    static set frameSkip(_value) {
        throw new Error(`Oozaru doesn't support frameskip`);
    }
    static set fullScreen(value) {
        if (value !== false)
            throw new Error(`Oozaru doesn't yet support fullScreen mode`);
    }
    static get main() {
        return mainObject;
    }
    static now() {
        return JobQueue.now();
    }
    static sleep(numFrames) {
        return new Promise(resolve => {
            Dispatch.later(numFrames, resolve);
        });
    }
    static setResolution(width, height) {
        Galileo.rerez(width, height);
    }
}
class FS {
    static async evaluateScript(fileName) {
        const url = Game.urlOf(fileName);
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.onload = () => {
                resolve();
                script.remove();
            };
            script.onerror = () => {
                reject(Error(`Oozaru was unable to load '${url}' as a script`));
                script.remove();
            };
            script.src = url;
            document.head.appendChild(script);
        });
    }
    static async fileExists(pathName) {
        const url = Game.urlOf(pathName);
        try {
            const response = await fetch(url);
            return response.status === 200;
        }
        catch {
            return false;
        }
    }
    static fullPath(pathName, baseDirName) {
        return Game.fullPath(pathName, baseDirName);
    }
    static async readFile(fileName, dataType = DataType.Text) {
        const url = Game.urlOf(fileName);
        switch (dataType) {
            case DataType.Bytes:
                const data = await Fido.fetchData(url);
                return new Uint8Array(data);
            case DataType.JSON:
                return Fido.fetchJSON(url);
            case DataType.Lines:
                const text = await Fido.fetchText(url);
                return text.split(/\r?\n/);
            case DataType.Raw:
                return Fido.fetchData(url);
            case DataType.Text:
                return Fido.fetchText(url);
        }
    }
}
class FileStream {
    fullPath;
    stream;
    static async fromFile(fileName, fileOp) {
        if (fileOp !== FileOp.Read)
            throw new RangeError(`Oozaru currently only supports FileStreams in read mode`);
        const url = Game.urlOf(fileName);
        const data = await Fido.fetchData(url);
        const fileStream = Object.create(this.prototype);
        fileStream.fullPath = fileName;
        fileStream.stream = new DataStream(data);
        return fileStream;
    }
    constructor() {
        throw new RangeError(`new FileStream() is not supported under Oozaru.`);
    }
    get fileName() {
        return this.fullPath;
    }
    get fileSize() {
        if (this.stream === null)
            throw new Error(`The FileStream has already been disposed`);
        return this.stream.bufferSize;
    }
    get position() {
        if (this.stream === null)
            throw new Error(`The FileStream has already been disposed`);
        return this.stream.position;
    }
    set position(value) {
        if (this.stream === null)
            throw new Error(`The FileStream has already been disposed`);
        this.stream.position = value;
    }
    dispose() {
        this.stream = null;
    }
    read(numBytes) {
        if (this.stream === null)
            throw new Error(`The FileStream has already been disposed`);
        return this.stream.readBytes(numBytes).buffer;
    }
    write(_data) {
        if (this.stream === null)
            throw Error(`The FileStream has already been disposed`);
        throw Error(`Oozaru doesn't yet support FileStream#write()`);
    }
}
class RNG {
    static fromSeed(seed) {
        return new RNG();
    }
    static fromState(state) {
        return new RNG();
    }
    constructor() {
    }
    [Symbol.iterator]() {
        return this;
    }
    get state() {
        return "";
    }
    set state(value) {
    }
    next() {
        return { done: false, value: Math.random() };
    }
}
class SSj {
    static log(object) {
        console.log(object);
    }
    static now() {
        return performance.now() / 1000.0;
    }
}
