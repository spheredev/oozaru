/**
 *  kh2Bar JavaScript module for Sphere
 *  Kingdom Hearts-style HP gauges with multiple lifebars
 *  (c) 2013-2018 Bruce Pascoe
**/

import { Prim, Thread } from '../lib/sphere-runtime.js';

export
class HPGauge extends Thread
{
	constructor(x, y, width, height, options = {})
	{
		super(options);

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		// note: using chartreuse as the default color here isn't just me being
		//       a joker: the Kingdom Hearts games themselves actually use chartreuse
		//       for HP gauges, NOT pure green.  classy!
		this.capacity = options.capacity !== undefined ? options.capacity : 0;
		this.sectorSize = options.sectorSize !== undefined ? options.sectorSize : 100;
		this.maxSectors = options.maxSectors !== undefined ? options.maxSectors : 'auto';
		let color = options.color !== undefined ? options.color : Color.Chartreuse;

		this.borderColor = Color.Black.fadeTo(color.a);
		this.colorFadeDuration = 0;
		this.colorFadeTimer = 0;
		this.damage = 0;
		this.damageColor = Color.DarkRed.fadeTo(color.a);
		this.damageFadeness = 1.0;
		this.drainSpeed = 2.0;
		this.emptyColor = Color.of('#303030').fadeTo(color.a);
		this.fadeSpeed = 0.0;
		this.fadeness = 1.0;
		this.hpColor = color.clone();
		this.isVisible = true;
		this.maxSectors = this.maxSectors;
		this.newColor = color.clone();
		this.newReading = this.capacity;
		this.numCombosRunning = 0;
		this.oldColor = color.clone();
		this.oldReading = this.capacity;
		this.reading = this.capacity;
		this.sectorSize = this.sectorSize;

		this.start();
	}

	get inCombo()
	{
		return this.numCombosRunning > 0;
	}

	changeColor(color, numFrames = 0)
	{
		this.oldColor = this.hpColor.clone();
		this.newColor = color.clone();
		if (numFrames !== 0) {
			this.colorFadeDuration = numFrames;
			this.colorFadeTimer = 0;
		} else {
			this.hpColor = this.newColor;
		}
	}

	endCombo()
	{
		if (--this.numCombosRunning < 0)
			this.numCombosRunning = 0;
	}

	hide(duration = 0.0)
	{
		if (duration > 0.0) {
			this.fadeSpeed = 1.0 / duration * (1.0 - this.fadeness);
		} else {
			this.fadeSpeed = 0.0;
			this.fadeness = 1.0;
		}
	}

	set(value)
	{
		value = Math.min(Math.max(Math.round(value), 0), this.capacity);
		if (value !== this.reading) {
			if (this.numCombosRunning > 0)
				this.damage += this.newReading - value;
			else
				this.damage = this.reading - value;
			this.damageFadeness = 0.0;
			this.oldReading = this.reading;
			this.newReading = value;
			this.drainTimer = 0.0;
		}
	}

	show(duration = 0.0)
	{
		if (duration > 0.0) {
			this.fadeSpeed = 1.0 / duration * (0.0 - this.fadeness);
		} else {
			this.fadeSpeed = 0.0;
			this.fadeness = 0.0;
		}
	}

	startCombo()
	{
		++this.numCombosRunning;
	}

