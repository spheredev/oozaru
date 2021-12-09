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

import { fetchTextFile, fullURL, isConstructor } from './utilities.js';
import { Version } from './version.js';

export default
class Game
{
	static manifest: Manifest;
	static rootPath: string;

	static async initialize(rootPath: string)
	{
		const manifest = await Manifest.fromFile(`${rootPath}/game.sgm`);

		if (manifest.apiVersion < 2)
			throw Error(`'${manifest.name}' is a Sphere 1.x game and won't run in Oozaru.`);
		if (manifest.apiLevel > Version.apiLevel)
			throw Error(`'${manifest.name}' requires API level '${manifest.apiLevel}' or higher.`);

		// API levels prior to level 4 had synchronous file system functions, which doesn't work in a
		// browser.  let Oozaru launch the game, but log a warning to the console to let the user know
		// there might be an issue.
		if (manifest.apiLevel < 4)
			console.warn(`'${manifest.name}' targets Sphere API level ${manifest.apiLevel} and may not run correctly under Oozaru. Consider summoning Big Chungus to fix this issue.`);

		this.manifest = manifest;
		this.rootPath = rootPath;
	}

	static fullPath(pathName: string, baseDirName = '@/')
	{
		// canonicalizing the base path first ensures the first hop will always be a SphereFS prefix.
		// this makes things easier below.
		if (baseDirName !== '@/')
			baseDirName = this.fullPath(`${baseDirName}/`);

		// if `pathName` already starts with a SphereFS prefix, don't rebase it.
		const inputPath = /^[@#~$%](?:\\|\/)/.test(pathName)
			? `${pathName}`
			: `${baseDirName}/${pathName}`;

		const input = inputPath.split(/[\\/]+/);
		if (input[0] === '$') {
			// '$/' aliases the directory containing the main module; it's not a root itself.
			input.splice(0, 1, ...this.manifest.mainPath.split(/[\\/]+/).slice(0, -1));
		}
		const output = [ input[0] ];
		for (let i = 1, len = input.length; i < len; ++i) {
			if (input[i] === '..') {
				if (output.length > 1) {
					output.pop();  // collapse it
				}
				else {
					// if collapsing a '../' would navigate past the SphereFS prefix, we've gone too far.
					throw new RangeError(`SphereFS sandbox violation '${pathName}'`);
				}
			}
			else if (input[i] !== '.') {
				output.push(input[i]);
			}
		}
		return output.join('/');
	}

	static async launch()
	{
		// load and execute the game's main module.  if it exports a startup
		// function or class, call it.
		const scriptURL = this.urlOf(this.manifest.mainPath);
		const main = await import(fullURL(scriptURL));
		if (isConstructor(main.default)) {
			const mainObject = new main.default();
			if (typeof mainObject.start === 'function')
				await mainObject.start();
		}
		else {
			await main.default();
		}
	}

	static urlOf(pathName: string)
	{
		const hops = pathName.split(/[\\/]+/);
		if (hops[0] !== '@' && hops[0] !== '#' && hops[0] !== '~' && hops[0] !== '$' && hops[0] !== '%')
			hops.unshift('@');
		if (hops[0] === '@') {
			hops.splice(0, 1);
			return `${this.rootPath}/${hops.join('/')}`;
		}
		else if (hops[0] === '#') {
			hops.splice(0, 1);
			return `assets/${hops.join('/')}`;
		}
		else {
			throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
		}
	}
}

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
		const content = await fetchTextFile(url);
		const values: Record<string, string> = {};
		for (const line of content.split(/\r?\n/)) {
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
