/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { Prim, Scene, Task } from 'sphere-runtime';

import { Game, Elements, SkillCategories } from '../gameDef/index.js';
import { drawTextEx } from '../utilities.js';

import { Stance } from './battleUnit.js';
import ItemUsable from './itemUsable.js';
import TargetMenu from './targetMenu.js';

export default
class MoveMenu extends Task
{
	constructor(unit, battle, stance)
	{
		super({ priority: 10 });

		this.lockedCursorColor = Color.of('#002448');
		this.moveRankColor = Color.White;
		this.normalCursorColor = Color.of('#004890');
		this.textColor = Color.White;
		this.usageTextColor = Color.Gold;

		this.battle = battle;
		this.drawers = null;
		this.expansion = 0.0;
		this.fadeness = 0.0;
		this.font = Font.Default;
		this.isExpanded = false;
		this.menuStance = stance;
		this.moveCursor = 0;
		this.moveCursorColor = Color.Transparent;
		this.moveMenu = null;
		this.selection = null;
		this.stance = null;
		this.topCursor = 0;
		this.topCursorColor = Color.Transparent;
		this.unit = unit;
		let drawerTable = {};
		for (const skill of this.unit.skills) {
			let category = skill.skillInfo.category;
			if (!(category in drawerTable)) {
				drawerTable[category] = {
					name: SkillCategories[category],
					contents: [],
					cursor: 0,
				};
			}
			drawerTable[category].contents.push(skill);
		}
		this.drawers = [];
		for (const category in drawerTable)
			this.drawers.push(drawerTable[category]);
		if (stance === Stance.Normal) {
			this.drawers = this.drawers.concat([
				{ name: "Item", contents: this.unit.items, cursor: 0 } ]);
		}

		this.chooseMove = new Scene()
			.fork()
				.tween(this.moveCursorColor, 7, 'easeInOutSine', this.lockedCursorColor)
			.end()
			.fork()
				.tween(this, 15, 'easeInBack', { expansion: 0.0 })
			.end()
			.tween(this, 15, 'easeInBack', { fadeness: 0.0 });

		this.hideMoveList = new Scene()
			.fork()
				.tween(this.moveCursorColor, 15, 'linear', Color.Transparent)
			.end()
			.fork()
				.tween(this.topCursorColor, 15, 'easeInOutSine', this.normalCursorColor)
			.end()
			.tween(this, 15, 'easeInBack', { expansion: 0.0 });

		this.showMenu = new Scene()
			.fork()
				.tween(this.topCursorColor, 15, 'easeOutQuad', Color.Silver)
				.tween(this.topCursorColor, 15, 'easeOutQuad', this.normalCursorColor)
			.end()
			.tween(this, 30, 'easeOutBounce', { fadeness: 1.0 });

		this.showMoveList = new Scene()
			.fork()
				.tween(this.topCursorColor, 15, 'easeInOutSine', this.lockedCursorColor)
			.end()
			.fork()
				.tween(this.moveCursorColor, 15, 'linear', this.normalCursorColor)
			.end()
			.tween(this, 15, 'easeOutExpo', { expansion: 1.0 });

		this.drawCursor = function(x, y, width, height, cursorColor, isLockedIn, isEnabled = true)
		{
			let color;
			let color2;
			color = isEnabled ? cursorColor : Color.Gray.fadeTo(cursorColor.a);
			color2 = Color.mix(color, Color.Black.fadeTo(color.a));
			if (isLockedIn) {
				let mainColor = color;
				color = color2;
				color2 = mainColor;
			}
			let halfHeight = Math.round(height / 2);
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, halfHeight, color2, color2, color, color);
			Prim.drawSolidRectangle(Surface.Screen, x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
			Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(cursorColor.a / 2));
		};

