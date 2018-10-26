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
class BufferStream
{
	private bytes: Uint8Array;
	private ptr = 0;
	private textDec = new TextDecoder();
	private view: DataView;

	constructor(buffer: BufferSource)
	{
		if (ArrayBuffer.isView(buffer))
			this.bytes = new Uint8Array(buffer.buffer);
		else
			this.bytes = new Uint8Array(buffer);
		this.view = new DataView(this.bytes.buffer);
	}

	get atEOF()
	{
		return this.ptr >= this.bytes.length;
	}

	get bufferSize()
	{
		return this.bytes.length;
	}

	get position()
	{
		return this.ptr;
	}

	set position(value)
	{
		if (value > this.bytes.length)
			throw new RangeError(`Stream position '${value}' is out of range`);
		this.ptr = value;
	}

	readInt8()
	{
		if (this.ptr + 1 > this.bytes.length)
			throw new Error(`Unable to read 8-bit signed integer from stream`);
		return this.view.getInt8(this.ptr++);
	}

	readInt16(littleEndian = false)
	{
		if (this.ptr + 2 > this.bytes.length)
			throw new Error(`Unable to read 16-bit signed integer from stream`);
		const value = this.view.getInt16(this.ptr, littleEndian);
		this.ptr += 2;
		return value;
	}

	readInt32(littleEndian = false)
	{
		if (this.ptr + 4 > this.bytes.length)
			throw new Error(`Unable to read 32-bit signed integer from stream`);
		const value = this.view.getInt32(this.ptr, littleEndian);
		this.ptr += 4;
		return value;
	}

	readString(numBytes: number)
	{
		if (this.ptr + numBytes > this.bytes.length)
			throw new Error(`Unable to read ${numBytes}-byte string from stream`);
		const slice = this.bytes.subarray(this.ptr, this.ptr + numBytes);
		this.ptr += numBytes;
		return this.textDec.decode(slice);
	}

	readStringU8()
	{
		const length = this.readUint8();
		return this.readString(length);
	}

	readStringU16(littleEndian = false)
	{
		const length = this.readUint16(littleEndian);
		return this.readString(length);
	}

	readStringU32(littleEndian = false)
	{
		const length = this.readUint32(littleEndian);
		return this.readString(length);
	}

	readUint8()
	{
		if (this.ptr + 1 > this.bytes.length)
			throw new Error(`Unable to read 8-bit unsigned integer from stream`);
		return this.view.getUint8(this.ptr++);
	}

	readUint16(littleEndian = false)
	{
		if (this.ptr + 2 > this.bytes.length)
			throw new Error(`Unable to read 16-bit unsigned integer from stream`);
		const value = this.view.getUint16(this.ptr, littleEndian);
		this.ptr += 2;
		return value;
	}

	readUint32(littleEndian = false)
	{
		if (this.ptr + 4 > this.bytes.length)
			throw new Error(`Unable to read 32-bit unsigned integer from stream`);
		const value = this.view.getUint32(this.ptr, littleEndian);
		this.ptr += 4;
		return value;
	}

	skipAhead(numBytes: number)
	{
		if (this.ptr + numBytes > this.bytes.length)
			throw new Error(`Cannot read ${numBytes} bytes from stream`);
		this.ptr += numBytes;
	}
}