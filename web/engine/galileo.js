/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2015-2022, Fat Cerberus
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
const BlendOp =
{
	Default: 0,
	Add: 1,
	Average: 2,
	CopyAlpha: 3,
	CopyRGB: 4,
	Invert: 5,
	Multiply: 6,
	Replace: 7,
	Subtract: 8,
};

export
const DepthOp =
{
	AlwaysPass: 0,
	Equal: 1,
	Greater: 2,
	GreaterOrEqual: 3,
	Less: 4,
	LessOrEqual: 5,
	NeverPass: 6,
	NotEqual: 7,
}

export
const ShapeType =
{
	Fan: 0,
	Lines: 1,
	LineLoop: 2,
	LineStrip: 3,
	Points: 4,
	Triangles: 5,
	TriStrip: 6,
}

var activeShader = null;
var activeSurface = null;
var defaultShader;
var webGL;

export default
class Galileo
{
	static async initialize(canvas)
	{
		const webGLContext = canvas.getContext('webgl', { alpha: false });
		if (webGLContext === null)
			throw new Error(`Couldn't acquire a WebGL rendering context.`);
		webGL = webGLContext;

		webGL.clearColor(0.0, 0.0, 0.0, 1.0);
		webGL.clearDepth(1.0);
		webGL.blendEquation(webGLContext.FUNC_ADD);
		webGL.blendFunc(webGLContext.SRC_ALPHA, webGLContext.ONE_MINUS_SRC_ALPHA);
		webGL.depthFunc(webGLContext.ALWAYS);
		webGL.enable(webGLContext.BLEND);
		webGL.enable(webGLContext.DEPTH_TEST);
		webGL.enable(webGLContext.SCISSOR_TEST);

		defaultShader = await Shader.fromFiles({
			vertexFile: '#/default.vert.glsl',
			fragmentFile: '#/default.frag.glsl',
		});

		Galileo.flip();
	}

	static draw(shapeType, vertexList, indexList, offset = 0, numVertices)
	{
		const drawMode = shapeType === ShapeType.Fan ? webGL.TRIANGLE_FAN
			: shapeType === ShapeType.Lines ? webGL.LINES
			: shapeType === ShapeType.LineLoop ? webGL.LINE_LOOP
			: shapeType === ShapeType.LineStrip ? webGL.LINE_STRIP
			: shapeType === ShapeType.Points ? webGL.POINTS
			: shapeType === ShapeType.TriStrip ? webGL.TRIANGLE_STRIP
			: webGL.TRIANGLES;
		vertexList.activate();
		if (indexList != null) {
			if (numVertices === undefined)
				numVertices = indexList.length - offset;
			indexList.activate();
			webGL.drawElements(drawMode, numVertices, webGL.UNSIGNED_SHORT, offset);
		}
		else {
			if (numVertices === undefined)
				numVertices = vertexList.length - offset;
			webGL.drawArrays(drawMode, offset, numVertices);
		}
	}

	static flip()
	{
		Surface.Screen.activate(defaultShader);
		Surface.Screen.unclip();
		webGL.disable(webGL.SCISSOR_TEST);
		webGL.clear(webGL.COLOR_BUFFER_BIT | webGL.DEPTH_BUFFER_BIT);
		webGL.enable(webGL.SCISSOR_TEST);
	}

