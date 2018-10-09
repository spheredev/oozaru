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

let
	s_eventLoop;

export
function initialize(global, eventLoop)
{
	s_eventLoop = eventLoop;
	Object.assign(global, {
		Sphere,
		Dispatch,
	});
}

class Sphere
{
	static get Engine()
	{
		return "Oozaru X.X.X";
	}

	static now()
	{
		return s_eventLoop.now();
	}
}

class Dispatch
{
	static now(callback)
	{
		let jobID = s_eventLoop.addJob('immediate', callback, false);
		return new JobToken(jobID);
	}

	static onRender(callback)
	{
		let jobID = s_eventLoop.addJob('render', callback, true);
		return new JobToken(jobID);
	}

	static onUpdate(callback)
	{
		let jobID = s_eventLoop.addJob('update', callback, true);
		return new JobToken(jobID);
	}
}

class JobToken
{
	constructor(jobID)
	{
		this.jobID = jobID;
	}

	cancel()
	{
		s_eventLoop.cancelJob(this.jobID);
	}
}