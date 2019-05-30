/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '../../lib/sphere-runtime.js';

import { Game, Items, Skills, Weapons } from '../gameDef/index.js';

import ItemUsable from './itemUsable.js';
import SkillUsable from './skillUsable.js';
import Stance from './stance.js';
import WeaponUsable from './weaponUsable.js';

export default
class AutoBattler
{
	constructor(unit, battle)
	{
		console.log(`initialize AI for ${unit.fullName}`);
		this.battle = battle;
		this.data = {};
		this.defaultSkillID = null;
		this.moveQueue = [];
		this.currentPhase = 0;
		this.phasePoints = null;
		this.targets = null;
		this.turnsTaken = 0;
		this.unit = unit;
	}

	get defaultSkill()
	{
		return this.defaultSkillID;
	}

	get hasMovesQueued()
	{
		return this.moveQueue.length > 0;
	}

	get phase()
	{
		return this.currentPhase;
	}

	set defaultSkill(value)
	{
		console.log(`default skill for ${this.unit.name} is ${Skills[value].name}`);
		this.defaultSkillID = value;
	}

	definePhases(thresholds, sigma = 0)
	{
		console.log(`set up ${thresholds.length + 1} phases for ${this.unit.name}`);
		this.phasePoints = from(thresholds)
			.select(it => Math.round(Random.normal(it, sigma)))
			.toArray();
		let phase = 1;
		for (const milestone of this.phasePoints)
			console.log(`phase ${++phase} will start at <= ${milestone} HP`);
		this.currentPhase = 0;
		this.lastPhase = 0;
	}

	async getNextMove()
	{
		let moveToUse = null;
		do {
			if (this.moveQueue.length == 0) {
				console.log(`defer to AI for ${this.unit.name}'s next move`);
				let enemyList = this.battle.enemiesOf(this.unit);
				this.enemies = [];
				for (let i = 0; i < enemyList.length; ++i) {
					let enemy = enemyList[i];
					this.enemies.push(enemy);
					this.enemies[enemy.id] = enemy;
				}
				let allyList = this.battle.alliesOf(this.unit);
				this.allies = [];
				for (let i = 0; i < allyList.length; ++i) {
					let ally = allyList[i];
					this.allies.push(ally);
					this.allies[ally.id] = ally;
				}
				this.targets = null;
				this.updatePhase();
				if (this.moveQueue.length == 0)
					await this.strategize();
				if (this.moveQueue.length == 0) {
					console.log(`no moves queued for ${this.unit.name}, using default`);
					if (this.defaultSkillID !== null)
						this.queueSkill(this.defaultSkillID);
					else
						throw new Error("no moves queued and no default skill");
				}
			}
			let candidateMove;
			let isUsable;
			do {
				candidateMove = this.moveQueue.shift();
				let isLegal = candidateMove.stance != Stance.Attack || candidateMove.usable.isUsable(this.unit, this.unit.stance);
				isUsable = isLegal && candidateMove.predicate();
				if (!isUsable)
					console.log(`discard ${this.unit.name}'s ${candidateMove.usable.name}, not usable`);
			} while (!isUsable && this.moveQueue.length > 0);
			if (isUsable)
				moveToUse = candidateMove;
			else if (this.defaultSkillID !== null)
				this.queueSkill(this.defaultSkillID);
		} while (moveToUse === null);
		++this.turnsTaken;
		return moveToUse;
	}

	hasStatus(statusID)
	{
		return this.unit.hasStatus(statusID);
	}

	isItemQueued(itemID)
	{
		return from(this.moveQueue)
			.where(it => it.usable instanceof ItemUsable)
			.any(it => it.usable.itemID === itemID);
	}

	isItemUsable(itemID)
	{
		return from(this.unit.items)
			.where(it => it.itemID === itemID)
			.any(it => it.isUsable(this, this.unit.stance));
	}

	isSkillQueued(skillID)
	{
		return from(this.moveQueue)
			.where(it => it.usable instanceof SkillUsable)
			.any(it => it.usable.skillID === skillID);
	}

	isSkillUsable(skillID)
	{
		let skillToUse = new SkillUsable(skillID, 100);
		return skillToUse.isUsable(this.unit, this.unit.stance);
	}

	itemsLeft(itemID)
	{
		let item = from(this.unit.items)
			.find(it => it.itemID === itemID);
		console.log(`${this.unit.name} has ${item.usesLeft}x ${item.name} left`);
		return item.usesLeft;
	}

