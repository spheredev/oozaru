/**
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

export default
class EventLoop
{
	constructor()
	{
		this.frameCount = 0;
		this.jobQueue = [];
		this.rafID = 0;
	}

	addJob(type, callback, recurring = false, delay = 0)
	{
		this.jobQueue.push({ id: nextJobID, type, callback, recurring, timer: delay });
		return nextJobID++;
	}

	animate(timestamp)
	{
		this.rafID = requestAnimationFrame(t => this.animate(t));

		this.runJobs('update');
		galileo.Surface.Screen.activate();
		galileo.Prim.clear();
		this.runJobs('render');
		this.runJobs('immediate');
		++this.frameCount;
	}

	cancelJob(jobID)
	{
		let ptr = 0;
		for (let i = 0, len = this.jobQueue.length; i < len; ++i) {
			const job = this.jobQueue[i];
			if (job.id === jobID)
				continue;  // delete
			this.jobQueue[ptr++] = job;
		}
		this.jobQueue.length = ptr;
	}

	now()
	{
		return this.frameCount;
	}

	runJobs(type)
	{
		for (let i = 0; i < this.jobQueue.length; ++i) {
			const job = this.jobQueue[i];
			if (job.type === type && (job.recurring || job.timer-- <= 0))
				job.callback.call(undefined);
		}
		let ptr = 0;
		for (let i = 0, len = this.jobQueue.length; i < len; ++i) {
			const job = this.jobQueue[i];
			if (!job.recurring && job.timer < 0)
				continue;  // delete
			this.jobQueue[ptr++] = job;
		}
		this.jobQueue.length = ptr;
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
		this.rafID = 0;
	}
}
