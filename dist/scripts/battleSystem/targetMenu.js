/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { from, Prim, Scene, Task } from 'sphere-runtime';

import { drawTextEx } from '../utilities.js';

import { Game } from '../gameDef/index.js';
import { Stance } from './battleUnit.js';

export default
class TargetMenu extends Task
{
	constructor(unit, battle, usable = null, moveName = null, stance = Stance.Normal)
	{
		super({ priority: 10 });

		this.battle = battle;
		this.canGroupCast = usable !== null ? usable.canGroupCast : false;
		this.doChangeInfo = null;
		this.isChoiceMade = false;
		this.infoBoxFadeness = 1.0;
		this.infoFadeness = 1.0;
		this.isTargetScanOn = from(battle.alliesOf(unit))
			.where(unit => unit.isAlive())
			.any(unit => unit.allowTargetScan);
		this.isTargetLocked = false;
		this.isGroupCast = false;
		this.name = moveName !== null ? moveName
			: usable !== null ? usable.name
			: unit.name;
		this.statusNames = null;
		this.cursorFont = Font.Default;
		this.infoFont = Font.Default;
		this.stance = stance;
		this.targets = [];
		this.unit = unit;
		this.unitToShowInfo = null;
		this.usable = usable;
		this.allowDeadUnits = usable !== null ? usable.allowDeadTarget : false;

		this.drawCursor = function(unit)
		{
			let width = this.cursorFont.widthOf(this.name) + 10;
			let x = unit.actor.x < Surface.Screen.width / 2 ? unit.actor.x + 37 : unit.actor.x - 5 - width;
			let y = unit.actor.y + 6;
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, 20, Color.Black.fadeTo(0.5));
			Prim.drawRectangle(Surface.Screen, x, y, width, 20, 1, Color.Black.fadeTo(0.25));
			drawTextEx(this.cursorFont, x + width / 2, y + 4, this.name, Color.White, 1, 'center');
		};

		this.drawInfoBox = function(x, y, width, height, alpha)
		{
			Prim.drawSolidRectangle(Surface.Screen, x, y, width, height, Color.Black.fadeTo(alpha * (1.0 - this.infoBoxFadeness)));
			Prim.drawRectangle(Surface.Screen, x, y, width, height, 1, Color.Black.fadeTo(0.125 * (1.0 - this.infoBoxFadeness)));
		};

		this.moveCursor = function(direction)
		{
			if (this.isGroupCast || this.targets == null)
				return;
			let position = this.targets[0].actor.position;
			let candidates = this.battle.alliesOf(this.targets[0]);
			let unitToSelect = null;
			while (unitToSelect === null) {
				position += direction;
				position = position > 2 ? 0
					: position < 0 ? 2
					: position;
				for (let i = 0; i < candidates.length; ++i) {
					if (position == candidates[i].actor.position
						&& (candidates[i].isAlive() || this.allowDeadUnits))
					{
						unitToSelect = candidates[i];
						break;
					}
				}
			}
			if (unitToSelect !== this.targets[0]) {
				this.targets = [ unitToSelect ];
				this.updateInfo();
			}
			this.updateTurnPreview();
		};

		this.updateInfo = function()
		{
			let unit = this.targets.length == 1 ? this.targets[0] : null;
			if (this.doChangeInfo != null) {
				this.doChangeInfo.stop();
			}
			this.doChangeInfo = new Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(() => {
					this.unitToShowInfo = unit;
					if (this.unitToShowInfo !== null) {
						this.statusNames = !this.unitToShowInfo.isAlive() ? [ "KO" ] : [];
						for (let i = 0; i < this.unitToShowInfo.statuses.length; ++i) {
							this.statusNames.push(this.unitToShowInfo.statuses[i].name);
						}
					}
				})
				.fork()
					.tween(this, 15, 'easeOutBack', { infoBoxFadeness: 0.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 0.0 });
			this.doChangeInfo.run();
		};