	static rerez(width, height)
	{
		webGL.canvas.width = width;
		webGL.canvas.height = height;
		Surface.Screen.size = { width, height };
		Surface.Screen.projection = new Transform()
			.project2D(0, 0, width, height);
		if (width <= 400 && height <= 300) {
			webGL.canvas.style.width = `${width * 2}px`;
			webGL.canvas.style.height = `${height * 2}px`;
		}
		else {
			webGL.canvas.style.width = `${width}px`;
			webGL.canvas.style.height = `${height}px`;
		}
		if (activeSurface === Surface.Screen)
			webGL.viewport(0, 0, webGL.canvas.width, webGL.canvas.height);
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

	static is(x, y)
	{
		return x.r === y.r && x.g === y.g && x.b === y.b;
	}

	static mix(x, y, wx = 1.0, wy = 1.0)
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

	static of(name)
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
					let propValue = Color[colorName];
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

	r;
	g;
	b;
	a;

	constructor(r, g, b, a = 1.0)
	{
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	get name()
	{
		throw new Error(`The Color#name API is not implemented.`);
	}

	clone()
	{
		return new Color(this.r, this.g, this.b, this.a);
	}

	fadeTo(alphaFactor)
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
	glBuffer = null;
	length = 0;

	constructor(indices)
	{
		this.glBuffer = webGL.createBuffer();
		if (this.glBuffer === null)
			throw new Error(`Engine couldn't create a WebGL buffer object.`);
		this.upload(indices);
	}

	activate()
	{
		webGL.bindBuffer(webGL.ELEMENT_ARRAY_BUFFER, this.glBuffer);
	}

	upload(indices)
	{
		const values = new Uint16Array(indices);
		webGL.bindBuffer(webGL.ELEMENT_ARRAY_BUFFER, this.glBuffer);
		webGL.bufferData(webGL.ELEMENT_ARRAY_BUFFER, values, webGL.STREAM_DRAW);
		this.length = values.length;
	}
}

export
class Model
{
	shapes;
	shader_;
	transform_;

	constructor(shapes, shader = Shader.Default)
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

	static async fromFiles(options)
	{
		const vertexShaderURL = Game.urlOf(options.vertexFile);
		const fragmentShaderURL = Game.urlOf(options.fragmentFile);
		const sources = await Promise.all([
			Fido.fetchText(vertexShaderURL),
			Fido.fetchText(fragmentShaderURL),
		]);
		return new Shader({
			vertexSource: sources[0],
			fragmentSource: sources[1],
		})
}

	fragmentShaderSource = "";
	glFragmentShader;
	glProgram;
	glVertexShader;
	modelViewMatrix = Transform.Identity;
	projection = Transform.Identity;
	uniformIDs = {};
	vertexShaderSource = "";
	valuesToSet = {};

	constructor(options)
	{
		const program = webGL.createProgram();
		const vertexShader = webGL.createShader(webGL.VERTEX_SHADER);
		const fragmentShader = webGL.createShader(webGL.FRAGMENT_SHADER);
		if (program === null || vertexShader === null || fragmentShader === null)
			throw new Error(`Engine couldn't create a WebGL shader object.`);
		this.glProgram = program;
		this.glVertexShader = vertexShader;
		this.glFragmentShader = fragmentShader;

		if ('vertexFile' in options && options.vertexFile !== undefined) {
			throw Error("'new Shader' with filenames is not supported in Oozaru.");
		}
		else if ('vertexSource' in options && options.vertexSource !== undefined) {
			this.compile(options.vertexSource, options.fragmentSource);
		}
		else {
			throw RangeError("'new Shader()' was called without either filenames or shader sources.");
		}
	}

	activate(useTexture)
	{
		if (activeShader !== this) {
			webGL.useProgram(this.glProgram);
			for (const name of Object.keys(this.valuesToSet)) {
				const entry = this.valuesToSet[name];
				let location = this.uniformIDs[name];
				if (location === undefined) {
					location = webGL.getUniformLocation(this.glProgram, name);
					this.uniformIDs[name] = location;
				}
				let size;
				switch (entry.type) {
					case 'boolean':
						webGL.uniform1i(location, entry.value ? 1 : 0);
						break;
					case 'float':
						webGL.uniform1f(location, entry.value);
						break;
					case 'floatArray':
						webGL.uniform1fv(location, entry.value);
						break;
					case 'floatVector':
						size = entry.value.length;
						size === 4 ? webGL.uniform4fv(location, entry.value)
							: size === 3 ? webGL.uniform3fv(location, entry.value)
							: size === 2 ? webGL.uniform2fv(location, entry.value)
							: webGL.uniform1fv(location, entry.value);
						break;
					case 'int':
						webGL.uniform1i(location, entry.value);
						break;
					case 'intArray':
						webGL.uniform1iv(location, entry.value);
						break;
					case 'intVector':
						size = entry.value.length;
						size === 4 ? webGL.uniform4iv(location, entry.value)
							: size === 3 ? webGL.uniform3iv(location, entry.value)
							: size === 2 ? webGL.uniform2iv(location, entry.value)
							: webGL.uniform1iv(location, entry.value);
						break;
					case 'matrix':
						webGL.uniformMatrix4fv(location, false, entry.value.values);
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
		return new Shader({
			vertexSource: this.vertexShaderSource,
			fragmentSource: this.fragmentShaderSource,
		});
	}

	compile(vertexShaderSource, fragmentShaderSource)
	{
		// compile vertex and fragment shaders and check for errors
		webGL.shaderSource(this.glVertexShader, vertexShaderSource);
		webGL.shaderSource(this.glFragmentShader, fragmentShaderSource);
		webGL.compileShader(this.glVertexShader);
		if (!webGL.getShaderParameter(this.glVertexShader, webGL.COMPILE_STATUS)) {
			const message = webGL.getShaderInfoLog(this.glVertexShader);
			throw Error(`Couldn't compile WebGL vertex shader.\n${message}`);
		}
		webGL.compileShader(this.glFragmentShader);
		if (!webGL.getShaderParameter(this.glFragmentShader, webGL.COMPILE_STATUS)) {
			const message = webGL.getShaderInfoLog(this.glFragmentShader);
			throw Error(`Couldn't compile WebGL fragment shader.\n${message}`);
		}

		// link the individual shaders into a program, check for errors
		webGL.attachShader(this.glProgram, this.glVertexShader);
		webGL.attachShader(this.glProgram, this.glFragmentShader);
		webGL.bindAttribLocation(this.glProgram, 0, 'al_pos');
		webGL.bindAttribLocation(this.glProgram, 1, 'al_color');
		webGL.bindAttribLocation(this.glProgram, 2, 'al_texcoord');
		webGL.linkProgram(this.glProgram);
		if (!webGL.getProgramParameter(this.glProgram, webGL.LINK_STATUS)) {
			const message = webGL.getProgramInfoLog(this.glProgram);
			throw Error(`Couldn't link WebGL shader program.\n${message}`);
		}

		this.vertexShaderSource = vertexShaderSource;
		this.fragmentShaderSource = fragmentShaderSource;
		this.uniformIDs = {};

		const transformation = this.modelViewMatrix.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
		this.setInt('al_tex', 0);
	}
	
	project(matrix)
	{
		this.projection = matrix.clone();
		let transformation = this.modelViewMatrix.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
	}

	setBoolean(name, value)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniform1i(location, value ? 1 : 0);
		}
		else {
			this.valuesToSet[name] = { type: 'boolean', value };
		}
	}

	setColorVector(name, color)
	{
		this.setFloatVector(name, color.toVector());
	}

	setFloat(name, value)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniform1f(location, value);
		}
		else {
			this.valuesToSet[name] = { type: 'float', value };
		}
	}

	setFloatArray(name, values)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniform1fv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'floatArray', value: values };
		}
	}

	setFloatVector(name, values)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			const size = values.length;
			size === 4 ? webGL.uniform4fv(location, values)
				: size === 3 ? webGL.uniform3fv(location, values)
				: size === 2 ? webGL.uniform2fv(location, values)
				: webGL.uniform1fv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'floatVector', value: values };
		}
	}

	setInt(name, value)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniform1i(location, value);
		}
		else {
			this.valuesToSet[name] = { type: 'int', value };
		}
	}

	setIntArray(name, values)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniform1iv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'intArray', value: values };
		}
	}

	setIntVector(name, values)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			const size = values.length;
			size === 4 ? webGL.uniform4iv(location, values)
				: size === 3 ? webGL.uniform3iv(location, values)
				: size === 2 ? webGL.uniform2iv(location, values)
				: webGL.uniform1iv(location, values);
		}
		else {
			this.valuesToSet[name] = { type: 'intVector', value: values };
		}
	}

	setMatrix(name, value)
	{
		if (activeShader === this) {
			let location = this.uniformIDs[name];
			if (location === undefined) {
				location = webGL.getUniformLocation(this.glProgram, name);
				this.uniformIDs[name] = location;
			}
			webGL.uniformMatrix4fv(location, false, value.values);
		}
		else {
			this.valuesToSet[name] = { type: 'matrix', value };
		}
	}

	transform(matrix)
	{
		this.modelViewMatrix = matrix.clone();
		let transformation = this.modelViewMatrix.clone()
			.compose(this.projection);
		this.setMatrix('al_projview_matrix', transformation);
	}
}

