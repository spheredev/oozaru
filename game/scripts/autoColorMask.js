/*
 *  OFF: Puppetmaster  (c) 2018 Fat Cerberus
 *  based on OFF by Mortis Ghost  (c) 2008
 */

import { Prim, Scene, Thread } from '/game/lib/sphere-runtime.js';

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
