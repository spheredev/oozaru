/**
 *  Sphere Runtime for Sphere games
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

import from from './from.js';
import Scene from './scene.js';

let
	adjuster = null,
	currentSound = null,
	haveOverride = false,
	mixer = null,
	oldSounds = [],
	topmostSound = null;

export default
class Music extends null
{
	static get adjustingVolume()
	{
		return adjuster !== null && adjuster.running;
	}

	static async adjustVolume(newVolume, fadeTime = 0)
	{
		appearifyMixer();
		newVolume = Math.min(Math.max(newVolume, 0.0), 1.0);
		if (this.adjusting)
			adjuster.stop();
		if (fadeTime > 0) {
			adjuster = new Scene()
				.tween(mixer, fadeTime, 'linear', { volume: newVolume });
			return adjuster.run();
		} else {
			mixer.volume = newVolume;
		}
	}

	static async override(fileName, fadeTime = 0)
	{
		await crossfade(fileName, fadeTime, true);
		haveOverride = true;
	}

	static async play(fileName, fadeTime = 0)
	{
		topmostSound = await crossfade(fileName, fadeTime, false);
	}

	static pop(fadeTime = 0)
	{
		if (oldSounds.length === 0)
			return;
		currentSound.fader.stop();
		currentSound.fader = new Scene()
			.tween(currentSound.stream, fadeTime, 'linear', { volume: 0.0 });
		currentSound.fader.run();
		topmostSound = oldSounds.pop();
		currentSound = topmostSound;
		if (currentSound !== null) {
			currentSound.stream.volume = 0.0;
			currentSound.fader.stop();
			currentSound.fader = new Scene()
				.tween(currentSound.stream, fadeTime, 'linear', { volume: 1.0 });
			currentSound.fader.run();
		}
	}

	static push(fileName, fadeTime = 0)
	{
		let oldSound = topmostSound;
		this.play(fileName, fadeTime);
		oldSounds.push(oldSound);
	}

	static reset(fadeTime = 0)
	{
		if (!haveOverride)
			return;
		haveOverride = false;

		currentSound.fader.stop();
		currentSound.fader = new Scene()
			.tween(currentSound.stream, fadeTime, 'linear', { volume: 0.0 });
		currentSound.fader.run();
		currentSound = topmostSound;
		if (currentSound !== null) {
			currentSound.stream.volume = 0.0;
			currentSound.fader.stop();
			currentSound.fader = new Scene()
				.tween(currentSound.stream, fadeTime, 'linear', { volume: 1.0 });
			currentSound.fader.run();
		}
	}
}

function appearifyMixer()
{
	// lazy mixer creation, works around Web Audio autoplay policy
	if (mixer === null)
		mixer = new Mixer(44100, 16, 2);
}

async function crossfade(fileName, frames = 0, forceChange = false)
{
	appearifyMixer();
	let allowChange = !haveOverride || forceChange;
	if (currentSound !== null && allowChange) {
		currentSound.fader.stop();
		currentSound.fader = new Scene()
			.tween(currentSound.stream, frames, 'linear', { volume: 0.0 });
		currentSound.fader.run();
	}
	if (fileName !== null) {
		let stream = await Sound.fromFile(fileName);
		stream.repeat = true;
		stream.volume = 0.0;
		stream.play(mixer);
		let fader = new Scene()
			.tween(stream, frames, 'linear', { volume: 1.0 });
		let newSound = { stream: stream, fader: fader };
		if (allowChange) {
			currentSound = newSound;
			newSound.fader.run();
		}
		return newSound;
	}
	else {
		return null;
	}
}
