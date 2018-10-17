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

import Pact from './pact.js';

/**
 * Asynchronously load the specified image file as an Image object
 */
export
async function loadImage(fileName: string)
{
	let image = new Image();
	let pact = new Pact();
	image.onload = () => {
		pact.resolve(image);
	};
	image.onerror = () => {
		pact.reject(`Error loading image file ${fileName}`);
	};
	image.src = fileName;
	await pact;
	// allow Pact to be collected
	image.onload = doNothing;
	image.onerror = doNothing;
	return image;
}

/**
 * Asynchronously load the specified sound file as an Audio object
 */
export
async function loadSound(fileName: string)
{
	let sound = new Audio();
	let pact = new Pact();
	sound.onloadeddata = () => {
		pact.resolve(sound);
	};
	sound.onerror = () => {
		pact.reject(`Error loading sound file ${fileName}`);
	};
	sound.src = fileName;
	await pact;
	// allow Pact to be collected
	sound.onloadeddata = doNothing;
	sound.onerror = doNothing;
	return sound;
}

/**
 * Check if a function is a constructor without calling it
 */
export function isConstructor (fn: any) {
	const fnProxy = new Proxy(fn, { construct() { return {}; } });
	try {
		//@ts-ignore
		new fnProxy();
		return true;
	} catch (e) {
		return false;
	}
}

function doNothing () {}