export
class Shape
{
	static drawImmediate(surface, shapeType, arg1, arg2)
	{
		if (arg1 instanceof Texture || arg1 === null) {
			const texture = arg1;
			const vertices = arg2;
			surface.activate(defaultShader, texture);
			Galileo.draw(shapeType, new VertexList(vertices));
		}
		else {
			const vertices = arg1;
			surface.activate(defaultShader);
			Galileo.draw(shapeType, new VertexList(vertices));
		}
	}

	indices;
	texture_;
	type;
	vertexList;

	constructor(shapeType, arg1, arg2 = null, arg3 = null)
	{
		this.type = shapeType;
		if (arg2 instanceof VertexList) {
			if (!(arg1 instanceof Texture) && arg1 != undefined)
				throw new Error("Expected a Texture or 'null' as second argument to Shape constructor");
			this.vertexList = arg2;
			this.indices = arg3;
			this.texture_ = arg1;
		}
		else {
			if (!(arg1 instanceof VertexList))
				throw new Error("Expected a VertexList or Texture as second argument to Shape constructor");
			this.vertexList = arg1;
			this.indices = arg2;
			this.texture_ = null;
		}
	}

	get indexList()
	{
		return this.indices;
	}

	get texture()
	{
		return this.texture_;
	}

	get vertexList()
	{
		return this.vertexList;
	}

