/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { Prim, Scene, Thread } from 'sphere-runtime';

import { Game } from '../gameDef/index.js';
import { drawTextEx } from '../utilities.js';

import HPGauge from './hpGauge.js';
import MPGauge from './mpGauge.js';
import TurnPreview from './turnPreview.js';

export default
class BattleHUD extends Thread
{
	constructor(partyMaxMP)
	{
		super({ priority: 20 });

		this.enemyHPGaugeColor = Color.White;
		this.partyHPGaugeColor = Color.Chartreuse;
		this.partyHighlightColor = Color.MidnightBlue;
		this.partyMPGaugeColor = Color.DarkOrchid;

		this.fadeness = 0.0;
		this.font = Font.Default;
		this.highlightColor = Color.Transparent;
		this.highlightedUnit = null;
		this.hpGaugesInfo = [];
		this.mpGauge = new MPGauge(partyMaxMP, this.partyMPGaugeColor);
		this.partyInfo = [ null, null, null ];
		this.turnPreview = new TurnPreview();

		this.drawElementBox = function(x, y, width, height)
		{
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, Color.Black.fadeTo(0.75));
			Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.125));
		};

		this.drawHighlight = function(x, y, width, height, color)
		{
			let outerColor = color;
			let innerColor = Color.mix(outerColor, Color.Black.fadeTo(color.a));
			let halfHeight = Math.round(height / 2);
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, halfHeight, outerColor, outerColor, innerColor, innerColor);
			Prim.drawSolidRectangle(Surface.Screen, x, y + halfHeight, width, height - halfHeight, innerColor, innerColor, outerColor, outerColor);
			Prim.drawRectangle(Surface.Screen, x, y, width, height, Color.Black.fadeTo(color.a / 2));
		};

		this.drawPartyElement = function(x, y, memberInfo, isHighlighted)
		{
			this.drawElementBox(x, y, 100, 20, Color.of('#002000'));
			if (isHighlighted)
				this.drawHighlight(x, y, 100, 20, this.highlightColor);
			this.drawHighlight(x, y, 100, 20, memberInfo.lightColor);
			let textColor = isHighlighted ?
				Color.mix(Color.White, Color.Silver, this.highlightColor.a, 1.0 - this.highlightColor.a) :
				Color.Silver;
			memberInfo.hpGauge.draw(x + 5, y + 5, 24, 10);
			drawTextEx(this.font, x + 34, y + 4, memberInfo.unit.name, textColor, 1);
			Prim.drawSolidRectangle(Surface.Screen, x + 81, y + 3, 14, 14, Color.RoyalBlue);
			Prim.drawRectangle(Surface.Screen, x + 81, y + 3, 14, 14, 1, Color.Black);
		};
	}

	dispose()
	{
		this.stop();
		this.turnPreview.dispose();
	}

	createEnemyHPGauge(unit)
	{
		let gauge = new HPGauge(unit.maxHP, Game.bossHPPerBar, this.enemyHPGaugeColor, 20);
		this.hpGaugesInfo.push({ owner: unit, gauge: gauge });
		gauge.show(0.0);
		console.log(`create HP gauge for unit '${unit.name}'`, `cap: ${unit.maxHP}`);
	}

	hide()
	{
		new Scene()
			.tween(this, 15, 'easeInExpo', { fadeness: 0.0 })
			.run();
	}

	highlight(unit)
	{
		if (unit !== null) {
			this.highlightedUnit = unit;
			new Scene()
				.tween(this.highlightColor, 6, 'easeInQuad', Color.mix(this.partyHighlightColor, Color.Black.fadeTo(this.partyHighlightColor.a)))
				.tween(this.highlightColor, 15, 'easeOutQuad', this.partyHighlightColor)
				.run();
		}
		else {
			new Scene()
				.tween(this.highlightColor, 6, 'easeInQuad', Color.Transparent)
				.run();
		}
	}

	setHP(unit, hp)
	{
		for (let i = 0; i < this.partyInfo.length; ++i) {
			let characterInfo = this.partyInfo[i];
			if (characterInfo !== null && characterInfo.unit == unit && hp != characterInfo.hp) {
				characterInfo.hpGauge.set(hp);
				let gaugeColor =
					hp / characterInfo.maxHP <= 0.1 ? Color.Red
					: hp / characterInfo.maxHP <= 0.33 ? Color.Yellow
					: this.partyHPGaugeColor;
				characterInfo.hpGauge.changeColor(gaugeColor, 0.5);
				let flashColor = hp > characterInfo.hp ? Color.LimeGreen : Color.DarkRed;
				new Scene()
					.fork()
						.tween(characterInfo.lightColor, 15, 'easeOutQuad', flashColor)
						.tween(characterInfo.lightColor, 15, 'easeOutQuad', Color.Transparent)
					.end()
					.tween(characterInfo, 15, 'easeInOutSine', { hp: hp })
					.run();
			}
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			let gaugeInfo = this.hpGaugesInfo[i];
			if (gaugeInfo.owner == unit)
				gaugeInfo.gauge.set(hp);
		}
	}

	setPartyMember(slot, unit, hp, maxHP)
	{
		if (slot < 0 || slot >= this.partyInfo.length)
			throw new RangeError(`invalid party slot index '${slot}'`);

		let hpGauge = new HPGauge(maxHP, Game.partyHPPerBar, this.partyHPGaugeColor, 10);
		hpGauge.show();
		this.partyInfo[slot] = {
			unit: unit,
			hp: hp,
			maxHP: maxHP,
			hpGauge: hpGauge,
			lightColor: Color.Red.fadeTo(0.0),
		};
	}

	show()
	{
		if (!this.running) {
			console.log("activate battle screen HUD");
			this.start();
		}
		new Scene()
			.tween(this, 30, 'easeOutExpo', { fadeness: 1.0 })
			.run();
	}

	on_render()
	{
		let y = -((this.partyInfo.length + this.hpGaugesInfo.length) * 20) * (1.0 - this.fadeness);
		let itemY = y;
		this.drawElementBox(260, itemY, 60, 60);
		this.mpGauge.draw(261, itemY + 1, 58);
		for (let i = 0; i < this.partyInfo.length; ++i) {
			let itemX = 160;
			let itemY = y + i * 20;
			if (this.partyInfo[i] !== null)
				this.drawPartyElement(itemX, itemY, this.partyInfo[i], this.highlightedUnit == this.partyInfo[i].unit);
			else
				this.drawElementBox(itemX, itemY, 100, 20);
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			let gaugeInfo = this.hpGaugesInfo[i];
			let itemX = 160;
			let itemY = y + this.partyInfo.length * 20 + i * 20;
			this.drawElementBox(itemX, itemY, 160, 20);
			if (this.highlightedUnit == gaugeInfo.owner)
				this.drawHighlight(itemX, itemY, 160, 20, this.highlightColor);
			Prim.drawSolidRectangle(Surface.Screen, itemX + 141, itemY + 3, 14, 14, Color.FireBrick);
			Prim.drawRectangle(Surface.Screen, itemX + 141, itemY + 3, 14, 14, 1, Color.Black);
			gaugeInfo.gauge.draw(itemX + 5, itemY + 5, 131, 10);
		}
	}

	on_update()
	{
		for (let i = 0; i < this.partyInfo.length; ++i) {
			if (this.partyInfo[i] !== null) {
				this.partyInfo[i].hpGauge.update();
			}
		}
		for (let i = 0; i < this.hpGaugesInfo.length; ++i) {
			this.hpGaugesInfo[i].gauge.update();
		}
	}
}
