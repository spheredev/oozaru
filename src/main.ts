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

main();

async function main()
{
	const urlQuery = new URL(location.href).searchParams;
	const gameID = urlQuery.get('game');

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
	const iconImage = document.createElement('img');
	iconImage.src = `dist/icon.png`;
	iconImage.width = 48;
	iconImage.height = 48;
	menu.appendChild(iconImage);

	const powerButton = document.getElementById('power')!;
	const powerText = document.getElementById('power-text')!;
	powerText.classList.add('visible');
	powerButton.onclick = async () => {
		if (powerButton.classList.contains('on')) {
			location.reload();
		}
		else {
			powerButton.classList.toggle('on');
			powerText.classList.remove('visible');
			canvas.focus();
			Pegasus.initialize(inputEngine);
			await Pegasus.launchGame(`dist`);
		}
	};
}

export
function reportException(value: unknown)
{
	let msg;
	if (value instanceof Error && value.stack !== undefined)
		msg = value.stack.replace(/\r?\n/g, '<br>');
	else
		msg = String(value);
	const readout = document.getElementById('readout') as HTMLPreElement;
	readout.classList.add('visible');
	readout.innerHTML = `an error occurred.\r\n\r\n${msg}`;
}
