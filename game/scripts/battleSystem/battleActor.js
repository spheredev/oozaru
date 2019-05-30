/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Scene } from '../../lib/sphere-runtime.js';

import { drawTextEx, range } from '../utilities.js';

import SpriteImage from './spriteImage.js';

export default
class BattleActor
{
	constructor(name, position, row, isEnemy)
	{
		this.damages = [];
		this.fadeScene = null;
		this.hasEntered = false;
		this.healings = [];
		this.isEnemy = isEnemy;
		this.isVisible = true;
		this.messageFont = Font.Default;
		this.name = name;
		this.opacity = 1.0;
		this.position = isEnemy ? position : 2 - position;
		this.row = row;
		this.spriteFileName = `spritesets/battlers/${name}.rss`;
		this.x = isEnemy ? -32 : 320;
		this.y = 168 - position * 32;
	}

	async initialize()
	{
		this.sprite = await SpriteImage.fromFile(this.spriteFileName);
		this.sprite.pose = this.isEnemy ? 'east' : 'west';
	}

	update()
	{
		this.sprite.update();
		for (let i = 0; i < this.damages.length; ++i) {
			let data = this.damages[i];
			let finalY = 20 - 11 * i;
			if (data.finalY != finalY) {
				data.scene.stop();
				data.finalY = finalY;
				let tweenInfo = {};
				for (let i2 = 0; i2 < data.text.length; ++i2) {
					let yName = `y${i2.toString()}`;
					tweenInfo[yName] = finalY;
				}
				data.scene = new Scene()
					.tween(data, 30, 'easeOutBounce', tweenInfo)
					.pause(15);
				data.scene.run();
			}
			if (!data.scene.running) {
				this.damages.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.healings.length; ++i) {
			if (!this.healings[i].scene.running) {
				this.healings.splice(i, 1);
				--i;
			}
		}
		return true;
	}

	render()
	{
		if (!this.isVisible && this.damages.length == 0 && this.healings.length == 0)
			return;
		this.sprite.blit(this.x, this.y, this.opacity);
		for (let i = 0; i < this.damages.length; ++i) {
			let text = this.damages[i].text;
			let x = this.x + 16 - this.messageFont.widthOf(text) / 2;
			for (let i2 = 0; i2 < text.length; ++i2) {
				let yName = 'y' + i2.toString();
				let y = this.y + this.damages[i][yName];
				let color = this.damages[i].color !== null
					? this.damages[i].color : Color.White;
				drawTextEx(this.messageFont, x, y, text[i2], color, 1);
				x += this.messageFont.widthOf(text[i2]);
			}
		}
		for (let i = 0; i < this.healings.length; ++i) {
			let y = this.y + this.healings[i].y;
			let color = this.healings[i].color !== null
				? this.healings[i].color : Color.GreenYellow;
			let textColor = color.fadeTo(this.healings[i].alpha);
			drawTextEx(this.messageFont, this.x + 16, y, this.healings[i].amount, textColor, 1, 'center');
		}
	}

	async animate(animationID)
	{
		// TODO: implement me!
		switch (animationID) {
			case 'die':
				this.sprite.pose = 'north';
				new Scene()
					.tween(this, 60, 'easeInOutSine', { opacity: 0.1 })
					.run();
				break;
			case 'hippo':
				this.sprite = new SpriteImage('battlers/maggie_hippo.rss');
				this.sprite.pose = this.isEnemy ? 'east' : 'west';
				break;
			case 'revive':
				new Scene()
					.tween(this, 60, 'easeInOutSine', { opacity: 1.0 })
					.call(() => { this.sprite.pose = this.isEnemy ? 'east' : 'west'; })
					.run();
				break;
			case 'sleep':
				await new Scene()
					.talk("maggie", 2.0, this.name + " fell asleep! Hey, does that mean I get to eat him now?")
					.run();
				break;
		}
	}

	async enter(isImmediate = false)
	{
		if (this.hasEntered)
			return;
		let newX = this.isEnemy ? 64 - this.row * 32 : 224 + this.row * 32;
		if (!isImmediate) {
			await new Scene()
				.tween(this, 90, 'linear', { x: newX })
				.run();
		}
		else {
			this.x = newX;
		}
		this.sprite.stop();
		this.hasEntered = true;
	}

	showDamage(amount, color = null)
	{
		let finalY = 20 - 11 * this.damages.length;
		let data = { text: amount.toString(), color: color, finalY: finalY };
		let tweenInfo = {};
		let indices = from(range(0, data.text.length - 1))
			.shuffle().toArray();
		for (let i = 0; i < data.text.length; ++i) {
			let yName = `y${i}`;
			data[yName] = finalY - (20 - indices[i] * 5);
			tweenInfo[yName] = finalY;
		}
		data.scene = new Scene()
			.tween(data, 30, 'easeOutBounce', tweenInfo)
			.pause(15);
		data.scene.run();
		this.damages.push(data);
	}

	showHealing(amount, color = null)
	{
		let data = { amount: amount, color: color, y: 20, alpha: 1.0 };
		data.scene = new Scene()
			.tween(data, 60, 'easeOutExpo', { y: -11 * this.healings.length })
			.tween(data, 30, 'easeInOutSine', { alpha: 0.0 });
		data.scene.run();
		this.healings.push(data);
	}
}
