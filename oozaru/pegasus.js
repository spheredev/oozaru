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

// note: predefined colors encoded in 8-bit RGBA (not float) because this whole table was
//       copied and pasted from miniSphere and I was too lazy to convert it.
const COLOR_TABLE =
[
	[ 1, "AliceBlue", 240, 248, 255, 255 ],
	[ 1, "AntiqueWhite", 250, 235, 215, 255 ],
	[ 1, "Aqua", 0, 255, 255, 255 ],
	[ 1, "Aquamarine", 127, 255, 212, 255 ],
	[ 1, "Azure", 240, 255, 255, 255 ],
	[ 1, "Beige", 245, 245, 220, 255 ],
	[ 1, "Bisque", 255, 228, 196, 255 ],
	[ 1, "Black", 0, 0, 0, 255 ],
	[ 1, "BlanchedAlmond", 255, 235, 205, 255 ],
	[ 1, "Blue", 0, 0, 255, 255 ],
	[ 1, "BlueViolet", 138, 43, 226, 255 ],
	[ 1, "Brown", 165, 42, 42, 255 ],
	[ 1, "BurlyWood", 222, 184, 135, 255 ],
	[ 1, "CadetBlue", 95, 158, 160, 255 ],
	[ 1, "Chartreuse", 127, 255, 0, 255 ],
	[ 1, "Chocolate", 210, 105, 30, 255 ],
	[ 1, "Coral", 255, 127, 80, 255 ],
	[ 1, "CornflowerBlue", 100, 149, 237, 255 ],
	[ 1, "Cornsilk", 255, 248, 220, 255 ],
	[ 1, "Crimson", 220, 20, 60, 255 ],
	[ 1, "Cyan", 0, 255, 255, 255 ],
	[ 1, "DarkBlue", 0, 0, 139, 255 ],
	[ 1, "DarkCyan", 0, 139, 139, 255 ],
	[ 1, "DarkGoldenrod", 184, 134, 11, 255 ],
	[ 1, "DarkGray", 169, 169, 169, 255 ],
	[ 1, "DarkGreen", 0, 100, 0, 255 ],
	[ 1, "DarkKhaki", 189, 183, 107, 255 ],
	[ 1, "DarkMagenta", 139, 0, 139, 255 ],
	[ 1, "DarkOliveGreen", 85, 107, 47, 255 ],
	[ 1, "DarkOrange", 255, 140, 0, 255 ],
	[ 1, "DarkOrchid", 153, 50, 204, 255 ],
	[ 1, "DarkRed", 139, 0, 0, 255 ],
	[ 1, "DarkSalmon", 233, 150, 122, 255 ],
	[ 1, "DarkSeaGreen", 143, 188, 143, 255 ],
	[ 1, "DarkSlateBlue", 72, 61, 139, 255 ],
	[ 1, "DarkSlateGray", 47, 79, 79, 255 ],
	[ 1, "DarkTurquoise", 0, 206, 209, 255 ],
	[ 1, "DarkViolet", 148, 0, 211, 255 ],
	[ 1, "DeepPink", 255, 20, 147, 255 ],
	[ 1, "DeepSkyBlue", 0, 191, 255, 255 ],
	[ 1, "DimGray", 105, 105, 105, 255 ],
	[ 1, "DodgerBlue", 30, 144, 255, 255 ],
	[ 1, "FireBrick", 178, 34, 34, 255 ],
	[ 1, "FloralWhite", 255, 250, 240, 255 ],
	[ 1, "ForestGreen", 34, 139, 34, 255 ],
	[ 1, "Fuchsia", 255, 0, 255, 255 ],
	[ 1, "Gainsboro", 220, 220, 220, 255 ],
	[ 1, "GhostWhite", 248, 248, 255, 255 ],
	[ 1, "Gold", 255, 215, 0, 255 ],
	[ 1, "Goldenrod", 218, 165, 32, 255 ],
	[ 1, "Gray", 128, 128, 128, 255 ],
	[ 1, "Green", 0, 128, 0, 255 ],
	[ 1, "GreenYellow", 173, 255, 47, 255 ],
	[ 1, "Honeydew", 240, 255, 240, 255 ],
	[ 1, "HotPink", 255, 105, 180, 255 ],
	[ 1, "IndianRed", 205, 92, 92, 255 ],
	[ 1, "Indigo", 75, 0, 130, 255 ],
	[ 1, "Ivory", 255, 255, 240, 255 ],
	[ 1, "Khaki", 240, 230, 140, 255 ],
	[ 1, "Lavender", 230, 230, 250, 255 ],
	[ 1, "LavenderBlush", 255, 240, 245, 255 ],
	[ 1, "LawnGreen", 124, 252, 0, 255 ],
	[ 1, "LemonChiffon", 255, 250, 205, 255 ],
	[ 1, "LightBlue", 173, 216, 230, 255 ],
	[ 1, "LightCoral", 240, 128, 128, 255 ],
	[ 1, "LightCyan", 224, 255, 255, 255 ],
	[ 1, "LightGoldenrodYellow", 250, 250, 210, 255 ],
	[ 1, "LightGray", 211, 211, 211, 255 ],
	[ 1, "LightGreen", 144, 238, 144, 255 ],
	[ 1, "LightPink", 255, 182, 193, 255 ],
	[ 1, "LightSalmon", 255, 160, 122, 255 ],
	[ 1, "LightSeaGreen", 32, 178, 170, 255 ],
	[ 1, "LightSkyBlue", 135, 206, 250, 255 ],
	[ 1, "LightSlateGray", 119, 136, 153, 255 ],
	[ 1, "LightSteelBlue", 176, 196, 222, 255 ],
	[ 1, "LightYellow", 255, 255, 224, 255 ],
	[ 1, "Lime", 0, 255, 0, 255 ],
	[ 1, "LimeGreen", 50, 205, 50, 255 ],
	[ 1, "Linen", 250, 240, 230, 255 ],
	[ 1, "Magenta", 255, 0, 255, 255 ],
	[ 1, "Maroon", 128, 0, 0, 255 ],
	[ 1, "MediumAquamarine", 102, 205, 170, 255 ],
	[ 1, "MediumBlue", 0, 0, 205, 255 ],
	[ 1, "MediumOrchid", 186, 85, 211, 255 ],
	[ 1, "MediumPurple", 147, 112, 219, 255 ],
	[ 1, "MediumSeaGreen", 60, 179, 113, 255 ],
	[ 1, "MediumSlateBlue", 123, 104, 238, 255 ],
	[ 1, "MediumSpringGreen", 0, 250, 154, 255 ],
	[ 1, "MediumTurquoise", 72, 209, 204, 255 ],
	[ 1, "MediumVioletRed", 199, 21, 133, 255 ],
	[ 1, "MidnightBlue", 25, 25, 112, 255 ],
	[ 1, "MintCream", 245, 255, 250, 255 ],
	[ 1, "MistyRose", 255, 228, 225, 255 ],
	[ 1, "Moccasin", 255, 228, 181, 255 ],
	[ 1, "NavajoWhite", 255, 222, 173, 255 ],
	[ 1, "Navy", 0, 0, 128, 255 ],
	[ 1, "OldLace", 253, 245, 230, 255 ],
	[ 1, "Olive", 128, 128, 0, 255 ],
	[ 1, "OliveDrab", 107, 142, 35, 255 ],
	[ 1, "Orange", 255, 165, 0, 255 ],
	[ 1, "OrangeRed", 255, 69, 0, 255 ],
	[ 1, "Orchid", 218, 112, 214, 255 ],
	[ 1, "PaleGoldenrod", 238, 232, 170, 255 ],
	[ 1, "PaleGreen", 152, 251, 152, 255 ],
	[ 1, "PaleTurquoise", 175, 238, 238, 255 ],
	[ 1, "PaleVioletRed", 219, 112, 147, 255 ],
	[ 1, "PapayaWhip", 225, 239, 213, 255 ],
	[ 1, "PeachPuff", 255, 218, 185, 255 ],
	[ 1, "Peru", 205, 133, 63, 255 ],
	[ 1, "Pink", 255, 192, 203, 255 ],
	[ 1, "Plum", 221, 160, 221, 255 ],
	[ 1, "PowderBlue", 176, 224, 230, 255 ],
	[ 1, "Purple", 128, 0, 128, 255 ],
	[ 1, "Red", 255, 0, 0, 255 ],
	[ 1, "RosyBrown", 188, 143, 143, 255 ],
	[ 1, "RoyalBlue", 65, 105, 225, 255 ],
	[ 1, "SaddleBrown", 139, 69, 19, 255 ],
	[ 1, "Salmon", 250, 128, 114, 255 ],
	[ 1, "SandyBrown", 244, 164, 96, 255 ],
	[ 1, "SeaGreen", 46, 139, 87, 255 ],
	[ 1, "Seashell", 255, 245, 238, 255 ],
	[ 1, "Sienna", 160, 82, 45, 255 ],
	[ 1, "Silver", 192, 192, 192, 255 ],
	[ 1, "SkyBlue", 135, 206, 235, 255 ],
	[ 1, "SlateBlue", 106, 90, 205, 255 ],
	[ 1, "SlateGray", 112, 128, 144, 255 ],
	[ 1, "Snow", 255, 250, 250, 255 ],
	[ 1, "SpringGreen", 0, 255, 127, 255 ],
	[ 1, "SteelBlue", 70, 130, 180, 255 ],
	[ 1, "Tan", 210, 180, 140, 255 ],
	[ 1, "Teal", 0, 128, 128, 255 ],
	[ 1, "Thistle", 216, 191, 216, 255 ],
	[ 1, "Tomato", 255, 99, 71, 255 ],
	[ 1, "Transparent", 0, 0, 0, 0 ],
	[ 1, "Turquoise", 64, 224, 208, 255 ],
	[ 1, "Violet", 238, 130, 238, 255 ],
	[ 1, "Wheat", 245, 222, 179, 255 ],
	[ 1, "White", 255, 255, 255, 255 ],
	[ 1, "WhiteSmoke", 245, 245, 245, 255 ],
	[ 1, "Yellow", 255, 255, 0, 255 ],
	[ 1, "YellowGreen", 154, 205, 50, 255 ],
	[ 2, "PurwaBlue", 155, 225, 255, 255 ],
	[ 2, "RebeccaPurple", 102, 51, 153, 255 ],
	[ 2, "StankyBean", 197, 162, 171, 255 ],
];

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

		global.ShapeType = galileo.ShapeType;

		global.Sphere = Sphere;
		global.Color = Color;
		global.Dispatch = Dispatch;
		global.Mixer = Mixer;
		global.SSj = SSj;
		global.Shader = Shader;
		global.Shape = Shape;
		global.Sound = Sound;
		global.Surface = Surface;
		global.Texture = Texture;
		global.Transform = Transform;
		global.VertexList = VertexList;

		// register getters for predefined colors
		for (const entry of COLOR_TABLE) {
			let colorName = entry[1];
			let r = entry[2] / 255.0,
				g = entry[3] / 255.0,
				b = entry[4] / 255.0,
				a = entry[5] / 255.0;
			Object.defineProperty(Color, colorName, {
				enumerable: false,
				configurable: true,
				get: function getPredefinedColor() {
					return new Color(r, g, b, a);
				},
			});
		}
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

	static sleep(numFrames)
	{
		return new Promise(resolve => {
			s_eventLoop.addJob('update', resolve, false, numFrames);
		});
	}

	static setResolution(width, height)
	{
		galileo.Prim.rerez(width, height);
	}
}

