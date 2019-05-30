/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Prim, Scene, Thread } from '../lib/sphere-runtime.js';

export default
class MenuStrip extends Thread
{
	constructor(title = "", canCancel = true, items = null)
	{
		super({ priority: 100 });

		this.carousel = null;
		this.font = Font.Default;
		this.canCancel = canCancel;
		this.menuItems = [];
		this.selectedItem = 0;
		this.title = title;
		if (items !== null) {
			for (const item of items)
				this.addItem(item);
		}
	}

	addItem(text, tag = text)
	{
		this.menuItems.push({ text, tag });
		return this;
	}

	async run()
	{
		this.openness = 0.0;
		this.scrollDirection = 0;
		this.scrollProgress = 0.0;
		this.brightness = 0.0;
		this.mode = "open";
		let carouselWidth = from(this.menuItems)
			.select(it => this.font.widthOf(it.text) + 10)
			.reduce((a, v) => Math.max(a, v), 0);
		this.carousel = new Surface(carouselWidth, this.font.height + 10);
		Keyboard.Default.clearQueue();
		this.start();
		this.takeFocus();
		this.animation = new Scene()
			.tween(this, 15, 'easeOutQuad', { openness: 1.0 });
		this.animation.run();
		await Thread.join(this);
		return this.chosenItem !== null
			? this.menuItems[this.chosenItem].tag
			: null;
	}

	on_inputCheck()
	{
		if (this.mode != 'idle')
			return;

		let key = Keyboard.Default.getKey();
		if (key == Key.Z) {
			this.chosenItem = this.selectedItem;
			this.animation = new Scene()
				.fork()
					.tween(this, 7, 'easeInOutSine', { brightness: 1.0 })
					.tween(this, 7, 'easeInOutSine', { brightness: 0.0 })
				.end()
				.tween(this, 15, 'easeInQuad', { openness: 0.0 });
			this.animation.run();
			this.mode = 'close';
		}
		else if (key == Key.X && this.canCancel) {
			this.chosenItem = null;
			this.animation = new Scene()
				.tween(this, 15, 'easeInQuad', { openness: 0.0 });
			this.animation.run();
			this.mode = 'close';
		}
		else if (key == Key.Left) {
			this.scrollDirection = -1;
			this.animation = new Scene()
				.tween(this, 15, 'linear', { scrollProgress: 1.0 });
			this.animation.run();
			this.mode = 'changeItem';
		}
		else if (key == Key.Right) {
			this.scrollDirection = 1;
			this.animation = new Scene()
				.tween(this, 15, 'linear', { scrollProgress: 1.0 });
			this.animation.run();
			this.mode = 'changeItem';
		}
	}

	on_render()
	{
		let height = this.font.height + 10;
		let menuY = Surface.Screen.height - height * this.openness;
		let normalStripColor = Color.Black.fadeTo(0.75 * this.openness);
		let litStripColor = Color.White.fadeTo(0.75 * this.openness);
		let stripColor = Color.mix(litStripColor, normalStripColor, this.brightness, 1.0 - this.brightness);
		Prim.drawSolidRectangle(Surface.Screen, 0, menuY, Surface.Screen.width, height, stripColor);
		let normalTitleColor = Color.of('#404040').fadeTo(this.openness);
		let litTitleColor = Color.Black.fadeTo(this.openness);
		let titleColor = Color.mix(litTitleColor, normalTitleColor, this.brightness, 1.0 - this.brightness);
		this.font.drawText(Surface.Screen, 6, menuY + 6, this.title, Color.Black.fadeTo(this.openness));
		this.font.drawText(Surface.Screen, 5, menuY + 5, this.title, titleColor);
		this.carousel.blendOp = BlendOp.Replace;
		Prim.drawSolidRectangle(this.carousel, 0, 0, this.carousel.width, this.carousel.height, Color.Transparent);
		this.carousel.blendOp = BlendOp.Default;
		let xOffset = (this.selectedItem + this.scrollProgress * this.scrollDirection) * this.carousel.width;
		let normalItemColor = Color.Orange.fadeTo(this.openness);
		let litItemColor = Color.of('#808040').fadeTo(this.openness);
		let itemColor = Color.mix(litItemColor, normalItemColor, this.brightness, 1.0 - this.brightness);
		for (let i = -1; i <= this.menuItems.length; ++i) {
			let itemIndex = i;
			if (i >= this.menuItems.length)
				itemIndex = i % this.menuItems.length;
			else if (i < 0)
				itemIndex = this.menuItems.length - 1 - Math.abs(i + 1) % this.menuItems.length;
			let itemText = this.menuItems[itemIndex].text;
			let textX = i * this.carousel.width + (this.carousel.width / 2 - this.font.widthOf(itemText) / 2);
			this.font.drawText(this.carousel, textX - xOffset + 1, 6, itemText, Color.Black.fadeTo(this.openness));
			this.font.drawText(this.carousel, textX - xOffset, 5, itemText, itemColor);
		}
		let carouselX = Surface.Screen.width - 5 - this.carousel.width - this.font.widthOf(">") - 5;
		Prim.blit(Surface.Screen, carouselX, menuY, this.carousel);
		this.font.drawText(Surface.Screen, carouselX - this.font.widthOf("<") - 5, menuY + 5, "<",
			Color.Gray.fadeTo(this.openness));
		if (this.scrollDirection == -1) {
			this.font.drawText(Surface.Screen, carouselX - this.font.widthOf("<") - 5, menuY + 5, "<",
				Color.Orange.fadeTo(this.openness * (1.0 - this.scrollProgress)));
		}
		this.font.drawText(Surface.Screen, carouselX + this.carousel.width + 5, menuY + 5, ">",
			Color.Gray.fadeTo(this.openness));
		if (this.scrollDirection == 1) {
			this.font.drawText(Surface.Screen, carouselX + this.carousel.width + 5, menuY + 5, ">",
				Color.Orange.fadeTo(this.openness * (1.0 - this.scrollProgress)));
		}
	}

	on_update()
	{
		switch (this.mode) {
			case 'open':
				if (!this.animation.running)
					this.mode = "idle";
				break;
			case 'changeItem':
				if (!this.animation.running) {
					let newSelection = this.selectedItem + this.scrollDirection;
					if (newSelection < 0)
						newSelection = this.menuItems.length - 1;
					else if (newSelection >= this.menuItems.length)
						newSelection = 0;
					this.selectedItem = newSelection;
					this.scrollDirection = 0;
					this.scrollProgress = 0.0;
					this.mode = "idle";
				}
				break;
			case 'close':
				if (!this.animation.running)
					this.stop();
				break;
		}
	}
}
