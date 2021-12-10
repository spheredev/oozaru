/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2015-2021, Fat Cerberus
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name of Spherical nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

import { Mixer, Sound, SoundStream } from './audialis.js';
import { DataStream } from './data-stream.js';
import Fido from './fido.js';
import Game from './game.js';
import * as Galileo from './galileo.js';
import { BlendOp, Color, DepthOp, ShapeType } from './galileo.js';
import InputEngine, { Key, Keyboard, Mouse, MouseKey } from './input-engine.js';
import { JobQueue, JobType } from './job-queue.js';
import { fetchJSON, fetchRawFile, fetchScript, fetchTextFile, fullURL, isConstructor } from './utilities.js';
import { Version } from './version.js';

enum DataType
{
	Bytes,
	Lines,
	Raw,
	Text,
}

enum FileOp
{
	Read,
	Update,
	Write,
}

interface JobOptions
{
	inBackground?: boolean;
	priority?: number;
}

interface ReadFileReturn
{
	[DataType.Bytes]: Uint8Array;
	[DataType.Lines]: string[];
	[DataType.Raw]: ArrayBuffer;
	[DataType.Text]: string;
}

interface ShaderOptions
{
	vertexFile: string;
	fragmentFile: string;
}

interface Vertex
{
	x: number;
	y: number;
	z?: number;
	u?: number;
	v?: number;
	color?: Color;
}

const console = globalThis.console;
const jobQueue = new JobQueue();

let defaultFont: Font;
let defaultShader: Shader;
let immediateVBO: Galileo.VertexBuffer;
let mainObject: { [x: string]: any } | undefined;

export default
class Pegasus
{
	static initialize()
	{
		immediateVBO = new Galileo.VertexBuffer();
	
		Object.defineProperty(globalThis, 'global', {
			writable: false,
			enumerable: false,
			configurable: false,
			value: globalThis,
		});
	
		// register Sphere v2 API globals
		Object.assign(globalThis, {
			// enumerations
			BlendOp,
			DataType,
			DepthOp,
			FileOp,
			Key,
			MouseKey,
			ShapeType,
	
			// classes and namespaces
			Sphere,
			Color,
			Dispatch,
			FS,
			FileStream,
			Font,
			IndexList,
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
			value: async function fromFile(fileName: string) {
				const url = Game.urlOf(fileName);
				return fetchJSON(url);
			},
		})
	}

	static async launchGame(rootPath: string)
	{
		// load the game's JSON manifest
		await Game.initialize(rootPath);
		Galileo.default.rerez(Game.manifest.resolution.x, Game.manifest.resolution.y);
		document.title = Game.manifest.name;
		document.getElementById('gameTitle')!.innerHTML = Game.manifest.name;
		document.getElementById('copyright')!.innerHTML = `game by ${Game.manifest.author}`;

		defaultFont = await Font.fromFile('#/default.rfn');
		defaultShader = await Shader.fromFiles({
			vertexFile: '#/default.vert.glsl',
			fragmentFile: '#/default.frag.glsl',
		});

		jobQueue.add(JobType.Render, () => {
			if (Fido.progress >= 1.0)
				return;
			const status = `fido: ${Math.floor(100.0 * Fido.progress)}% (${Fido.numJobs} files)`;
			const textSize = defaultFont.getTextSize(status);
			const x = Surface.Screen.width - textSize.width - 5;
			const y = Surface.Screen.height - textSize.height - 5;
			defaultFont.drawText(Surface.Screen, x + 1, y + 1, status, Color.Black);
			defaultFont.drawText(Surface.Screen, x, y, status, Color.Silver);
		}, true, Infinity);

		// start the Sphere v2 event loop
		jobQueue.start();

		await Game.launch();
	}
}

class Sphere
{
	static get APILevel()
	{
		return Version.apiLevel;
	}

	static get Compiler()
	{
		return undefined;
	}

	static get Engine()
	{
		return `${Version.name} ${Version.version}`;
	}

	static get Game()
	{
		return Game.manifest;
	}

	static get Version()
	{
		return Version.apiVersion;
	}

	static get frameRate()
	{
		return 60;
	}

	static get frameSkip()
	{
		return 0;
	}

	static get fullScreen()
	{
		return false;
	}

	static set frameRate(_value)
	{
		throw new Error(`Oozaru doesn't support setting the frame rate`);
	}

	static set frameSkip(_value)
	{
		throw new Error(`Oozaru doesn't support frameskip`);
	}