	set indexList(value)
	{
		if (value !== null && !(value instanceof IndexList))
			throw TypeError("Shape#indexList must be set to an IndexList object or 'null'.");
		this.indices = value;
	}

	set texture(value)
	{
		if (value !== null && !(value instanceof Texture))
			throw TypeError("Shape#texture must be set to a Texture object or 'null'.");
		this.texture_ = value;
	}

	set vertexList(value)
	{
		if (!(value instanceof VertexList))
			throw TypeError("Shape#vertexList must be set to a VertexList object.");
		this.vertexList = value;
	}

	draw(surface = Surface.Screen, transform = Transform.Identity, shader = Shader.Default)
	{
		surface.activate(shader, this.texture_, transform);
		Galileo.draw(this.type, this.vertexList, this.indices);
	}
}

export
class Texture
{
	static async fromFile(fileName)
	{
		const imageURL = Game.urlOf(fileName);
		const image = await Fido.fetchImage(imageURL);
		const texture = new Texture(image);
		texture.fileName = Game.fullPath(fileName);
		return texture;
	}

	fileName;
	glTexture;
	size = { width: 0, height: 0 };

	constructor(...args)
	{
		const glTexture = webGL.createTexture();
		if (glTexture === null)
			throw new Error(`Engine couldn't create a WebGL texture object.`);
		this.glTexture = glTexture;
		if (typeof args[0] === 'string') {
			throw Error("'new Texture' with filename is not supported in Oozaru.");
		}
		else {
			const oldBinding = webGL.getParameter(webGL.TEXTURE_BINDING_2D);
			webGL.bindTexture(webGL.TEXTURE_2D, glTexture);
			webGL.pixelStorei(webGL.UNPACK_FLIP_Y_WEBGL, true);
			if (args[0] instanceof HTMLImageElement) {
				const image = args[0];
				webGL.texImage2D(webGL.TEXTURE_2D, 0, webGL.RGBA, webGL.RGBA, webGL.UNSIGNED_BYTE, image);
				this.size = { width: args[0].width, height: args[0].height };
			}
			else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
				const width = args[0];
				const height = args[1];
				if (width < 1 || height < 1)
					throw RangeError("A texture cannot be less than one pixel in size.");
				if (args[2] instanceof ArrayBuffer || ArrayBuffer.isView(args[2])) {
					const buffer = args[2] instanceof ArrayBuffer ? args[2] : args[2].buffer;
					if (buffer.byteLength < width * height * 4)
						throw RangeError(`The provided buffer is too small to initialize a ${width}x${height} texture.`);
					webGL.texImage2D(webGL.TEXTURE_2D, 0, webGL.RGBA, width, height, 0, webGL.RGBA, webGL.UNSIGNED_BYTE,
						new Uint8Array(buffer));
				}
				else {
					const pixels = new Uint32Array(width * height);
					if (args[2] !== undefined)
						pixels.fill((args[2].a * 255 << 24) + (args[2].b * 255 << 16) + (args[2].g * 255 << 8) + (args[2].r * 255));
					webGL.texImage2D(webGL.TEXTURE_2D, 0, webGL.RGBA, width, height, 0, webGL.RGBA, webGL.UNSIGNED_BYTE,
						new Uint8Array(pixels.buffer));
				}
				this.size = { width, height };
			}
			webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_MIN_FILTER, webGL.LINEAR);
			webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_WRAP_S, webGL.CLAMP_TO_EDGE);
			webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_WRAP_T, webGL.CLAMP_TO_EDGE);
			webGL.bindTexture(webGL.TEXTURE_2D, oldBinding);
		}
	}

	get height()
	{
		return this.size.height;
	}

	get width()
	{
		return this.size.width;
	}

	upload(content, x = 0, y = 0, width = this.width, height = this.height)
	{
		const pixelData = ArrayBuffer.isView(content)
			? new Uint8Array(content.buffer)
			: new Uint8Array(content);
		webGL.bindTexture(webGL.TEXTURE_2D, this.glTexture);
		webGL.texSubImage2D(webGL.TEXTURE_2D, 0, x, this.size.height - y - height, width, height, webGL.RGBA, webGL.UNSIGNED_BYTE, pixelData);
	}

	useTexture(textureUnit = 0)
	{
		webGL.activeTexture(webGL.TEXTURE0 + textureUnit);
		webGL.bindTexture(webGL.TEXTURE_2D, this.glTexture);
	}
}

