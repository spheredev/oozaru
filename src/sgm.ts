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

import * as util from './utility.js'

/** Specifies a screen resolution in pixels. */
interface Resolution
{
	readonly x: number;
	readonly y: number;
}

/** Represents a Sphere game manifest. */
export
class Manifest
{
	#apiLevel: number;
	#author: string;
	#description: string;
	#mainPath: string;
	#resolution: Resolution = { x: 320, y: 240 };
	#title: string;
	#version: number;

	/** Asynchronously constructs a new manifest from a file. */
	static async fromFile(url: string)
	{
		const content = await util.fetchText(url);
		const lines = content.split(/\r?\n/);
		const values: Record<string, string | undefined> = {};
		for (const line of lines) {
			const lineParse = line.match(/(.*)=(.*)/);
			if (lineParse && lineParse.length === 3) {
				const key = lineParse[1];
				const value = lineParse[2];
				values[key] = value;
			}
		}
		return new this(values);
	}

	constructor(values: Record<string, string | undefined>)
	{
		// preliminary checks to make sure we have a Sphere v2 manifest
		this.#version = parseInt(values.version ?? "1", 10);
		this.#apiLevel = parseInt(values.api ?? "0", 10);
		this.#mainPath = values.main ?? "";
		if (this.#apiLevel > 0 || this.#mainPath != "") {
			this.#version = Math.max(this.#version, 2);
			this.#apiLevel = Math.max(this.#apiLevel, 1);
		}
		if (this.#version < 2)
			throw Error("Oozaru doesn't support Sphere v1 games.");

		this.#title = values.name ?? "Untitled";
		this.#author = values.author ?? "Unknown";
		this.#description = values.description ?? "";

		const resString = values.resolution ?? "320x240";
		const resParse = resString.match(/(\d+)x(\d+)/);
		if (resParse && resParse.length === 3) {
			this.#resolution = {
				x: parseInt(resParse[1], 10),
				y: parseInt(resParse[2], 10),
			};
		}
	}

	/** The Sphere platform version this manifest targets. */
	get version() { return this.#version; }

	/** The Sphere API level this manifest targets. */
	get apiLevel() { return this.#apiLevel; }

	/** The title of the game, as read from its `name` field. */
	get title() { return this.#title; }

	/** The name of the game's author or publisher. */
	get author() { return this.#author; }

	/** A short description of the game. */
	get description() { return this.#description; }

	/** The resolution the game renders at by default. */
	get resolution() { return this.#resolution; }

	/** The SphereFS path of the game's main JS module. */
	get mainPath() { return this.#mainPath; }
}