	static set fullScreen(value)
	{
		if (value !== false)
			throw new Error(`Oozaru doesn't yet support fullScreen mode`);
	}

	static get main()
	{
		return mainObject;
	}

	static now()
	{
		return jobQueue.now();
	}

	static sleep(numFrames: number)
	{
		return new Promise<void>(resolve => {
			jobQueue.add(JobType.Update, resolve, false, numFrames);
		});
	}

	static setResolution(width: number, height: number)
	{
		Galileo.default.rerez(width, height);
	}
}

class Dispatch
{
	static cancelAll()
	{
		throw new Error(`'Dispatch#cancelAll()' API is not implemented`);
	}

	static later(numFrames: number, callback: () => void)
	{
		const jobID = jobQueue.add(JobType.Update, callback, false, numFrames);
		return new JobToken(jobID);
	}

	static now(callback: () => void)
	{
		const jobID = jobQueue.add(JobType.Immediate, callback);
		return new JobToken(jobID);
	}

	static onRender(callback: () => void, options: JobOptions = {})
	{
		const jobID = jobQueue.add(JobType.Render, callback, true, options.priority);
		return new JobToken(jobID);
	}

	static onUpdate(callback: () => void, options: JobOptions = {})
	{
		const jobID = jobQueue.add(JobType.Update, callback, true, options.priority);
		return new JobToken(jobID);
	}
}

class FS
{
	static async evaluateScript(fileName: string)
	{
		const url = Game.urlOf(fileName);
		return fetchScript(url);
	}

	static async fileExists(pathName: string)
	{
		const url = Game.urlOf(pathName);
		try {
			const response = await fetch(url);
			return response.status === 200;
		}
		catch {
			return false;
		}
	}

	static fullPath(pathName: string, baseDirName: string)
	{
		return Game.fullPath(pathName, baseDirName);
	}

	static readFile(fileName: string): Promise<ReadFileReturn[DataType.Text]>;
	static readFile<T extends DataType>(fileName: string, dataType: T): Promise<ReadFileReturn[T]>;
	static async readFile(fileName: string, dataType = DataType.Text)
	{
		const url = Game.urlOf(fileName);
		switch (dataType) {
			case DataType.Bytes:
				const data = await fetchRawFile(url);
				return new Uint8Array(data);
			case DataType.Lines:
				const text = await fetchTextFile(url);
				return text.split(/\r?\n/);
			case DataType.Raw:
				return fetchRawFile(url);
			case DataType.Text:
				return fetchTextFile(url);
		}
	}
}

class FileStream
{
	fullPath: string;
	stream: DataStream | null;

	static async fromFile(fileName: string, fileOp: FileOp)
	{
		if (fileOp !== FileOp.Read)
			throw new RangeError(`Oozaru currently only supports FileStreams in read mode`);

		const url = Game.urlOf(fileName);
		const data = await fetchRawFile(url);
		const fileStream = Object.create(this.prototype) as FileStream;
		fileStream.fullPath = fileName;
		fileStream.stream = new DataStream(data);
		return fileStream;
	}

	constructor()
	{
		throw new RangeError(`new FileStream() with filename is not supported`);
	}

	get fileName()
	{
		return this.fullPath;
	}

	get fileSize()
	{
		if (this.stream === null)
			throw new Error(`The FileStream has already been disposed`);
		return this.stream.bufferSize;
	}

	get position()
	{
		if (this.stream === null)
			throw new Error(`The FileStream has already been disposed`);
		return this.stream.position;
	}

	set position(value)
	{
		if (this.stream === null)
			throw new Error(`The FileStream has already been disposed`);
		this.stream.position = value;
	}

	dispose()
	{
		this.stream = null;
	}

	read(numBytes: number)
	{
		if (this.stream === null)
			throw new Error(`The FileStream has already been disposed`);
		return this.stream.readBytes(numBytes).buffer;
	}

	write(_data: BufferSource)
	{
		if (this.stream === null)
			throw Error(`The FileStream has already been disposed`);
		throw Error(`Oozaru doesn't yet support FileStream#write()`);
	}
}