export
class Surface extends Texture
{
	blendOp_ = BlendOp.Default;
	clipRectangle;
	depthOp_ = DepthOp.AlwaysPass;
	frameBuffer;
	projection;

	static get Screen()
	{
		const screenSurface = Object.create(Surface.prototype);
		screenSurface.size = { width: webGL.canvas.width, height: webGL.canvas.height };
		screenSurface.blendOp_ = BlendOp.Default;
		screenSurface.clipRectangle = { x: 0, y: 0, w: webGL.canvas.width, h: webGL.canvas.height };
		screenSurface.depthOp_ = DepthOp.AlwaysPass;
		screenSurface.frameBuffer = null;
		screenSurface.projection = new Transform()
			.project2D(0, 0, webGL.canvas.width, webGL.canvas.height);
		Object.defineProperty(Surface, 'Screen', {
			value: screenSurface,
			writable: false,
			enumerable: false,
			configurable: true,
		});
		return screenSurface;
	}

	static async fromFile(fileName)
	{
		throw Error("'Surface.fromFile' is not supported in Oozaru.");
	}

	constructor(...args)
	{
		if (typeof args[0] === 'string')
			throw Error("'new Surface' with filename is not supported in Oozaru.");

		super(...args);

		const frameBuffer = webGL.createFramebuffer();
		const depthBuffer = webGL.createRenderbuffer();
		if (frameBuffer === null || depthBuffer === null)
			throw new Error(`Engine couldn't create a WebGL framebuffer object.`);

		// in order to set up a new FBO we need to change the current framebuffer binding, so make sure
		// it gets changed back afterwards.
		const previousFBO = webGL.getParameter(webGL.FRAMEBUFFER_BINDING);
		webGL.bindFramebuffer(webGL.FRAMEBUFFER, frameBuffer);
		webGL.framebufferTexture2D(webGL.FRAMEBUFFER, webGL.COLOR_ATTACHMENT0, webGL.TEXTURE_2D, this.glTexture, 0);
		webGL.bindRenderbuffer(webGL.RENDERBUFFER, depthBuffer);
		webGL.renderbufferStorage(webGL.RENDERBUFFER, webGL.DEPTH_COMPONENT16, this.width, this.height);
		webGL.framebufferRenderbuffer(webGL.FRAMEBUFFER, webGL.DEPTH_ATTACHMENT, webGL.RENDERBUFFER, depthBuffer);
		webGL.bindFramebuffer(webGL.FRAMEBUFFER, previousFBO);

		this.clipRectangle = { x: 0, y: 0, w: this.width, h: this.height };
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

	activate(shader, texture = null, transform = Transform.Identity)
	{
		if (this !== activeSurface) {
			webGL.bindFramebuffer(webGL.FRAMEBUFFER, this.frameBuffer);
			webGL.viewport(0, 0, this.width, this.height);
			webGL.scissor(this.clipRectangle.x, this.clipRectangle.y, this.clipRectangle.w, this.clipRectangle.h);
			applyBlendOp(this.blendOp_);
			applyDepthOp(this.depthOp_);
			activeSurface = this;
		}
		shader.activate(texture !== null);
		shader.project(this.projection);
		shader.transform(transform);
		texture?.useTexture(0);
	}

	clipTo(x, y, width, height)
	{
		this.clipRectangle.x = x;
		this.clipRectangle.y = y;
		this.clipRectangle.w = width;
		this.clipRectangle.h = height;
		if (this === activeSurface)
			webGL.scissor(x, this.height - y - height, width, height);
	}

	unclip()
	{
		this.clipTo(0, 0, this.width, this.height);
	}
}

export
class Transform
{
	values;

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

