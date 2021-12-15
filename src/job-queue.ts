/**
 *  Oozaru: Sphere for the Web
 *  Copyright (c) 2015-2022, Fat Cerberus
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

import Galileo from './galileo.js';

interface Job
{
	jobID: number;
	type: JobType;
	callback: () => void | PromiseLike<void>;
	cancelled: boolean;
	paused: boolean;
	priority: number;
	recurring: boolean;
	busy: boolean;
	timer: number;
}

export
interface JobOptions
{
	inBackground?: boolean;
	priority?: number;
}

export
enum JobType
{
	// in order of execution
	Render,
	Update,
	Immediate,
}

var frameCount = -1;
var jobSortNeeded = false;
var jobs: Job[] = [];
var nextJobID = 1;
var rAFID = 0;

export default
class JobQueue
{
	static now()
	{
		return Math.max(frameCount, 0);
	}

	static start()
	{
		if (rAFID !== 0)  // already running?
			return;
		rAFID = requestAnimationFrame(animate);
	}

	static stop()
	{
		if (rAFID !== 0)
			cancelAnimationFrame(rAFID);
		frameCount = -1;
		jobs.length = 0;
		rAFID = 0;
	}
}

export
class Dispatch
{
	static cancelAll()
	{
		throw new Error(`'Dispatch#cancelAll()' API is not implemented`);
	}

	static later(numFrames: number, callback: () => void)
	{
		const job = addJob(JobType.Update, callback, false, numFrames);
		return new JobToken(job);
	}

	static now(callback: () => void)
	{
		const job = addJob(JobType.Immediate, callback);
		return new JobToken(job);
	}

	static onRender(callback: () => void, options: JobOptions = {})
	{
		const job = addJob(JobType.Render, callback, true, options.priority);
		return new JobToken(job);
	}

	static onUpdate(callback: () => void, options: JobOptions = {})
	{
		const job = addJob(JobType.Update, callback, true, options.priority);
		return new JobToken(job);
	}
}

export
class JobToken
{
	job: Job;

	constructor(job: Job)
	{
		this.job = job;
	}

	cancel()
	{
		this.job.cancelled = true;
	}

	pause()
	{
		this.job.paused = true;
	}

	resume()
	{
		this.job.paused = false;
	}
}

function addJob(type: JobType, callback: () => void | PromiseLike<void>, recurring?: false, delay?: number): Job;
function addJob(type: JobType, callback: () => void | PromiseLike<void>, recurring: true, priority?: number): Job;
function addJob(type: JobType, callback: () => void | PromiseLike<void>, recurring = false, delayOrPriority = 0)
{
	const timer = !recurring ? delayOrPriority : 0;
	let priority = recurring ? delayOrPriority : 0.0;

	// invert priority of render jobs so that the highest-priority render is done last
	// (painter's algorithm).
	if (type === JobType.Render)
		priority = -(priority);

	const job: Job = {
		jobID: nextJobID++,
		type,
		callback,
		cancelled: false,
		priority,
		recurring,
		busy: false,
		paused: false,
		timer,
	};
	jobs.push(job);
	jobSortNeeded = true;
	return job;
}

function animate()
{
	rAFID = requestAnimationFrame(animate);

	++frameCount;

	Galileo.flip();

	// sort the Dispatch jobs for this frame
	if (jobSortNeeded) {
		// job queue sorting criteria, in order of key ranking:
		// 1. all recurring jobs first, followed by all one-offs
		// 2. renders, then updates, then immediates
		// 3. highest to lowest priority
		// 4. within the same priority bracket, maintain FIFO order
		jobs.sort((a, b) => {
			const recurDelta = +b.recurring - +a.recurring;
			const typeDelta = a.type - b.type;
			const priorityDelta = b.priority - a.priority;
			const fifoDelta = a.jobID - b.jobID;
			return recurDelta || typeDelta || priorityDelta || fifoDelta;
		});
		jobSortNeeded = false;
	}

	// this is a bit tricky.  Dispatch.now() is required to be processed in the same frame it's
	// issued, but we also want to avoid doing updates and renders out of turn.  to that end,
	// the loop below is split into two phases.  in phase one, we run through the sorted part of
	// the list.  in phase two, we process all jobs added since the frame started, but skip over
	// the update and render jobs, leaving them for the next frame.  conveniently for us,
	// Dispatch.now() jobs are not prioritized so they're guaranteed to be in the correct order
	// (FIFO) naturally!
	let ptr = 0;
	const initialLength = jobs.length;
	for (let i = 0; i < jobs.length; ++i) {
		const job = jobs[i];
		if ((i < initialLength || job.type === JobType.Immediate)
			&& !job.busy && !job.cancelled && (job.recurring || job.timer-- <= 0)
			&& !job.paused)
		{
			job.busy = true;
			Promise.resolve(job.callback())
				.then(() => {
					job.busy = false;
				})
				.catch(exception => {
					jobs.length = 0;
					throw exception;
				});
		}
		if (job.cancelled || (!job.recurring && job.timer < 0))
			continue;  // delete it
		jobs[ptr++] = job;
	}
	jobs.length = ptr;
}
