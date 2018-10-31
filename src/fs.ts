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

import * as util from './utility.js'

export
class Game
{
	private data: { [x: string]: any };
	private screenSize: { x: number, y: number };
	private url: string;

	static async fromDirectory(url: string)
	{
		const json = await util.fetchJSON(`${url}/game.json`);
		const game = new this();
		game.url = url;
		game.data = Object.freeze(json);

		// parse the screen resolution string
		const matches = game.data.resolution.match(/^([0-9]*)x([0-9]*)$/);
		if (matches !== null)
			game.screenSize = Object.freeze({ x: +matches[1], y: +matches[2] });
		else
			game.screenSize = Object.freeze({ x: 640, y: 480 });

		return game;
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
			return `./assets/${hops.join('/')}`;
		}
		else {
			throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
		}
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
}