	on_render()
	{
		if (this.fadeness >= 1.0)
			return;  // invisible, skip rendering
		let damageShown = Math.max(this.damage - (this.reading - this.newReading), 0);
		let numReserves = Math.ceil(this.capacity / this.sectorSize - 1);
		let numReservesFilled = Math.max(Math.ceil(this.reading / this.sectorSize - 1), 0);
		let numReservesDamaged = Math.ceil((damageShown + this.reading) / this.sectorSize - 1);
		let barInUse;
		if (numReservesFilled === numReserves) {
			barInUse = this.capacity % this.sectorSize;
			if (barInUse === 0)
				barInUse = this.sectorSize;
		} else {
			barInUse = this.sectorSize;
		}
		let barFilled = this.reading % this.sectorSize;
		if (barFilled === 0 && this.reading > 0)
			barFilled = barInUse;
		let barDamaged = Math.min(damageShown, this.sectorSize - barFilled) * (1.0 - this.damageFadeness);
		let barHeight = Math.ceil(this.height * 0.5 + 0.5);
		let widthInUse = Math.round((this.width - 2) * barInUse / this.sectorSize);
		let fillWidth = Math.ceil(widthInUse * barFilled / barInUse);
		let damageWidth = Math.ceil(widthInUse * (barFilled + barDamaged) / barInUse) - fillWidth;
		let emptyWidth = widthInUse - (fillWidth + damageWidth);
		let borderColor = fadeColor(this.borderColor, this.fadeness);
		let fillColor = fadeColor(this.hpColor, this.fadeness);
		let emptyColor = fadeColor(this.emptyColor, this.fadeness);
		let usageColor = Color.mix(emptyColor, fadeColor(this.damageColor, this.fadeness), this.damageFadeness, 1.0 - this.damageFadeness);
		if (barInUse < this.sectorSize && numReservesFilled > 0) {
			Prim.drawRectangle(Surface.Screen, this.x, this.y, this.width, barHeight, 1, Color.mix(borderColor, Color.Transparent, 50, 50));
			drawSegment(this.x + 1, this.y + 1, this.width - 2, barHeight - 2, Color.mix(fillColor, Color.Transparent, 50, 50));
		}
		let barEdgeX = this.x + this.width - 1;
		Prim.drawRectangle(Surface.Screen, barEdgeX - widthInUse - 1, this.y, widthInUse + 2, barHeight, 1, borderColor);
		drawSegment(barEdgeX - fillWidth, this.y + 1, fillWidth, barHeight - 2, fillColor);
		Prim.drawSolidRectangle(Surface.Screen, barEdgeX - fillWidth - damageWidth, this.y + 1, damageWidth, barHeight - 2, usageColor);
		drawSegment(barEdgeX - fillWidth - damageWidth - emptyWidth, this.y + 1, emptyWidth, barHeight - 2, emptyColor);
		let slotYSize = this.height - barHeight + 1;
		let slotXSize = this.maxSectors === 'auto'
			? Math.round(slotYSize * 1.25)
			: Math.ceil(this.width / (this.maxSectors - 1));
		let slotX;
		let slotY = this.y + this.height - slotYSize;
		Prim.drawSolidRectangle(Surface.Screen, this.x + (this.width - slotXSize), slotY, slotXSize, slotYSize, borderColor);
		Prim.drawRectangle(Surface.Screen, this.x + (this.width - slotXSize) + 1, slotY + 1, slotXSize - 2, slotYSize - 2, 1, Color.Silver);
		for (let i = 0; i < numReserves; ++i) {
			let color;
			if (i < numReservesFilled)
				color = fillColor;
			else if (i < numReservesDamaged)
				color = usageColor;
			else
				color = emptyColor;
			slotX = this.x + (this.width - slotXSize) - (i + 1) * (slotXSize - 1);
			Prim.drawRectangle(Surface.Screen, slotX, slotY, slotXSize, slotYSize, 1, borderColor);
			if (color !== usageColor)
				drawSegment(slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
			else
				Prim.drawSolidRectangle(Surface.Screen, slotX + 1, slotY + 1, slotXSize - 2, slotYSize - 2, color);
		}
	}

	on_update()
	{
		++this.colorFadeTimer;
		if (this.colorFadeDuration !== 0 && this.colorFadeTimer < this.colorFadeDuration) {
			this.hpColor.r = tween(this.oldColor.r, this.colorFadeTimer, this.colorFadeDuration, this.newColor.r);
			this.hpColor.g = tween(this.oldColor.g, this.colorFadeTimer, this.colorFadeDuration, this.newColor.g);
			this.hpColor.b = tween(this.oldColor.b, this.colorFadeTimer, this.colorFadeDuration, this.newColor.b);
			this.hpColor.a = tween(this.oldColor.a, this.colorFadeTimer, this.colorFadeDuration, this.newColor.a);
		} else {
			this.hpColor = this.newColor;
			this.colorFadeDuration = 0;
		}
		this.fadeness = Math.min(Math.max(this.fadeness + this.fadeSpeed / Sphere.frameRate, 0.0), 1.0);
		this.drainTimer += this.drainSpeed / Sphere.frameRate;
		if (this.newReading !== this.reading && this.drainTimer < 0.25)
			this.reading = Math.round(tween(this.oldReading, this.drainTimer, 0.25, this.newReading));
		else
			this.reading = this.newReading;
		if (this.numCombosRunning <= 0 && this.reading === this.newReading) {
			this.damageFadeness += this.drainSpeed / Sphere.frameRate;
			if (this.damageFadeness >= 1.0) {
				this.damage = 0;
				this.damageFadeness = 1.0;
			}
		}
	}
}

function drawSegment(x, y, width, height, color)
{
	let topHeight = Math.ceil(height / 8);
	let bottomHeight = height - topHeight;
	let yBottom = y + topHeight;
	let dimColor = Color.mix(color, Color.Black.fadeTo(color.a), 66, 33);
	Prim.drawSolidRectangle(Surface.Screen, x, y, width, topHeight, dimColor, dimColor, color, color);
	Prim.drawSolidRectangle(Surface.Screen, x, yBottom, width, bottomHeight, color, color, dimColor, dimColor);
}

function fadeColor(color, fadeness)
{
	return color.fadeTo(1.0 - fadeness);
}

function tween(start, time, duration, end)
{
	return -(end - start) / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
}
