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
import { BlendOp, Color, DepthOp, Font, IndexList, Model, Shader, Shape, ShapeType, Surface, Texture, Transform, VertexList } from './galileo.js';
import InputEngine, { Joystick, Key, Keyboard, Mouse, MouseKey } from './input-engine.js';
import { JobQueue, JobType } from './job-queue.js';
import { fetchScript } from './utilities.js';
import { Version } from './version.js';

enum DataType
{
	Bytes,
	JSON,
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
	[DataType.JSON]: any;
	[DataType.Lines]: string[];
	[DataType.Raw]: ArrayBuffer;
	[DataType.Text]: string;
}

const console = globalThis.console;
const jobQueue = new JobQueue();

var mainObject: { [x: string]: any } | undefined;

export default
class Pegasus
{
	static initialize()
	{
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
				const text = await Fido.fetchText(url);
				return JSON.parse(text);
			},
		})
	}

	static async launchGame(rootPath: string)
	{
		// load the game's JSON manifest
		await Game.initialize(rootPath);

		jobQueue.add(JobType.Render, () => {
			if (Fido.progress >= 1.0)
				return;
			const status = `fido: ${Math.floor(100.0 * Fido.progress)}% (${Fido.numJobs} files)`;
			const textSize = Font.Default.getTextSize(status);
			const x = Surface.Screen.width - textSize.width - 5;
			const y = Surface.Screen.height - textSize.height - 5;
			Font.Default.drawText(Surface.Screen, x + 1, y + 1, status, Color.Black);
			Font.Default.drawText(Surface.Screen, x, y, status, Color.Silver);
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

class FileStream
{
	fullPath: string;
	stream: DataStream | null;

	static async fromFile(fileName: string, fileOp: FileOp)
	{
		if (fileOp !== FileOp.Read)
			throw new RangeError(`Oozaru currently only supports FileStreams in read mode`);

		const url = Game.urlOf(fileName);
		const data = await Fido.fetchData(url);
		const fileStream = Object.create(this.prototype) as FileStream;
		fileStream.fullPath = fileName;
		fileStream.stream = new DataStream(data);
		return fileStream;
	}

	constructor()
	{
		throw new RangeError(`new FileStream() is not supported under Oozaru.`);
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
