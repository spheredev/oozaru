/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { Prim, Scene } from 'sphere-runtime';

import { drawTextEx } from '../utilities.js';

export default
class MPGauge
{
	constructor(capacity, color = Color.DodgerBlue, font = Font.Default) {
		this.animation = null;
		this.capacity = capacity;
		this.color = color;
		this.reading = capacity;
		this.textFont = font;
		this.usage = 0;
		this.usageColor = Color.Transparent;
		this.value = capacity;
	}

	draw(x, y, size)
	{
		Surface.Screen.clipTo(x, y, size, size);
		if (this.capacity > 0) {
			let innerFillColor = this.color;
			let outerFillColor = Color.mix(this.color, Color.Black.fadeTo(this.color.a));
			let outerUsageColor = this.usageColor;
			let innerUsageColor = Color.mix(this.usageColor, Color.Black.fadeTo(this.usageColor.a));
			let maxRadius = Math.ceil(size * Math.sqrt(2) / 2);
			Prim.drawSolidCircle(Surface.Screen, x + size / 2, y + size / 2, maxRadius * Math.sqrt((this.reading + this.usage) / this.capacity), innerUsageColor, outerUsageColor);
			Prim.drawSolidCircle(Surface.Screen, x + size / 2, y + size / 2, maxRadius * Math.sqrt(this.reading / this.capacity), innerFillColor, outerFillColor);
			drawTextEx(this.textFont, x + size - 21, y + size / 2 - 8, Math.round(this.reading), Color.White, 1, 'right');
			drawTextEx(this.textFont, x + size - 20, y + size / 2 - 4, "MP", new Color(1, 0.75, 0), 1);
		}
		Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
	}

	set(value)
	{
		value = Math.min(Math.max(value, 0), this.capacity);
		if (value != this.value) {
			if (this.animation != null) {
				this.animation.stop();
			}
			this.animation = new Scene()
				.fork()
					.tween(this, 15, 'easeInOutSine', { usage: this.reading - value })
				.end()
				.fork()
					.tween(this, 15, 'easeInOutSine', { reading: value })
				.end()
				.tween(this.usageColor, 6, 'easeInOutSine', this.color)
				.tween(this.usageColor, 30, 'easeInOutSine', Color.Transparent);
			this.animation.run();
		}
		this.value = value;
	}

	update()
	{
		if (this.animation != null && !this.animation.running) {
			this.usage = 0;
		}
	}
}
