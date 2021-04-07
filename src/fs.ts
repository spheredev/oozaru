/**
 *  Sphere: the JavaScript game platform
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
import * as version from './version.js';

const MIN_API_LEVEL = 4;

export
class Game
{
	private data: { [x: string]: any };
	private screenSize: { x: number, y: number };
	private url: string;

	static async fromDirectory(url: string)
	{
		const json = await util.fetchText(`${url}/game.json`);
		return new this(url, json);
	}

	static urlOf(game: Game | null, pathName: string)
	{
		const hops = pathName.split(/[\\/]+/);
		if (hops[0] !== '@' && hops[0] !== '#' && hops[0] !== '~' && hops[0] !== '$' && hops[0] !== '%')
			hops.unshift('@');
		if (hops[0] === '@') {
			if (game === null)
				throw new Error(`No game loaded to resolve SphereFS '@/' prefix`);
			hops.splice(0, 1);
			return `${game.url}/${hops.join('/')}`;
		}
		else if (hops[0] === '#') {
			hops.splice(0, 1);
			return `assets/${hops.join('/')}`;
		}
		else {
			throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
		}
	}

	constructor(directoryURL: string, manifestJSON: string)
	{
		const manifest = JSON.parse(manifestJSON);
		verifyManifest(this, manifest);

		this.url = directoryURL.endsWith('/')
			? directoryURL.substr(0, directoryURL.length - 1)
			: directoryURL;
		this.data = manifest;

		// parse the screen resolution string
		const matches = this.data.resolution.match(/^([0-9]*)x([0-9]*)$/);
		this.screenSize = matches !== null
			? Object.freeze({ x: +matches[1], y: +matches[2] })
			: Object.freeze({ x: 640, y: 480 });
	}

	get author(): string
	{
		return this.data.author;
	}

	get compiler(): string
	{
		return this.data.$COMPILER;
	}

	get modulePath(): string
	{
		return this.data.main;
	}

	get manifest()
	{
		return this.data;
	}

	get resolution()
	{
		return this.screenSize;
	}

	get summary(): string
	{
		return this.data.summary;
	}

	get title(): string
	{
		return this.data.name;
	}

	fullPath(pathName: string, baseDirName = '@/')
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
			input.splice(0, 1, ...this.data.main.split(/[\\/]+/).slice(0, -1));
		}
		const output = [ input[0] ];
		for (let i = 1, len = input.length; i < len; ++i) {
			if (input[i] === '..') {
				if (output.length > 1) {
					output.pop();  // collapse it
				}
				else {
					// if collapsing a '../' would navigate past the SphereFS prefix, we've gone too far.
					throw new RangeError(`FS sandbox violation on '${pathName}'`);
				}
			}
			else if (input[i] !== '.') {
				output.push(input[i]);
			}
		}
		return output.join('/');
	}
}

function verifyManifest(game: Game, manifest: Record<string, any>)
{
	// check if the targeted API version and level are supported
	const apiVersion = manifest.apiVersion ?? 2;
	const apiLevel = manifest.apiLevel ?? 1;
	if (typeof apiVersion !== 'number' || apiVersion < 1)
		throw Error(`Invalid API version '${apiVersion}' in game manifest`);
	if (typeof apiLevel !== 'number' || apiLevel < 1)
		throw Error(`Invalid API level '${apiLevel}' in game manifest`);
	if (apiVersion == 1)
		throw Error(`Sphere v1 API-based games are not supported`);
	if (apiLevel > version.apiLevel)
		throw Error(`Game targets unsupported API level ${apiLevel}`);

	// note: Oozaru doesn't support games targeting API 3 or below, as that entails some
	//       Web-unfriendly compatibility baggage.
	if (apiLevel < MIN_API_LEVEL)
		throw Error(`Game targets API level ${MIN_API_LEVEL - 1} or below`);
}
