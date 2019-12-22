/**
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2019, Fat Cerberus
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

import * as version from './version.js';

import Galileo from './galileo.js';
import InputEngine from './input-engine.js';
import Pegasus from './pegasus.js';

const mainCanvas = document.getElementById('screen') as HTMLCanvasElement;
const inputEngine = new InputEngine(mainCanvas);

main();

async function main()
{
	await Galileo.initialize(mainCanvas);
	mainCanvas.onclick = async () => {
		mainCanvas.onclick = null;
		const headingDiv = document.getElementById('prompt') as HTMLDivElement;
		headingDiv.innerHTML = `<tt><i>loading...</i></tt>`;
		await Pegasus.initialize(inputEngine);
		let game;
		try {
			game = await Pegasus.launchGame('game');
			document.body.style.backgroundColor = '#000';
			headingDiv.innerHTML = `
				<tt><i>${game.title}</i> by <b>${game.author}</b></tt><br>
				<tt>- <b>${version.name} ${version.version}</b> implementing <b>API v${version.apiVersion} level ${version.apiLevel}</b></tt><br>
				<tt>- game compiled with <b>${game.compiler}</b></tt><br>
				<tt>- backbuffer resolution is <b>${game.resolution.x}x${game.resolution.y}</b></tt><br>
				<br>
				<tt><b>About this Game:</b></tt><br>
				<tt>${game.summary}</tt>
			`;
		}
		catch (e) {
			reportException(e);
		}
	};
}

export
async function reportException(exception: unknown)
{
	let msg;
	if (exception instanceof Error && exception.stack !== undefined)
		msg = exception.stack.replace(/\r?\n/g, '<br>');
	else
		msg = String(exception);
	const headingDiv = document.getElementById('prompt') as HTMLDivElement;
	headingDiv.innerHTML = `<font color=#C88><tt>Uncaught JavaScript exception!<br><pre>${msg}</pre></tt></font>`;
	console.error(exception);
}
