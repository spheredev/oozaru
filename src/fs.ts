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

import { Manifest } from './sgm.js';
import * as version from './version.js';

export
class Game
{
	#manifest: Manifest;
	#url: string;

	static async fromDirectory(url: string)
	{
		const manifest = await Manifest.fromFile(`${url}/game.sgm`);
		return new this(url, manifest);
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
			return `${game.#url}/${hops.join('/')}`;
		}
		else if (hops[0] === '#') {
			hops.splice(0, 1);
			return `assets/${hops.join('/')}`;
		}
		else {
			throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
		}
	}

	constructor(directoryURL: string, manifest: Manifest)
	{
		this.#manifest = verifyManifest(this, manifest);
		this.#url = directoryURL.endsWith('/')
			? directoryURL.substr(0, directoryURL.length - 1)
			: directoryURL;
	}

	get author()
	{
		return this.manifest.author;
	}

	get compiler(): string | undefined
	{
		return undefined;
	}

	get modulePath(): string
	{
		return this.#manifest.mainPath;
	}

	get manifest()
	{
		return this.#manifest;
	}

	get resolution()
	{
		return this.#manifest.resolution;
	}

	get description(): string
	{
		return this.#manifest.description;
	}

	get title(): string
	{
		return this.#manifest.title;
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
			input.splice(0, 1, ...this.#manifest.mainPath.split(/[\\/]+/).slice(0, -1));
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

function verifyManifest(game: Game, manifest: Manifest)
{
	// check if the targeted API version and level are supported
	if (manifest.apiLevel > version.apiLevel)
		throw Error(`Oozaru doesn't support API level '${manifest.apiLevel}'.`);

	// note: Oozaru doesn't support games targeting API 3 or below, as that entails some
	//       Web-unfriendly compatibility baggage.
	if (manifest.apiLevel < 4)
		throw Error(`Game targets old API level '${manifest.apiLevel}'.`);

	return manifest;
}
