/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { from } from 'sphere-runtime';

import { Maths, Skills } from '../gameDef/index.js';
import { clone } from '../utilities.js';

import { Stance } from './battleUnit.js';

export default
class SkillUsable
{
	constructor(skillID, level = 1)
	{
		if (!(skillID in Skills))
			throw new ReferenceError(`no skill definition for '${skillID}'`);

		this.levelUpTable = [];
		for (let i = 1; i <= 100; ++i) {
			let xpNeeded = Math.ceil(i > 1 ? i ** 3 : 0);
			this.levelUpTable[i] = xpNeeded;
		}
		this.skillInfo = Skills[skillID];
		this.canGroupCast = this.skillInfo.groupCast ?? false;
		this.experience = this.levelUpTable[level];
		this.givesExperience = true;
		this.isGroupCast = from([ 'allEnemies', 'allAllies' ])
			.anyIs(this.skillInfo.targetType);
		this.name = this.skillInfo.name;
		this.skillID = skillID;
		this.useAiming = true;
		this.allowDeadTarget = 'allowDeadTarget' in this.skillInfo
			? this.skillInfo.allowDeadTarget
			: false;
	}

	get level()
	{
		for (let level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpTable[level])
				return level;
		}
		return 1;
	}

	get rank()
	{
		return Maths.skillRank(this.skillInfo);
	}

	defaultTargets(user)
	{
		let target;
		switch (this.skillInfo.targetType) {
			case 'single': {
				let enemies = user.battle.enemiesOf(user);
				target = from(enemies)
					.where(it => it.isAlive())
					.sample(1).first();
				if (this.allowDeadTarget && from(enemies).any(it => !it.isAlive())) {
					target = from(enemies)
						.where(it => !it.isAlive())
						.sample(1).first();
				}
				return [ target ];
			}
			case 'ally': {
				let allies = user.battle.alliesOf(user);
				target = user;
				if (this.allowDeadTarget && from(allies).any(it => !it.isAlive())) {
					target = from(allies)
						.where(it => !it.isAlive())
						.sample(1).first();
				}
				return [ target ];
			}
			case 'allEnemies': {
				return from(user.battle.enemiesOf(user))
					.where(it => it.isAlive() || this.allowDeadUnits)
					.toArray();
			}
			case 'allAllies': {
				return from(user.battle.alliesOf(user))
					.where(it => it.isAlive() || this.allowDeadUnits)
					.toArray();
			}
			default: {
				return user;
			}
		}
	}

	grow(amount)
	{
		amount = Math.max(Math.round(amount), 0);
		this.experience = Math.min(this.experience + amount, this.levelUpTable[100]);
		console.log(`skill ${this.name} gained ${amount} EXP`, `lv: ${this.level}`);
	}

	isUsable(user, stance = Stance.Normal)
	{
		let userWeaponType = user.weapon != null ? user.weapon.type : null;
		let skillWeaponType = this.skillInfo.weaponType;
		if (skillWeaponType != null && userWeaponType != skillWeaponType)
			return false;
		return this.mpCost(user) <= user.mpPool.availableMP
			&& stance != Stance.Guard;
	}

	mpCost(user)
	{
		return Math.min(Math.max(Math.ceil(Maths.mp.usage(this.skillInfo, this.level, user.battlerInfo)), 0), 999);
	}

	peekActions()
	{
		return this.skillInfo.actions;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new RangeError(`${unit.name} tried to use unusable skill ${this.name}`);
		console.log(`${unit.name} is using ${this.name}`, `targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`);
		if (unit.weapon != null && this.skillInfo.weaponType != null)
			console.log(`weapon is ${unit.weapon.name}`, `lv: ${unit.weapon.level}`);
		unit.mpPool.use(this.mpCost(unit));
		let growthRate = 'growthRate' in this.skillInfo ? this.skillInfo.growthRate : 1.0;
		let targetInfos = [];
		for (let i = 0; i < targets.length; ++i)
			targetInfos.push(targets[i].battlerInfo);
		let experience = Maths.experience.skill(this.skillInfo, unit.battlerInfo, targetInfos);
		this.grow(experience);
		let eventData = { skill: clone(this.skillInfo) };
		unit.raiseEvent('useSkill', eventData);
		unit.battle.notifyAIs('skillUsed', unit.id, this.skillID, unit.stance, from(targets).select(it => it.id).toArray());
		return eventData.skill.actions;
	}
}
