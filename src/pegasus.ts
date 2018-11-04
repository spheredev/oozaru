/*
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

import * as version from './version.js';

import BufferStream from './buffer-stream.js';
import EventLoop, { JobType } from './event-loop.js';
import InputEngine, { MouseKey, Key } from './input-engine.js';
import * as audialis from './audialis.js';
import * as fs from './fs.js';
import * as galileo from './galileo.js';
import * as util from './utility.js';

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

interface MouseEvent
{
	key: MouseKey;
	x: number;
	y: number;
}

interface ShaderOptions
{
	vertexFile: string;
	fragmentFile: string;
}

interface Vertex
{
	x: number,
	y: number,
	z?: number,
	u?: number,
	v?: number,
	color?: Color
}

const eventLoop = new EventLoop();

let defaultFont: Font;
let defaultShader: Shader;
let game: fs.Game;
let immediateVBO: galileo.VertexBuffer;
let inputEngine: InputEngine;
let mainObject: { [x: string]: any } | undefined;

export default
class Pegasus extends null
{
	static initialize(input: InputEngine)
	{
		inputEngine = input;
		immediateVBO = new galileo.VertexBuffer();

		Object.defineProperty(window, 'global', {
			writable: false,
			enumerable: false,
			configurable: false,
			value: window,
		});

		// register Sphere v2 API globals
		Object.assign(window, {
			// enumerations
			BlendOp: galileo.BlendOp,
			DepthOp: galileo.DepthOp,
			FileOp,
			Key,
			MouseKey,
			ShapeType: galileo.ShapeType,

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
	}

	static async launchGame(directoryURL: string)
	{
		// load the game's JSON manifest
		game = await fs.Game.fromDirectory(directoryURL);
		galileo.Prim.rerez(game.resolution.x, game.resolution.y);
		document.title = game.title;

		defaultFont = await Font.fromFile('#/default.rfn');
		defaultShader = await Shader.fromFiles({
			vertexFile: '#/default.vert.glsl',
			fragmentFile: '#/default.frag.glsl',
		});

		// load and execute the game's main module.  if it exports a startup
		// function or class, call it.
		const moduleURL = fs.Game.urlOf(game, game.modulePath);
		const main = await util.fetchModule(moduleURL);
		if (util.isConstructor(main.default)) {
			mainObject = new main.default() as object;
			if (typeof mainObject.start === 'function')
				mainObject.start();
		} else {
			main.default();
		}

		// start the Sphere v2 event loop
		eventLoop.start();

		return game;
	}
}

class Sphere extends null
{
	static get APILevel()
	{
		return version.apiLevel;
	}

	static get Compiler()
	{
		return game.compiler;
	}

	static get Engine()
	{
		return `${version.name} ${version.version}`;
	}

	static get Game()
	{
		return game.manifest;
	}

	static get Version()
	{
		return version.apiVersion;
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
		return eventLoop.now();
	}

	static sleep(numFrames: number)
	{
		return new Promise(resolve => {
			eventLoop.addJob(JobType.Update, resolve, false, numFrames);
		});
	}

	static setResolution(width: number, height: number)
	{
		galileo.Prim.rerez(width, height);
	}
}

class Color
{
	// note: predefined colors encoded in 8-bit RGBA (not float) because this whole table was
	//       copied and pasted from miniSphere and I was too lazy to convert it.
	static get ['AliceBlue'] ()            { return new Color(240 / 255, 248 / 255, 255 / 255, 255 / 255); }
	static get ['AntiqueWhite'] ()         { return new Color(250 / 255, 235 / 255, 215 / 255, 255 / 255); }
	static get ['Aqua'] ()                 { return new Color(0   / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get ['Aquamarine'] ()           { return new Color(127 / 255, 255 / 255, 212 / 255, 255 / 255); }
	static get ['Azure'] ()                { return new Color(240 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get ['Beige'] ()                { return new Color(245 / 255, 245 / 255, 220 / 255, 255 / 255); }
	static get ['Bisque'] ()               { return new Color(255 / 255, 228 / 255, 196 / 255, 255 / 255); }
	static get ['Black'] ()                { return new Color(0   / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get ['BlanchedAlmond'] ()       { return new Color(255 / 255, 235 / 255, 205 / 255, 255 / 255); }
	static get ['Blue'] ()                 { return new Color(0   / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get ['BlueViolet'] ()           { return new Color(138 / 255, 43  / 255, 226 / 255, 255 / 255); }
	static get ['Brown'] ()                { return new Color(165 / 255, 42  / 255, 42  / 255, 255 / 255); }
	static get ['BurlyWood'] ()            { return new Color(222 / 255, 184 / 255, 135 / 255, 255 / 255); }
	static get ['CadetBlue'] ()            { return new Color(95  / 255, 158 / 255, 160 / 255, 255 / 255); }
	static get ['Chartreuse'] ()           { return new Color(127 / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get ['Chocolate'] ()            { return new Color(210 / 255, 105 / 255, 30  / 255, 255 / 255); }
	static get ['Coral'] ()                { return new Color(255 / 255, 127 / 255, 80  / 255, 255 / 255); }
	static get ['CornflowerBlue'] ()       { return new Color(100 / 255, 149 / 255, 237 / 255, 255 / 255); }
	static get ['Cornsilk'] ()             { return new Color(255 / 255, 248 / 255, 220 / 255, 255 / 255); }
	static get ['Crimson'] ()              { return new Color(220 / 255, 20  / 255, 60  / 255, 255 / 255); }
	static get ['Cyan'] ()                 { return new Color(0   / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get ['DarkBlue'] ()             { return new Color(0   / 255, 0   / 255, 139 / 255, 255 / 255); }
	static get ['DarkCyan'] ()             { return new Color(0   / 255, 139 / 255, 139 / 255, 255 / 255); }
	static get ['DarkGoldenrod'] ()        { return new Color(184 / 255, 134 / 255, 11  / 255, 255 / 255); }
	static get ['DarkGray'] ()             { return new Color(169 / 255, 169 / 255, 169 / 255, 255 / 255); }
	static get ['DarkGreen'] ()            { return new Color(0   / 255, 100 / 255, 0   / 255, 255 / 255); }
	static get ['DarkKhaki'] ()            { return new Color(189 / 255, 183 / 255, 107 / 255, 255 / 255); }
	static get ['DarkMagenta'] ()          { return new Color(139 / 255, 0   / 255, 139 / 255, 255 / 255); }
	static get ['DarkOliveGreen'] ()       { return new Color(85  / 255, 107 / 255, 47  / 255, 255 / 255); }
	static get ['DarkOrange'] ()           { return new Color(255 / 255, 140 / 255, 0   / 255, 255 / 255); }
	static get ['DarkOrchid'] ()           { return new Color(153 / 255, 50  / 255, 204 / 255, 255 / 255); }
	static get ['DarkRed'] ()              { return new Color(139 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get ['DarkSalmon'] ()           { return new Color(233 / 255, 150 / 255, 122 / 255, 255 / 255); }
	static get ['DarkSeaGreen'] ()         { return new Color(143 / 255, 188 / 255, 143 / 255, 255 / 255); }
	static get ['DarkSlateBlue'] ()        { return new Color(72  / 255, 61  / 255, 139 / 255, 255 / 255); }
	static get ['DarkSlateGray'] ()        { return new Color(47  / 255, 79  / 255, 79  / 255, 255 / 255); }
	static get ['DarkTurquoise'] ()        { return new Color(0   / 255, 206 / 255, 209 / 255, 255 / 255); }
	static get ['DarkViolet'] ()           { return new Color(148 / 255, 0   / 255, 211 / 255, 255 / 255); }
	static get ['DeepPink'] ()             { return new Color(255 / 255, 20  / 255, 147 / 255, 255 / 255); }
	static get ['DeepSkyBlue'] ()          { return new Color(0   / 255, 191 / 255, 255 / 255, 255 / 255); }
	static get ['DimGray'] ()              { return new Color(105 / 255, 105 / 255, 105 / 255, 255 / 255); }
	static get ['DodgerBlue'] ()           { return new Color(30  / 255, 144 / 255, 255 / 255, 255 / 255); }
	static get ['FireBrick'] ()            { return new Color(178 / 255, 34  / 255, 34  / 255, 255 / 255); }
	static get ['FloralWhite'] ()          { return new Color(255 / 255, 250 / 255, 240 / 255, 255 / 255); }
	static get ['ForestGreen'] ()          { return new Color(34  / 255, 139 / 255, 34  / 255, 255 / 255); }
	static get ['Fuchsia'] ()              { return new Color(255 / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get ['Gainsboro'] ()            { return new Color(220 / 255, 220 / 255, 220 / 255, 255 / 255); }
	static get ['GhostWhite'] ()           { return new Color(248 / 255, 248 / 255, 255 / 255, 255 / 255); }
	static get ['Gold'] ()                 { return new Color(255 / 255, 215 / 255, 0   / 255, 255 / 255); }
	static get ['Goldenrod'] ()            { return new Color(218 / 255, 165 / 255, 32  / 255, 255 / 255); }
	static get ['Gray'] ()                 { return new Color(128 / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get ['Green'] ()                { return new Color(0   / 255, 128 / 255, 0   / 255, 255 / 255); }
	static get ['GreenYellow'] ()          { return new Color(173 / 255, 255 / 255, 47  / 255, 255 / 255); }
	static get ['Honeydew'] ()             { return new Color(240 / 255, 255 / 255, 240 / 255, 255 / 255); }
	static get ['HotPink'] ()              { return new Color(255 / 255, 105 / 255, 180 / 255, 255 / 255); }
	static get ['IndianRed'] ()            { return new Color(205 / 255, 92  / 255, 92  / 255, 255 / 255); }
	static get ['Indigo'] ()               { return new Color(75  / 255, 0   / 255, 130 / 255, 255 / 255); }
	static get ['Ivory'] ()                { return new Color(255 / 255, 255 / 255, 240 / 255, 255 / 255); }
	static get ['Khaki'] ()                { return new Color(240 / 255, 230 / 255, 140 / 255, 255 / 255); }
	static get ['Lavender'] ()             { return new Color(230 / 255, 230 / 255, 250 / 255, 255 / 255); }
	static get ['LavenderBlush'] ()        { return new Color(255 / 255, 240 / 255, 245 / 255, 255 / 255); }
	static get ['LawnGreen'] ()            { return new Color(124 / 255, 252 / 255, 0   / 255, 255 / 255); }
	static get ['LemonChiffon'] ()         { return new Color(255 / 255, 250 / 255, 205 / 255, 255 / 255); }
	static get ['LightBlue'] ()            { return new Color(173 / 255, 216 / 255, 230 / 255, 255 / 255); }
	static get ['LightCoral'] ()           { return new Color(240 / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get ['LightCyan'] ()            { return new Color(224 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get ['LightGoldenrodYellow'] () { return new Color(250 / 255, 250 / 255, 210 / 255, 255 / 255); }
	static get ['LightGray'] ()            { return new Color(211 / 255, 211 / 255, 211 / 255, 255 / 255); }
	static get ['LightGreen'] ()           { return new Color(144 / 255, 238 / 255, 144 / 255, 255 / 255); }
	static get ['LightPink'] ()            { return new Color(255 / 255, 182 / 255, 193 / 255, 255 / 255); }
	static get ['LightSalmon'] ()          { return new Color(255 / 255, 160 / 255, 122 / 255, 255 / 255); }
	static get ['LightSeaGreen'] ()        { return new Color(32  / 255, 178 / 255, 170 / 255, 255 / 255); }
	static get ['LightSkyBlue'] ()         { return new Color(135 / 255, 206 / 255, 250 / 255, 255 / 255); }
	static get ['LightSlateGray'] ()       { return new Color(119 / 255, 136 / 255, 153 / 255, 255 / 255); }
	static get ['LightSteelBlue'] ()       { return new Color(176 / 255, 196 / 255, 222 / 255, 255 / 255); }
	static get ['LightYellow'] ()          { return new Color(255 / 255, 255 / 255, 224 / 255, 255 / 255); }
	static get ['Lime'] ()                 { return new Color(0   / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get ['LimeGreen'] ()            { return new Color(50  / 255, 205 / 255, 50  / 255, 255 / 255); }
	static get ['Linen'] ()                { return new Color(250 / 255, 240 / 255, 230 / 255, 255 / 255); }
	static get ['Magenta'] ()              { return new Color(255 / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get ['Maroon'] ()               { return new Color(128 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get ['MediumAquamarine'] ()     { return new Color(102 / 255, 205 / 255, 170 / 255, 255 / 255); }
	static get ['MediumBlue'] ()           { return new Color(0   / 255, 0   / 255, 205 / 255, 255 / 255); }
	static get ['MediumOrchid'] ()         { return new Color(186 / 255, 85  / 255, 211 / 255, 255 / 255); }
	static get ['MediumPurple'] ()         { return new Color(147 / 255, 112 / 255, 219 / 255, 255 / 255); }
	static get ['MediumSeaGreen'] ()       { return new Color(60  / 255, 179 / 255, 113 / 255, 255 / 255); }
	static get ['MediumSlateBlue'] ()      { return new Color(123 / 255, 104 / 255, 238 / 255, 255 / 255); }
	static get ['MediumSpringGreen'] ()    { return new Color(0   / 255, 250 / 255, 154 / 255, 255 / 255); }
	static get ['MediumTurquoise'] ()      { return new Color(72  / 255, 209 / 255, 204 / 255, 255 / 255); }
	static get ['MediumVioletRed'] ()      { return new Color(199 / 255, 21  / 255, 133 / 255, 255 / 255); }
	static get ['MidnightBlue'] ()         { return new Color(25  / 255, 25  / 255, 112 / 255, 255 / 255); }
	static get ['MintCream'] ()            { return new Color(245 / 255, 255 / 255, 250 / 255, 255 / 255); }
	static get ['MistyRose'] ()            { return new Color(255 / 255, 228 / 255, 225 / 255, 255 / 255); }
	static get ['Moccasin'] ()             { return new Color(255 / 255, 228 / 255, 181 / 255, 255 / 255); }
	static get ['NavajoWhite'] ()          { return new Color(255 / 255, 222 / 255, 173 / 255, 255 / 255); }
	static get ['Navy'] ()                 { return new Color(0   / 255, 0   / 255, 128 / 255, 255 / 255); }
	static get ['OldLace'] ()              { return new Color(253 / 255, 245 / 255, 230 / 255, 255 / 255); }
	static get ['Olive'] ()                { return new Color(128 / 255, 128 / 255, 0   / 255, 255 / 255); }
	static get ['OliveDrab'] ()            { return new Color(107 / 255, 142 / 255, 35  / 255, 255 / 255); }
	static get ['Orange'] ()               { return new Color(255 / 255, 165 / 255, 0   / 255, 255 / 255); }
	static get ['OrangeRed'] ()            { return new Color(255 / 255, 69  / 255, 0   / 255, 255 / 255); }
	static get ['Orchid'] ()               { return new Color(218 / 255, 112 / 255, 214 / 255, 255 / 255); }
	static get ['PaleGoldenrod'] ()        { return new Color(238 / 255, 232 / 255, 170 / 255, 255 / 255); }
	static get ['PaleGreen'] ()            { return new Color(152 / 255, 251 / 255, 152 / 255, 255 / 255); }
	static get ['PaleTurquoise'] ()        { return new Color(175 / 255, 238 / 255, 238 / 255, 255 / 255); }
	static get ['PaleVioletRed'] ()        { return new Color(219 / 255, 112 / 255, 147 / 255, 255 / 255); }
	static get ['PapayaWhip'] ()           { return new Color(225 / 255, 239 / 255, 213 / 255, 255 / 255); }
	static get ['PeachPuff'] ()            { return new Color(255 / 255, 218 / 255, 185 / 255, 255 / 255); }
	static get ['Peru'] ()                 { return new Color(205 / 255, 133 / 255, 63  / 255, 255 / 255); }
	static get ['Pink'] ()                 { return new Color(255 / 255, 192 / 255, 203 / 255, 255 / 255); }
	static get ['Plum'] ()                 { return new Color(221 / 255, 160 / 255, 221 / 255, 255 / 255); }
	static get ['PowderBlue'] ()           { return new Color(176 / 255, 224 / 255, 230 / 255, 255 / 255); }
	static get ['Purple'] ()               { return new Color(128 / 255, 0   / 255, 128 / 255, 255 / 255); }
	static get ['Red'] ()                  { return new Color(255 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get ['RosyBrown'] ()            { return new Color(188 / 255, 143 / 255, 143 / 255, 255 / 255); }
	static get ['RoyalBlue'] ()            { return new Color(65  / 255, 105 / 255, 225 / 255, 255 / 255); }
	static get ['SaddleBrown'] ()          { return new Color(139 / 255, 69  / 255, 19  / 255, 255 / 255); }
	static get ['Salmon'] ()               { return new Color(250 / 255, 128 / 255, 114 / 255, 255 / 255); }
	static get ['SandyBrown'] ()           { return new Color(244 / 255, 164 / 255, 96  / 255, 255 / 255); }
	static get ['SeaGreen'] ()             { return new Color(46  / 255, 139 / 255, 87  / 255, 255 / 255); }
	static get ['Seashell'] ()             { return new Color(255 / 255, 245 / 255, 238 / 255, 255 / 255); }
	static get ['Sienna'] ()               { return new Color(160 / 255, 82  / 255, 45  / 255, 255 / 255); }
	static get ['Silver'] ()               { return new Color(192 / 255, 192 / 255, 192 / 255, 255 / 255); }
	static get ['SkyBlue'] ()              { return new Color(135 / 255, 206 / 255, 235 / 255, 255 / 255); }
	static get ['SlateBlue'] ()            { return new Color(106 / 255, 90  / 255, 205 / 255, 255 / 255); }
	static get ['SlateGray'] ()            { return new Color(112 / 255, 128 / 255, 144 / 255, 255 / 255); }
	static get ['Snow'] ()                 { return new Color(255 / 255, 250 / 255, 250 / 255, 255 / 255); }
	static get ['SpringGreen'] ()          { return new Color(0   / 255, 255 / 255, 127 / 255, 255 / 255); }
	static get ['SteelBlue'] ()            { return new Color(70  / 255, 130 / 255, 180 / 255, 255 / 255); }
	static get ['Tan'] ()                  { return new Color(210 / 255, 180 / 255, 140 / 255, 255 / 255); }
	static get ['Teal'] ()                 { return new Color(0   / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get ['Thistle'] ()              { return new Color(216 / 255, 191 / 255, 216 / 255, 255 / 255); }
	static get ['Tomato'] ()               { return new Color(255 / 255, 99  / 255, 71  / 255, 255 / 255); }
	static get ['Transparent'] ()          { return new Color(0   / 255, 0   / 255, 0   / 255, 0   / 255); }
	static get ['Turquoise'] ()            { return new Color(64  / 255, 224 / 255, 208 / 255, 255 / 255); }
	static get ['Violet'] ()               { return new Color(238 / 255, 130 / 255, 238 / 255, 255 / 255); }
	static get ['Wheat'] ()                { return new Color(245 / 255, 222 / 255, 179 / 255, 255 / 255); }
	static get ['White'] ()                { return new Color(255 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get ['WhiteSmoke'] ()           { return new Color(245 / 255, 245 / 255, 245 / 255, 255 / 255); }
	static get ['Yellow'] ()               { return new Color(255 / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get ['YellowGreen'] ()          { return new Color(154 / 255, 205 / 255, 50  / 255, 255 / 255); }
	static get ['PurwaBlue'] ()            { return new Color(155 / 255, 225 / 255, 255 / 255, 255 / 255); }
	static get ['RebeccaPurple'] ()        { return new Color(102 / 255, 51  / 255, 153 / 255, 255 / 255); }
	static get ['StankyBean'] ()           { return new Color(197 / 255, 162 / 255, 171 / 255, 255 / 255); }

	static is(color1: Color, color2: Color)
	{
		return color1.zit.r === color2.zit.r
			&& color1.zit.g === color2.zit.g
			&& color1.zit.b === color2.zit.b;
	}

	static mix(color1: Color, color2: Color, w1 = 1.0, w2 = 1.0)
	{
		const totalWeight = w1 + w2;
		const r = (w1 * color1.zit.r + w2 * color2.zit.r) / totalWeight;
		const g = (w1 * color1.zit.g + w2 * color2.zit.g) / totalWeight;
		const b = (w1 * color1.zit.b + w2 * color2.zit.b) / totalWeight;
		const a = (w1 * color1.zit.a + w2 * color2.zit.a) / totalWeight;
		return new Color(r, g, b, a);
	}

	static of(name: string)
	{
		// parse 6-digit format (#rrggbb)
		let matched = name.match(/^#?([0-9a-f]{6})$/i);
		if (matched) {
			const m = matched[1];
			return new Color(
				parseInt(m.substr(0, 2), 16) / 255.0,
				parseInt(m.substr(2, 2), 16) / 255.0,
				parseInt(m.substr(4, 2), 16) / 255.0,
			);
		}

		// parse 8-digit format (#aarrggbb)
		matched = name.match(/^#?([0-9a-f]{8})$/i);
		if (matched) {
			const m = matched[1];
			return new Color(
				parseInt(m.substr(2, 2), 16) / 255.0,
				parseInt(m.substr(4, 2), 16) / 255.0,
				parseInt(m.substr(6, 2), 16) / 255.0,
				parseInt(m.substr(0, 2), 16) / 255.0,
			);
		}

		// see if `name` matches a predefined color (not case sensitive)
		const toMatch = name.toUpperCase();

		for (let colorName in Color) {
			if (colorName.toUpperCase() === toMatch) {
				try {
					let propValue = (Color as any)[colorName];
					if (propValue instanceof Color)
						return propValue;
				}
				catch {}
				break;
			}
		}

		// if we got here, none of the parsing attempts succeeded, so throw an error.
		throw new RangeError(`Invalid color designation '${name}'`);
	}

	zit: { r: number, g: number, b: number, a: number };
	constructor(r: number, g: number, b: number, a = 1.0)
	{
		this.zit = { r, g, b, a };
	}

	get name()
	{
		throw new Error(`API not implemented`);
	}

	get r()
	{
		return this.zit.r;
	}

	get g()
	{
		return this.zit.g;
	}

	get b()
	{
		return this.zit.b;
	}

	get a()
	{
		return this.zit.a;
	}

	set r(value)
	{
		this.zit.r = Math.min(Math.max(value, 0.0), 1.0);
	}

	set g(value)
	{
		this.zit.g = Math.min(Math.max(value, 0.0), 1.0);
	}

	set b(value)
	{
		this.zit.b = Math.min(Math.max(value, 0.0), 1.0);
	}

	set a(value)
	{
		this.zit.a = Math.min(Math.max(value, 0.0), 1.0);
	}

	clone()
	{
		return new Color(this.zit.r, this.zit.g, this.zit.b, this.zit.a);
	}

	fadeTo(alphaFactor: number)
	{
		return new Color(
			this.zit.r, this.zit.g, this.zit.b,
			this.zit.a * alphaFactor);
	}
}

class Dispatch extends null
{
	static cancelAll()
	{
		throw new Error(`API not implemented`);
	}

	static later(numFrames: number, callback: () => void)
	{
		const jobID = eventLoop.addJob(JobType.Update, callback, false, numFrames);
		return new JobToken(jobID);
	}

	static now(callback: () => void)
	{
		const jobID = eventLoop.addJob(JobType.Immediate, callback);
		return new JobToken(jobID);
	}

	static onRender(callback: () => void, options: JobOptions = {})
	{
		const jobID = eventLoop.addJob(JobType.Render, callback, true, options.priority);
		return new JobToken(jobID);
	}

	static onUpdate(callback: () => void, options: JobOptions = {})
	{
		const jobID = eventLoop.addJob(JobType.Update, callback, true, options.priority);
		return new JobToken(jobID);
	}
}

class FS extends null
{
	static async evaluateScript(fileName: string)
	{
		const url = fs.Game.urlOf(game, fileName);
		return util.fetchScript(url);
	}

	static async fileExists(pathName: string)
	{
		const url = fs.Game.urlOf(game, pathName);
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
		return game.fullPath(pathName, baseDirName);
	}

	static async require(fileName: string)
	{
		const url = fs.Game.urlOf(game, fileName);
		const text = await (await fetch(url)).text();
		return JSON.parse(text);
	}
}

class FileStream
{
	fullPath: string;
	stream: BufferStream | null;

	static async open(fileName: string, fileOp: FileOp)
	{
		if (fileOp !== FileOp.Read)
			throw new RangeError(`Oozaru currently only supports FileStreams in read mode`);

		const url = fs.Game.urlOf(game, fileName);
		const data = await util.fetchRawFile(url);
		const fileStream = Object.create(this.prototype) as FileStream;
		fileStream.fullPath = fileName;
		fileStream.stream = new BufferStream(data);
		return fileStream;
	}

	constructor()
	{
		throw new RangeError(`'new FileStream' is unsupported, use 'FileStream.open' instead`);
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
			throw new Error(`The FileStream has already been disposed`);
		throw new Error(`Oozaru doesn't yet support FileStream#write()`);
	}
}

class Font
{
	font: galileo.Font;

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

	static async fromFile(fileName: string)
	{
		const url = fs.Game.urlOf(game, fileName);
		const font = await galileo.Font.fromFile(url);
		const object = Object.create(this.prototype) as Font;
		object.font = font;
		return object;
	}

	constructor()
	{
		throw new RangeError(`'new Font' is unsupported, use 'Font.fromFile' instead`);
	}

	get height()
	{
		return this.font.height;
	}

	drawText(surface: Surface, x: number, y: number, text: string, color = Color.White, wrapWidth?: number)
	{
		const matrix = galileo.Matrix.Identity.translate(x, y);
		surface.drawTarget.activate();
		Shader.Default.program.activate(false);
		Shader.Default.program.project(surface.projection.matrix);
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			for (let i = 0, len = lines.length; i < len; ++i) {
				this.font.drawText(lines[i], color, matrix);
				matrix.translate(0, this.font.height);
			}
		}
		else {
			this.font.drawText(text, color, matrix);
		}
	}

	getTextSize(text: string, wrapWidth?: number)
	{
		if (wrapWidth !== undefined){
			const lines = this.font.wordWrap(text, wrapWidth);
			return {
				width: wrapWidth,
				height: lines.length * this.font.height,
			};
		}
		else {
			return {
				width: this.font.widthOf(text),
				height: this.font.height,
			};
		}
	}

	widthOf(text: string)
	{
		return this.font.widthOf(text);
	}

	wordWrap(text: string, wrapWidth: number)
	{
		return this.font.wordWrap(text, wrapWidth);
	}
}

class IndexList
{
	buffer: galileo.IndexBuffer;

	constructor(indices: Iterable<number>)
	{
		this.buffer = new galileo.IndexBuffer(indices);
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
		eventLoop.cancelJob(this.jobID);
	}
}

class Joystick
{
	static getDevices()
	{
		return [] as Joystick[];
	}
}

class Keyboard
{
	static get Default()
	{
		const keyboard = new Keyboard();
		Object.defineProperty(Keyboard, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: keyboard,
		});
		return keyboard;
	}

	get capsLock()
	{
		return false;
	}

	get numLock()
	{
		return false;
	}

	get scrollLock()
	{
		return false;
	}

	charOf(key: Key, shifted = false): string
	{
		return key === Key.Space ? " "
			: key === Key.Tilde ? shifted ? "~" : "`"
			: key === Key.D0 ? shifted ? ")" : "0"
			: key === Key.D1 ? shifted ? "!" : "1"
			: key === Key.D2 ? shifted ? "@" : "2"
			: key === Key.D3 ? shifted ? "#" : "3"
			: key === Key.D4 ? shifted ? "$" : "4"
			: key === Key.D5 ? shifted ? "%" : "5"
			: key === Key.D6 ? shifted ? "^" : "6"
			: key === Key.D7 ? shifted ? "&" : "7"
			: key === Key.D8 ? shifted ? "*" : "8"
			: key === Key.D9 ? shifted ? "(" : "9"
			: key === Key.A ? shifted ? "A" : "a"
			: key === Key.B ? shifted ? "B" : "b"
			: key === Key.C ? shifted ? "C" : "c"
			: key === Key.D ? shifted ? "D" : "d"
			: key === Key.E ? shifted ? "E" : "e"
			: key === Key.F ? shifted ? "F" : "f"
			: key === Key.G ? shifted ? "G" : "g"
			: key === Key.H ? shifted ? "H" : "h"
			: key === Key.I ? shifted ? "I" : "i"
			: key === Key.J ? shifted ? "J" : "j"
			: key === Key.K ? shifted ? "K" : "k"
			: key === Key.L ? shifted ? "L" : "l"
			: key === Key.M ? shifted ? "M" : "m"
			: key === Key.N ? shifted ? "N" : "n"
			: key === Key.O ? shifted ? "O" : "o"
			: key === Key.P ? shifted ? "P" : "p"
			: key === Key.Q ? shifted ? "Q" : "q"
			: key === Key.R ? shifted ? "R" : "r"
			: key === Key.S ? shifted ? "S" : "s"
			: key === Key.T ? shifted ? "T" : "t"
			: key === Key.U ? shifted ? "U" : "u"
			: key === Key.V ? shifted ? "V" : "v"
			: key === Key.W ? shifted ? "W" : "w"
			: key === Key.X ? shifted ? "X" : "x"
			: key === Key.Y ? shifted ? "Y" : "y"
			: key === Key.Z ? shifted ? "Z" : "z"
			: "";
	}

	clearQueue()
	{
		inputEngine.clearKeyQueue();
	}

	getKey(): Key | null
	{
		return inputEngine.getKey();
	}

	isPressed(key: Key)
	{
		return inputEngine.isKeyDown(key);
	}
}

class Mixer
{
	mixer: audialis.Mixer;

	static get Default()
	{
		const mixer = new Mixer(44100, 16, 2);
		Object.defineProperty(Mixer, 'Default', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: mixer,
		});
		return mixer;
	}

	constructor(frequency: number, _bits: number, _numChannels: number)
	{
		this.mixer = new audialis.Mixer(frequency);
	}

	get volume()
	{
		return this.mixer.volume;
	}
	set volume(value)
	{
		this.mixer.volume = value;
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

class Mouse
{
	static get Default()
	{
		return new this();
	}

	get x()
	{
		return 0;
	}

	get y()
	{
		return 0;
	}

	clearQueue()
	{
	}

	getEvent(): MouseEvent | null
	{
		return null;
	}

	isPressed(_key: MouseKey)
	{
		return false;
	}
}

class RNG
{
	static fromSeed(seedValue: number)
	{
		throw new Error(`'RNG.fromSeed' is not yet implemented`);
	}

	static fromState(state: string)
	{
		throw new Error(`'RNG.fromState' is not yet implemented`);
	}

	constructor()
	{
	}

	get state()
	{
		throw new Error(`'RNG.state' is not yet implemented`);
	}
	set state(value)
	{
		throw new Error(`'RNG.state' is not yet implemented`);
	}

	next()
	{
		return {
			done: false,
			value: Math.random(),
		};
	}
}

class SSj extends null
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
	fragSource: string;
	program: galileo.Shader;
	vertSource: string;

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
		const vertURL = fs.Game.urlOf(game, options.vertexFile);
		const fragURL = fs.Game.urlOf(game, options.fragmentFile);
		const shader = Object.create(this.prototype) as Shader;
		shader.vertSource = await util.fetchText(vertURL);
		shader.fragSource = await util.fetchText(fragURL);
		shader.program = new galileo.Shader(shader.vertSource, shader.fragSource);
		return shader;
	}

	constructor(_options: ShaderOptions)
	{
		throw new RangeError(`'new Shader' is unsupported, use 'Shader.fromFiles' instead`);
	}

	clone()
	{
		const dolly = Object.create(Object.getPrototypeOf(this)) as this;
		dolly.vertSource = this.vertSource;
		dolly.fragSource = this.fragSource;
		dolly.program = new galileo.Shader(dolly.vertSource, dolly.fragSource);
		return dolly;
	}

	setBoolean(name: string, value: boolean)
	{
		this.program.setBoolValue(name, value);
	}

	setColorVector(name: string, value: Color)
	{
		this.program.setFloatVec(name, [
			value.zit.r,
			value.zit.g,
			value.zit.b,
			value.zit.a
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
	shape: galileo.Shape;

	static drawImmediate(surface: Surface, type: galileo.ShapeType, texture: Texture | null, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: galileo.ShapeType, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: galileo.ShapeType, arg1: Texture | ArrayLike<Vertex> | null, arg2?: ArrayLike<Vertex>)
	{
		surface.drawTarget.activate();
		if (arg1 instanceof Texture || arg1 === null) {
			Shader.Default.program.activate(arg1 !== null);
			Shader.Default.program.project(surface.projection.matrix);
			Shader.Default.program.transform(galileo.Matrix.Identity);
			if (arg1 !== null)
				arg1.texture.activate(0);
			immediateVBO.upload(arg2 as ArrayLike<Vertex>);
			galileo.Prim.draw(immediateVBO, null, type);
		}
		else {
			Shader.Default.program.activate(false);
			Shader.Default.program.project(surface.projection.matrix);
			Shader.Default.program.transform(galileo.Matrix.Identity);
			immediateVBO.upload(arg1);
			galileo.Prim.draw(immediateVBO, null, type);
		}
	}

	constructor(type: galileo.ShapeType, texture: Texture | null, vbo: VertexList, indexList?: IndexList | null)
	constructor(type: galileo.ShapeType, vbo: VertexList, indexList?: IndexList | null)
	constructor(arg0: galileo.ShapeType, arg1: Texture | VertexList | null, arg2: VertexList | IndexList | null = null, arg3: IndexList | null = null)
	{
		if (arg2 instanceof VertexList) {
			if (!(arg1 instanceof Texture) && arg1 != undefined)
				throw new Error("Expected Texture or null as second parameter to new Shape");
			const vbo = arg2.buffer;
			const ibo = arg3 !== null ? arg3.buffer : null;
			this.shape = new galileo.Shape(vbo, ibo, arg0);
			this.texture = arg1;
			this.indexList = arg3;
		}
		else {
			if (!(arg1 instanceof VertexList))
				throw new Error("Expected VertexList or Texture as second parameter to new Shape");
			let vbo = arg1.buffer;
			const ibo = arg2 !== null ? arg2.buffer : null;
			this.shape = new galileo.Shape(vbo, ibo, arg0);
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

class Sound
{
	private sound: audialis.Sound;

	static async fromFile(fileName: string)
	{
		const url = fs.Game.urlOf(game, fileName);
		const sound = Object.create(this.prototype) as Sound;
		sound.sound = await audialis.Sound.fromFile(url);
		return sound;
	}

	constructor(_fileName: string)
	{
		throw new RangeError(`'new Sound' is unsupported, use 'Sound.fromFile' instead`);
	}

	get length()
	{
		return this.sound.length;
	}

	get position()
	{
		return this.sound.position;
	}
	set position(value)
	{
		this.sound.position = value;
	}

	get repeat()
	{
		return this.sound.repeat;
	}
	set repeat(value)
	{
		this.sound.repeat = value;
	}

	get volume()
	{
		return this.sound.volume;
	}
	set volume(value)
	{
		this.sound.volume = value;
	}

	pause()
	{
		this.sound.pause();
	}

	play(mixer = Mixer.Default)
	{
		this.sound.play(mixer.mixer);
	}

	stop()
	{
		this.sound.stop();
	}
}

class SoundStream
{
	stream: audialis.Stream;

	constructor(frequency: number, bits: number, numChannels: number)
	{
		if (bits !== 32) // Web Audio only supports float32 samples
			throw new RangeError(`Only 32-bit floating-point audio is supported in Oozaru`);
		this.stream = new audialis.Stream(frequency, numChannels);
	}

	get length()
	{
		return this.stream.buffered;
	}

	pause()
	{
		this.stream.pause();
	}

	play(mixer = Mixer.Default)
	{
		this.stream.play(mixer.mixer);
	}

	stop()
	{
		this.stream.stop();
	}

	write(data: Float32Array)
	{
		this.stream.buffer(data);
	}
}

class Texture
{
	texture: galileo.Texture;

	static async fromFile(fileName: string)
	{
		const url = fs.Game.urlOf(game, fileName);
		const image = await util.fetchImage(url);
		return new Texture(image);
	}

	constructor(fileName: string);
	constructor(width: number, height: number, content?: ArrayBufferView | Color);
	constructor(image: HTMLImageElement);
	constructor(...args: [ any, any?, any? ])
	{
		if (typeof args[0] === 'string') {
			throw new RangeError(`'new Texture' with filename is unsupported, use 'Texture.fromFile' instead`);
		}
		else if (args[0] instanceof HTMLImageElement) {
			const image = args[0];
			this.texture = new galileo.Texture(image);
		}
		else {
			const width: number = args[0];
			const height: number = args[1];
			const content: ArrayBufferView | Color | undefined = args[2];
			this.texture = new galileo.Texture(width, height, content);
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
	drawTarget: galileo.DrawTarget;
	projection: Transform;

	static get Screen()
	{
		const drawTarget = galileo.DrawTarget.Screen;
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

	constructor(width: number, height: number, content?: ArrayBufferView | Color);
	constructor(image: HTMLImageElement);
	constructor(...args: [ any, any?, any? ])
	{
		super(...args);

		this.drawTarget = new galileo.DrawTarget(this.texture);
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
	matrix: galileo.Matrix;

	static get Identity()
	{
		let transform = new this();
		return transform;
	}

	constructor()
	{
		this.matrix = new galileo.Matrix();
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
	buffer: galileo.VertexBuffer;

	constructor(vertices: Iterable<Vertex>)
	{
		this.buffer = new galileo.VertexBuffer([ ...vertices ]);
	}
}