class Font
{
	static get Default()
	{
		Object.defineProperty(Font, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: defaultFont,
		});
		return defaultFont;
	}

	font: Galileo.Font;

	static async fromFile(fileName: string)
	{
		const url = Game.urlOf(fileName);
		const font = await Galileo.Font.fromFile(url);
		const object = Object.create(this.prototype) as Font;
		object.font = font;
		return object;
	}

	constructor(fileName: string)
	{
		throw new Error("'new Font()' from filename is not supported under Oozaru.");
	}

	get height()
	{
		return this.font.height;
	}

	drawText(surface: Surface, x: number, y: number, text: any, color = Color.White, wrapWidth?: number)
	{
		const matrix = Galileo.Matrix.Identity.translate(Math.trunc(x), Math.trunc(y));
		surface.drawTarget.activate();
		Shader.Default.program.activate(false);
		Shader.Default.program.project(surface.projection.matrix);
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(String(text), wrapWidth);
			for (let i = 0, len = lines.length; i < len; ++i) {
				this.font.drawText(lines[i], color, matrix);
				matrix.translate(0, this.font.height);
			}
		}
		else {
			this.font.drawText(String(text), color, matrix);
		}
	}

	getTextSize(text: any, wrapWidth?: number)
	{
		return this.font.getTextSize(String(text), wrapWidth);
	}

	heightOf(text: any, wrapWidth?: number)
	{
		return this.font.heightOf(String(text), wrapWidth);
	}

	widthOf(text: any)
	{
		return this.font.widthOf(String(text));
	}

	wordWrap(text: any, wrapWidth: number)
	{
		return this.font.wordWrap(String(text), wrapWidth);
	}
}

class IndexList
{
	buffer: Galileo.IndexBuffer;

	constructor(indices: Iterable<number>)
	{
		this.buffer = new Galileo.IndexBuffer(indices);
	}
}

class JobToken
{
	jobID: number;

	constructor(jobID: number)
	{
		this.jobID = jobID;
	}

	cancel()
	{
		jobQueue.cancel(this.jobID);
	}

	pause()
	{
		jobQueue.pause(this.jobID, true);
	}

	resume()
	{
		jobQueue.pause(this.jobID, false);
	}
}

class Joystick
{
	static get P1()
	{
		return memoize(this, 'P1', new Joystick());
	}

	static get P2()
	{
		return memoize(this, 'P2', new Joystick());
	}

	static get P3()
	{
		return memoize(this, 'P3', new Joystick());
	}

	static get P4()
	{
		return memoize(this, 'P4', new Joystick());
	}

	static getDevices()
	{
		return [];
	}

	get name()
	{
		return "null joystick";
	}

	get numAxes()
	{
		return 0;
	}

	get numButtons()
	{
		return 0;
	}

	getPosition()
	{
		return 0.0;
	}

	isPressed()
	{
		return false;
	}
}

class Model
{
	private shapes: Shape[];
	private shader_: Shader;
	private transform_: Transform;

	constructor(shapes: Iterable<Shape>, shader = Shader.Default)
	{
		this.shapes = [ ...shapes ];
		this.shader_ = shader;
		this.transform_ = new Transform();
	}

	get shader()
	{
		return this.shader_;
	}
	set shader(value)
	{
		this.shader_ = value;
	}

	get transform()
	{
		return this.transform_;
	}
	set transform(value)
	{
		this.transform_ = value;
	}

	draw(surface = Surface.Screen)
	{
		surface.drawTarget.activate();
		this.shader_.program.project(surface.projection.matrix);
		this.shader_.program.transform(this.transform_.matrix);
		for (const shape of this.shapes) {
			this.shader_.program.activate(shape.texture !== null);
			if (shape.texture !== null)
				shape.texture.texture.activate(0);
			shape.shape.draw();
		}
	}
}

class RNG
{
	static fromSeed(seed: number)
	{
		return new RNG();
	}
	
	static fromState(state: string)
	{
		return new RNG();
	}

	constructor()
	{
	}

	[Symbol.iterator](): Iterator<number>
	{
		return this;
	}

	get state()
	{
		return "";
	}

	set state(value: string)
	{
	}

	next(): IteratorResult<number>
	{
		return { done: false, value: Math.random() };
	}
}

class SSj
{
	static log(object: any)
	{
		console.log(object);
	}

	static now()
	{
		return performance.now() / 1000.0;
	}
}

class Shader
{
	fragmentSource: string;
	program: Galileo.Shader;
	vertexSource: string;

