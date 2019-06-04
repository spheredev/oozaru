/*
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2019, Fat Cerberus
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

import BufferStream from './buffer-stream';
import * as util from './utility';

interface Glyph
{
	pixelData: Uint8Array;
	width: number;
	height: number;
	u: number;
	v: number;
}

let activeDrawTarget: DrawTarget | null = null;
let activeShader: Shader | null = null;
let gl: WebGLRenderingContext;
let screenCanvas: HTMLCanvasElement;

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
interface RGBA
{
	r: number;
	g: number;
	b: number;
	a: number;
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
interface Vertex
{
	x: number;
	y: number;
	z?: number;
	u?: number;
	v?: number;
	color?: RGBA;
}

export default
class Galileo extends null
{
	static async initialize(canvas: HTMLCanvasElement)
	{
		const glOptions = { alpha: false, preserveDrawingBuffer: true };
		const webGL = (canvas.getContext('webgl2', glOptions)
			|| canvas.getContext('webgl', glOptions)
			|| canvas.getContext('experimental-webgl', glOptions)) as WebGLRenderingContext | null;
		if (webGL === null)
			throw new Error(`Unable to acquire WebGL rendering context`);
		webGL.clearColor(0.0, 0.0, 0.0, 1.0);
		webGL.clearDepth(1.0);
		webGL.blendEquation(webGL.FUNC_ADD);
		webGL.blendFunc(webGL.SRC_ALPHA, webGL.ONE_MINUS_SRC_ALPHA);
		webGL.depthFunc(webGL.LEQUAL);
		webGL.enable(webGL.BLEND);
		webGL.enable(webGL.DEPTH_TEST);
		webGL.enable(webGL.SCISSOR_TEST);

		gl = webGL;
		screenCanvas = canvas;

		DrawTarget.Screen.activate();
	}
}

export
class Color
{
	r: number;
	g: number;
	b: number;
	a: number;

	constructor(r: number, g: number, b: number, a = 1.0)
	{
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

export
class DrawTarget
{
	private blendOp_ = BlendOp.Default;
	private clipping: Rectangle;
	private depthOp_ = DepthOp.LessOrEqual;
	private frameBuffer: WebGLFramebuffer | null;
	private texture: Texture | null;

	static get Screen()
	{
		const surface = Object.create(DrawTarget.prototype) as DrawTarget;
		surface.blendOp_ = BlendOp.Default;
		surface.clipping = { x: 0, y: 0, w: screenCanvas.width, h: screenCanvas.height };
		surface.depthOp_ = DepthOp.LessOrEqual;
		surface.frameBuffer = null;
		surface.texture = null;
		Object.defineProperty(DrawTarget, 'Screen', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: surface,
		});
		return surface;
	}

	constructor(texture: Texture)
	{
		const frameBuffer = gl.createFramebuffer();
		const depthBuffer = gl.createRenderbuffer();
		if (frameBuffer === null || depthBuffer === null)
			throw new Error(`Unable to create WebGL framebuffer object`);

		// save the last framebuffer binding and restore it afterwards.  Oozaru tries to minimize framebuffer switches
		// and won't even realize it's been changed if we don't.
		const previousFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D, texture.hwTexture, 0);
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texture.width, texture.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, previousFBO);

		this.clipping = { x: 0, y: 0, w: texture.width, h: texture.height };
		this.frameBuffer = frameBuffer;
		this.texture = texture;
	}

	get blendOp()
	{
		return this.blendOp_;
	}
	set blendOp(value)
	{
		this.blendOp_ = value;
		if (activeDrawTarget === this)
			applyBlendOp(value);
	}

	get depthOp()
	{
		return this.depthOp_;
	}
	set depthOp(value)
	{
		this.depthOp_ = value;
		if (activeDrawTarget === this)
			applyDepthOp(value);
	}

	get height()
	{
		return this.texture !== null
			? this.texture.height
			: screenCanvas.height;
	}

	get width()
	{
		return this.texture !== null
			? this.texture.width
			: screenCanvas.width;
	}

	activate()
	{
		if (activeDrawTarget === this)
			return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
		if (this.texture !== null)
			gl.viewport(0, 0, this.texture.width, this.texture.height);
		else
			gl.viewport(0, 0, screenCanvas.width, screenCanvas.height);
		gl.scissor(this.clipping.x, this.clipping.y, this.clipping.w, this.clipping.h);
		applyBlendOp(this.blendOp_);
		applyDepthOp(this.depthOp_);
		activeDrawTarget = this;
	}

	clipTo(x: number, y: number, width: number, height: number)
	{
		this.clipping.x = x;
		this.clipping.y = y;
		this.clipping.w = width;
		this.clipping.h = height;
		if (this === activeDrawTarget)
			gl.scissor(x, this.height - y - height, width, height);
	}

	unclip()
	{
		this.clipping.x = 0;
		this.clipping.y = 0;
		this.clipping.w = this.width;
		this.clipping.h = this.height;
		if (this === activeDrawTarget)
			gl.scissor(0, 0, this.width, this.height);
	}
}

export
class Font
{
	private atlas: Texture;
	private glyphs: Glyph[] = [];
	private lineHeight = 0;
	private maxWidth = 0;
	private numGlyphs = 0;
	private stride: number;
	private vertexBuffer = new VertexBuffer();

	static async fromFile(url: string)
	{
		const data = await util.fetchRawFile(url);
		return new this(data);
	}

	constructor(rfnData: BufferSource)
	{
		let stream = new BufferStream(rfnData);
		let rfn = stream.readStruct({
			signature: 'string/4',
			version:   'uint16-le',
			numGlyphs: 'uint16-le',
			reserved:  'reserve/248',
		});
		if (rfn.signature !== '.rfn')
			throw new Error(`Unable to load RFN font file`);
		if (rfn.version < 2 || rfn.version > 2)
			throw new Error(`Unsupported RFN version '${rfn.version}'`)
		if (rfn.numGlyphs <= 0)
			throw new Error(`Malformed RFN font (no glyphs)`);
		const numAcross = Math.ceil(Math.sqrt(rfn.numGlyphs));
		this.stride = 1.0 / numAcross;
		for (let i = 0; i < rfn.numGlyphs; ++i) {
			let charInfo = stream.readStruct({
				width:    'uint16-le',
				height:   'uint16-le',
				reserved: 'reserve/28',
			});
			this.lineHeight = Math.max(this.lineHeight, charInfo.height);
			this.maxWidth = Math.max(this.maxWidth, charInfo.width);
			const pixelData = stream.readBytes(charInfo.width * charInfo.height * 4);
			this.glyphs.push({
				width: charInfo.width,
				height: charInfo.height,
				u: i % numAcross / numAcross,
				v: 1.0 - Math.floor(i / numAcross) / numAcross,
				pixelData,
			});
		}
		this.atlas = new Texture(numAcross * this.maxWidth, numAcross * this.lineHeight);
		this.numGlyphs = rfn.numGlyphs;
		for (let i = 0; i < this.numGlyphs; ++i) {
			const glyph = this.glyphs[i];
			const x = i % numAcross * this.maxWidth;
			const y = Math.floor(i / numAcross) * this.lineHeight;
			this.atlas.upload(glyph.pixelData, x, y, glyph.width, glyph.height);
		}
	}

	get height()
	{
		return this.lineHeight;
	}

	drawText(text: string, color: RGBA, matrix: Matrix)
	{
		if (text === "")
			return;  // empty string, nothing to render
		if (activeShader !== null) {
			activeShader.activate(true);
			activeShader.transform(matrix);
		}
		this.atlas.activate(0);
		let cp: number | undefined;
		let ptr = 0;
		let x = 0;
		const vertices: Vertex[] = [];
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = cp == 0x20AC ? 128
				: cp == 0x201A ? 130
				: cp == 0x0192 ? 131
				: cp == 0x201E ? 132
				: cp == 0x2026 ? 133
				: cp == 0x2020 ? 134
				: cp == 0x2021 ? 135
				: cp == 0x02C6 ? 136
				: cp == 0x2030 ? 137
				: cp == 0x0160 ? 138
				: cp == 0x2039 ? 139
				: cp == 0x0152 ? 140
				: cp == 0x017D ? 142
				: cp == 0x2018 ? 145
				: cp == 0x2019 ? 146
				: cp == 0x201C ? 147
				: cp == 0x201D ? 148
				: cp == 0x2022 ? 149
				: cp == 0x2013 ? 150
				: cp == 0x2014 ? 151
				: cp == 0x02DC ? 152
				: cp == 0x2122 ? 153
				: cp == 0x0161 ? 154
				: cp == 0x203A ? 155
				: cp == 0x0153 ? 156
				: cp == 0x017E ? 158
				: cp == 0x0178 ? 159
				: cp;
			if (cp >= this.numGlyphs)
				cp = 0x1A;
			const glyph = this.glyphs[cp];
			const x1 = x, x2 = x1 + glyph.width;
			const y1 = 0, y2 = y1 + glyph.height;
			const u1 = glyph.u;
			const u2 = u1 + glyph.width / this.maxWidth * this.stride;
			const v1 = glyph.v;
			const v2 = v1 - glyph.height / this.lineHeight * this.stride;
			vertices.push(
				{ x: x1, y: y1, u: u1, v: v1, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y1, u: u2, v: v1, color },
				{ x: x1, y: y2, u: u1, v: v2, color },
				{ x: x2, y: y2, u: u2, v: v2, color },
			);
			x += glyph.width;
		}
		this.vertexBuffer.upload(vertices);
		Prim.draw(this.vertexBuffer, null, ShapeType.Triangles);
	}

	widthOf(text: string)
	{
		let cp: number | undefined;
		let ptr = 0;
		let width = 0;
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = cp == 0x20AC ? 128
				: cp == 0x201A ? 130
				: cp == 0x0192 ? 131
				: cp == 0x201E ? 132
				: cp == 0x2026 ? 133
				: cp == 0x2020 ? 134
				: cp == 0x2021 ? 135
				: cp == 0x02C6 ? 136
				: cp == 0x2030 ? 137
				: cp == 0x0160 ? 138
				: cp == 0x2039 ? 139
				: cp == 0x0152 ? 140
				: cp == 0x017D ? 142
				: cp == 0x2018 ? 145
				: cp == 0x2019 ? 146
				: cp == 0x201C ? 147
				: cp == 0x201D ? 148
				: cp == 0x2022 ? 149
				: cp == 0x2013 ? 150
				: cp == 0x2014 ? 151
				: cp == 0x02DC ? 152
				: cp == 0x2122 ? 153
				: cp == 0x0161 ? 154
				: cp == 0x203A ? 155
				: cp == 0x0153 ? 156
				: cp == 0x017E ? 158
				: cp == 0x0178 ? 159
				: cp;
			if (cp >= this.numGlyphs)
				cp = 0x1A;
			const glyph = this.glyphs[cp];
			width += glyph.width;
		}
		return width;
	}

	wordWrap(text: string, wrapWidth: number)
	{
		const lines: string[] = [];
		let codepoints: number[] = [];
		let currentLine = "";
		let lineWidth = 0;
		let lineFinished = false;
		let wordWidth = 0;
		let wordFinished = false;
		let cp: number | undefined;
		let ptr = 0;
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = cp == 0x20AC ? 128
				: cp == 0x201A ? 130
				: cp == 0x0192 ? 131
				: cp == 0x201E ? 132
				: cp == 0x2026 ? 133
				: cp == 0x2020 ? 134
				: cp == 0x2021 ? 135
				: cp == 0x02C6 ? 136
				: cp == 0x2030 ? 137
				: cp == 0x0160 ? 138
				: cp == 0x2039 ? 139
				: cp == 0x0152 ? 140
				: cp == 0x017D ? 142
				: cp == 0x2018 ? 145
				: cp == 0x2019 ? 146
				: cp == 0x201C ? 147
				: cp == 0x201D ? 148
				: cp == 0x2022 ? 149
				: cp == 0x2013 ? 150
				: cp == 0x2014 ? 151
				: cp == 0x02DC ? 152
				: cp == 0x2122 ? 153
				: cp == 0x0161 ? 154
				: cp == 0x203A ? 155
				: cp == 0x0153 ? 156
				: cp == 0x017E ? 158
				: cp == 0x0178 ? 159
				: cp;
			if (cp >= this.numGlyphs)
				cp = 0x1A;
			const glyph = this.glyphs[cp];
			switch (cp) {
				case 13: case 10:  // newline
					if (cp === 13 && text.codePointAt(ptr) == 10)
						++ptr;  // treat CRLF as a single newline
					lineFinished = true;
					break;
				case 8:  // tab
					codepoints.push(cp);
					wordWidth += this.glyphs[32].width * 3;
					wordFinished = true;
					break;
				case 32:  // space
					codepoints.push(cp);
					wordWidth += glyph.width;
					wordFinished = true;
					break;
				default:
					codepoints.push(cp);
					wordWidth += glyph.width;
					break;
			}
			if (wordFinished || lineFinished) {
				currentLine += String.fromCodePoint(...codepoints);
				lineWidth += wordWidth;
				codepoints.length = 0;
				wordWidth = 0;
				wordFinished = false;
			}
			if (lineWidth + wordWidth > wrapWidth || lineFinished) {
				lines.push(currentLine);
				currentLine = "";
				lineWidth = 0;
				lineFinished = false;
			}
		}
		currentLine += String.fromCodePoint(...codepoints);
		if (currentLine !== "")
			lines.push(currentLine);
		return lines;
	}
}

export
class IndexBuffer
{
	hwBuffer: WebGLBuffer | null = null;
	length: number = 0;
	maxItems: number = 0;
	streamable: boolean;

	constructor(indices?: Iterable<number>)
	{
		this.streamable = indices === undefined;
		if (indices !== undefined)
			this.upload(indices);
	}

	activate()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.hwBuffer);
	}

	upload(indices: Iterable<number>)
	{
		const values = new Uint16Array(indices);
		this.length = values.length;
		if (this.length <= this.maxItems && this.hwBuffer !== null) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.hwBuffer);
			gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, values);
		}
		else {
			gl.deleteBuffer(this.hwBuffer);
			this.hwBuffer = gl.createBuffer();
			if (this.hwBuffer === null)
				throw new Error(`Unable to create WebGL index buffer object`);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.hwBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, this.streamable ? gl.STREAM_DRAW : gl.STATIC_DRAW);
			this.length = values.length;
			this.maxItems = this.length;
		}
	}
}

export
class Matrix
{
	values: Float32Array;

	static get Identity()
	{
		return new this().identity();
	}

	constructor(values?: ArrayLike<number>)
	{
		if (values !== undefined)
			this.values = new Float32Array(values);
		else
			this.values = new Float32Array(4 * 4);
	}

	clone()
	{
		const dolly = new Matrix();
		dolly.values.set(this.values);
		return dolly;
	}

	composeWith(other: Matrix)
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

	ortho(left: number, top: number, right: number, bottom: number, near = -1.0, far = 1.0)
	{
		const deltaX = right - left;
		const deltaY = top - bottom;
		const deltaZ = far - near;

		const projection = new Matrix();
		const values = projection.values;
		values[0] = 2.0 / deltaX;
		values[5] = 2.0 / deltaY;
		values[10] = 2.0 / deltaZ;
		values[15] = 1.0;
		values[12] = -(right + left) / deltaX;
		values[13] = -(top + bottom) / deltaY;
		values[14] = -(far + near) / deltaZ;

		return this.composeWith(projection);
	}

	perspective(left: number, top: number, right: number, bottom: number, near: number, far: number)
	{
		const deltaX = right - left;
		const deltaY = top - bottom;
		const deltaZ = far - near;

		const projection = new Matrix();
		const values = projection.values;
		values[0] = 2.0 * near / deltaX;
		values[5] = 2.0 * near / deltaY;
		values[8] = (right + left) / deltaX;
		values[9] = (top + bottom) / deltaY;
		values[10] = -(far + near) / deltaZ;
		values[11] = -1.0;
		values[14] = -2.0 * far * near / deltaZ;
		values[15] = 0.0;

		return this.composeWith(projection);
	}

	rotate(theta: number, vX: number, vY: number, vZ: number)
	{
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		const siv = 1.0 - cos;

		const rotation = new Matrix();
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

		return this.composeWith(rotation);
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
class Prim extends null
{
	static clear()
	{
		gl.disable(gl.SCISSOR_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.SCISSOR_TEST);
	}

	static draw(vertexBuffer: VertexBuffer, indexBuffer: IndexBuffer | null, type: ShapeType, offset = 0, numVertices?: number)
	{
		const drawMode = type === ShapeType.Fan ? gl.TRIANGLE_FAN
			: type === ShapeType.Lines ? gl.LINES
			: type === ShapeType.LineLoop ? gl.LINE_LOOP
			: type === ShapeType.LineStrip ? gl.LINE_STRIP
			: type === ShapeType.Points ? gl.POINTS
			: type === ShapeType.TriStrip ? gl.TRIANGLE_STRIP
			: gl.TRIANGLES;
		vertexBuffer.activate();
		if (indexBuffer !== null) {
			if (numVertices === undefined)
				numVertices = indexBuffer.length - offset;
			indexBuffer.activate();
			gl.drawElements(drawMode, numVertices, gl.UNSIGNED_SHORT, offset);
		}
		else {
			if (numVertices === undefined)
				numVertices = vertexBuffer.length - offset;
			gl.drawArrays(drawMode, 0, numVertices);
		}
	}

	static rerez(width: number, height: number)
	{
		screenCanvas.width = width;
		screenCanvas.height = height;
		if (width <= 400 && height <= 300) {
			screenCanvas.style.width = `${width * 2}px`;
			screenCanvas.style.height = `${height * 2}px`;
		}
		else {
			screenCanvas.style.width = `${width}px`;
			screenCanvas.style.height = `${height}px`;
		}
		if (activeDrawTarget === DrawTarget.Screen)
			gl.viewport(0, 0, screenCanvas.width, screenCanvas.height);
	}
}

export
class Shader
{
	program: WebGLProgram;
	deferredValues: { [x: string]: { type: string, value: any } } = {};
	hasTextureLoc: WebGLUniformLocation | null;
	modelViewLoc: WebGLUniformLocation | null;
	textureLoc: WebGLUniformLocation | null;
	modelView: Matrix;
	projection: Matrix;
	uniformIDs: { [x: string]: WebGLUniformLocation | null } = {};

	constructor(vertexSource: string, fragmentSource: string)
	{
		const program = gl.createProgram();
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		if (program === null || vertShader === null || fragShader === null)
			throw new Error(`Unable to create WebGL shader program object`);

		// compile vertex and fragment shaders and check for errors
		gl.shaderSource(vertShader, vertexSource);
		gl.shaderSource(fragShader, fragmentSource);
		gl.compileShader(vertShader);
		if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
			const message = gl.getShaderInfoLog(vertShader);
			throw new Error(`Couldn't compile vertex shader...\n${message}`);
		}
		gl.compileShader(fragShader);
		if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
			const message = gl.getShaderInfoLog(fragShader);
			throw new Error(`Couldn't compile fragment shader...\n${message}`);
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

		this.program = program;
		this.hasTextureLoc = gl.getUniformLocation(program, 'al_use_tex');
		this.modelViewLoc = gl.getUniformLocation(program, 'al_projview_matrix');
		this.textureLoc = gl.getUniformLocation(program, 'al_tex');
		this.projection = Matrix.Identity;
		this.modelView = Matrix.Identity;
	}

	activate(useTexture: boolean)
	{
		if (activeShader !== this) {
			let transformation = this.modelView.clone()
				.composeWith(this.projection);
			gl.useProgram(this.program);
			gl.uniformMatrix4fv(this.modelViewLoc, false, transformation.values);
			gl.uniform1i(this.textureLoc, 0);
			for (const name of Object.keys(this.deferredValues)) {
				const entry = this.deferredValues[name];
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
			this.deferredValues = {};
			activeShader = this;
		}
		gl.uniform1i(this.hasTextureLoc, useTexture ? 1 : 0);
	}

	project(matrix: Matrix)
	{
		this.projection = matrix.clone();
		if (activeShader === this) {
			let transformation = this.modelView.clone()
				.composeWith(this.projection);
			gl.uniformMatrix4fv(this.modelViewLoc, false, transformation.values);
		}
	}

	setBoolValue(name: string, value: boolean)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1i(location, value ? 1 : 0);
		else
			this.deferredValues[name] = { type: 'bool', value };
	}

	setFloatArray(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1fv(location, values);
		else
			this.deferredValues[name] = { type: 'floatArray', value: values };
	}

	setFloatValue(name: string, value: number)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1f(location, value);
		else
			this.deferredValues[name] = { type: 'float', value };
	}

	setFloatVec(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
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
			this.deferredValues[name] = { type: 'floatVec', value: values };
		}
	}

	setIntArray(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1iv(location, values);
		else
			this.deferredValues[name] = { type: 'intArray', value: values };
	}

	setIntValue(name: string, value: number)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniform1i(location, value);
		else
			this.deferredValues[name] = { type: 'int', value };
	}

	setIntVec(name: string, values: number[])
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
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
			this.deferredValues[name] = { type: 'intVec', value: values };
		}
	}

	setMatrixValue(name: string, value: Matrix)
	{
		let location = this.uniformIDs[name];
		if (location === undefined) {
			location = gl.getUniformLocation(this.program, name);
			this.uniformIDs[name] = location;
		}
		if (activeShader === this)
			gl.uniformMatrix4fv(location, false, value.values);
		else
			this.deferredValues[name] = { type: 'matrix', value };
	}

	transform(matrix: Matrix)
	{
		this.modelView = matrix.clone();
		if (activeShader === this) {
			let transformation = this.modelView.clone()
				.composeWith(this.projection);
			gl.uniformMatrix4fv(this.modelViewLoc, false, transformation.values);
		}
	}
}

export
class Shape
{
	type: ShapeType;
	vertices: VertexBuffer;
	indices: IndexBuffer | null;

	constructor(vertexBuffer: VertexBuffer, indexBuffer: IndexBuffer | null, type: ShapeType)
	{
		this.type = type;
		this.vertices = vertexBuffer;
		this.indices = indexBuffer;
	}

	draw()
	{
		Prim.draw(this.vertices, this.indices, this.type);
	}
}

export
class Texture
{
	hwTexture: WebGLTexture;
	width: number;
	height: number;

	constructor(image: HTMLImageElement);
	constructor(width: number, height: number, content?: BufferSource | RGBA);
	constructor(arg1: HTMLImageElement | number, arg2?: number, arg3?: BufferSource | RGBA)
	{
		const hwTexture = gl.createTexture();
		if (hwTexture === null)
			throw new Error(`Unable to create WebGL texture object`);
		this.hwTexture = hwTexture;
		const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
		gl.bindTexture(gl.TEXTURE_2D, this.hwTexture);
		// @ts-ignore: TypeScript has the wrong signature for `gl.pixelStorei()`
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		if (arg1 instanceof HTMLImageElement) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, arg1);
			this.width = arg1.width;
			this.height = arg1.height;
		}
		else {
			this.width = arg1;
			this.height = arg2 as number;
			if (arg3 instanceof ArrayBuffer || ArrayBuffer.isView(arg3)) {
				const buffer = arg3 instanceof ArrayBuffer ? arg3 : arg3.buffer;
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					new Uint8Array(buffer));
			}
			else {
				let pixels = new Uint32Array(this.width * this.height);
				if (arg3 !== undefined)
					pixels.fill((arg3.a * 255 << 24) + (arg3.b * 255 << 16) + (arg3.g * 255 << 8) + (arg3.r * 255));
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					new Uint8Array(pixels.buffer));
			}
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, oldBinding);
	}

	activate(textureUnit = 0)
	{
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.hwTexture);
	}

	upload(content: BufferSource, x = 0, y = 0, width = this.width, height = this.height)
	{
		const pixelData = ArrayBuffer.isView(content)
			? new Uint8Array(content.buffer)
			: new Uint8Array(content);
		gl.bindTexture(gl.TEXTURE_2D, this.hwTexture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, x, this.height - y - height, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
	}
}

export
class VertexBuffer
{
	hwBuffer: WebGLBuffer | null = null;
	length: number = 0;
	maxItems: number = 0;
	streamable: boolean;

	constructor(vertices?: ArrayLike<Vertex>)
	{
		this.streamable = vertices === undefined;
		if (vertices !== undefined)
			this.upload(vertices);
	}

	activate()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.hwBuffer);
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
			if (vertex.z !== undefined)
				data[2 + i * 10] = vertex.z;
			data[3 + i * 10] = 1.0;
			if (vertex.color !== undefined) {
				data[4 + i * 10] = vertex.color.r;
				data[5 + i * 10] = vertex.color.g;
				data[6 + i * 10] = vertex.color.b;
				data[7 + i * 10] = vertex.color.a;
			}
			else {
				data[4 + i * 10] = 1.0;
				data[5 + i * 10] = 1.0;
				data[6 + i * 10] = 1.0;
				data[7 + i * 10] = 1.0;
			}
			if (vertex.u !== undefined && vertex.v !== undefined) {
				data[8 + i * 10] = vertex.u;
				data[9 + i * 10] = vertex.v;
			}
		}
		this.length = vertices.length;
		if (this.length <= this.maxItems && this.hwBuffer != null) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.hwBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
		}
		else {
			gl.deleteBuffer(this.hwBuffer);
			this.hwBuffer = gl.createBuffer();
			if (this.hwBuffer === null)
				throw new Error(`Unable to create WebGL vertex buffer object`);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.hwBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data, this.streamable ? gl.STREAM_DRAW : gl.STATIC_DRAW);
			this.maxItems = this.length;
		}
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
