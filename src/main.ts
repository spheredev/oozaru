/**
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2020, Fat Cerberus
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

import Galileo from './galileo.js';
import InputEngine from './input-engine.js';
import Pegasus from './pegasus.js';

const GameList =
[
	{ name: "Tovarishch Smert", path: 'game/comradeDeath' },
	{ name: "Spectacles Battle Demo", path: 'game/specs' },
];

main();

async function main()
{
	const urlQuery = new URL(location.href).searchParams;
	const gamePath = urlQuery.get('path');
	
	// use event handling to intercept errors originating inside the Sphere sandbox, rather than a
	// try-catch.  otherwise the debugger thinks the error is handled and doesn't do a breakpoint,
	// making diagnosing bugs in the engine harder than necessary.
	window.addEventListener('error', e => {
		reportException(e.error);
	});
	window.addEventListener('unhandledrejection', e => {
		reportException(e.reason);
	});

	const canvas = document.getElementById('screen') as HTMLCanvasElement;
	const inputEngine = new InputEngine(canvas);
	await Galileo.initialize(canvas);

	const menu = document.getElementById('menu')!;
	for (const game of GameList) {
		const iconImage = document.createElement('img');
		iconImage.src = `${game.path}/icon.png`;
		iconImage.width = 48;
		iconImage.height = 48;
		const anchor = document.createElement('a');
		anchor.className = 'game';
		if (game.path === gamePath)
			anchor.classList.add('running');
		anchor.title = game.name;
		anchor.href = `${location.origin}${location.pathname}?path=${game.path}`;
		anchor.appendChild(iconImage);
		menu.appendChild(anchor);
	}
	if (gamePath !== null) {
		Pegasus.initialize(inputEngine);
		canvas.focus();
		await Pegasus.launchGame(gamePath);
	}
}

export
function reportException(value: unknown)
{
	let msg;
	if (value instanceof Error && value.stack !== undefined)
		msg = value.stack.replace(/\r?\n/g, '<br>');
	else
		msg = String(value);
	const headingDiv = document.getElementById('readout') as HTMLDivElement;
	headingDiv.innerHTML = `<pre>${msg}</pre>`;
}
