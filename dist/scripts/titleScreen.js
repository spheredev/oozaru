/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { Music, Prim, Scene, Task } from 'sphere-runtime';

import MenuStrip from './menuStrip.js';

export default
class TitleScreen extends Task
{
	constructor(fileName = '@/data/titleScreen.json')
	{
		super();

		console.log(`initializing titlescreen`, `file: '${fileName}'`);

		this.fileName = fileName;
		this.start();
	}

	async run(showLogos = true)
	{
	    this.data = Sphere.APILevel >= 4
			? await File.load(this.fileName, DataType.JSON)
			: FS.readFile(this.fileName, DataType.JSON);
		this.fadeAlpha = 0.0;
		this.fadeTime = this.data.titleFadeFrames;
		this.menu = new MenuStrip(this.data.menuText, false, [ "fight RSB", "exit" ]);
		this.texture = await Texture.fromFile(this.data.titleScreen);
		this.splashes = [];
		for (const splash of this.data.splashScreens) {
			console.log(`splash '${splash.fileName}'`, `hold: ${splash.holdFrames}f`);
			let texture = await Texture.fromFile(splash.fileName);
			let thread = new SplashThread(texture, this.data.splashFadeFrames, splash.holdFrames);
			this.splashes.push({ thread });
		}

		if (this.data.musicOverSplash)
			Music.play(this.data.music);
		if (showLogos) {
			for (const splash of this.splashes) {
				splash.thread.start();
				await Task.join(splash.thread);
			}
		}
		if (!this.data.musicOverSplash)
			Music.play(this.data.music);
		await new Scene()
			.tween(this, this.fadeTime, 'linear', { fadeAlpha: 1.0 })
			.run();
		await this.menu.run();
		await new Scene()
			.doIf(() => !this.data.persistBGM)
				.fork()
					.adjustBGM(0.0, this.fadeTime)
					.changeBGM(null)
				.end()
			.end()
			.tween(this, this.fadeTime, 'linear', { fadeAlpha: 0.0 })
			.resync()
			.adjustBGM(1.0)
			.run();
	}

	on_startUp()
	{
		this.fadeAlpha = 0.0;
	}

	on_render()
	{
		let fadeMask = Color.White.fadeTo(this.fadeAlpha);
		Prim.blit(Surface.Screen, 0, 0, this.texture, fadeMask);
	}
}

class SplashThread extends Task
{
	constructor(texture, fadeTime, holdTime)
	{
		super();

		this.fadeStep = 1.0 / fadeTime;
		this.holdTime = holdTime;
		this.texture = texture;
		this.x = Math.trunc((Surface.Screen.width - texture.width) / 2);
		this.y = Math.trunc((Surface.Screen.height - texture.height) / 2);
	}

	on_startUp()
	{
		this.fadeAlpha = 0.0;
		this.fadeMask = Color.White.fadeTo(0.0);
	}

	on_render()
	{
		const x = (Surface.Screen.width - this.texture.width) / 2;
		const y = (Surface.Screen.height - this.texture.height) / 2;
		Prim.blit(Surface.Screen, x, y, this.texture, this.fadeMask);
	}

	async on_update()
	{
		this.fadeAlpha = Math.min(Math.max(this.fadeAlpha + this.fadeStep, 0.0), 1.0);
		this.fadeMask = Color.White.fadeTo(this.fadeAlpha);
		if (this.fadeAlpha >= 1.0) {
			await Sphere.sleep(this.holdTime);
			this.fadeStep = -(this.fadeStep);
		}
		else if (this.fadeAlpha <= 0.0) {
			this.stop();
		}
	}
}
