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

import * as galileo from './galileo';
import * as util from './utility';

interface Job
{
	jobID: number;
	type: JobType;
	callback: () => void;
	cancelled: boolean,
	priority: number;
	recurring: boolean;
	running: boolean;
	timer: number;
}

export
enum JobType
{
	Immediate,
	Render,
	Update,
}

let nextJobID = 1;

export default
class JobQueue
{
	private frameCount = -1;
	private jobs: Job[] = [];
	private rafCallback = this.animate.bind(this);
	private rafID = 0;
	private sortNeeded = false;

	add(type: JobType, callback: () => void, recurring?: false, delay?: number): number;
	add(type: JobType, callback: () => void, recurring: true, priority?: number): number;
	add(type: JobType, callback: () => void, recurring = false, delayOrPriority = 0)
	{
		const timer = !recurring ? delayOrPriority : 0;
		let priority = recurring ? delayOrPriority : 0.0;

		// note: priority is inverted for render jobs so that the highest-priority render
		//       gets done last ("painter's algorithm").
		if (type === JobType.Render)
			priority = -(priority);

		this.jobs.push({
			jobID: nextJobID,
			type,
			callback,
			cancelled: false,
			priority,
			recurring,
			running: false,
			timer,
		});
		this.sortNeeded = true;
		return nextJobID++;
	}

	cancel(jobID: number)
	{
		for (let i = 0, len = this.jobs.length; i < len; ++i) {
			const job = this.jobs[i];
			if (job.jobID === jobID)
				job.cancelled = true;
		}
	}

	now()
	{
		return Math.max(this.frameCount, 0);
	}

	start()
	{
		if (this.rafID !== 0)  // already running?
			return;

		this.rafID = requestAnimationFrame(this.rafCallback);
	}

	stop()
	{
		if (this.rafID !== 0)
			cancelAnimationFrame(this.rafID);
		this.frameCount = 0;
		this.jobs.length = 0;
		this.rafID = 0;
	}

	private animate(_timestamp: number)
	{
		this.rafID = requestAnimationFrame(this.rafCallback);

		++this.frameCount;
		galileo.DrawTarget.Screen.activate();
		galileo.DrawTarget.Screen.unclip();
		galileo.Prim.clear();
		this.runJobs(JobType.Render);
		this.runJobs(JobType.Update);
		this.runJobs(JobType.Immediate);
	}

	private runJobs(type: JobType)
	{
		if (this.sortNeeded) {
			this.jobs.sort((a, b) => {
				const delta = b.priority - a.priority;
				const fifoDelta = a.jobID - b.jobID;
				return delta !== 0 ? delta : fifoDelta;
			});
			this.sortNeeded = false;
		}
		for (const job of this.jobs) {
			if (job.type === type && !job.running && (job.recurring || job.timer-- <= 0)) {
				job.running = true;
				util.promiseTry(job.callback).then(() => {
					job.running = false;
				});
			}
		}
		let ptr = 0;
		for (let i = 0, len = this.jobs.length; i < len; ++i) {
			const job = this.jobs[i];
			if ((!job.recurring && job.timer < 0) || job.cancelled)
				continue;  // delete
			this.jobs[ptr++] = job;
		}
		this.jobs.length = ptr;
	}
}