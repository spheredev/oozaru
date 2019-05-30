/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Prim, Scene, Thread } from '../../lib/sphere-runtime.js';

import { drawTextEx } from '../utilities.js';

import BattleActor from './battleActor.js';
import BattleHUD from './battleHUD.js';

export default
class BattleScreen extends Thread
{
	constructor(partyMaxMP)
	{
		super();

		this.actorTypes = {
			enemy: { isEnemy: true },
			party: { isEnemy: false },
		};

		this.actors = {};
		for (const type in this.actorTypes)
			this.actors[type] = [];
		this.hud = new BattleHUD(partyMaxMP);

		this.startRunning = function()
		{
			console.log("activate main battle screen");
			this.start();
			this.hud.show();
		};
	}

	dispose()
	{
		this.hud.dispose();
		this.stop();
	}

	async announceAction(actionName, alignment, bannerColor = Color.Gray)
	{
		let announcement = {
			screen: this,
			text: actionName,
			alignment: alignment,
			color: bannerColor,
			font: Font.Default,
			fadeness: 1.0,
			render() {
				let width = this.font.widthOf(this.text) + 20;
				let height = this.font.height + 10;
				let x = (Surface.Screen.width - width) / 2;
				let y = 112;
				let textY = y + (height - this.font.height) / 2;
				let boxColor = this.color.fadeTo(1.0 - this.fadeness);
				Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, boxColor);
				Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.25 * (1.0 - this.fadeness)));
				drawTextEx(this.font, x + width / 2, textY, this.text, Color.White.fadeTo(1.0 - this.fadeness), 1, 'center');
			},
		};
		let job = Dispatch.onRender(() => announcement.render(), { priority: 10 });
		await new Scene()
			.tween(announcement, 7, 'easeInOutSine', { fadeness: 0.0 })
			.pause(46)
			.tween(announcement, 7, 'easeInOutSine', { fadeness: 1.0 })
			.run();
		job.cancel();
	}

	createActor(name, position, row, alignment, alreadyThere = false)
	{
		if (!(alignment in this.actorTypes))
			throw new Error(`invalid actor alignment '${alignment}'`);
		let isEnemy = this.actorTypes[alignment].isEnemy;
		let actor = new BattleActor(name, position, row, isEnemy, alreadyThere);
		this.actors[alignment].push(actor);
		return actor;
	}

	async fadeOut(duration)
	{
		if (Sphere.Game.disableAnimations) {
			this.dispose();
			return;
		}
		await new Scene()
			.fadeTo(Color.Black, duration)
			.call(() => this.dispose())
			.fadeTo(Color.Transparent, 0.5)
			.run();
	}

	async go(title = null)
	{
		this.title = title;
		await new Scene()
			.doIf(() => !Sphere.Game.disableAnimations)
				.fadeTo(Color.White, 15)
				.fadeTo(Color.Transparent, 30)
				.fadeTo(Color.White, 15)
			.end()
			.call(() => this.startRunning())
			.doIf(() => !Sphere.Game.disableAnimations)
				.fadeTo(Color.Transparent, 60)
			.end()
			.run();
	}

	async showTitle()
	{
		if (this.title === null || Sphere.Game.disableAnimations)
			return;
		await new Scene()
			.marquee(this.title, Color.Black.fadeTo(0.5))
			.run();
	}

	async on_startUp()
	{
		this.background = new Texture('images/battleBackground.png');
	}

	on_render()
	{
		Prim.blit(Surface.Screen, 0, -16, this.background);
		for (const type in this.actorTypes) {
			for (let i = 0; i < this.actors[type].length; ++i)
				this.actors[type][i].render();
		}
	}

	on_update()
	{
		for (const type in this.actorTypes) {
			for (let i = 0; i < this.actors[type].length; ++i)
				this.actors[type][i].update();
		}
	}
}