	static get Default()
	{
		Object.defineProperty(Shader, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: defaultShader,
		});
		return defaultShader;
	}

	static async fromFiles(options: ShaderOptions)
	{
		const vertexURL = Game.urlOf(options.vertexFile);
		const fragmentURL = Game.urlOf(options.fragmentFile);
		const shader = Object.create(this.prototype) as Shader;
		const [ vertexSource, fragmentSource ] = await Promise.all([
			fetchTextFile(vertexURL),
			fetchTextFile(fragmentURL)
		]);
		shader.program = new Galileo.Shader(vertexSource, fragmentSource);
		shader.vertexSource = vertexSource;
		shader.fragmentSource = fragmentSource;
		return shader;
	}

	constructor(options: ShaderOptions)
	{
		throw new RangeError("new Shader() with filename is not supported");
	}

	clone()
	{
		const dolly = Object.create(Object.getPrototypeOf(this)) as Shader;
		dolly.vertexSource = this.vertexSource;
		dolly.fragmentSource = this.fragmentSource;
		dolly.program = new Galileo.Shader(dolly.vertexSource, dolly.fragmentSource);
		return dolly;
	}

	setBoolean(name: string, value: boolean)
	{
		this.program.setBoolValue(name, value);
	}

	setColorVector(name: string, value: Color)
	{
		this.program.setFloatVec(name, [
			value.r,
			value.g,
			value.b,
			value.a
		]);
	}

	setFloat(name: string, value: number)
	{
		this.program.setFloatValue(name, value);
	}

	setFloatArray(name: string, values: number[])
	{
		this.program.setFloatArray(name, values);
	}

	setFloatVector(name: string, values: number[])
	{
		this.program.setFloatVec(name, values);
	}

	setInt(name: string, value: number)
	{
		this.program.setIntValue(name, value);
	}

	setIntArray(name: string, values: number[])
	{
		this.program.setIntArray(name, values);
	}

	setIntVector(name: string, values: number[])
	{
		this.program.setIntVec(name, values);
	}

	setMatrix(name: string, value: Transform)
	{
		this.program.setMatrixValue(name, value.matrix);
	}
}

class Shape
{
	texture: Texture | null;
	indexList: IndexList | null;
	shape: Galileo.Shape;

	static drawImmediate(surface: Surface, type: Galileo.ShapeType, texture: Texture | null, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: Galileo.ShapeType, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: Galileo.ShapeType, arg1: Texture | ArrayLike<Vertex> | null, arg2?: ArrayLike<Vertex>)
	{
		surface.drawTarget.activate();
		if (arg1 instanceof Texture || arg1 === null) {
			Shader.Default.program.activate(arg1 !== null);
			Shader.Default.program.project(surface.projection.matrix);
			Shader.Default.program.transform(Galileo.Matrix.Identity);
			if (arg1 !== null)
				arg1.texture.activate(0);
			immediateVBO.upload(arg2 as ArrayLike<Vertex>);
			Galileo.default.draw(immediateVBO, null, type);
		}
		else {
			Shader.Default.program.activate(false);
			Shader.Default.program.project(surface.projection.matrix);
			Shader.Default.program.transform(Galileo.Matrix.Identity);
			immediateVBO.upload(arg1);
			Galileo.default.draw(immediateVBO, null, type);
		}
	}

	constructor(type: Galileo.ShapeType, texture: Texture | null, vbo: VertexList, indexList?: IndexList | null)
	constructor(type: Galileo.ShapeType, vbo: VertexList, indexList?: IndexList | null)
	constructor(arg0: Galileo.ShapeType, arg1: Texture | VertexList | null, arg2: VertexList | IndexList | null = null, arg3: IndexList | null = null)
	{
		if (arg2 instanceof VertexList) {
			if (!(arg1 instanceof Texture) && arg1 != undefined)
				throw new Error("Expected Texture or null as second parameter to new Shape");
			const vbo = arg2.buffer;
			const ibo = arg3 !== null ? arg3.buffer : null;
			this.shape = new Galileo.Shape(vbo, ibo, arg0);
			this.texture = arg1;
			this.indexList = arg3;
		}
		else {
			if (!(arg1 instanceof VertexList))
				throw new Error("Expected VertexList or Texture as second parameter to new Shape");
			let vbo = arg1.buffer;
			const ibo = arg2 !== null ? arg2.buffer : null;
			this.shape = new Galileo.Shape(vbo, ibo, arg0);
			this.texture = null;
			this.indexList = arg2;
		}
	}

	draw(surface = Surface.Screen, transform = Transform.Identity, shader = Shader.Default)
	{
		surface.drawTarget.activate();
		shader.program.activate(this.texture !== null);
		shader.program.project(surface.projection.matrix);
		shader.program.transform(transform.matrix);
		if (this.texture !== null)
			this.texture.texture.activate(0);
		this.shape.draw();
	}
}

class Texture
{
	hasLoaded = false;
	texture: Galileo.Texture;

	static async fromFile(fileName: string)
	{
		const url = Game.urlOf(fileName);
		const image = await Fido.fetchImage(url);
		return new Texture(image);
	}

