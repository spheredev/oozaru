/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Prim, Scene, Thread } from '../lib/sphere-runtime.js';

export default
class AutoColorMask extends Thread
{
	constructor(initialMask = Color.Transparent)
	{
		super({ priority: Infinity });

		this.mask = initialMask;
		this.scene = null;

		this.start();
	}

	on_render()
	{
		Prim.fill(Surface.Screen, this.mask);
	}

	async fadeTo(newMask, numFrames = 60)
	{
		if (!(newMask instanceof Color))
			throw new TypeError(`'newMask' must be a Color object`);

		if (this.scene !== null)
			this.scene.stop();
		this.scene = new Scene()
			.tween(this.mask, numFrames, 'linear', newMask);
		await this.scene.run();
	}
}
