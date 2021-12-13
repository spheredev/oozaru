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

import { DataStream } from './data-stream.js';
import Fido from './fido.js';
import { Color, Shape, ShapeType, Size, Surface, Texture, Vertex } from './galileo.js';
import Game from './game.js';

interface Glyph
{
	pixelData: Uint8Array;
	width: number;
	height: number;
	u: number;
	v: number;
}

var defaultFont: Font;

export default
class FontSystem
{
    static async initialize()
    {
		defaultFont = await Font.fromFile('#/default.rfn');
    }
}

export
class Font
{
	static get Default()
	{
		return defaultFont;
	}

	static async fromFile(fileName: string)
	{
		fileName = Game.urlOf(fileName);
		const data = await Fido.fetchData(fileName);
		return new Font(data);
	}

	atlas: Texture;
	glyphs: Glyph[] = [];
	lineHeight = 0;
	maxWidth = 0;
	numGlyphs = 0;
	stride: number;

	constructor(source: BufferSource | string)
	{
		if (typeof source === 'string')
			throw RangeError("new Font() from file is not supported under Oozaru.");
		let stream = new DataStream(source);
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

	drawText(surface: Surface, x: number, y: number, text: string, color = Color.White, wrapWidth?: number)
	{
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			for (let i = 0, len = lines.length; i < len; ++i)
				this.renderString(surface, x, y, lines[i], color);
		}
		else {
			this.renderString(surface, x, y, text, color);
		}
	}

	getTextSize(text: string, wrapWidth?: number): Size
	{
		if (wrapWidth !== undefined) {
			const lines = this.wordWrap(text, wrapWidth);
			return {
				width: wrapWidth,
				height: lines.length * this.lineHeight,
			};
		}
		else {
			return {
				width: this.widthOf(text),
				height: this.lineHeight,
			};
		}
	}

	heightOf(text: string, wrapWidth?: number)
	{
		return this.getTextSize(text, wrapWidth).height;
	}

	renderString(surface: Surface, x: number, y: number, text: string, color: Color)
	{
		x = Math.trunc(x);
        y = Math.trunc(y);
        if (text === "")
			return;  // empty string, nothing to render
		let cp: number | undefined;
		let ptr = 0;
		let xOffset = 0;
		const vertices: Vertex[] = [];
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = unicodeToASCII(cp);
			if (cp >= this.numGlyphs)
				cp = 0x1A;
			const glyph = this.glyphs[cp];
			const x1 = x + xOffset, x2 = x1 + glyph.width;
			const y1 = y, y2 = y1 + glyph.height;
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
			xOffset += glyph.width;
		}
        Shape.drawImmediate(surface, ShapeType.Triangles, this.atlas, vertices);
	}

	widthOf(text: string)
	{
		let cp: number | undefined;
		let ptr = 0;
		let width = 0;
		while ((cp = text.codePointAt(ptr++)) !== undefined) {
			if (cp > 0xFFFF)  // surrogate pair?
				++ptr;
			cp = unicodeToASCII(cp);
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
			cp = unicodeToASCII(cp);
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

function unicodeToASCII(codepoint: number)
{
	return codepoint == 0x20AC ? 128
		: codepoint == 0x201A ? 130
		: codepoint == 0x0192 ? 131
		: codepoint == 0x201E ? 132
		: codepoint == 0x2026 ? 133
		: codepoint == 0x2020 ? 134
		: codepoint == 0x2021 ? 135
		: codepoint == 0x02C6 ? 136
		: codepoint == 0x2030 ? 137
		: codepoint == 0x0160 ? 138
		: codepoint == 0x2039 ? 139
		: codepoint == 0x0152 ? 140
		: codepoint == 0x017D ? 142
		: codepoint == 0x2018 ? 145
		: codepoint == 0x2019 ? 146
		: codepoint == 0x201C ? 147
		: codepoint == 0x201D ? 148
		: codepoint == 0x2022 ? 149
		: codepoint == 0x2013 ? 150
		: codepoint == 0x2014 ? 151
		: codepoint == 0x02DC ? 152
		: codepoint == 0x2122 ? 153
		: codepoint == 0x0161 ? 154
		: codepoint == 0x203A ? 155
		: codepoint == 0x0153 ? 156
		: codepoint == 0x017E ? 158
		: codepoint == 0x0178 ? 159
		: codepoint;
}