	constructor(fileName: string);
	constructor(width: number, height: number, content?: BufferSource | Color);
	constructor(image: HTMLImageElement);
	constructor(...args: [ any, any?, any? ])
	{
		if (typeof args[0] === 'string') {
			throw new RangeError("new Texture() with filename is not supported");
		}
		else if (args[0] instanceof HTMLImageElement) {
			const image = args[0];
			this.texture = new Galileo.Texture(image);
			this.hasLoaded = true;
		}
		else {
			const width: number = args[0];
			const height: number = args[1];
			const content: ArrayBufferView | Color | undefined = args[2];
			this.texture = new Galileo.Texture(width, height, content);
			this.hasLoaded = true;
		}
	}

	get height()
	{
		return this.texture.height;
	}

	get width()
	{
		return this.texture.width;
	}
}

class Surface extends Texture
{
	drawTarget: Galileo.DrawTarget;
	projection: Transform;

	static get Screen()
	{
		const drawTarget = Galileo.DrawTarget.Screen;
		const surface = Object.create(Surface.prototype) as Surface;
		surface.drawTarget = drawTarget;
		surface.projection = new Transform()
			.project2D(0, 0, drawTarget.width, drawTarget.height);
		Object.defineProperty(this, 'Screen', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: surface,
		});
		return surface;
	}

	constructor(width: number, height: number, content?: BufferSource | Color);
	constructor(image: HTMLImageElement);
	constructor(...args: [ any, any?, any? ])
	{
		super(...args);

		this.drawTarget = new Galileo.DrawTarget(this.texture);
		this.projection = new Transform()
			.project2D(0, 0, this.drawTarget.width, this.drawTarget.height);
	}

	get blendOp()
	{
		return this.drawTarget.blendOp;
	}
	set blendOp(value)
	{
		this.drawTarget.blendOp = value;
	}

	get depthOp()
	{
		return this.drawTarget.depthOp;
	}
	set depthOp(value)
	{
		this.drawTarget.depthOp = value;
	}

	get height()
	{
		return this.drawTarget.height;
	}

	get transform()
	{
		return this.projection;
	}
	set transform(value)
	{
		this.projection = value;
	}

	get width()
	{
		return this.drawTarget.width;
	}

	clipTo(x: number, y: number, width: number, height: number)
	{
		this.drawTarget.clipTo(x, y, width, height);
	}
}

class Transform
{
	matrix: Galileo.Matrix;

	static get Identity()
	{
		let transform = new this();
		return transform;
	}

	constructor()
	{
		this.matrix = new Galileo.Matrix();
		this.matrix.identity();
	}

	compose(transform: Transform)
	{
		this.matrix.composeWith(transform.matrix);
		return this;
	}

	identity()
	{
		this.matrix.identity();
		return this;
	}

	project2D(left: number, top: number, right: number, bottom: number, near = -1.0, far = 1.0)
	{
		this.matrix.ortho(left, top, right, bottom, near, far);
		return this;
	}

	project3D(fov: number, aspect: number, near: number, far: number)
	{
		const fh = Math.tan(fov * Math.PI / 360.0) * near;
		const fw = fh * aspect;
		this.matrix.perspective(-fw, -fh, fw, fh, near, far);
		return this;
	}

	rotate(angle: number, vX = 0.0, vY = 0.0, vZ = 1.0)
	{
		// normalize the rotation axis vector
		const norm = Math.sqrt(vX * vX + vY * vY + vZ * vZ);
		if (norm > 0.0) {
			vX = vX / norm;
			vY = vY / norm;
			vZ = vZ / norm;
		}

		// convert degrees to radians
		const theta = angle * Math.PI / 180.0;

		this.matrix.rotate(theta, vX, vY, vZ);
		return this;
	}

	scale(sX: number, sY: number, sZ = 1.0)
	{
		this.matrix.scale(sX, sY, sZ);
		return this;
	}

	translate(tX: number, tY: number, tZ = 0.0)
	{
		this.matrix.translate(tX, tY, tZ);
		return this;
	}
}

class VertexList
{
	buffer: Galileo.VertexBuffer;

	constructor(vertices: Iterable<Vertex>)
	{
		this.buffer = new Galileo.VertexBuffer([ ...vertices ]);
	}
}

function memoize(object: object, key: PropertyKey, value: unknown)
{
	Object.defineProperty(object, key, {
		writable: false,
		enumerable: false,
		configurable: true,
		value,
	});
	return value;
}
