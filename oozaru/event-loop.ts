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

let
	nextJobID = 1;

export enum JobType {
	update,
	render,
	immediate
}

type Job = {
	id : number,
	type : JobType,
	callback : () => any,
	recurring : boolean,
	timer : number
}

export default
class EventLoop
{
	frameCount: number;
	jobQueue: any[];
	rafID: number;
	constructor()
	{
		this.frameCount = 0;
		this.jobQueue = [];
		this.rafID = 0;
	}

	addJob(type : JobType, callback : () => any, recurring = false, delay = 0)
	{
		this.jobQueue.push(<Job>{ id: nextJobID, type, callback, recurring, timer: delay });
		return nextJobID++;
	}

	animate(id: number)
	{
		this.rafID = requestAnimationFrame(t => this.animate(t));

		this.runJobs(JobType.update);
		galileo.Surface.Screen.activate();
		galileo.Prim.clear();
		this.runJobs(JobType.render);
		this.runJobs(JobType.immediate);
		++this.frameCount;
	}

	cancelJob(jobID : number)
	{
		this.jobQueue.some ((job : Job, index, queue) => {
			if (job.id === jobID) {
				queue.splice(index, 1);
				return true;
			}
			return false;
		});
	}

	now()
	{
		return this.frameCount;
	}

	runJobs(type : JobType)
	{
		const removals : number[] = [];
		const queue = this.jobQueue;
		queue.forEach ((job : Job, index) => {
			if (job.type === type) {
				if (job.recurring || job.timer-- <= 0) {
					job.callback.call(undefined);
					if (!job.recurring) {
						removals.push(index);
					}
				}
			}
		});

		removals.reverse().forEach((index) =>{
			queue.splice(index, 1);
		})
	}

	start()
	{
		this.rafID = requestAnimationFrame(t => this.animate(t));
	}

	stop()
	{
		if (this.rafID !== 0)
			cancelAnimationFrame(this.rafID);
		this.frameCount = 0;
		this.jobQueue.length = 0;
		this.rafID = -1;
	}
}
