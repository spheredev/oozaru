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

import Sampler from './sampler.js';

export
class Mixer
{
	context: AudioContext;
	gainer: GainNode;

	constructor(frequency: number)
	{
		this.context = new AudioContext({
			sampleRate: frequency,
		});
		this.gainer = this.context.createGain();
		this.gainer.gain.value = 1.0;
		this.gainer.connect(this.context.destination);
	}

	get volume()
	{
		return this.gainer.gain.value;
	}

	set volume(value)
	{
		this.gainer.gain.value = value;
	}
}

export
class Stream
{
	buffers: Float32Array[] = [];
	frequency: number;
	inPtr = 0.0;
	numChannels: number;
	timeBuffered = 0.0;

	constructor(frequency: number, numChannels = 1)
	{
		this.frequency = frequency;
		this.numChannels = numChannels;
	}

	get buffered()
	{
		return this.timeBuffered;
	}

	buffer(data: Float32Array)
	{
		this.buffers.push(data);
		this.timeBuffered += data.length / (this.frequency * this.numChannels);
	}

	play(mixer: Mixer)
	{
		const node = mixer.context.createScriptProcessor(4096, 0, this.numChannels);
		node.addEventListener('audioprocess', e => {
			if (this.timeBuffered < e.outputBuffer.duration)
				return;  // not enough audio buffered
			this.timeBuffered = this.timeBuffered - e.outputBuffer.duration;
			if (this.timeBuffered < 0.0)
				this.timeBuffered = 0.0;
			const step = this.frequency / e.outputBuffer.sampleRate;
			const outputs: Float32Array[] = [];
			for (let i = 0; i < this.numChannels; ++i)
				outputs[i] = e.outputBuffer.getChannelData(i);
			let inBuffer = this.buffers[0];
			let inPtr = this.inPtr;
			const sampler = new Sampler(inBuffer, this.numChannels);
			for (let i = 0, len = outputs[0].length; i < len; ++i) {
				for (let j = 0; j < this.numChannels; ++j)
					outputs[j][i] = sampler.sample(inPtr, j);
				inPtr += step;
				if (inPtr >= Math.floor(inBuffer.length / this.numChannels)) {
					this.buffers.shift();
					inBuffer = sampler.source = this.buffers[0];
					inPtr = 0.0;
					if (inBuffer === undefined)
						return;  // no more data--it probably got eaten
				}
			}
			this.inPtr = inPtr;
		});
		node.connect(mixer.gainer);
	}
}
