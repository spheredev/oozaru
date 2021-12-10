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

interface FetchJob
{
	bytesDone: number;
	finished: boolean;
	totalSize: number | null;
	url:  string;
}

export default
class Fido
{
	static jobs: FetchJob[] = [];

	static async fetch(url: string)
	{
		const job: FetchJob = {
			url,
			bytesDone: 0,
			totalSize: null,
			finished: false,
		};
		this.jobs.push(job);
		const response = await fetch(url);
		if (response.body === null)
			throw Error(`Unable to fetch '${url}' (${response.status})`);
		const reader = response.body.getReader();
		const length = response.headers.get('Content-Length');
		if (length !== null)
			job.totalSize = parseInt(length);
		const chunks = [];
		while (!job.finished) {
			const result = await reader.read();
			if (!result.done) {
				chunks.push(result.value);
				job.bytesDone += result.value.length;
			}
			job.finished = result.done;
		}
		let allDone = true;
		for (const job of this.jobs)
			allDone = allDone && job.finished;
		if (allDone)
			this.jobs.length = 0;
		return new Blob(chunks);
	}

	static async fetchData(url: string)
	{
		const blob = await this.fetch(url);
		return blob.arrayBuffer();
	}

	static async fetchImage(url: string)
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

	static async fetchText(url: string)
	{
		const blob = await this.fetch(url);
		return blob.text();
	}

	static get numJobs()
	{
		return this.jobs.length;
	}

	static get progress()
	{
		let bytesTotal = 0;
		let bytesDone = 0;
		for (const job of this.jobs) {
			if (job.totalSize === null)
				continue;
			bytesTotal += job.totalSize;
			bytesDone += job.bytesDone;
		}
		return bytesTotal > 0 ? bytesDone / bytesTotal : 1.0;
	}
}
