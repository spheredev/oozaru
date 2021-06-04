/**
 *  Sphere: the JavaScript game platform
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

import * as galileo from './galileo.js';
import { Awaitable } from './types.js';

interface Job
{
	jobID: number;
	type: JobType;
	callback: () => Awaitable<void>;
	cancelled: boolean;
	paused: boolean;
	priority: number;
	recurring: boolean;
	busy: boolean;
	timer: number;
}

export
enum JobType
{
	// in order of execution
	Render,
	Update,
	Immediate,
}

let nextJobID = 1;

export default
class JobQueue
{
	#frameCount = -1;
	#jobs: Job[] = [];
	#rafCallback = () => this.animate();
	#rafID = 0;
	#sortingNeeded = false;

	add(type: JobType, callback: () => Awaitable<void>, recurring?: false, delay?: number): number;
	add(type: JobType, callback: () => Awaitable<void>, recurring: true, priority?: number): number;
	add(type: JobType, callback: () => Awaitable<void>, recurring = false, delayOrPriority = 0)
	{
		const timer = !recurring ? delayOrPriority : 0;
		let priority = recurring ? delayOrPriority : 0.0;

		// invert priority of render jobs so that the highest-priority render is done last
		// (painter's algorithm).
		if (type === JobType.Render)
			priority = -(priority);

		this.#jobs.push({
			jobID: nextJobID,
			type,
			callback,
			cancelled: false,
			priority,
			recurring,
			busy: false,
			paused: false,
			timer,
		});
		this.#sortingNeeded = true;
		return nextJobID++;
	}

	cancel(jobID: number)
	{
		// note that we can't safely delete entries from the job list here as that might interfere
		// with any ongoing rAF callbacks.
		for (let i = 0, len = this.#jobs.length; i < len; ++i) {
			const job = this.#jobs[i];
			if (job.jobID === jobID)
				job.cancelled = true;
		}
	}

	now()
	{
		return Math.max(this.#frameCount, 0);
	}

	pause(jobID: number, paused: boolean)
	{
		for (let i = 0, len = this.#jobs.length; i < len; ++i) {
			const job = this.#jobs[i];
			if (job.jobID === jobID)
				job.paused = paused;
		}
	}

	start()
	{
		if (this.#rafID !== 0)  // already running?
			return;

		this.#rafID = requestAnimationFrame(this.#rafCallback);
	}

	stop()
	{
		if (this.#rafID !== 0)
			cancelAnimationFrame(this.#rafID);
		this.#frameCount = -1;
		this.#jobs.length = 0;
		this.#rafID = 0;
	}

	private animate()
	{
		this.#rafID = requestAnimationFrame(this.#rafCallback);

		++this.#frameCount;

		// reset clipping and clear the backbuffer
		galileo.DrawTarget.Screen.activate();
		galileo.DrawTarget.Screen.unclip();
		galileo.Prim.clear();

		// sort the Dispatch jobs for this frame
		if (this.#sortingNeeded) {
			// job queue sorting criteria, in order of key ranking:
			// 1. all recurring jobs first, followed by all one-offs
			// 2. renders, then updates, then immediates
			// 3. highest to lowest priority
			// 4. within the same priority bracket, maintain FIFO order
			this.#jobs.sort((a, b) => {
				const recurDelta = +b.recurring - +a.recurring;
				const typeDelta = a.type - b.type;
				const priorityDelta = b.priority - a.priority;
				const fifoDelta = a.jobID - b.jobID;
				return recurDelta || typeDelta || priorityDelta || fifoDelta;
			});
			this.#sortingNeeded = false;
		}

		// this is a bit tricky.  Dispatch.now() is required to be processed in the same frame it's
		// issued, but we also want to avoid doing updates and renders out of turn.  to that end,
		// the loop below is split into two phases.  in phase one, we run through the sorted part of
		// the list.  in phase two, we process all jobs added since the frame started, but skip over
		// the update and render jobs, leaving them for the next frame.  conveniently for us,
		// Dispatch.now() jobs are not prioritized so they're guaranteed to be in the correct order
		// (FIFO) naturally!
		let ptr = 0;
		const initialLength = this.#jobs.length;
		for (let i = 0; i < this.#jobs.length; ++i) {
			const job = this.#jobs[i];
			if ((i < initialLength || job.type === JobType.Immediate)
				&& !job.busy && !job.cancelled && (job.recurring || job.timer-- <= 0)
				&& !job.paused)
			{
				job.busy = true;
				(async () => job.callback())()
					.then(() => {
						job.busy = false;
					})
					.catch(exception => {
						this.#jobs.length = 0;
						throw exception;
					});
			}
			if (job.cancelled || (!job.recurring && job.timer < 0))
				continue;  // delete it
			this.#jobs[ptr++] = job;
		}
		this.#jobs.length = ptr;
	}
}