class Color
{
	static is(color1, color2)
	{
		let tag1 = color1[kTag];
		let tag2 = color2[kTag];
		return tag1.r === tag2.r
			&& tag1.g === tag2.g
			&& tag1.b === tag2.b;
	}

	static mix(color1, color2, w1 = 1.0, w2 = 1.0)
	{
		let totalWeight = w1 + w2;
		let tag1 = color1[kTag];
		let tag2 = color2[kTag];
		let r = (w1 * tag1.r + w2 * tag2.r) / totalWeight;
		let g = (w1 * tag1.g + w2 * tag2.g) / totalWeight;
		let b = (w1 * tag1.b + w2 * tag2.b) / totalWeight;
		let a = (w1 * tag1.a + w2 * tag2.a) / totalWeight;
		return new Color(r, g, b, a);
	}

	static of(name)
	{
		// parse 6-digit format (#rrggbb)
		let matched = name.match(/^#?([0-9a-f]{6})$/i);
		if (matched) {
			let m = matched[1];
			return new Color(
				parseInt(m.substr(0, 2), 16) / 255.0,
				parseInt(m.substr(2, 2), 16) / 255.0,
				parseInt(m.substr(4, 2), 16) / 255.0,
			);
		}

		// parse 8-digit format (#aarrggbb)
		matched = name.match(/^#?([0-9a-f]{8})$/i);
		if (matched) {
			let m = matched[1];
			return new Color(
				parseInt(m.substr(2, 2), 16) / 255.0,
				parseInt(m.substr(4, 2), 16) / 255.0,
				parseInt(m.substr(6, 2), 16) / 255.0,
				parseInt(m.substr(0, 2), 16) / 255.0,
			);
		}

		// see if `name` matches a predefined color (not case sensitive)
		let toMatch = name.toUpperCase();
		for (const colorEntry of COLOR_TABLE) {
			let name = colorEntry[1];
			if (name.toUpperCase() === toMatch)
				return Color[name];  // use appropriate Color getter
		}

		// if we got here, none of the parsing attempts succeeded, so throw an error.
		throw new RangeError(`Invalid color designation '${name}'`);
	}

	constructor(r, g, b, a = 1.0)
	{
		this[kTag] = { r, g, b, a };
	}

	get name()
	{
		throw new Error("Oops, not implemented!");
	}

	get r()
	{
		return this[kTag].r;
	}

	get g()
	{
		return this[kTag].g;
	}

	get b()
	{
		return this[kTag].b;
	}

	get a()
	{
		return this[kTag].a;
	}

	set r(value)
	{
		this[kTag].r = Math.min(Math.max(value, 0.0), 1.0);
	}

	set g(value)
	{
		this[kTag].g = Math.min(Math.max(value, 0.0), 1.0);
	}

	set b(value)
	{
		this[kTag].b = Math.min(Math.max(value, 0.0), 1.0);
	}

	set a(value)
	{
		this[kTag].a = Math.min(Math.max(value, 0.0), 1.0);
	}

	clone()
	{
		let tag = this[kTag];
		return new Color(tag.r, tag.g, tag.b, tag.a);
	}

	fadeTo(alphaFactor)
	{
		let tag = this[kTag];
		return new Color(tag.r, tag.g, tag.b, tag.a * alphaFactor);
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

class Mixer
{
	get volume() { return 1.0; }
	set volume(value) {}
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
	constructor(...args)
	{
		// function(type[, texture], vertexList[, indexList])

		let tag = this[kTag] = {};
		tag.texture = null;
		tag.indexList = null;
		if (args[1] instanceof Texture || args[1] === null) {
			let vbo = args[2][kTag];
			let ibo = null;
			if (args[3] !== undefined)
				ibo = args[3][kTag];
			tag.shape = new galileo.Shape(vbo, ibo, args[0]);
			tag.texture = args[1];
		}
		else {
			let vbo = args[2][kTag];
			let ibo = null;
			if (args[2] !== undefined)
				ibo = args[2][kTag];
			tag.shape = new galileo.Shape(vbo, ibo, args[0]);
		}
	}

	draw(surface = Surface.Screen, shader = Shader.Default)
	{
		let tag = this[kTag];
		let galSurface = surface[kTag].surface;
		let galShape = tag.shape;
		let galShader = shader[kTag];
		let galTexture = tag.texture[kTag].texture;
		galSurface.activate();
		galShader.activate(true);
		galTexture.activate(0);
		galShape.draw();
	}
}

class Sound
{
	static async fromFile(fileName)
	{
		let audioElement = await util.loadSound(`game/${fileName}`);
		audioElement.loop = true;
		return new this(audioElement);
	}

	constructor(audioElement)
	{
		if (!(audioElement instanceof HTMLAudioElement))
			throw new TypeError('HTMLAudioElement object expected here');
		this[kTag] = audioElement;
	}

	get length()
	{
		let audioElement = this[kTag];
		return audioElement.duration;
	}

	get position()
	{
		let audioElement = this[kTag];
		return audioElement.currentTime;
	}

	get repeat()
	{
		let audioElement = this[kTag];
		return audioElement.loop;
	}

	get volume()
	{
		let audioElement = this[kTag];
		return audioElement.volume;
	}

	set position(value)
	{
		let audioElement = this[kTag];
		audioElement.currentTime = value;
	}

	set repeat(value)
	{
		let audioElement = this[kTag];
		audioElement.loop = value;
	}

	set volume(value)
	{
		let audioElement = this[kTag];
		audioElement.volume = value;
	}

	pause()
	{
		let audioElement = this[kTag];
		audioElement.pause();
	}

	play()
	{
		let audioElement = this[kTag];
		audioElement.play();
	}

	stop()
	{
		let audioElement = this[kTag];
		audioElement.pause();
		audioElement.fastSeek(0.0);
	}
}

class Texture
{
	static async fromFile(fileName)
	{
		let image = await util.loadImage(`game/${fileName}`);
		let texture = Object.create(this.prototype);
		texture[kTag] = { texture: new galileo.Texture(image) };
		return texture;
	}

	get height()
	{
		return this[kTag].texture.height;
	}

	get width()
	{
		return this[kTag].texture.width;
	}
}

class Surface extends Texture
{
	static get Screen()
	{
		let galSurface = galileo.Surface.Screen;
		let surface = Object.create(Surface.prototype);
		surface[kTag] = { surface: galSurface };
		Object.defineProperty(this, 'Screen', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: surface,
		});
		return surface;
	}

	get height()
	{
		let galSurface = this[kTag].surface;
		return galSurface.height;
	}

	get width()
	{
		let galSurface = this[kTag].surface;
		return galSurface.width;
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
		// `VertexBuffer` constructor expects an array as input, so if we only have a
		// non-array iterable we need to convert it first.
		if (!Array.isArray(vertices))
			vertices = [ ...vertices ];

		this[kTag] = new galileo.VertexBuffer(vertices);
	}
}
