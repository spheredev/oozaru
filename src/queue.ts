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

// this is based on an algorithm for dynamically-expanding ring buffers which
// is described here:
// https://blog.labix.org/2010/12/23/efficient-algorithm-for-expanding-circular-buffers

export default
class Queue<T> implements Iterable<T>
{
	private entries: T[] = [];
	private overflowSize = 0;
	private readPtr: number = 0;
	private stride = 1;
	private writePtr: number = 0;

	constructor()
	{
	}

	*[Symbol.iterator]()
	{
		while (!this.empty)
			yield this.shift();
	}

	get empty()
	{
		return this.readPtr === this.writePtr
			&& this.overflowSize === 0;
	}

	get head()
	{
		return this.entries[this.readPtr];
	}

	clear()
	{
		this.entries.length = 0;
		this.stride = 1;
		this.overflowSize = 0;
		this.writePtr = 0;
		this.readPtr = 0;
	}

	push(value: T)
	{
		const ringFull = (this.writePtr + 1) % this.stride === this.readPtr;
		if (ringFull || this.overflowSize > 0) {
			this.entries.push(value);
			++this.overflowSize;
		}
		else {
			this.entries[this.writePtr++] = value;
			if (this.writePtr >= this.stride)
				this.writePtr = 0;
		}
	}

	shift()
	{
		const value = this.entries[this.readPtr++];
		if (this.readPtr >= this.stride)
			this.readPtr = 0;
		if (this.readPtr === this.writePtr) {
			// expand the window into the overflow area
			const newStride = this.stride + this.overflowSize;
			this.readPtr = this.stride % newStride;
			this.writePtr = 0;
			this.stride = newStride;
			this.overflowSize = 0;
		}
		return value;
	}
}
