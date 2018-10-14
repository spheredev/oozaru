/**
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2018, Fat Cerberus
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
 *  * Neither the name of miniSphere nor the names of its contributors may be
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

import EventLoop from './event-loop.js';
import * as galileo from './galileo.js';
import * as util from './utility.js';

const
	kTag = Symbol("internal use");

let
	s_eventLoop = new EventLoop(),
	s_mainObject = undefined;

export default
class Pegasus extends null
{
	static initializeGlobals()
	{
		Object.defineProperty(window, 'global', {
			writable: false,
			enumerable: false,
			configurable: false,
			value: window,
		});

		global.ShapeType = Object.freeze({
			Fan: 0,
			Lines: 1,
			LineLoop: 2,
			LineStrip: 3,
			Points: 4,
			Triangles: 5,
			TriStrip: 6,
		});

		global.Sphere = Sphere;
		global.Dispatch = Dispatch;
		global.SSj = SSj;
		global.Shader = Shader;
		global.Shape = Shape;
		global.Texture = Texture;
		global.Transform = Transform;
		global.VertexList = VertexList;
	}

	static async launchGame(dirName)
	{
		let fileName = `${dirName}/main.js`;
		let main = await import(fileName);
		if (typeof main.default === 'function') {
			if (main.default.constructor.name === 'AsyncFunction') {
				main.default();
			}
			else {
				s_mainObject = new main.default();
				if (typeof s_mainObject.start === 'function')
					s_mainObject.start();
			}
		}
		s_eventLoop.start();
	}
}

class Sphere extends null
{
	static get APILevel()
	{
		return 1;
	}

	static get Engine()
	{
		return "Oozaru X.X.X";
	}

	static get Version()
	{
		return 2;
	}

	static get main()
	{
		return s_mainObject;
	}

	static now()
	{
		return s_eventLoop.now();
	}
}

class Dispatch extends null
{
	static later(numFrames, callback)
	{
		let jobID = s_eventLoop.addJob('update', callback, false, numFrames);
		return new JobToken(jobID);
	}

	static now(callback)
	{
		let jobID = s_eventLoop.addJob('immediate', callback, false);
		return new JobToken(jobID);
	}

	static onRender(callback)
	{
		let jobID = s_eventLoop.addJob('render', callback, true);
		return new JobToken(jobID);
	}

	static onUpdate(callback)
	{
		let jobID = s_eventLoop.addJob('update', callback, true);
		return new JobToken(jobID);
	}
}

class JobToken
{
	get [Symbol.toStringTag]() { return 'JobToken'; }

	constructor(jobID)
	{
		this[kTag] = jobID;
	}

	cancel()
	{
		let jobID = this[kTag];
		s_eventLoop.cancelJob(jobID);
	}
}

class SSj extends null
{
	static log(object)
	{
		console.log(object);
	}
}

class Shader
{
	static get Default()
	{
		let shader = Object.create(this.prototype);
		shader[kTag] = galileo.Shader.Default;
		Object.defineProperty(this, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: shader,
		});
		return shader;
	}
}

class Shape
{
	constructor(type, texture, vertexList, indexList = null)
	{
		let tag = this[kTag] = {};
		tag.vertexList = vertexList;
		tag.indexList = indexList;
		tag.texture = texture;
	}

	draw(surface = null, transform = null)
	{
		let tag = this[kTag];
		if (transform !== null)
			transform = transform[kTag];
		let vbo = tag.vertexList[kTag];
		let texture = tag.texture !== null ? tag.texture[kTag] : null;
		let shader = galileo.Shader.Default;
		if (tag.indexList !== null) {
			let ibo = tag.indexList[kTag];
			shader.drawIndexed(vbo, ibo, texture, transform);
		}
		else {
			shader.draw(vbo, texture, transform);
		}
	}
}

class Texture
{
	static async fromFile(fileName)
	{
		let image = await util.loadImage(`game/${fileName}`);
		let texture = Object.create(this.prototype);
		texture[kTag] = new galileo.Texture(image);
		return texture;
	}
}

class Transform
{
	constructor()
	{
		this[kTag] = new galileo.Transform();
	}
}

class VertexList
{
	constructor(vertices)
	{
		this[kTag] = new galileo.VBO(vertices);
	}
}
