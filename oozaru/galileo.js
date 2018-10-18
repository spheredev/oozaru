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

let
	activeShader = null,
	activeSurface = null,
	defaultShader,
	gl,
	screenCanvas;

export default
class Galileo extends null
{
	static async initialize(canvas)
	{
		gl = canvas.getContext('webgl');
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		const vertSource = await (await fetch('shaders/default.vert.glsl')).text();
		const fragSource = await (await fetch('shaders/default.frag.glsl')).text();
		defaultShader = new Shader(vertSource, fragSource);
		screenCanvas = canvas;

		Surface.Screen.activate();
	}
}

export
const ShapeType = Object.freeze({
	Fan: 0,
	Lines: 1,
	LineLoop: 2,
	LineStrip: 3,
	Points: 4,
	Triangles: 5,
	TriStrip: 6,
});

export
class Color
{
	constructor(r, g, b, a = 1.0)
	{
		this.data = { r, g, b, a };
	}
}

export
class IndexBuffer
{
	constructor(indices)
	{
		const hwBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hwBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		this.hwBuffer = hwBuffer;
		this.length = indices.length;
	}

	activate()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.hwBuffer);
	}
}

export
class Prim extends null
{
	static clear()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	static rerez(width, height)
	{
		screenCanvas.width = width;
		screenCanvas.height = height;
		if (activeSurface === Surface.Screen)
			gl.viewport(0, 0, screenCanvas.width, screenCanvas.height);
	}
}

export
class Shader
{
	static get Default()
	{
		return defaultShader;
	}

	constructor(vertexSource, fragmentSource)
	{
		const program = gl.createProgram(),
			vertShader = gl.createShader(gl.VERTEX_SHADER),
			fragShader = gl.createShader(gl.FRAGMENT_SHADER);

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
		this.transform = new Transform();
	}

	activate(useTexture)
	{
		if (activeShader !== this) {
			gl.useProgram(this.program);
			activeShader = this;
		}
		this.transform.identity();
		this.transform.ortho(0, 0, activeSurface.width, activeSurface.height);
		gl.uniform1i(this.hasTextureLoc, useTexture ? 1 : 0);
		gl.uniform1i(this.textureLoc, 0);
		gl.uniformMatrix4fv(this.modelViewLoc, false, this.transform.matrix);
	}
}

export
class Shape
{
	constructor(vertexBuffer, indexBuffer, type = ShapeType.TriStrip)
	{
		this.type = type;
		this.vertices = vertexBuffer;
		this.indices = indexBuffer;
	}

	draw()
	{
		const drawMode = this.type === ShapeType.Fan ? gl.TRIANGLE_FAN
			: this.type === ShapeType.Lines ? gl.LINES
			: this.type === ShapeType.LineLoop ? gl.LINE_LOOP
			: this.type === ShapeType.LineStrip ? gl.LINE_STRIP
			: this.type === ShapeType.Points ? gl.POINTS
			: this.type === ShapeType.TriStrip ? gl.TRIANGLE_STRIP
			: gl.TRIANGLES;
		this.vertices.activate();
		if (this.indices !== null) {
			this.indices.activate();
			gl.drawElements(drawMode, this.indices.length, gl.UNSIGNED_SHORT, 0);
		}
		else {
			gl.drawArrays(drawMode, 0, this.vertices.length);
		}
	}
}

export
class Surface
{
	static get Screen()
	{
		const screenSurface = Object.create(Surface.prototype);
		screenSurface.frameBuffer = null;
		Object.defineProperty(this, 'Screen', {
			writable: false,
			enumerable: false,
			configurable: true,
			value: screenSurface,
		});
		return screenSurface;
	}

	constructor(texture)
	{
		const frameBuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT,
			gl.TEXTURE_2D, texture.hwTexture);

		this.frameBuffer = frameBuffer;
		this.texture = texture;
	}

	get height()
	{
		return this.frameBuffer !== null
			? this.texture.height
			: screenCanvas.height;
	}

	get width()
	{
		return this.frameBuffer !== null
			? this.texture.width
			: screenCanvas.width;
	}

	activate()
	{
		if (activeSurface === this)
			return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
		if (this.frameBuffer !== null)
			gl.viewport(0, 0, this.texture.width, this.texture.height);
		else
			gl.viewport(0, 0, screenCanvas.width, screenCanvas.height);
		activeSurface = this;
	}
}

export
class Texture
{
	constructor(image)
	{
		const hwTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, hwTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		this.hwTexture = hwTexture;
		this.width = image.width;
		this.height = image.height;
	}

	activate(textureUnit = 0)
	{
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.hwTexture);
	}
}

export
class Transform
{
	constructor()
	{
		this.matrix = new Float32Array(4 * 4);
		this.identity();
	}

	clone()
	{
		const dolly = new Transform();
		dolly.matrix.set(this.matrix);
	}

	identity()
	{
		this.matrix.set([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0,
		]);
	}

	ortho(left, top, right, bottom, near = -1.0, far = 1.0)
	{
		const sX = 2 / (right - left);
		const sY = 2 / (top - bottom);
		const sZ = -2 / (far - near);
		const tX = -(right + left) / (right - left);
		const tY = -(top + bottom) / (top - bottom);
		const tZ = (far + near) / (far - near);
		this.matrix.set([
			sX,  0.0, 0.0, 0.0,
			0.0, sY,  0.0, 0.0,
			0.0, 0.0, sZ,  0.0,
			tX,  tY,  tZ,  1.0,
		]);
	}
}

export
class VertexBuffer
{
	constructor(vertices)
	{
		const data = new Float32Array(10 * vertices.length);
		for (let i = 0, len = vertices.length; i < len; ++i) {
			const vertex = vertices[i];
			if (vertex.x !== undefined)
				data[0 + i * 10] = vertex.x;
			if (vertex.y !== undefined)
				data[1 + i * 10] = vertex.y;
			data[2 + i * 10] = 0.0;
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
		const hwBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, hwBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

		this.hwBuffer = hwBuffer;
		this.length = vertices.length;
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
}
