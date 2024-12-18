/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { from } from 'sphere-runtime';

import { Game } from './game.js';

export
const Maths =
{
	accuracy: {
		bow(userInfo, targetInfo) {
			return userInfo.stats.foc / targetInfo.stats.agi;
		},
		breath(userInfo, targetInfo) {
			return 1.0;
		},
		devour(userInfo, targetInfo) {
			return (100 - targetInfo.health * targetInfo.tier) / 100
				* userInfo.stats.agi / targetInfo.stats.agi;
		},
		gun(userInfo, targetInfo) {
			return 1.0;
		},
		magic(userInfo, targetInfo) {
			return 1.0;
		},
		physical(userInfo, targetInfo) {
			return 1.0;
		},
		shuriken(userInfo, targetInfo) {
			return 1.0;
		},
		staff(userInfo, targetInfo) {
			return 1.0;
		},
		sword(userInfo, targetInfo) {
			return userInfo.stats.agi * 1.5 / targetInfo.stats.agi;
		},
	},

	damage: {
		calculate(power, level, targetTier, attack, defense, isGroupCast = false) {
			let damage = power * level**0.5 * attack / defense;
			if (isGroupCast)
				damage /= 1.5;
			return damage;
		},
		bow(userInfo, targetInfo, power) {
			const defense = Maths.statValue(0, userInfo.level);
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, defense);
		},
		magicArrow(userInfo, targetInfo, power) {
			const defense = Maths.statValue(0, userInfo.level);
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.mag, defense);
		},
		breath(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.foc);
		},
		gun(userInfo, targetInfo, power) {
			const attack = Maths.statValue(100, userInfo.level);
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				attack, targetInfo.stats.def);
		},
		magic(userInfo, targetInfo, power, isGroupCast) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.mag, targetInfo.stats.foc, isGroupCast);
		},
		physical(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.str);
		},
		physicalRecoil(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				targetInfo.stats.def, userInfo.stats.def);
		},
		shuriken(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.foc, targetInfo.stats.def);
		},
		staff(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.def);
		},
		sword(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str, targetInfo.stats.def);
		},
	},

	experience: {
		skill(skillInfo, userInfo, targetsInfo) {
			let levelSum = 0;
			let statSum = 0;
			for (let i = 0; i < targetsInfo.length; ++i) {
				levelSum += targetsInfo[i].level;
				statSum += targetsInfo[i].baseStatAverage;
			}
			let levelAverage = Math.round(levelSum / targetsInfo.length);
			let statAverage = Math.round(statSum / targetsInfo.length);
			return levelAverage * statAverage;
		},
		stat(statID, enemyUnitInfo) {
			return enemyUnitInfo.level * enemyUnitInfo.baseStats[statID];
		},
	},

	guardStance: {
		damageTaken(baseDamage, tags) {
			if (from(tags).anyIs('deathblow'))
				return baseDamage - 1;
			else if (from(tags).anyIn([ 'bow', 'omni', 'special', 'zombie' ]))
				return baseDamage;
			else
				return baseDamage / Game.bonusMultiplier;
		},
	},

	healing(userInfo, targetInfo, power, isGroupCast) {
		const defense = Maths.statValue(0, userInfo.level);
		return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
			userInfo.stats.mag, defense, isGroupCast);
	},

	hp(unitInfo, level, tier) {
		const vit = Maths.statValue(unitInfo.baseStats.vit, level);
		return 25 * vit * (tier ** 2);
	},

	mp: {
		capacity(unitInfo) {
			const mag = Maths.statValue(unitInfo.baseStats.mag, unitInfo.level);
			return 10 * mag * unitInfo.tier;
		},
		usage(skill, level, userInfo) {
			const baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
			return userInfo.baseStats.foc * baseCost / 100;
		},
	},

	retreatChance(enemyUnitsInfo) {
		return 1.0;
	},

	skillRank(skill) {
		let rankTotal = 0;
		for (let i = 0; i < skill.actions.length; ++i)
			rankTotal += skill.actions[i].rank;
		return rankTotal;
	},

	statValue(baseStat, level) {
		return Math.round((50 + 0.5 * baseStat) * (10 + level) / 110);
	},

	timeUntilNextTurn(unitInfo, rank) {
		return rank * 10000 / unitInfo.stats.agi;
	},
};
