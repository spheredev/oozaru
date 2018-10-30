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

import * as exports from './vanilla.js'

let defaultFont: Font;

export default
class VanillaAPI extends null
{
	static async initialize()
	{
		const rfnData = await util.loadRawFile('./system.rfn');
		defaultFont = new Font(new galileo.Font(rfnData));

		for (const name of Object.keys(exports)) {
			if (name === 'default')
				continue;
			Object.defineProperty(window, name, {
				writable: true,
				enumerable: false,
				configurable: true,
				value: (exports as any)[name];
			});
		}
	}
}

export
function CreateSurface(width: number, height: number)
{
	return new Surface(width, height);
}

export
function GetSystemFont()
{
	return defaultFont;
}

class Font
{
	font: galileo.Font;
	matrix = new galileo.Matrix();

	constructor(font: galileo.Font)
	{
		this.font = font;
	}

	drawText(x: number, y: number, text: string)
	{
		this.matrix.identity().translate(x, y);
		this.font.drawText(text, { r: 1, g: 1, b: 1, a: 1 }, this.matrix);
	}

	getStringHeight(text: string)
	{
		return this.font.height;
	}

	getStringWidth(text: string)
	{
		return this.font.textSize(text).width;
	}
}

class Surface
{
	drawTarget: galileo.DrawTarget;
	texture: galileo.Texture;

	constructor(width: number, height: number)
	{
		this.texture = new galileo.Texture(width, height);
		this.drawTarget = new galileo.DrawTarget(this.texture);
	}

	get height()
	{
		return this.drawTarget.height;
	}

	get width()
	{
		return this.drawTarget.width;
	}
}
