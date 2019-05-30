/*
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2019, Fat Cerberus
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
interface FetchJob
{
	bytesDone: number;
	totalSize: number | null;
	url:  string;
}

export default
class Fido
{
	private jobs: FetchJob[] = [];

	async fetch(url: string)
	{
		const job: FetchJob = {
			url,
			bytesDone: 0,
			totalSize: null,
		};
		this.jobs.push(job);
		const response = await fetch(url);
		if (response.body === null)
			throw Error(`Unable to fetch '${url}' (${response.status})`);
		const reader = response.body.getReader();
		const length = response.headers.get('Content-Length');
		if (length !== null)
			job.totalSize = parseInt(length);
		let finished = false;
		const chunks = [];
		while (!finished) {
			const { value: data, done } = await reader.read();
			if (!done) {
				chunks.push(data);
				job.bytesDone += data.length;
			}
			finished = done;
		}
		return new Blob(chunks);
	}

	async fetchImage(url: string)
	{
		const blob = await this.fetch(url);
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => {
				resolve(image);
				URL.revokeObjectURL(image.src);
			};
			image.onerror = () => {
				reject(new Error(`Unable to load image file '${url}'`));
				URL.revokeObjectURL(image.src);
			}
			image.src = URL.createObjectURL(blob);
		});
	}

	get numJobs()
	{
		return this.jobs.length;
	}

	get progress()
	{
		let bytesTotal = 0;
		let bytesDone = 0;
		for (let i = 0, len = this.jobs.length; i < len; ++i) {
			const job = this.jobs[i];
			if (job.totalSize === null)
				continue;
			bytesTotal += job.totalSize;
			bytesDone += job.bytesDone;
		}
		return bytesTotal > 0 ? bytesDone / bytesTotal : 1.0;
	}
}
