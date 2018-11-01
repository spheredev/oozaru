/**
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

import Galileo from './galileo.js';
import InputEngine from './input-engine.js';
import Pegasus from './pegasus.js';

const mainCanvas = document.getElementById('screen') as HTMLCanvasElement;
const inputEngine = new InputEngine(mainCanvas);

main();

async function main()
{
	await Galileo.initialize(mainCanvas);
	await Pegasus.initialize(inputEngine);
	mainCanvas.onclick = async () => {
		mainCanvas.onclick = null;
		const headingDiv = document.getElementById('prompt') as HTMLDivElement;
		headingDiv.innerHTML = `<i>loading...</i>`;
		const game = await Pegasus.launchGame('./game/');
		headingDiv.innerHTML = `
			<tt><i>${game.title}</i> by <b>${game.author}</b></tt><br>
			<tt>- <b>${Sphere.Engine}</b> implementing <b>API v${Sphere.Version} level ${Sphere.APILevel}</b></tt><br>
			<tt>- game compiled with <b>${Sphere.Compiler}</b></tt><br>
			<tt>- backbuffer resolution is <b>${game.resolution.x}x${game.resolution.y}</b></tt><br>
			<br>
			<tt><b>About this Game:</b></tt><br>
			<tt>${Sphere.Game.summary}</tt>
		`;
	};
}
