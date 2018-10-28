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

	constructor(frequency: number)
	{
		this.context = new AudioContext({
			sampleRate: frequency,
		});
	}
}

export
class Stream
{
	buffers: AudioBuffer[] = [];
	bufferLength = 0.0;
	frequency: number;
	lastMixer: Mixer | null;
	node: ScriptProcessorNode;
	numChannels: number;
	timeOffset = 0.0;

	constructor(frequency: number, numChannels = 1)
	{
		this.frequency = frequency;
		this.numChannels = numChannels;
		this.lastMixer = null;
		this.node = new ScriptProcessorNode();
	}

	get timeLeft()
	{
		return this.bufferLength;
	}

	buffer(data: Float32Array)
	{
		// TODO: split channels in input buffer

		const buffer = new AudioBuffer({
			length: data.byteLength,
			numberOfChannels: this.numChannels,
			sampleRate: this.frequency,
		});
		this.bufferLength += buffer.duration;
		buffer.copyToChannel(data, 0);
		if (this.lastMixer !== null) {
			const source = new AudioBufferSourceNode(this.lastMixer.context, { buffer });
			source.connect(this.lastMixer.context.destination);
			source.start(this.timeOffset);
			source.addEventListener('ended', () => this.bufferLength -= buffer.duration)
			this.timeOffset += buffer.duration;
		}
		else {
			this.buffers.push(buffer);
		}
	}

	play(mixer: Mixer)
	{
		let buffer: AudioBuffer | undefined
		this.timeOffset = mixer.context.currentTime;
		while (buffer = this.buffers.shift()) {
			const source = new AudioBufferSourceNode(mixer.context, { buffer });
			source.connect(mixer.context.destination);
			source.start(this.timeOffset);
			source.addEventListener('ended', () => this.bufferLength -= source.buffer!.duration)
			this.timeOffset += buffer.duration;
		}
		this.lastMixer = mixer;
	}
}