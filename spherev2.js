// Oozaru: Sphere v2 for the Web
// a lightweight JavaScript-powered game engine
// (c) 2016 Fat Cerberus

'use strict';

var g_screen = document.getElementById('screen').getContext('2d');
var g_renderJobs = [];
var g_updateJobs = [];
var g_now = 0;

requestAnimationFrame(doFrame);

// Sphere v2 `system` object
window.system =
{
	name: "Oozaru",
	version: "X.X.X",
	apiVersion: 2,
	apiLevel: 0,
	extensions: [],

	now: function() {
		return g_now;
	},
};

// Sphere v2 Dispatch API
window.Dispatch =
{
	onRender: function(fn, priority) {
		priority = priority || 0.0;

		let job = {
			token: {},
			priority: priority,
			handler: fn,
		};
		g_renderJobs.push(job);
		g_renderJobs.sort((a, b) => a.priority - b.priority);
		return job.token;
	},
	onUpdate: function(fn, priority) {
		priority = priority || 0.0;

		let job = {
			token: {},
			priority: priority,
			handler: fn,
		};
		g_updateJobs.push(job);
		g_updateJobs.sort((b, a) => a.priority - b.priority);
		return job.token;
	},
};

function doFrame(time)
{
	requestAnimationFrame(doFrame);

    g_screen.fillStyle = "black";
    g_screen.fillRect(0, 0, 320, 240);
    for (let job of g_renderJobs)
		job.handler.call(undefined);

	for (let job of g_updateJobs)
		job.handler.call(undefined);
	
	++g_now;
}
