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

export
function isConstructor(func: Function)
{
	const funcProxy = new Proxy(func, { construct() { return {}; } });
	try {
		Reflect.construct(funcProxy, []);
		return true;
	}
	catch {
		return false;
	}
}

export
async function loadAudioFile(url: string)
{
	return new Promise<HTMLAudioElement>((resolve, reject) => {
		const audio = new Audio();
		audio.onloadedmetadata = () => resolve(audio);
		audio.onerror = () =>
			reject(new Error(`Unable to load audio file '${url}'`));
		audio.src = url;
	});
}

export
async function loadRawFile(url: string)
{
	const fileRequest = await fetch(url);
	return fileRequest.arrayBuffer();
}

export
async function loadImageFile(url: string)
{
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () =>
			reject(new Error(`Unable to load image file '${url}'`));
		image.src = url;
	});
}

export
async function loadJSModule(url: string)
{
	const vector = `$module$${Math.random().toString(32).slice(2)}`;
	const globalThis: { [x: string]: any } = window;
	const fullURL = toAbsoluteURL(url);
	const source = `
		import * as module from "${fullURL}";
		window.${vector} = module;
	`;
	const blob = new Blob([ source ], { type: 'text/javascript' });
	return new Promise<any>((resolve, reject) => {
		const script = document.createElement('script');
		script.type = 'module';
		script.defer = true;
		const finishUp = () => {
			delete globalThis[vector];
			script.remove();
			URL.revokeObjectURL(script.src);
		};
		script.onload = () => {
			resolve(globalThis[vector]);
			finishUp();
		}
		script.onerror = () => {
			reject(new Error(`Unable to load JS module '${url}'`));
			finishUp();
		}
		script.src = URL.createObjectURL(blob);
		document.head!.appendChild(script);
	});
}

export
function promiseTry<T>(callback: () => T)
{
	return new Promise<T>(resolve => {
		resolve(callback());
	});
}

function toAbsoluteURL(url: string)
{
	const anchor = document.createElement('a');
	anchor.setAttribute("href", url);
	return (anchor.cloneNode(false) as HTMLAnchorElement).href;
}

export
function urlFromPath(pathName: string)
{
	const hops = pathName.split(/[\\/]+/);
	if (hops[0] !== '@' && hops[0] !== '#' && hops[0] !== '~' && hops[0] !== '$' && hops[0] !== '%')
		hops.unshift('@');
	if (hops[0] === '@') {
		hops.splice(0, 1);
		return `./game/${hops.join('/')}`;
	}
	else if (hops[0] === '#') {
		hops.splice(0, 1);
		return `./assets/${hops.join('/')}`;
	}
	else {
		throw new RangeError(`Unsupported SphereFS prefix '${hops[0]}'`);
	}
}
