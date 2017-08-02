// Oozaru: Sphere v2 for the Web
// a lightweight JavaScript-powered game engine
// (c) 2016-2017 Fat Cerberus

var g_screen = document.getElementById('screen').getContext('2d');
var g_frameRate = 60;
var g_laterJobs = [];
var g_renderJobs = [];
var g_updateJobs = [];
var g_counter = 0;

window.global = window;

// `screen object
global.screen =
{
	get frameRate() {
		return g_frameRate;
	},
	set frameRate(value) {
		g_frameRate = value;
	},
	
	now() {
		return g_counter;
	},
};

// Sphere v2 `system` object
global.Sphere =
{
	Platform: "Oozaru X.X.X",
	Version: 2,
	APILevel: 0,
};

global.Prim =
{
	drawRectangle: function(surface, x, y, w, h, color)
	{
		g_screen.fillStyle = "dodgerblue";
		g_screen.fillRect(x, y, w, h);
	}
};

global.Color = {};

// Sphere v2 Dispatch API
global.Dispatch =
{
	cancel: function(token)
	{
		const from = require('from');

		var jobList;
		switch (token.type) {
			case 'now':
				clearTimeout(token.id);
				return;
			case 'later':
				jobList = g_laterJobs;
				break;
			case 'onRender':
				jobList = g_renderJobs;
				break;
			case 'onUpdate':
				jobList = g_updateJobs;
				break;
		}
		from(jobList)
			.where(it => it == token)
			.remove();
	},
	
	later: function(fn, numFrames)
	{
		var job = {
			type: 'later',
			framesLeft: numFrames,
			handler: fn,
		};
		g_laterJobs.push(job);
		return job;
	},
	
	now: function(fn)
	{
		var job = {
			type: 'now',
			id: setTimeout(fn, 0),
		};
		return job;
	},
	
	onRender: function(fn, priority)
	{
		priority = priority || 0.0;

		var job = {
			type: 'onRender',
			priority: priority,
			handler: fn,
		};
		g_renderJobs.push(job);
		g_renderJobs.sort((a, b) => a.priority - b.priority);
		return job;
	},

	onUpdate: function(fn, priority)
	{
		priority = priority || 0.0;

		var job = {
			type: 'onUpdate',
			priority: priority,
			handler: fn,
		};
		g_updateJobs.push(job);
		g_updateJobs.sort((b, a) => a.priority - b.priority);
		return job;
	},
};

requestAnimationFrame(doFrame);
function doFrame(time)
{
	const from = require('from');

	requestAnimationFrame(doFrame);

	from(g_laterJobs)
		.where(it => it.framesLeft-- == 0)
		.besides(it => it.handler.call(undefined))
		.remove();

	g_screen.fillStyle = "black";
	g_screen.fillRect(0, 0, 320, 240);
	for (let job of g_renderJobs)
		job.handler.call(undefined);

	for (let job of g_updateJobs)
		job.handler.call(undefined);
	
	++g_counter;
}

require('./game/main');
