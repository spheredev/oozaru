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
	bufferSize = 0;
	frequency: number;
	inPtr = 0;
	numChannels: number;

	constructor(frequency: number, numChannels = 1)
	{
		this.frequency = frequency;
		this.numChannels = numChannels;
	}

	get timeLeft()
	{
		return this.bufferSize / (this.frequency * this.numChannels);
	}

	buffer(data: Float32Array)
	{
		this.buffers.push(data);
	}

	play(mixer: Mixer)
	{
		const node = mixer.context.createScriptProcessor(4096, 0, 1);
		node.addEventListener('audioprocess', e => {
			if (this.buffers.length === 0)
				return;
			let outBytesLeft = e.outputBuffer.length;
			let outPtr = 0;
			while (outBytesLeft > 0) {
				const samples = this.buffers[0].subarray(this.inPtr);
				const bytesToCopy = Math.min(outBytesLeft, samples.length);
				e.outputBuffer.copyToChannel(samples, 0, outPtr);
				outBytesLeft -= bytesToCopy;
				outPtr += bytesToCopy;
				this.inPtr += bytesToCopy;
				if (this.inPtr >= this.buffers[0].length) {
					this.buffers.shift();
					this.inPtr = 0;
				}
			}
		});
		node.connect(mixer.gainer);
	}
}