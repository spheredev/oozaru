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

import * as galileo from './galileo.js';
import * as util from './utility.js';

let
	s_defaultShader,
	s_eventLoop;

export default
class Pegasus
{
	static async initialize(global, eventLoop)
	{
		s_eventLoop = eventLoop;

		let vertSource = await (await fetch('shaders/default.vert.glsl')).text();
		let fragSource = await (await fetch('shaders/default.frag.glsl')).text();
		s_defaultShader = new galileo.Shader(vertSource, fragSource);

		Object.defineProperty(global, 'global', {
			writable: false,
			enumerable: false,
			configurable: false,
			value: global,
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
		global.Shader = Shader;
		global.Shape = Shape;
		global.Texture = Texture;
		global.Transform = Transform;
		global.VertexList = VertexList;
	}
}

class Sphere
{
	static get Engine() { return "Oozaru X.X.X"; }
	static get Version() { return 2; }
	static get APILevel() { return 1; }

	static now()
	{
		return s_eventLoop.now();
	}
}

class Dispatch
{
	static now(callback)
	{
		s_eventLoop.addJob('immediate', callback, false);
	}

	static onRender(callback)
	{
		s_eventLoop.addJob('render', callback, true);
	}

	static onUpdate(callback)
	{
		s_eventLoop.addJob('update', callback, true);
	}
}

class Shader
{
	static get Default()
	{
		let shader = Object.create(this.prototype);
		shader.shader = s_defaultShader;
		Object.defineProperty(this, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: shader,
		});
	}
}

class Shape
{
	constructor(type, texture, vertexList, indexList = null)
	{
		this.vertexList = vertexList;
		this.indexList = indexList;
		this.texture = texture;
	}

	draw(surface = null, transform = null)
	{
		if (transform !== null)
			transform = transform.transform;
		if (this.indexList !== null)
			s_defaultShader.drawIndexed(this.vertexList.vbo, this.indexList.ibo, this.texture.texture, transform);
		else
			s_defaultShader.draw(this.vertexList.vbo, this.texture.texture, transform);
	}
}

class Texture
{
	static async fromFile(fileName)
	{
		let image = await util.loadImage(`game/${fileName}`);
		let o = Object.create(this.prototype);
		o.texture = new galileo.Texture(image);
		return o;
	}
}

class Transform
{
	constructor()
	{
		this.transform = new galileo.Transform();
	}
}

class VertexList
{
	constructor(vertices)
	{
		this.vbo = new galileo.VBO(vertices);
	}
}