	predictItemTurns(itemID)
	{
		if (!(itemID in Items))
			throw new ReferenceError(`no item definition for '${itemID}'`);

		let itemRank = 'rank' in Items[itemID] ? Items[itemID].rank : Game.defaultItemRank;
		let forecast = this.battle.predictTurns(this.unit, [ itemRank ]);
		console.log(`${this.unit.name} considering ${Items[itemID].name}`,
			`next: ${forecast[0].unit.name}`);
		return forecast;
	}

	predictSkillTurns(skillID)
	{
		if (!(skillID in Skills))
			throw new ReferenceError(`no skill definition for '${skillID}'`);

		let forecast = this.battle.predictTurns(this.unit, Skills[skillID].actions);
		console.log(`${this.unit.name} considering ${Skills[skillID].name}`,
			`next: ${forecast[0].unit.name}`);
		return forecast;
	}

	queueGuard()
	{
		this.moveQueue.push({
			usable: null,
			stance: Stance.Guard,
			predicate: () => true,
		});
	}

	queueItem(itemID, unitID = null)
	{
		let itemToUse = from(this.unit.items)
			.where(it => it.itemID === itemID)
			.where(it => it.isUsable(this.unit, this.unit.stance))
			.first();
		if (itemToUse === undefined)
			throw new Error(`${this.unit.name} tried to use an item '${itemID}' not owned`);
		let targets = this.targets !== null ? this.targets
			: unitID !== null ? [ this.battle.findUnit(unitID) ]
			: itemToUse.defaultTargets(this.unit);
		this.moveQueue.push({
			usable: itemToUse,
			stance: Stance.Attack,
			targets,
			predicate: () => true,
		});
		console.log(`${this.unit.name} queued use of item ${itemToUse.name}`);
	}

	queueSkill(skillID, stance = Stance.Attack, unitID = null, predicate = () => true)
	{
		let skillToUse = new SkillUsable(skillID, 100);
		let targetUnit = unitID !== null ? this.battle.findUnit(unitID) : null;
		let targets = this.targets !== null ? this.targets
			: targetUnit !== null ? [ targetUnit ]
			: skillToUse.defaultTargets(this.unit);
		this.moveQueue.push({
			usable: skillToUse,
			stance: stance,
			targets: targets,
			predicate: predicate,
		});
		console.log(`${this.unit.name} queued use of skill ${skillToUse.name}`);
	}

	queueWeapon(weaponID)
	{
		let weaponUsable = new WeaponUsable(weaponID);
		this.moveQueue.push({
			usable: weaponUsable,
			stance: Stance.Attack,
			targets: weaponUsable.defaultTargets(this.unit),
			predicate: () => true,
		});
		let weaponDef = Weapons[weaponID];
		console.log(`${this.unit.name} queued weapon change to ${weaponDef.name}`);
	}

	setTarget(targetID)
	{
		let unit = this.battle.findUnit(targetID);
		this.targets = unit !== null ? [ unit ] : null;
	}

	strategize()
	{
		if (this.defaultSkillID !== null)
			this.queueSkill(this.defaultSkillID);
		else
			throw new Error("AI has no strategy");
	}

	updatePhase()
	{
		let phaseToEnter = 1;
		if (this.phasePoints !== null) {
			let milestone = from(this.phasePoints)
				.where(it => it >= this.unit.hp)
				.last();
			phaseToEnter = 2 + this.phasePoints.indexOf(milestone);
		}
		let lastPhase = this.currentPhase;
		this.currentPhase = Math.max(phaseToEnter, this.currentPhase);  // ratcheting
		if (this.currentPhase > lastPhase) {
			console.log(`${this.unit.name} is entering phase ${this.currentPhase}`,
				`prev: ${lastPhase > 0 ? lastPhase : "none"}`);
			this.on_phaseChanged(this.currentPhase, lastPhase);
		}
	}

	on_itemUsed      (userID, itemID, targetIDs) {}
	on_skillUsed     (userID, skillID, stance, targetIDs) {}
	on_stanceChanged (userID, stance) {}
	on_phaseChanged  (phase, lastPhase) {}
	on_unitDamaged   (unitID, amount, tags, attacker) {}
	on_unitHealed    (unitID, amount, tags) {}
	on_unitKilled    (unitID) {}
	on_unitReady     (unitID) {}
	on_unitTargeted  (targetID, action, unitID) {}
}
