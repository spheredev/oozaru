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

import Fido from './fido.js';
import Game from './game.js';

export
enum BlendOp
{
	Default,
	Add,
	Average,
	CopyAlpha,
	CopyRGB,
	Invert,
	Multiply,
	Replace,
	Subtract,
}

export
enum DepthOp
{
	AlwaysPass,
	Equal,
	Greater,
	GreaterOrEqual,
	Less,
	LessOrEqual,
	NeverPass,
	NotEqual,
}

export
interface Rectangle
{
	x: number;
	y: number;
	w: number;
	h: number;
}

export
interface ShaderOptions
{
	vertexFile: string;
	fragmentFile: string;
}

export
enum ShapeType
{
	Fan,
	Lines,
	LineLoop,
	LineStrip,
	Points,
	Triangles,
	TriStrip,
}

export
interface Size
{
	width: number;
	height: number;
}

export
interface Vertex
{
	x: number;
	y: number;
	z?: number;
	u?: number;
	v?: number;
	color?: Color;
}

var activeShader: Shader | null = null;
var activeSurface: Surface | null = null;
var defaultShader: Shader;
var gl: WebGLRenderingContext;

export default
class Galileo
{
	static async initialize(canvas: HTMLCanvasElement)
	{
		const glContext = canvas.getContext('webgl', { alpha: false });
		if (glContext === null)
			throw new Error(`Oozaru was unable to create a WebGL context.`);
		gl = glContext;

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.blendEquation(glContext.FUNC_ADD);
		gl.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
		gl.depthFunc(glContext.ALWAYS);
		gl.enable(glContext.BLEND);
		gl.enable(glContext.DEPTH_TEST);
		gl.enable(glContext.SCISSOR_TEST);

		defaultShader = await Shader.fromFiles({
			vertexFile: '#/default.vert.glsl',
			fragmentFile: '#/default.frag.glsl',
		});

		Galileo.flip();
	}

	static draw(type: ShapeType, vertices: VertexList, indices?: IndexList | null, offset = 0, numVertices?: number)
	{
		const drawMode = type === ShapeType.Fan ? gl.TRIANGLE_FAN
			: type === ShapeType.Lines ? gl.LINES
			: type === ShapeType.LineLoop ? gl.LINE_LOOP
			: type === ShapeType.LineStrip ? gl.LINE_STRIP
			: type === ShapeType.Points ? gl.POINTS
			: type === ShapeType.TriStrip ? gl.TRIANGLE_STRIP
			: gl.TRIANGLES;
		vertices.activate();
		if (indices != null) {
			if (numVertices === undefined)
				numVertices = indices.length - offset;
			indices.activate();
			gl.drawElements(drawMode, numVertices, gl.UNSIGNED_SHORT, offset);
		}
		else {
			if (numVertices === undefined)
				numVertices = vertices.length - offset;
			gl.drawArrays(drawMode, offset, numVertices);
		}
	}

	static flip()
	{
		Surface.Screen.activate(defaultShader);
		Surface.Screen.unclip();
		gl.disable(gl.SCISSOR_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.SCISSOR_TEST);
	}

