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
class Deque<T> implements Iterable<T>
{
	private entries: T[] = [];
	private overflowPtr = 1;
	private readPtr: number = 0;
	private stride = 1;
	private vips: T[] = [];
	private writePtr: number = 0;

	*[Symbol.iterator]()
	{
		while (!this.empty)
			yield this.shift();
	}

	get empty()
	{
		return this.readPtr === this.writePtr
			&& this.overflowPtr === this.stride
			&& this.vips.length === 0;
	}

	get head()
	{
		return this.vips.length > 0 ? this.vips[this.vips.length - 1]
			: this.readPtr !== this.writePtr ? this.entries[this.readPtr]
			: this.entries[this.overflowPtr - 1];
	}

	get last()
	{
		const ptr = this.writePtr > 0 ? this.writePtr - 1
			: this.stride - 1;
		return this.overflowPtr > this.stride ? this.entries[this.overflowPtr - 1]
			: this.readPtr !== this.writePtr ? this.entries[ptr]
			: this.vips[0];
	}

	clear()
	{
		this.entries.length = 0;
		this.stride = 1;
		this.overflowPtr = 1;
		this.writePtr = 0;
		this.readPtr = 0;
	}

	pop()
	{
		if (this.overflowPtr > this.stride) {
			// take from overflow area first
			return this.entries[--this.overflowPtr];
		}
		else if (this.readPtr !== this.writePtr) {
			if (--this.writePtr < 0)
				this.writePtr = this.stride - 1;
			return this.entries[this.writePtr];
		}
		else {
			// note: uses Array#shift so not O(1).  i'll fix it eventually but
			//       ultimately, I don't expect this case to be common.
			return this.vips.shift();
		}
	}

	push(value: T)
	{
		const ringFull = (this.writePtr + 1) % this.stride === this.readPtr;
		if (ringFull || this.overflowPtr > this.stride) {
			// if there's already an overflow area established, we need to keep
			// using it to maintain proper FIFO order.
			this.entries[this.overflowPtr++] = value;
		}
		else {
			this.entries[this.writePtr++] = value;
			if (this.writePtr >= this.stride)
				this.writePtr = 0;
		}
	}

	shift()
	{
		if (this.vips.length === 0) {
			const value = this.entries[this.readPtr++];
			if (this.readPtr >= this.stride)
				this.readPtr = 0;
			if (this.readPtr === this.writePtr) {
				// absorb the overflow area back into the ring
				this.readPtr = this.stride % this.overflowPtr;
				this.writePtr = 0;
				this.stride = this.overflowPtr;
			}
			return value;
		}
		else {
			return this.vips.pop()!;
		}
	}

	unshift(value: T)
	{
		const ringFull = (this.writePtr + 1) % this.stride === this.readPtr;
		if (!ringFull) {
			if (--this.readPtr < 0)
				this.readPtr = this.stride - 1;
			this.entries[this.readPtr] = value;
		}
		else {
			this.vips.push(value);
		}
	}
}
