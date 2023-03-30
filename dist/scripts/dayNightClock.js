/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

// note: don't run more than one day/night clock at a time.  doing so will cause multiple
//       filters to be applied to the screen, which won't look too nice. :o)

import { Task } from 'sphere-runtime';

const
	DayMask      = [ 0.0, 0.0, 0.0, 0.0 ],
	TwilightMask = [ 0.5, 0.125, 0.0625, 0.625 ],
	NightMask    = [ 0.0, 0.0, 0.125, 0.5625 ];

const
	Day    = 0,
	Night  = 1,
	Fading = 2;

export default
class DayNightClock extends Task
{
	constructor()
	{
		super({ priority: 1 });

		this.start();
	}

	mixMasks(mask1, mask2, proportion1, proportion2)
	{
		this.currentMask[0] = mask1[0] * proportion1 + mask2[0] * proportion2;
		this.currentMask[1] = mask1[1] * proportion1 + mask2[1] * proportion2;
		this.currentMask[2] = mask1[2] * proportion1 + mask2[2] * proportion2;
		this.currentMask[3] = mask1[3] * proportion1 + mask2[3] * proportion2;
		this.shader.setFloatVector('tintColor', this.currentMask);
	}

	now()
	{
		const time = Math.floor((Date.now() - this.offset) * 0.001) % 86400;
		const currentTime = ((time * 10) % 86400);
		this.inGameTime.hour = Math.floor(currentTime / 3600);
		this.inGameTime.minute = Math.floor((currentTime / 60) % 60);
		this.inGameTime.second = currentTime % 60;
		return this.inGameTime;
	}

	async on_startUp()
	{
		let width = Surface.Screen.width;
		let height = Surface.Screen.height;
		let rectangle = new Shape(ShapeType.TriStrip,
			new VertexList([
				{ x: 0,     y: 0 },
				{ x: width, y: 0 },
				{ x: 0,     y: height },
				{ x: width, y: height },
			]));
		this.shader = await Shader.fromFiles({
			vertexFile:   'shaders/tintColor.vert.glsl',
			fragmentFile: 'shaders/tintColor.frag.glsl',
		});
		this.model = new Model([ rectangle ], this.shader);

		this.inGameTime = new InGameTime(0, 0, 0);
		this.offset = new Date().getTimezoneOffset() * 60 * 1000;
		this.state = Day;
		this.currentMask = [ 0.0, 0.0, 0.0, 0.0 ];

		console.log("initializing day/night clock", `time: ${this.now()}`);
	}

	on_render()
	{
		this.model.draw();
	}

	on_update()
	{
		let now = this.now();
		if (now.hour < 5 || now.hour >= 19) {
			if (this.state !== Night) {
				this.state = Night;
				this.shader.setFloatVector('tintColor', NightMask);
			}
		}
		else if (now.hour >= 7 && now.hour < 17) {
			if (this.state !== Day) {
				this.state = Day;
				this.shader.setFloatVector('tintColor', DayMask);
			}
		}
		else if (now.hour >= 5 && now.hour < 6) {
			this.state = Fading;
			let alpha = now.minute / 60;
			this.mixMasks(TwilightMask, NightMask, alpha, 1.0 - alpha);
		}
		else if (now.hour >= 6 && now.hour < 7) {
			this.state = Fading;
			let alpha = now.minute / 60;
			this.mixMasks(DayMask, TwilightMask, alpha, 1.0 - alpha);
		}
		else if (now.hour >= 17 && now.hour < 18) {
			this.state = Fading;
			let alpha = now.minute / 60;
			this.mixMasks(TwilightMask, DayMask, alpha, 1.0 - alpha);
		}
		else if (now.hour >= 18 && now.hour < 19) {
			this.state = Fading;
			let alpha = now.minute / 60;
			this.mixMasks(NightMask, TwilightMask, alpha, 1.0 - alpha);
		}
	}
}

export
class InGameTime
{
	constructor(hour, minute, second)
	{
		this.hour = hour;
		this.minute = minute;
		this.second = second;
	}

	toString()
	{
		let hourText = `0${this.hour}`.slice(-2);
		let minuteText = `0${this.minute}`.slice(-2);
		let secondText = `0${this.second}`.slice(-2);
		return `${hourText}:${minuteText}:${secondText}`;
	}
}