	constructor(values)
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

	compose(other)
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

	project2D(left, top, right, bottom, near = -1.0, far = 1.0)
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

	project3D(fov, aspect, near, far)
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

	rotate(angle, vX, vY, vZ)
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

	scale(sX, sY, sZ = 1.0)
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

	translate(tX, tY, tZ = 0.0)
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
	glBuffer = null;
	length = 0;

	constructor(vertices)
	{
		this.glBuffer = webGL.createBuffer();
		if (this.glBuffer === null)
			throw new Error(`Engine couldn't create a WebGL buffer object.`);
		this.upload(vertices);
	}

	activate()
	{
		webGL.bindBuffer(webGL.ARRAY_BUFFER, this.glBuffer);
		webGL.enableVertexAttribArray(0);
		webGL.enableVertexAttribArray(1);
		webGL.enableVertexAttribArray(2);
		webGL.vertexAttribPointer(0, 4, webGL.FLOAT, false, 40, 0);
		webGL.vertexAttribPointer(1, 4, webGL.FLOAT, false, 40, 16);
		webGL.vertexAttribPointer(2, 2, webGL.FLOAT, false, 40, 32);
	}

	upload(vertices)
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
		webGL.bindBuffer(webGL.ARRAY_BUFFER, this.glBuffer);
		webGL.bufferData(webGL.ARRAY_BUFFER, data, webGL.STREAM_DRAW);
		this.length = vertices.length;
	}
}

function applyBlendOp(blendOp)
{
	switch (blendOp) {
		case BlendOp.Default:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.SRC_ALPHA, webGL.ONE_MINUS_SRC_ALPHA);
			break;
		case BlendOp.Add:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.ONE, webGL.ONE);
			break;
		case BlendOp.Average:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.CONSTANT_COLOR, webGL.CONSTANT_COLOR);
			webGL.blendColor(0.5, 0.5, 0.5, 0.5);
			break;
		case BlendOp.CopyAlpha:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFuncSeparate(webGL.ZERO, webGL.ONE, webGL.ONE, webGL.ZERO);
			break;
		case BlendOp.CopyRGB:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFuncSeparate(webGL.ONE, webGL.ZERO, webGL.ZERO, webGL.ONE);
			break;
		case BlendOp.Invert:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.ZERO, webGL.ONE_MINUS_SRC_COLOR);
			break;
		case BlendOp.Multiply:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.DST_COLOR, webGL.ZERO);
			break;
		case BlendOp.Replace:
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.ONE, webGL.ZERO);
			break;
		case BlendOp.Subtract:
			webGL.blendEquation(webGL.FUNC_REVERSE_SUBTRACT);
			webGL.blendFunc(webGL.ONE, webGL.ONE);
			break;
		default:
			// something went horribly wrong if we got here; just set the blender to output
			// nothing so the user can see something went awry.
			webGL.blendEquation(webGL.FUNC_ADD);
			webGL.blendFunc(webGL.ZERO, webGL.ZERO);
	}
}

function applyDepthOp(depthOp)
{
	const depthFunc = depthOp === DepthOp.AlwaysPass ? webGL.ALWAYS
		: depthOp === DepthOp.Equal ? webGL.EQUAL
		: depthOp === DepthOp.Greater ? webGL.GREATER
		: depthOp === DepthOp.GreaterOrEqual ? webGL.GEQUAL
		: depthOp === DepthOp.Less ? webGL.LESS
		: depthOp === DepthOp.LessOrEqual ? webGL.LEQUAL
		: depthOp === DepthOp.NotEqual ? webGL.NOTEQUAL
		: webGL.NEVER;
	webGL.depthFunc(depthFunc);
}
