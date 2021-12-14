/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2015-2021, Fat Cerberus
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
 *  * Neither the name of Spherical nor the names of its contributors may be
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

import { DataStream } from './data-stream.js';
import Fido from './fido.js';

interface FileRecord
{
	byteOffset: number;
	byteLength: number;
	fileSize: number;
	data?: ArrayBuffer;
}

export
class Package
{
	stream: DataStream;
	toc: Record<string, FileRecord> = {};
	
	static async fromFile(url: string)
	{
		const response = await Fido.fetch(url);
		const buffer = await response.arrayBuffer();
		const stream = new DataStream(buffer);
		return new this(stream);
	}

	constructor(stream: DataStream)
	{
		const spkHeader = stream.readStruct({
			signature: 'string/4',
			version:   'uint16-le',
			numFiles:  'uint32-le',
			tocOffset: 'uint32-le',
			reserved:  'reserve/2',
		});
		if (spkHeader.signature != '.spk')
			throw RangeError("Not a valid Sphere package file");
		if (spkHeader.version !== 1)
			throw RangeError(`Unsupported SPK format version '${spkHeader.version}'`);
		stream.position = spkHeader.tocOffset;
		for (let i = 0; i < spkHeader.numFiles; ++i) {
			const entry = stream.readStruct({
				version:    'uint16-le',
				nameLength: 'uint16-le',
				byteOffset: 'uint32-le',
				fileSize:   'uint32-le',
				byteSize:   'uint32-le',
			});
			if (entry.version !== 1)
				throw RangeError(`Unsupported SPK file record version '${entry.version}'`);
			const pathName = stream.readString(entry.nameLength);
			this.toc[pathName] = {
				byteOffset: entry.byteOffset,
				byteLength: entry.byteLength,
				fileSize: entry.fileSize,
			};
		}
		this.stream = stream;
	}

	dataOf(pathName: string)
	{
		if (!(pathName in this.toc))
			throw Error(`File not found in Sphere package '${pathName}'`);
		const record = this.toc[pathName];
		if (record.data === undefined) {
			if (record.byteLength !== record.fileSize)
				throw RangeError(`Compressed packages are currently unsupported`);
			this.stream.position = record.byteOffset;
			const compressedData = this.stream.readBytes(record.byteLength);
			record.data = compressedData.buffer;
		}
		return record.data;
	}
}
