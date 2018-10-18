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

import * as galileo from './galileo.js';

let nextJobID = 1;


export enum JobType {
	Update,
	Render,
	Immediate
}

type Job = {
	id: number,
	type : JobType,
	callback : () => any,
	recurring : boolean,
	timer: number
}

export default
class EventLoop
{
	zit : {
		frameCount : number,
		jobQueue : Job[],
		rafID : number
	} = {
		frameCount : 0,
		jobQueue : [],
		rafID : 0
	}

	addJob(type: JobType, callback : () => any, recurring = false, delay = 0)
	{
		this.zit.jobQueue.push({ id: nextJobID, type, callback, recurring, timer: delay });
		return nextJobID++;
	}

	animate(timestamp : number)
	{
		this.zit.rafID = requestAnimationFrame(t => this.animate(t));

		this.runJobs(JobType.Update);
		galileo.Surface.Screen.activate();
		galileo.Prim.clear();
		this.runJobs(JobType.Render);
		this.runJobs(JobType.Immediate);
		++this.zit.frameCount;
	}

	cancelJob(jobID : number)
	{
		let ptr = 0;
		for (let i = 0, len = this.zit.jobQueue.length; i < len; ++i) {
			const job = this.zit.jobQueue[i];
			if (job.id === jobID)
				continue;  // delete
			this.zit.jobQueue[ptr++] = job;
		}
		this.zit.jobQueue.length = ptr;
	}

	now()
	{
		return this.zit.frameCount;
	}

	runJobs(type : JobType)
	{
		for (let i = 0; i < this.zit.jobQueue.length; ++i) {
			const job = this.zit.jobQueue[i];
			if (job.type === type && (job.recurring || job.timer-- <= 0))
				job.callback.call(undefined);
		}
		let ptr = 0;
		for (let i = 0, len = this.zit.jobQueue.length; i < len; ++i) {
			const job = this.zit.jobQueue[i];
			if (!job.recurring && job.timer < 0)
				continue;  // delete
			this.zit.jobQueue[ptr++] = job;
		}
		this.zit.jobQueue.length = ptr;
	}

	start()
	{
		this.zit.rafID = requestAnimationFrame(t => this.animate(t));
	}

	stop()
	{
		if (this.zit.rafID !== 0)
			cancelAnimationFrame(this.zit.rafID);
		this.zit.frameCount = 0;
		this.zit.jobQueue.length = 0;
		this.zit.rafID = 0;
	}
}
