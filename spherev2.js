// Oozaru: Sphere v2 for the Web
// a lightweight JavaScript-powered game engine
// (c) 2016 Fat Cerberus

var g_screen = document.getElementById('screen').getContext('2d');
var g_frameRate = 60;
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
};

// Sphere v2 `system` object
global.system =
{
	name: "Oozaru",
	version: "X.X.X",
	apiVersion: 2,
	apiLevel: 0,
	extensions: [],

	now: function() {
		return g_counter;
	},
};

global.prim =
{
	rect: function(surface, x, y, w, h, color)
	{
		g_screen.fillStyle = "dodgerblue";
		g_screen.fillRect(x, y, w, h);
	}
};

global.Color = {};

// Sphere v2 Dispatch API
global.Dispatch =
{
	onRender: function(fn, priority)
	{
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

	onUpdate: function(fn, priority)
	{
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

requestAnimationFrame(doFrame);
function doFrame(time)
{
	requestAnimationFrame(doFrame);

    g_screen.fillStyle = "black";
    g_screen.fillRect(0, 0, 320, 240);
    for (let job of g_renderJobs)
		job.handler.call(undefined);

	for (let job of g_updateJobs)
		job.handler.call(undefined);
	
	++g_counter;
}

require('./game/main');
