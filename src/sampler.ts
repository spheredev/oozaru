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

export default
class Sampler
{
	head = 0.0;
	tail = 0.0;
	numChannels: number;
	samples: Float32Array | Float64Array;
	window = 1.0;

	constructor(source: Float32Array | Float64Array, numChannels = 1)
	{
		this.numChannels = numChannels;
		this.samples = source;
	}

	get source()
	{
		return this.samples;
	}

	set source(value)
	{
		this.samples = value;
	}

	sample(x: number, channel = 0)
	{
		const x1 = Math.floor(x) * this.numChannels + channel;
		const frac = x - Math.floor(x);
		if (false && frac !== 0.0) {
			const x2 = x1 + this.numChannels;
			const value = x1 >= 0 ? this.samples[x1] : this.head;
			const next = x2 < this.samples.length ? this.samples[x2] : this.tail;
			return value + frac * (next - value);
		}
		else {
			return x1 >= this.samples.length ? this.tail
				: x1 < 0 ? this.head
				: this.samples[x1];
		}
	}
}