	static rerez(width: number, height: number)
	{
		gl.canvas.width = width;
		gl.canvas.height = height;
		Surface.Screen.size = { width, height };
		Surface.Screen.projection = new Transform()
			.project2D(0, 0, width, height);
		if (width <= 400 && height <= 300) {
			gl.canvas.style.width = `${width * 2}px`;
			gl.canvas.style.height = `${height * 2}px`;
		}
		else {
			gl.canvas.style.width = `${width}px`;
			gl.canvas.style.height = `${height}px`;
		}
		if (activeSurface === Surface.Screen)
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
}

export
class Color
{
	// note: predefined colors encoded in 8-bit RGBA (not float) because this whole table was
	//       copied and pasted from neoSphere and I was too lazy to convert it.
	static get AliceBlue ()            { return new Color(240 / 255, 248 / 255, 255 / 255, 255 / 255); }
	static get AntiqueWhite ()         { return new Color(250 / 255, 235 / 255, 215 / 255, 255 / 255); }
	static get Aqua ()                 { return new Color(0   / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get Aquamarine ()           { return new Color(127 / 255, 255 / 255, 212 / 255, 255 / 255); }
	static get Azure ()                { return new Color(240 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get Beige ()                { return new Color(245 / 255, 245 / 255, 220 / 255, 255 / 255); }
	static get Bisque ()               { return new Color(255 / 255, 228 / 255, 196 / 255, 255 / 255); }
	static get Black ()                { return new Color(0   / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get BlanchedAlmond ()       { return new Color(255 / 255, 235 / 255, 205 / 255, 255 / 255); }
	static get Blue ()                 { return new Color(0   / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get BlueViolet ()           { return new Color(138 / 255, 43  / 255, 226 / 255, 255 / 255); }
	static get Brown ()                { return new Color(165 / 255, 42  / 255, 42  / 255, 255 / 255); }
	static get BurlyWood ()            { return new Color(222 / 255, 184 / 255, 135 / 255, 255 / 255); }
	static get CadetBlue ()            { return new Color(95  / 255, 158 / 255, 160 / 255, 255 / 255); }
	static get Chartreuse ()           { return new Color(127 / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get Chocolate ()            { return new Color(210 / 255, 105 / 255, 30  / 255, 255 / 255); }
	static get Coral ()                { return new Color(255 / 255, 127 / 255, 80  / 255, 255 / 255); }
	static get CornflowerBlue ()       { return new Color(100 / 255, 149 / 255, 237 / 255, 255 / 255); }
	static get Cornsilk ()             { return new Color(255 / 255, 248 / 255, 220 / 255, 255 / 255); }
	static get Crimson ()              { return new Color(220 / 255, 20  / 255, 60  / 255, 255 / 255); }
	static get Cyan ()                 { return new Color(0   / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get DarkBlue ()             { return new Color(0   / 255, 0   / 255, 139 / 255, 255 / 255); }
	static get DarkCyan ()             { return new Color(0   / 255, 139 / 255, 139 / 255, 255 / 255); }
	static get DarkGoldenrod ()        { return new Color(184 / 255, 134 / 255, 11  / 255, 255 / 255); }
	static get DarkGray ()             { return new Color(169 / 255, 169 / 255, 169 / 255, 255 / 255); }
	static get DarkGreen ()            { return new Color(0   / 255, 100 / 255, 0   / 255, 255 / 255); }
	static get DarkKhaki ()            { return new Color(189 / 255, 183 / 255, 107 / 255, 255 / 255); }
	static get DarkMagenta ()          { return new Color(139 / 255, 0   / 255, 139 / 255, 255 / 255); }
	static get DarkOliveGreen ()       { return new Color(85  / 255, 107 / 255, 47  / 255, 255 / 255); }
	static get DarkOrange ()           { return new Color(255 / 255, 140 / 255, 0   / 255, 255 / 255); }
	static get DarkOrchid ()           { return new Color(153 / 255, 50  / 255, 204 / 255, 255 / 255); }
	static get DarkRed ()              { return new Color(139 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get DarkSalmon ()           { return new Color(233 / 255, 150 / 255, 122 / 255, 255 / 255); }
	static get DarkSeaGreen ()         { return new Color(143 / 255, 188 / 255, 143 / 255, 255 / 255); }
	static get DarkSlateBlue ()        { return new Color(72  / 255, 61  / 255, 139 / 255, 255 / 255); }
	static get DarkSlateGray ()        { return new Color(47  / 255, 79  / 255, 79  / 255, 255 / 255); }
	static get DarkTurquoise ()        { return new Color(0   / 255, 206 / 255, 209 / 255, 255 / 255); }
	static get DarkViolet ()           { return new Color(148 / 255, 0   / 255, 211 / 255, 255 / 255); }
	static get DeepPink ()             { return new Color(255 / 255, 20  / 255, 147 / 255, 255 / 255); }
	static get DeepSkyBlue ()          { return new Color(0   / 255, 191 / 255, 255 / 255, 255 / 255); }
	static get DimGray ()              { return new Color(105 / 255, 105 / 255, 105 / 255, 255 / 255); }
	static get DodgerBlue ()           { return new Color(30  / 255, 144 / 255, 255 / 255, 255 / 255); }
	static get FireBrick ()            { return new Color(178 / 255, 34  / 255, 34  / 255, 255 / 255); }
	static get FloralWhite ()          { return new Color(255 / 255, 250 / 255, 240 / 255, 255 / 255); }
	static get ForestGreen ()          { return new Color(34  / 255, 139 / 255, 34  / 255, 255 / 255); }
	static get Fuchsia ()              { return new Color(255 / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get Gainsboro ()            { return new Color(220 / 255, 220 / 255, 220 / 255, 255 / 255); }
	static get GhostWhite ()           { return new Color(248 / 255, 248 / 255, 255 / 255, 255 / 255); }
	static get Gold ()                 { return new Color(255 / 255, 215 / 255, 0   / 255, 255 / 255); }
	static get Goldenrod ()            { return new Color(218 / 255, 165 / 255, 32  / 255, 255 / 255); }
	static get Gray ()                 { return new Color(128 / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get Green ()                { return new Color(0   / 255, 128 / 255, 0   / 255, 255 / 255); }
	static get GreenYellow ()          { return new Color(173 / 255, 255 / 255, 47  / 255, 255 / 255); }
	static get Honeydew ()             { return new Color(240 / 255, 255 / 255, 240 / 255, 255 / 255); }
	static get HotPink ()              { return new Color(255 / 255, 105 / 255, 180 / 255, 255 / 255); }
	static get IndianRed ()            { return new Color(205 / 255, 92  / 255, 92  / 255, 255 / 255); }
	static get Indigo ()               { return new Color(75  / 255, 0   / 255, 130 / 255, 255 / 255); }
	static get Ivory ()                { return new Color(255 / 255, 255 / 255, 240 / 255, 255 / 255); }
	static get Khaki ()                { return new Color(240 / 255, 230 / 255, 140 / 255, 255 / 255); }
	static get Lavender ()             { return new Color(230 / 255, 230 / 255, 250 / 255, 255 / 255); }
	static get LavenderBlush ()        { return new Color(255 / 255, 240 / 255, 245 / 255, 255 / 255); }
	static get LawnGreen ()            { return new Color(124 / 255, 252 / 255, 0   / 255, 255 / 255); }
	static get LemonChiffon ()         { return new Color(255 / 255, 250 / 255, 205 / 255, 255 / 255); }
	static get LightBlue ()            { return new Color(173 / 255, 216 / 255, 230 / 255, 255 / 255); }
	static get LightCoral ()           { return new Color(240 / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get LightCyan ()            { return new Color(224 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get LightGoldenrodYellow () { return new Color(250 / 255, 250 / 255, 210 / 255, 255 / 255); }
	static get LightGray ()            { return new Color(211 / 255, 211 / 255, 211 / 255, 255 / 255); }
	static get LightGreen ()           { return new Color(144 / 255, 238 / 255, 144 / 255, 255 / 255); }
	static get LightPink ()            { return new Color(255 / 255, 182 / 255, 193 / 255, 255 / 255); }
	static get LightSalmon ()          { return new Color(255 / 255, 160 / 255, 122 / 255, 255 / 255); }
	static get LightSeaGreen ()        { return new Color(32  / 255, 178 / 255, 170 / 255, 255 / 255); }
	static get LightSkyBlue ()         { return new Color(135 / 255, 206 / 255, 250 / 255, 255 / 255); }
	static get LightSlateGray ()       { return new Color(119 / 255, 136 / 255, 153 / 255, 255 / 255); }
	static get LightSteelBlue ()       { return new Color(176 / 255, 196 / 255, 222 / 255, 255 / 255); }
	static get LightYellow ()          { return new Color(255 / 255, 255 / 255, 224 / 255, 255 / 255); }
	static get Lime ()                 { return new Color(0   / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get LimeGreen ()            { return new Color(50  / 255, 205 / 255, 50  / 255, 255 / 255); }
	static get Linen ()                { return new Color(250 / 255, 240 / 255, 230 / 255, 255 / 255); }
	static get Magenta ()              { return new Color(255 / 255, 0   / 255, 255 / 255, 255 / 255); }
	static get Maroon ()               { return new Color(128 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get MediumAquamarine ()     { return new Color(102 / 255, 205 / 255, 170 / 255, 255 / 255); }
	static get MediumBlue ()           { return new Color(0   / 255, 0   / 255, 205 / 255, 255 / 255); }
	static get MediumOrchid ()         { return new Color(186 / 255, 85  / 255, 211 / 255, 255 / 255); }
	static get MediumPurple ()         { return new Color(147 / 255, 112 / 255, 219 / 255, 255 / 255); }
	static get MediumSeaGreen ()       { return new Color(60  / 255, 179 / 255, 113 / 255, 255 / 255); }
	static get MediumSlateBlue ()      { return new Color(123 / 255, 104 / 255, 238 / 255, 255 / 255); }
	static get MediumSpringGreen ()    { return new Color(0   / 255, 250 / 255, 154 / 255, 255 / 255); }
	static get MediumTurquoise ()      { return new Color(72  / 255, 209 / 255, 204 / 255, 255 / 255); }
	static get MediumVioletRed ()      { return new Color(199 / 255, 21  / 255, 133 / 255, 255 / 255); }
	static get MidnightBlue ()         { return new Color(25  / 255, 25  / 255, 112 / 255, 255 / 255); }
	static get MintCream ()            { return new Color(245 / 255, 255 / 255, 250 / 255, 255 / 255); }
	static get MistyRose ()            { return new Color(255 / 255, 228 / 255, 225 / 255, 255 / 255); }
	static get Moccasin ()             { return new Color(255 / 255, 228 / 255, 181 / 255, 255 / 255); }
	static get NavajoWhite ()          { return new Color(255 / 255, 222 / 255, 173 / 255, 255 / 255); }
	static get Navy ()                 { return new Color(0   / 255, 0   / 255, 128 / 255, 255 / 255); }
	static get OldLace ()              { return new Color(253 / 255, 245 / 255, 230 / 255, 255 / 255); }
	static get Olive ()                { return new Color(128 / 255, 128 / 255, 0   / 255, 255 / 255); }
	static get OliveDrab ()            { return new Color(107 / 255, 142 / 255, 35  / 255, 255 / 255); }
	static get Orange ()               { return new Color(255 / 255, 165 / 255, 0   / 255, 255 / 255); }
	static get OrangeRed ()            { return new Color(255 / 255, 69  / 255, 0   / 255, 255 / 255); }
	static get Orchid ()               { return new Color(218 / 255, 112 / 255, 214 / 255, 255 / 255); }
	static get PaleGoldenrod ()        { return new Color(238 / 255, 232 / 255, 170 / 255, 255 / 255); }
	static get PaleGreen ()            { return new Color(152 / 255, 251 / 255, 152 / 255, 255 / 255); }
	static get PaleTurquoise ()        { return new Color(175 / 255, 238 / 255, 238 / 255, 255 / 255); }
	static get PaleVioletRed ()        { return new Color(219 / 255, 112 / 255, 147 / 255, 255 / 255); }
	static get PapayaWhip ()           { return new Color(225 / 255, 239 / 255, 213 / 255, 255 / 255); }
	static get PeachPuff ()            { return new Color(255 / 255, 218 / 255, 185 / 255, 255 / 255); }
	static get Peru ()                 { return new Color(205 / 255, 133 / 255, 63  / 255, 255 / 255); }
	static get Pink ()                 { return new Color(255 / 255, 192 / 255, 203 / 255, 255 / 255); }
	static get Plum ()                 { return new Color(221 / 255, 160 / 255, 221 / 255, 255 / 255); }
	static get PowderBlue ()           { return new Color(176 / 255, 224 / 255, 230 / 255, 255 / 255); }
	static get Purple ()               { return new Color(128 / 255, 0   / 255, 128 / 255, 255 / 255); }
	static get Red ()                  { return new Color(255 / 255, 0   / 255, 0   / 255, 255 / 255); }
	static get RosyBrown ()            { return new Color(188 / 255, 143 / 255, 143 / 255, 255 / 255); }
	static get RoyalBlue ()            { return new Color(65  / 255, 105 / 255, 225 / 255, 255 / 255); }
	static get SaddleBrown ()          { return new Color(139 / 255, 69  / 255, 19  / 255, 255 / 255); }
	static get Salmon ()               { return new Color(250 / 255, 128 / 255, 114 / 255, 255 / 255); }
	static get SandyBrown ()           { return new Color(244 / 255, 164 / 255, 96  / 255, 255 / 255); }
	static get SeaGreen ()             { return new Color(46  / 255, 139 / 255, 87  / 255, 255 / 255); }
	static get Seashell ()             { return new Color(255 / 255, 245 / 255, 238 / 255, 255 / 255); }
	static get Sienna ()               { return new Color(160 / 255, 82  / 255, 45  / 255, 255 / 255); }
	static get Silver ()               { return new Color(192 / 255, 192 / 255, 192 / 255, 255 / 255); }
	static get SkyBlue ()              { return new Color(135 / 255, 206 / 255, 235 / 255, 255 / 255); }
	static get SlateBlue ()            { return new Color(106 / 255, 90  / 255, 205 / 255, 255 / 255); }
	static get SlateGray ()            { return new Color(112 / 255, 128 / 255, 144 / 255, 255 / 255); }
	static get Snow ()                 { return new Color(255 / 255, 250 / 255, 250 / 255, 255 / 255); }
	static get SpringGreen ()          { return new Color(0   / 255, 255 / 255, 127 / 255, 255 / 255); }
	static get SteelBlue ()            { return new Color(70  / 255, 130 / 255, 180 / 255, 255 / 255); }
	static get Tan ()                  { return new Color(210 / 255, 180 / 255, 140 / 255, 255 / 255); }
	static get Teal ()                 { return new Color(0   / 255, 128 / 255, 128 / 255, 255 / 255); }
	static get Thistle ()              { return new Color(216 / 255, 191 / 255, 216 / 255, 255 / 255); }
	static get Tomato ()               { return new Color(255 / 255, 99  / 255, 71  / 255, 255 / 255); }
	static get Transparent ()          { return new Color(0   / 255, 0   / 255, 0   / 255, 0   / 255); }
	static get Turquoise ()            { return new Color(64  / 255, 224 / 255, 208 / 255, 255 / 255); }
	static get Violet ()               { return new Color(238 / 255, 130 / 255, 238 / 255, 255 / 255); }
	static get Wheat ()                { return new Color(245 / 255, 222 / 255, 179 / 255, 255 / 255); }
	static get White ()                { return new Color(255 / 255, 255 / 255, 255 / 255, 255 / 255); }
	static get WhiteSmoke ()           { return new Color(245 / 255, 245 / 255, 245 / 255, 255 / 255); }
	static get Yellow ()               { return new Color(255 / 255, 255 / 255, 0   / 255, 255 / 255); }
	static get YellowGreen ()          { return new Color(154 / 255, 205 / 255, 50  / 255, 255 / 255); }
	static get PurwaBlue ()            { return new Color(155 / 255, 225 / 255, 255 / 255, 255 / 255); }
	static get RebeccaPurple ()        { return new Color(102 / 255, 51  / 255, 153 / 255, 255 / 255); }
	static get StankyBean ()           { return new Color(197 / 255, 162 / 255, 171 / 255, 255 / 255); }

	r: number;
	g: number;
	b: number;
	a: number;

	static is(x: Color, y: Color)
	{
		return x.r === y.r && x.g === y.g && x.b === y.b;
	}

	static mix(x: Color, y: Color, wx = 1.0, wy = 1.0)
	{
		const totalWeight = wx + wy;
		wx /= totalWeight;
		wy /= totalWeight;
		return new Color(
			x.r * wx + y.r * wy,
			x.g * wx + y.g * wy,
			x.b * wx + y.b * wy,
			x.a * wx + y.a * wy);
	}
	
	static of(name: string)
	{
		// parse 6-digit format (#rrggbb)
		let matched = name.match(/^#?([0-9a-f]{6})$/i);
		if (matched) {
			const m = matched[1];
			return new Color(
				parseInt(m.slice(0, 2), 16) / 255.0,
				parseInt(m.slice(2, 4), 16) / 255.0,
				parseInt(m.slice(4, 6), 16) / 255.0,
			);
		}

		// parse 8-digit format (#aarrggbb)
		matched = name.match(/^#?([0-9a-f]{8})$/i);
		if (matched) {
			const m = matched[1];
			return new Color(
				parseInt(m.slice(2, 4), 16) / 255.0,
				parseInt(m.slice(4, 6), 16) / 255.0,
				parseInt(m.slice(6, 8), 16) / 255.0,
				parseInt(m.slice(0, 2), 16) / 255.0,
			);
		}

		// see if `name` matches a predefined color (not case sensitive)
		const toMatch = name.toUpperCase();

		for (const colorName in Color) {
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
	
	constructor(r: number, g: number, b: number, a = 1.0)
	{
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	get name(): string
	{
		throw new Error(`'Color#name' API is not implemented`);
	}

	clone()
	{
		return new Color(this.r, this.g, this.b, this.a);
	}

	fadeTo(alphaFactor: number)
	{
		return new Color(this.r, this.g, this.b,
			this.a * alphaFactor);
	}

	toVector()
	{
		return [ this.r, this.g, this.b, this.a ];
	}
}

export
class IndexList
{
	glBuffer: WebGLBuffer | null = null;
	length: number = 0;

	constructor(indices: ArrayLike<number>)
	{
		this.glBuffer = gl.createBuffer();
		if (this.glBuffer === null)
			throw new Error(`Oozaru was unable to create a WebGL buffer object.`);
		this.upload(indices);
	}

	activate()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
	}

	upload(indices: ArrayLike<number>)
	{
		const values = new Uint16Array(indices);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STREAM_DRAW);
		this.length = values.length;
	}
}

export
class Model
{
	shapes: Shape[];
	shader_: Shader;
	transform_: Transform;

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

	get transform()
	{
		return this.transform_;
	}

	set shader(value)
	{
		this.shader_ = value;
	}

	set transform(value)
	{
		this.transform_ = value;
	}

	draw(surface = Surface.Screen)
	{
		for (const shape of this.shapes)
			shape.draw(surface, this.transform_, this.shader_);
	}
}

export
class Shader
{
	static get Default()
	{
		return defaultShader;
	}
	
	static async fromFiles(options: ShaderOptions)
	{
		const vertexURL = Game.urlOf(options.vertexFile);
		const fragmentURL = Game.urlOf(options.fragmentFile);
		const [ vertexSource, fragmentSource ] = await Promise.all([
			Fido.fetchText(vertexURL),
			Fido.fetchText(fragmentURL),
		]);
		return new Shader(vertexSource, fragmentSource);
	}
	
	fragmentSource: string;
	glProgram: WebGLProgram;
	modelView: Transform;
	projection: Transform;
	uniformIDs: { [x: string]: WebGLUniformLocation | null } = {};
	vertexSource: string;
	valuesToSet: { [x: string]: { type: string, value: any } } = {};

	constructor(vertexSource: string, fragmentSource: string)
	{
		const program = gl.createProgram();
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		if (program === null || vertShader === null || fragShader === null)
			throw new Error(`Oozaru was unable to create a WebGL shader object`);

		// compile vertex and fragment shaders and check for errors
		gl.shaderSource(vertShader, vertexSource);
		gl.shaderSource(fragShader, fragmentSource);
		gl.compileShader(vertShader);
		if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
			const message = gl.getShaderInfoLog(vertShader);
			throw new Error(`Unable to compile vertex shader...\n${message}`);
		}
		gl.compileShader(fragShader);
		if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
			const message = gl.getShaderInfoLog(fragShader);
			throw new Error(`Unable to compile fragment shader...\n${message}`);
		}

		// link the individual shaders into a program, check for errors
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.bindAttribLocation(program, 0, 'al_pos');
		gl.bindAttribLocation(program, 1, 'al_color');
		gl.bindAttribLocation(program, 2, 'al_texcoord');
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const message = gl.getProgramInfoLog(program);
			throw new Error(`Couldn't link shader program...\n${message}`);
		}

		this.fragmentSource = fragmentSource;
		this.glProgram = program;
		this.projection = Transform.Identity;
		this.modelView = Transform.Identity;
		this.vertexSource = vertexSource;

		let transformation = this.modelView.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
		this.setInt('al_tex', 0);
	}

	activate(useTexture: boolean)
	{
		if (activeShader !== this) {
			gl.useProgram(this.glProgram);
			for (const name of Object.keys(this.valuesToSet)) {
				const entry = this.valuesToSet[name];
				const slot = this.uniformIDs[name];
				let size: number;
				switch (entry.type) {
					case 'bool':
						gl.uniform1i(slot, entry.value ? 1 : 0);
						break;
					case 'float':
						gl.uniform1f(slot, entry.value);
						break;
					case 'floatArray':
						gl.uniform1fv(slot, entry.value);
						break;
					case 'floatVec':
						size = entry.value.length;
						size === 4 ? gl.uniform4fv(slot, entry.value)
							: size === 3 ? gl.uniform3fv(slot, entry.value)
							: size === 2 ? gl.uniform2fv(slot, entry.value)
							: gl.uniform1fv(slot, entry.value);
						break;
					case 'int':
						gl.uniform1i(slot, entry.value);
						break;
					case 'intArray':
						gl.uniform1iv(slot, entry.value);
						break;
					case 'intVec':
						size = entry.value.length;
						size === 4 ? gl.uniform4iv(slot, entry.value)
							: size === 3 ? gl.uniform3iv(slot, entry.value)
							: size === 2 ? gl.uniform2iv(slot, entry.value)
							: gl.uniform1iv(slot, entry.value);
						break;
					case 'matrix':
						gl.uniformMatrix4fv(slot, false, entry.value.values);
						break;
				}
			}
			this.valuesToSet = {};
			activeShader = this;
		}
		this.setBoolean('al_use_tex', useTexture);
	}

	clone()
	{
		return new Shader(this.vertexSource, this.fragmentSource);
	}

	project(matrix: Transform)
	{
		this.projection = matrix.clone();
		let transformation = this.modelView.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
	}

	setBoolean(name: string, value: boolean)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1i(location, value ? 1 : 0);
		else
			this.valuesToSet[name] = { type: 'bool', value };
	}

	setColorVector(name: string, color: Color)
	{
		this.setFloatVector(name, color.toVector());
	}

	setFloat(name: string, value: number)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1f(location, value);
		else
			this.valuesToSet[name] = { type: 'float', value };
	}

	setFloatArray(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1fv(location, values);
		else
			this.valuesToSet[name] = { type: 'floatArray', value: values };
	}

	setFloatVector(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this) {
			const size = values.length;
			size === 4 ? gl.uniform4fv(location, values)
				: size === 3 ? gl.uniform3fv(location, values)
				: size === 2 ? gl.uniform2fv(location, values)
				: gl.uniform1fv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'floatVec', value: values };
		}
	}

	setInt(name: string, value: number)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1i(location, value);
		else
			this.valuesToSet[name] = { type: 'int', value };
	}

	setIntArray(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1iv(location, values);
		else
			this.valuesToSet[name] = { type: 'intArray', value: values };
	}

	setIntVector(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this) {
			const size = values.length;
			size === 4 ? gl.uniform4iv(location, values)
				: size === 3 ? gl.uniform3iv(location, values)
				: size === 2 ? gl.uniform2iv(location, values)
				: gl.uniform1iv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'intVec', value: values };
		}
	}

	setMatrix(name: string, value: Transform)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.glProgram, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniformMatrix4fv(location, false, value.values);
		else
			this.valuesToSet[name] = { type: 'matrix', value };
	}

	transform(matrix: Transform)
	{
		this.modelView = matrix.clone();
		let transformation = this.modelView.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
	}
}

export
class Shape
{
	static drawImmediate(surface: Surface, type: ShapeType, texture: Texture | null, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: ShapeType, vertices: ArrayLike<Vertex>): void
	static drawImmediate(surface: Surface, type: ShapeType, arg1: Texture | ArrayLike<Vertex> | null, arg2?: ArrayLike<Vertex>)
	{
		if (arg1 instanceof Texture || arg1 === null) {
			surface.activate(defaultShader, arg1);
			Galileo.draw(type, new VertexList(arg2!));
		}
		else {
			surface.activate(defaultShader);
			Galileo.draw(type, new VertexList(arg1));
		}
	}

	indices: IndexList | null;
	texture: Texture | null;
	type: ShapeType;
	vertices: VertexList;

	constructor(type: ShapeType, texture: Texture | null, vertices: VertexList, indices?: IndexList | null)
	constructor(type: ShapeType, vertices: VertexList, indices?: IndexList | null)
	constructor(type: ShapeType, arg1: Texture | VertexList | null, arg2: VertexList | IndexList | null = null, arg3: IndexList | null = null)
	{
		this.type = type;
		if (arg2 instanceof VertexList) {
			if (!(arg1 instanceof Texture) && arg1 != undefined)
				throw new Error("Expected a Texture or 'null' as second argument to Shape constructor");
			this.vertices = arg2;
			this.indices = arg3;
			this.texture = arg1;
		}
		else {
			if (!(arg1 instanceof VertexList))
				throw new Error("Expected a VertexList or Texture as second argument to Shape constructor");
			this.vertices = arg1;
			this.indices = arg2;
			this.texture = null;
		}
	}

	draw(surface = Surface.Screen, transform = Transform.Identity, shader = Shader.Default)
	{
		surface.activate(shader, this.texture, transform);
		Galileo.draw(this.type, this.vertices, this.indices);
	}
}

export
class Texture
{
	static async fromFile(fileName: string)
	{
		fileName = Game.urlOf(fileName);
		const image = await Fido.fetchImage(fileName);
		return new this(image);
	}

	glTexture: WebGLTexture;
	size: Size;

	constructor(image: HTMLImageElement);
	constructor(width: number, height: number, content?: BufferSource | Color);
	constructor(image: string);
	constructor(arg1: HTMLImageElement | number | string, arg2?: number, arg3?: BufferSource | Color)
	{
		if (typeof arg1 === 'string')
			throw RangeError("new Texture() from filename is unsupported under Oozaru.");

		const glTexture = gl.createTexture();
		if (glTexture === null)
			throw new Error(`Unable to create WebGL texture object`);
		this.glTexture = glTexture;
		const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		if (arg1 instanceof HTMLImageElement) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, arg1);
			this.size = { width: arg1.width, height: arg1.height };
		}
		else {
			const width = arg1;
			const height = arg2!;
			if (arg3 instanceof ArrayBuffer || ArrayBuffer.isView(arg3)) {
				const buffer = arg3 instanceof ArrayBuffer ? arg3 : arg3.buffer;
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					new Uint8Array(buffer));
			}
			else {
				let pixels = new Uint32Array(width * height);
				if (arg3 !== undefined)
					pixels.fill((arg3.a * 255 << 24) + (arg3.b * 255 << 16) + (arg3.g * 255 << 8) + (arg3.r * 255));
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					new Uint8Array(pixels.buffer));
			}
			this.size = { width, height };
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, oldBinding);
	}

	get height()
	{
		return this.size.height;
	}

	get width()
	{
		return this.size.width;
	}

	upload(content: BufferSource, x = 0, y = 0, width = this.size.width, height = this.size.height)
	{
		const pixelData = ArrayBuffer.isView(content)
			? new Uint8Array(content.buffer)
			: new Uint8Array(content);
		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, x, this.size.height - y - height, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
	}

	useTexture(textureUnit = 0)
	{
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
	}
}

export
class Surface extends Texture
{
	blendOp_ = BlendOp.Default;
	clipping: Rectangle;
	depthOp_ = DepthOp.AlwaysPass;
	frameBuffer: WebGLFramebuffer | null;
	projection: Transform;

	static get Screen()
	{
		const screenSurface = Object.create(Surface.prototype) as Surface;
		screenSurface.size = { width: gl.canvas.width, height: gl.canvas.height };
		screenSurface.blendOp_ = BlendOp.Default;
		screenSurface.clipping = { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height };
		screenSurface.depthOp_ = DepthOp.AlwaysPass;
		screenSurface.frameBuffer = null;
		screenSurface.projection = new Transform()
			.project2D(0, 0, gl.canvas.width, gl.canvas.height);
		Object.defineProperty(Surface, 'Screen', {
			value: screenSurface,
			writable: false,
			enumerable: false,
			configurable: true,
		});
		return screenSurface;
	}

	constructor(...args: | [ HTMLImageElement ]
	                     | [ string ]
	                     | [ number, number, (BufferSource | Color)? ])
	{
		// @ts-expect-error
		super(...args);

		const frameBuffer = gl.createFramebuffer();
		const depthBuffer = gl.createRenderbuffer();
		if (frameBuffer === null || depthBuffer === null)
			throw new Error(`Oozaru was unable to create a WebGL frame buffer.`);

		// in order to set up a new FBO we need to change the current framebuffer binding, so make sure
		// it gets changed back afterwards.
		const previousFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.glTexture, 0);
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, previousFBO);

		this.clipping = { x: 0, y: 0, w: this.width, h: this.height };
		this.frameBuffer = frameBuffer;
		this.projection = new Transform()
			.project2D(0, 0, this.width, this.height);
	}

	get blendOp()
	{
		return this.blendOp_;
	}

	get depthOp()
	{
		return this.depthOp_;
	}

	get transform()
	{
		return this.projection;
	}

	set blendOp(value)
	{
		this.blendOp_ = value;
		if (activeSurface === this)
			applyBlendOp(value);
	}

	set depthOp(value)
	{
		this.depthOp_ = value;
		if (activeSurface === this)
			applyDepthOp(value);
	}

	set transform(value)
	{
		this.projection = value;
	}

	activate(shader: Shader, texture: Texture | null = null, transform = Transform.Identity)
	{
		if (this !== activeSurface) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
			gl.viewport(0, 0, this.width, this.height);
			gl.scissor(this.clipping.x, this.clipping.y, this.clipping.w, this.clipping.h);
			applyBlendOp(this.blendOp_);
			applyDepthOp(this.depthOp_);
			activeSurface = this;
		}
		shader.activate(texture !== null);
		shader.project(this.projection);
		shader.transform(transform);
		texture?.useTexture(0);
	}

	clipTo(x: number, y: number, width: number, height: number)
	{
		this.clipping.x = x;
		this.clipping.y = y;
		this.clipping.w = width;
		this.clipping.h = height;
		if (this === activeSurface)
			gl.scissor(x, this.height - y - height, width, height);
	}

	unclip()
	{
		this.clipTo(0, 0, this.width, this.height);
	}
}

export
class Transform
{
	values: Float32Array;

	static get Identity()
	{
		return new this([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0,
		]);
	}

	static get Zero()
	{
		return new this([
			0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0,
		]);
	}

	constructor(values?: ArrayLike<number>)
	{
		if (values !== undefined) {
			if (values.length !== 16)
				throw RangeError("new Transform() requires a 16-element array of numbers as input.");
			this.values = new Float32Array(values);
		}
		else {
			this.values = new Float32Array([
				1.0, 0.0, 0.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 1.0, 0.0,
				0.0, 0.0, 0.0, 1.0,
			]);
		}
	}

	clone()
	{
		return new Transform(this.values);
	}

	compose(other: Transform)
	{
		const m1 = this.values;
		const m2 = other.values;

		// multiply from the left (i.e. `other * this`).  this emulates the way Allegro's
		// `al_compose_transform()` function works--that is, transformations are logically applied in
		// the order they're specified, rather than reversed as in classic OpenGL.
		const a00  = m2[0], a01 = m2[1], a02 = m2[2], a03 = m2[3];
		const a10  = m2[4], a11 = m2[5], a12 = m2[6], a13 = m2[7];
		const a20  = m2[8], a21 = m2[9], a22 = m2[10], a23 = m2[11];
		const a30  = m2[12], a31 = m2[13], a32 = m2[14], a33 = m2[15];
		const b00 = m1[0], b01 = m1[1], b02 = m1[2], b03 = m1[3];
		const b10 = m1[4], b11 = m1[5], b12 = m1[6], b13 = m1[7];
		const b20 = m1[8], b21 = m1[9], b22 = m1[10], b23 = m1[11];
		const b30 = m1[12], b31 = m1[13], b32 = m1[14], b33 = m1[15];

		// multiply the matrices together.  funny story: I still don't understand how this
		// works.  but it does, so...
		m1[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
		m1[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
		m1[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
		m1[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
		m1[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
		m1[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
		m1[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
		m1[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
		m1[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
		m1[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
		m1[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
		m1[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
		m1[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
		m1[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
		m1[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
		m1[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

		return this;
	}

	identity()
	{
		this.values.set([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0,
		]);
		return this;
	}

	project2D(left: number, top: number, right: number, bottom: number, near = -1.0, far = 1.0)
	{
		const deltaX = right - left;
		const deltaY = top - bottom;
		const deltaZ = far - near;

		const projection = Transform.Zero;
		const values = projection.values;
		values[0] = 2.0 / deltaX;
		values[5] = 2.0 / deltaY;
		values[10] = 2.0 / deltaZ;
		values[15] = 1.0;
		values[12] = -(right + left) / deltaX;
		values[13] = -(top + bottom) / deltaY;
		values[14] = -(far + near) / deltaZ;

		return this.compose(projection);
	}

	project3D(fov: number, aspect: number, near: number, far: number)
	{
		const fh = Math.tan(fov * Math.PI / 360.0) * near;
		const fw = fh * aspect;

		const deltaX = fw - -fw;
		const deltaY = -fh - fh;
		const deltaZ = far - near;

		const projection = Transform.Zero;
		const values = projection.values;
		values[0] = 2.0 * near / deltaX;
		values[5] = 2.0 * near / deltaY;
		values[8] = (fw + -fw) / deltaX;
		values[9] = (-fh + fh) / deltaY;
		values[10] = -(far + near) / deltaZ;
		values[11] = -1.0;
		values[14] = -2.0 * far * near / deltaZ;
		values[15] = 0.0;

		return this.compose(projection);
	}

	rotate(angle: number, vX: number, vY: number, vZ: number)
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

		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		const siv = 1.0 - cos;

		const rotation = Transform.Zero;
		const values = rotation.values;
		values[0] = (siv * vX * vX) + cos;
		values[1] = (siv * vX * vY) + (vZ * sin);
		values[2] = (siv * vX * vZ) - (vY * sin);
		values[4] = (siv * vX * vY) - (vZ * sin);
		values[5] = (siv * vY * vY) + cos;
		values[6] = (siv * vZ * vY) + (vX * sin);
		values[8] = (siv * vX * vZ) + (vY * sin);
		values[9] = (siv * vY * vZ) - (vX * sin);
		values[10] = (siv * vZ * vZ) + cos;
		values[15] = 1.0;

		return this.compose(rotation);
	}

	scale(sX: number, sY: number, sZ = 1.0)
	{
		this.values[0] *= sX;
		this.values[4] *= sX;
		this.values[8] *= sX;
		this.values[12] *= sX;

		this.values[1] *= sY;
		this.values[5] *= sY;
		this.values[9] *= sY;
		this.values[13] *= sY;

		this.values[2] *= sZ;
		this.values[6] *= sZ;
		this.values[10] *= sZ;
		this.values[14] *= sZ;

		return this;
	}

	translate(tX: number, tY: number, tZ = 0.0)
	{
		this.values[12]	+= tX;
		this.values[13] += tY;
		this.values[14] += tZ;
		return this;
	}
}

export
class VertexList
{
	glBuffer: WebGLBuffer | null = null;
	length: number = 0;

	constructor(vertices: ArrayLike<Vertex>)
	{
		this.glBuffer = gl.createBuffer();
		if (this.glBuffer === null)
			throw new Error(`Oozaru was unable to create a WebGL buffer object.`);
		this.upload(vertices);
	}

	activate()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 40, 0);
		gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 40, 16);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 40, 32);
	}

	upload(vertices: ArrayLike<Vertex>)
	{
		const data = new Float32Array(10 * vertices.length);
		for (let i = 0, len = vertices.length; i < len; ++i) {
			const vertex = vertices[i];
			data[0 + i * 10] = vertex.x;
			data[1 + i * 10] = vertex.y;
			data[2 + i * 10] = vertex.z ?? 0.0;
			data[3 + i * 10] = 1.0;
			data[4 + i * 10] = vertex.color?.r ?? 1.0;
			data[5 + i * 10] = vertex.color?.g ?? 1.0;
			data[6 + i * 10] = vertex.color?.b ?? 1.0;
			data[7 + i * 10] = vertex.color?.a ?? 1.0;
			data[8 + i * 10] = vertex.u ?? 0.0;
			data[9 + i * 10] = vertex.v ?? 0.0;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
		this.length = vertices.length;
	}
}

function applyBlendOp(op: BlendOp)
{
	switch (op) {
		case BlendOp.Default:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			break;
		case BlendOp.Add:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ONE, gl.ONE);
			break;
		case BlendOp.Average:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
			gl.blendColor(0.5, 0.5, 0.5, 0.5);
			break;
		case BlendOp.CopyAlpha:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFuncSeparate(gl.ZERO, gl.ONE, gl.ONE, gl.ZERO);
			break;
		case BlendOp.CopyRGB:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ZERO, gl.ONE);
			break;
		case BlendOp.Invert:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
			break;
		case BlendOp.Multiply:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.DST_COLOR, gl.ZERO);
			break;
		case BlendOp.Replace:
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ONE, gl.ZERO);
			break;
		case BlendOp.Subtract:
			gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
			gl.blendFunc(gl.ONE, gl.ONE);
			break;
		default:
			// something went horribly wrong if we got here; just set the blender to output
			// nothing so the user can see something went awry.
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ZERO, gl.ZERO);
	}
}

function applyDepthOp(op: DepthOp)
{
	const depthFunc = op === DepthOp.AlwaysPass ? gl.ALWAYS
		: op === DepthOp.Equal ? gl.EQUAL
		: op === DepthOp.Greater ? gl.GREATER
		: op === DepthOp.GreaterOrEqual ? gl.GEQUAL
		: op === DepthOp.Less ? gl.LESS
		: op === DepthOp.LessOrEqual ? gl.LEQUAL
		: op === DepthOp.NotEqual ? gl.NOTEQUAL
		: gl.NEVER;
	gl.depthFunc(depthFunc);
}
