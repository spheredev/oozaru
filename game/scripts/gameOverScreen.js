/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Music, Prim, Scene, Thread } from '/game/lib/sphere-runtime.js';

import MenuStrip from './menuStrip.js';

export default
class GameOverScreen extends Thread
{
	constructor()
	{
		super();
	}

	show()
	{
		this.action = null;
		this.mode = 'transitionIn';
		if (Sphere.Game.disableAnimations)
			this.fadeness = 0.0;
		Music.play(null);
		this.transition = new Scene()
			.pushBGM('gameOver')
			.adjustBGM(1.0)
			.tween(this, 300, 'linear', { fadeness: 0.0 });
		this.transition.run();
		this.start();
		return this;
	}

	async on_startUp()
	{
		this.image = await Texture.fromFile('images/gameOverScreen.png');
		this.fadeness = 1.0;
		this.transition = null;
	}

	on_render()
	{
		Prim.blit(Surface.Screen, 0, 0, this.image);
		Prim.fill(Surface.Screen, Color.Black.fadeTo(this.fadeness));
	}

	async on_update()
	{
		switch (this.mode) {
			case 'idle':
				break;
			case 'transitionIn':
				if (!this.transition.running) {
					this.mode = 'idle';
					let menu = new MenuStrip("Game Over", false);
					menu.addItem("Retry Battle", GameOverAction.Retry);
					menu.addItem("Give Up", GameOverAction.Quit);
					this.action = await menu.run();
					if (Sphere.Game.disableAnimations)
						this.fadeness = 1.0;
					this.transition = new Scene()
						.fork()
							.adjustBGM(0.0, 120)
						.end()
						.tween(this, 120, 'linear', { fadeness: 1.0 });
					this.transition.run();
					this.mode = 'transitionOut';
				}
				break;
			case 'transitionOut':
				if (!this.transition.running) {
					Music.pop();
					Music.adjustVolume(1.0);
					this.stop();
				}
				break;
		}
	}
}

export
const GameOverAction =
{
	Retry: 1,
	Quit:  2,
};