		this.drawItemBox = function(x, y, width, height, alpha, isSelected, isLockedIn, cursorColor, isEnabled = true)
		{
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, Color.Black.fadeTo(alpha));
			Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.1));
			if (isSelected)
				this.drawCursor(x, y, width, height, cursorColor, isLockedIn, isEnabled);
		};

		this.drawMoveItem = function(x, y, item, isSelected, isLockedIn)
		{
			x = Math.floor(x);
			y = Math.floor(y);
			let alpha = this.fadeness * this.expansion;
			let isEnabled = item.isEnabled;
			let textColor = isSelected ? this.textColor : Color.Gray.fadeTo(alpha);
			let usageTextColor = isSelected ? this.usageTextColor : Color.mix(this.usageTextColor, Color.Black.fadeTo(this.usageTextColor.a));
			textColor = isEnabled ? textColor : Color.Black.fadeTo(alpha / 8);
			usageTextColor = isEnabled ? usageTextColor : Color.Black.fadeTo(alpha / 8);
			this.drawItemBox(x, y, 160, 18, alpha / 2, isSelected, isLockedIn, this.moveCursorColor, isEnabled);
			let rankBoxColor = isEnabled ? Color.mix(item.idColor, Color.Black.fadeTo(item.idColor.a))
				: Color.mix(item.idColor, Color.Black.fadeTo(item.idColor.a), 25, 75);
			let rankColor = isEnabled ? item.idColor : Color.mix(item.idColor, Color.Black.fadeTo(item.idColor.a), 33, 66);
			Prim.drawSolidRectangle(Surface.Screen, x + 5, y + 2, 14, 14, rankBoxColor);
			Prim.drawRectangle(Surface.Screen, x + 5, y + 2, 14, 14, 1, Color.Black.fadeTo(rankBoxColor.a / 2));
			drawTextEx(this.font, x + 12, y + 3, isFinite(item.rank) ? item.rank : "?", rankColor, 1, 'center');

			let shadowLength = isEnabled ? 1 : 0;
			drawTextEx(this.font, x + 24, y + 3, item.name, textColor, shadowLength);
			if (item.mpCost > 0) {
				drawTextEx(this.font, x + 141, y + 1, item.mpCost, textColor, shadowLength, 'right');
				drawTextEx(this.font, x + 142, y + 5, "MP", usageTextColor, shadowLength);
			}
			else if (item.usable instanceof ItemUsable) {
				drawTextEx(this.font, x + 148, y + 3, item.usable.usesLeft, textColor, shadowLength, 'right');
				drawTextEx(this.font, x + 149, y + 3, "x", usageTextColor, shadowLength);
			}
		};

		this.drawTopItem = function(x, y, width, item, isSelected)
		{
			let isEnabled = item.contents.length > 0;
			this.drawItemBox(x, y, width, 18, 0.55 * this.fadeness, isSelected, this.isExpanded, this.topCursorColor, isEnabled);
			let textColor = isSelected ? Color.White.fadeTo(this.fadeness) : Color.Gray.fadeTo(this.fadeness);
			textColor = isEnabled ? textColor : Color.Black.fadeTo(this.fadeness / 8);
			drawTextEx(this.font, x + width / 2, y + 3, item.name.substr(0, 3), textColor, isEnabled ? 1 : 0, 'center');
		};

		this.updateTurnPreview = function()
		{
			let nextMoveOrRank;
			if (this.stance !== Stance.Guard) {
				if (this.isExpanded) {
					nextMoveOrRank = this.moveMenu[this.moveCursor].usable;
				}
				else {
					let drawer = this.drawers[this.topCursor];
					nextMoveOrRank = drawer.contents.length > 0 ? drawer.contents[drawer.cursor] : Game.defaultItemRank;
				}
			}
			else {
				nextMoveOrRank = Game.guardRank;
			}
			let nextActions = isNaN(nextMoveOrRank) ? nextMoveOrRank.peekActions() : [ nextMoveOrRank ];
			let prediction = this.battle.predictTurns(this.unit, nextActions);
			this.battle.ui.hud.turnPreview.set(prediction);
		};
	}

	async run()
	{
		this.battle.suspend();
		this.battle.ui.hud.highlight(this.unit);
		let chosenTargets = null;
		this.stance = this.lastStance = this.menuStance;
		while (chosenTargets === null) {
			this.expansion = 0.0;
			this.isExpanded = false;
			this.selection = null;
			this.stance = this.lastStance;
			Keyboard.Default.clearQueue();
			this.showMenu.run();
			this.updateTurnPreview();
			this.start();
			this.takeFocus();
			await Task.join(this);
			let targetMenu;
			switch (this.stance) {
				case Stance.Normal: {
					const targeter = new TargetMenu(this.unit, this.battle, this.selection, this.selection.name, this.stance);
					chosenTargets = await targeter.run();
					break;
				}
				case Stance.Guard: {
					targetMenu = new TargetMenu(this.unit, this.battle, null, "Guard", this.stance);
					targetMenu.lockTargets([ this.unit ]);
					chosenTargets = await targetMenu.run();
					break;
				}
			}
		}
		this.battle.ui.hud.highlight(null);
		this.battle.resume();
		return {
			usable: this.selection,
			stance: this.stance,
			targets: chosenTargets,
		};
	}

	on_inputCheck()
	{
		let key = Keyboard.Default.getKey();
		if (key == Key.Z) {
			if (!this.isExpanded && this.drawers[this.topCursor].contents.length > 0) {
				let usables = this.drawers[this.topCursor].contents;
				this.moveMenu = [];
				for (let i = 0; i < usables.length; ++i) {
					let menuItem = {
						name: usables[i].name,
						idColor: Color.Silver,
						isEnabled: usables[i].isUsable(this.unit, this.stance),
						mpCost: usables[i].mpCost(this.unit),
						rank: usables[i].rank,
						usable: usables[i],
					};
					let actions = menuItem.usable.peekActions();
					for (let i2 = 0; i2 < actions.length; ++i2) {
						for (let i3 = 0; i3 < actions[i2].effects.length; ++i3) {
							if ('element' in actions[i2].effects[i3]) {
								menuItem.idColor = Elements[actions[i2].effects[i3].element].color;
							}
						}
					}
					this.moveMenu.push(menuItem);
				}
				this.moveCursor = this.drawers[this.topCursor].cursor;
				this.isExpanded = true;
				this.hideMoveList.stop();
				this.showMoveList.run();
				this.updateTurnPreview();
			}
			else if (this.isExpanded && this.moveMenu[this.moveCursor].isEnabled) {
				this.drawers[this.topCursor].cursor = this.moveCursor;
				this.selection = this.moveMenu[this.moveCursor].usable;
				this.showMoveList.stop();
				this.chooseMove.run();
			}
		}
		else if (key == Key.X && this.isExpanded) {
			this.drawers[this.topCursor].cursor = this.moveCursor;
			this.isExpanded = false;
			this.showMoveList.stop();
			this.hideMoveList.run();
		}
		else if (key == Key.V && this.stance == Stance.Normal) {
			this.stance = Stance.Guard;
			this.updateTurnPreview();
			this.showMoveList.stop();
			this.chooseMove.run();
		}
		else if (!this.isExpanded && key == Key.Left) {
			--this.topCursor;
			if (this.topCursor < 0) {
				this.topCursor = this.drawers.length - 1;
			}
			this.updateTurnPreview();
		}
		else if (!this.isExpanded && key == Key.Right) {
			++this.topCursor;
			if (this.topCursor >= this.drawers.length) {
				this.topCursor = 0;
			}
			this.updateTurnPreview();
		}
		else if (this.isExpanded && key == Key.Up) {
			this.moveCursor = this.moveCursor - 1 < 0 ? this.moveMenu.length - 1 : this.moveCursor - 1;
			this.updateTurnPreview();
		}
		else if (this.isExpanded && key == Key.Down) {
			this.moveCursor = (this.moveCursor + 1) % this.moveMenu.length;
			this.updateTurnPreview();
		}
	}

	on_render()
	{
		let yOrigin = -54 * (1.0 - this.fadeness) + 16;
		let stanceText = this.stance === Stance.Guard ? "GS" : "NS";
		Surface.Screen.clipTo(0, 16, Surface.Screen.width, Surface.Screen.height - 16);
		Prim.drawSolidRectangle(Surface.Screen, 0, yOrigin, 136, 16, Color.Black.fadeTo(0.625 * this.fadeness));
		Prim.drawRectangle(Surface.Screen, 0, yOrigin, 136, 16, 1, Color.Black.fadeTo(0.1 * this.fadeness));
		Prim.drawSolidRectangle(Surface.Screen, 136, yOrigin, 24, 16, Color.Black.fadeTo(0.7 * this.fadeness));
		Prim.drawRectangle(Surface.Screen, 136, yOrigin, 24, 16, 1, Color.Black.fadeTo(0.1 * this.fadeness));
		drawTextEx(this.font, 68, yOrigin + 2, `${this.unit.name}'s turn`, Color.DarkGray.fadeTo(this.fadeness), 1, 'center');
		drawTextEx(this.font, 148, yOrigin + 2, stanceText, Color.Khaki.fadeTo(this.fadeness), 1, 'center');
		let itemWidth = 160 / this.drawers.length;
		Prim.drawSolidRectangle(Surface.Screen, 0, 16, 160, yOrigin - 16, Color.Black.fadeTo(0.75 * this.fadeness));
		for (let i = 0; i < this.drawers.length; ++i) {
			let x = Math.floor(i * itemWidth);
			let width = Math.floor((i + 1) * itemWidth) - x;
			this.drawTopItem(x, yOrigin + 16, width, this.drawers[i], i == this.topCursor);
		}
		Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
		let itemY;
		if (this.expansion > 0.0) {
			Surface.Screen.clipTo(0, yOrigin + 34, 160, Surface.Screen.height - (yOrigin + 34));
			let height = this.moveMenu.length * 16;
			let y = yOrigin + 34 - height * (1.0 - this.expansion);
			Prim.drawSolidRectangle(Surface.Screen, 0, 34, 160, y - 34, Color.Black.fadeTo(0.5 * this.expansion * this.fadeness));
			itemY = y;
			for (let i = 0; i < this.moveMenu.length; ++i) {
				this.drawMoveItem(0, itemY, this.moveMenu[i], i == this.moveCursor, this.chooseMove.running);
				itemY += 18;
			}
			Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
		}
		else {
			itemY = yOrigin + 34;
		}
	}

	on_update()
	{
		if ((this.selection !== null || this.stance === Stance.Guard) && !this.chooseMove.running)
			this.stop();
	}
}