		this.updateTurnPreview = function()
		{
			const nextActions = this.stance === Stance.Guard
				? [ Game.guardRank ]
				: this.usable.peekActions();
			let prediction = this.battle.predictTurns(this.unit, nextActions, this.targets);
			this.battle.ui.hud.turnPreview.set(prediction);
		}
	}

	lockTargets(targetUnits)
	{
		this.targets = targetUnits;
		this.isTargetLocked = true;
	}

	async run()
	{
		this.isChoiceMade = false;
		if (!this.isTargetLocked) {
			this.targets = this.usable !== null
				? this.usable.defaultTargets(this.unit)
				: [ this.battle.enemiesOf(this.unit)[0] ];
		}
		this.isGroupCast = this.usable !== null ? this.usable.isGroupCast : false;
		this.updateInfo();
		Keyboard.Default.clearQueue();
		this.start();
		this.takeFocus();
		this.updateTurnPreview();
		await Task.join(this);
		return this.targets;
	}

	on_inputCheck()
	{
		switch (Keyboard.Default.getKey()) {
			case Key.Z:
				new Scene()
					.fork()
						.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
					.end()
					.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
					.resync()
					.call(() => { this.isChoiceMade = true; })
					.run();
				break;
			case Key.X:
				this.targets = null;
				new Scene()
					.fork()
						.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
					.end()
					.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
					.resync()
					.call(() => { this.isChoiceMade = true; })
					.run();
				this.updateTurnPreview();
				break;
			case Key.V:
				if (this.canGroupCast && !this.isTargetLocked) {
					this.isGroupCast = !this.isGroupCast;
					if (this.isGroupCast)
						this.targets = this.battle.alliesOf(this.targets[0]);
					else
						this.targets = [ this.battle.alliesOf(this.targets[0])[0] ];
					this.updateInfo();
					this.updateTurnPreview();
				}
				break;
			case Key.Up:
				if (!this.isTargetLocked) {
					this.moveCursor(-1);
				}
				break;
			case Key.Down:
				if (!this.isTargetLocked) {
					this.moveCursor(1);
				}
				break;
			case Key.Left:
				if (!this.isTargetLocked && this.targets != null) {
					const enemyUnits = this.battle.enemiesOf(this.unit);
					if (!this.isGroupCast)
						this.targets = [ enemyUnits[0] ];
					else
						this.targets = enemyUnits;
					this.updateInfo();
					this.updateTurnPreview();
				}
				break;
			case Key.Right:
				if (!this.isTargetLocked && this.targets != null) {
					if (!this.isGroupCast)
						this.targets = [ this.unit ];
					else
						this.targets = this.battle.alliesOf(this.unit);
					this.updateInfo();
					this.updateTurnPreview();
				}
				break;
		}
	}

	on_render()
	{
		if (this.targets !== null) {
			for (let i = 0; i < this.targets.length; ++i) {
				this.drawCursor(this.targets[i]);
			}
		}
		if (this.unitToShowInfo != null) {
			Surface.Screen.clipTo(0, 16, 160, Surface.Screen.height - 16);
			let textAlpha = (1.0 - this.infoBoxFadeness) * (1.0 - this.infoFadeness);
			let textColor = Color.Silver.fadeTo(textAlpha);
			let statColor = Color.of('#c0c090').fadeTo(textAlpha);
			let statusColor = Color.of('#c0c060').fadeTo(textAlpha);
			if (this.isTargetScanOn || this.unitToShowInfo.isPartyMember()) {
				let nameBoxHeight = 20 + 12 * this.statusNames.length;
				let y = 16 - (nameBoxHeight + 20) * this.infoBoxFadeness;
				Prim.drawSolidRectangle(Surface.Screen, 0, 16, 160, y - 16, Color.Black.fadeTo(0.5 * (1.0 - this.infoBoxFadeness)));
				this.drawInfoBox(0, y, 160, nameBoxHeight, 0.625);
				drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, textColor, 1, 'center');
				for (let i = 0; i < this.statusNames.length; ++i)
					drawTextEx(this.infoFont, 80, y + 16 + 12 * i, this.statusNames[i], statusColor, 1, 'center');
				this.drawInfoBox(0, y + nameBoxHeight, 80, 20, 0.5);
				drawTextEx(this.infoFont, 40, y + nameBoxHeight + 4, `${this.unitToShowInfo.hp} HP`, statColor, 1, 'center');
				this.drawInfoBox(80, y + nameBoxHeight, 80, 20, 0.5);
				drawTextEx(this.infoFont, 120, y + nameBoxHeight + 4, `${this.unitToShowInfo.mpPool.availableMP} MP`, statColor, 1, 'center');
			}
			else {
				let y = 16 - 20 * this.infoBoxFadeness;
				Prim.drawSolidRectangle(Surface.Screen, 0, 16, 160, y - 16, Color.Black.fadeTo(0.5 * (1.0 - this.infoBoxFadeness)));
				this.drawInfoBox(0, y, 160, 20, 0.625);
				drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, textColor, 1, 'center');
			}
			Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
		}
	}

	on_update()
	{
		if (this.isChoiceMade)
			this.stop();
	}
}
