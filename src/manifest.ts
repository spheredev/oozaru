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

import { fetchTextFile } from './utilities.js'

export
class Manifest
{
	apiLevel: number;
	apiVersion: number;
	author: string;
	description: string;
	mainPath: string;
	name: string;
	resolution = { x: 320, y: 240 };
	saveID = "";

	static async fromFile(url: string)
	{
		const lines = (await fetchTextFile(url))
			.split(/\r?\n/);
		const values: Record<string, string> = {};
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

	constructor(values: Record<string, string>)
	{
		this.name = values.name ?? "Untitled";
		this.author = values.author ?? "Unknown";
		this.description = values.description ?? "";

		// `main` field implies Sphere v2, even if no API is specified
		this.apiVersion = parseInt(values.version ?? "1", 10);
		this.apiLevel = parseInt(values.api ?? "0", 10);
		this.mainPath = values.main ?? "";
		if (this.apiLevel > 0 || this.mainPath != "") {
			this.apiVersion = Math.max(this.apiVersion, 2);
			this.apiLevel = Math.max(this.apiLevel, 1);
		}

		if (this.apiVersion >= 2) {
			this.saveID = values.saveID ?? "";
			const resString = values.resolution ?? "";
			const resParse = resString.match(/(\d+)x(\d+)/);
			if (resParse && resParse.length === 3) {
				this.resolution = {
					x: parseInt(resParse[1], 10),
					y: parseInt(resParse[2], 10),
				};
			}
		}
		else {
			this.mainPath = values.script ?? "";
			this.resolution = {
				x: parseInt(values.screen_width ?? "320", 10),
				y: parseInt(values.screen_height ?? "240", 10),
			}
		}

		if (this.mainPath === "")
			throw Error("Game manifest doesn't specify a main script.");
	}
}
