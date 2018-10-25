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

let activeShader: Shader | null = null;
let activeDrawTarget: DrawTarget | null = null;
let defaultShader: Shader;
let gl: WebGLRenderingContext;
let screenCanvas: HTMLCanvasElement;

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
		const webGLContext = canvas.getContext('webgl', { alpha: false });
		if (webGLContext === null)
			throw new Error(`Unable to acquire WebGL rendering context`);
		gl = webGLContext;
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.BLEND);
		gl.enable(gl.SCISSOR_TEST);

		const vertSource = await (await fetch('shaders/default.vert.glsl')).text();
		const fragSource = await (await fetch('shaders/default.frag.glsl')).text();
		defaultShader = new Shader(vertSource, fragSource);
		screenCanvas = canvas;

		DrawTarget.Screen.activate();
	}
}

export
class DrawTarget
{
	clipping: Rectangle;
	frameBuffer: WebGLFramebuffer | null;
	texture: Texture | null;

	static get Screen()
	{
		const screenSurface = Object.create(DrawTarget.prototype) as DrawTarget;
		screenSurface.clipping = { x: 0, y: 0, w: screenCanvas.width, h: screenCanvas.height };
		screenSurface.frameBuffer = null;
		screenSurface.texture = null;
		Object.defineProperty(this, 'Screen', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: screenSurface,
		});
		return screenSurface;
	}

	constructor(texture: Texture)
	{
		const frameBuffer = gl.createFramebuffer();
		if (frameBuffer === null)
			throw new Error(`Unable to create WebGL framebuffer object`);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D, texture.hwTexture, 0);

		this.clipping = { x: 0, y: 0, w: texture.width, h: texture.height };
		this.frameBuffer = frameBuffer;
		this.texture = texture;
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
		activeDrawTarget = this;
	}

	clipTo(x: number, y: number, width: number, height: number)
	{
		this.clipping.x = x;
		this.clipping.y = y;
		this.clipping.w = width;
		this.clipping.h = height;
		if (this === activeDrawTarget)
			gl.scissor(x, y, width, height);
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
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable(gl.SCISSOR_TEST);
	}

	static rerez(width: number, height: number)
	{
		screenCanvas.width = width;
		screenCanvas.height = height;
		if (activeDrawTarget === DrawTarget.Screen)
			gl.viewport(0, 0, screenCanvas.width, screenCanvas.height);
	}
}

export
class Shader
{
	program: WebGLProgram;
	hasTextureLoc: WebGLUniformLocation | null;
	modelViewLoc: WebGLUniformLocation | null;
	textureLoc: WebGLUniformLocation | null;
	modelView: Matrix;
	projection: Matrix;

	static get Default()
	{
		return defaultShader;
	}

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

	static draw(vertexBuffer: VertexBuffer, indexBuffer: IndexBuffer | null, type: ShapeType)
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
			indexBuffer.activate();
			gl.drawElements(drawMode, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
		}
		else {
			gl.drawArrays(drawMode, 0, vertexBuffer.length);
		}
	}

	constructor(vertexBuffer: VertexBuffer, indexBuffer: IndexBuffer | null, type: ShapeType)
	{
		this.type = type;
		this.vertices = vertexBuffer;
		this.indices = indexBuffer;
	}

	draw()
	{
		Shape.draw(this.vertices, this.indices, this.type);
	}
}

export
class Texture
{
	hwTexture: WebGLTexture;
	width: number;
	height: number;

	constructor(image: HTMLImageElement);
	constructor(width: number, height: number, content?: ArrayBufferView | RGBA);
	constructor(arg1: HTMLImageElement | number, arg2?: number, arg3?: ArrayBufferView | RGBA)
	{
		const hwTexture = gl.createTexture();
		if (hwTexture === null)
			throw new Error(`Unable to create WebGL texture object`);
		this.hwTexture = hwTexture;
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
			if (ArrayBuffer.isView(arg3)) {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					new Uint8Array(arg3.buffer));
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
	}

	activate(textureUnit = 0)
	{
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.hwTexture);
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
