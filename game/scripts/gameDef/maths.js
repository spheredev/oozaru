/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from } from '/game/lib/sphere-runtime.js';

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
		sword(userInfo, targetInfo) {
			return userInfo.stats.agi * 1.5 / targetInfo.stats.agi;
		},
	},

	damage: {
		calculate(power, level, targetTier, attack, defense) {
			return power * level**0.5 * attack / defense;
		},
		bow(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str,
				Maths.statValue(0, targetInfo.level));
		},
		breath(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.vit * 2 + userInfo.stats.mag) / 3),
				targetInfo.stats.vit);
		},
		magic(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
				targetInfo.stats.foc);
		},
		gun(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				Maths.statValue(100, userInfo.level),
				targetInfo.stats.def);
		},
		physical(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.str,
				Math.round((targetInfo.stats.def * 2 + targetInfo.stats.str) / 3));
		},
		physicalRecoil(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power / 2, userInfo.level, targetInfo.tier,
				targetInfo.stats.str, userInfo.stats.str);
		},
		shuriken(userInfo, targetInfo, power) {
			return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
				userInfo.stats.foc, targetInfo.stats.def);
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
				return baseDamage / 2;
		},
	},

	healing(userInfo, targetInfo, power) {
		return Maths.damage.calculate(power, userInfo.level, targetInfo.tier,
			Math.round((userInfo.stats.mag * 2 + userInfo.stats.foc) / 3),
			Maths.statValue(0, targetInfo.level));
	},

	hp(unitInfo, level, tier) {
		let statAverage = Math.round((unitInfo.baseStats.vit * 10
			+ unitInfo.baseStats.str
			+ unitInfo.baseStats.def
			+ unitInfo.baseStats.foc
			+ unitInfo.baseStats.mag
			+ unitInfo.baseStats.agi) / 15);
		statAverage = Maths.statValue(statAverage, level);
		return 25 * tier**2 * statAverage;
	},

	mp: {
		capacity(unitInfo) {
			let statAverage = Math.round((unitInfo.baseStats.mag * 10
				+ unitInfo.baseStats.vit
				+ unitInfo.baseStats.str
				+ unitInfo.baseStats.def
				+ unitInfo.baseStats.foc
				+ unitInfo.baseStats.agi) / 15);
			statAverage = Maths.statValue(statAverage, unitInfo.level);
			return 10 * unitInfo.tier * statAverage;
		},
		usage(skill, level, userInfo) {
			let baseCost = 'baseMPCost' in skill ? skill.baseMPCost : 0;
			return baseCost * level**0.5 * userInfo.baseStats.mag / 100;
		},
	},

	retreatChance(enemyUnitsInfo) {
		return 1.0;
	},

	skillRank(skill) {
		let rankTotal = 0;
		for (let i = 0; i < skill.actions.length; ++i) {
			rankTotal += skill.actions[i].rank;
		}
		return rankTotal;
	},

	statValue(baseStat, level) {
		return Math.round((50 + 0.5 * baseStat) * (10 + level) / 110);
	},

	timeUntilNextTurn(unitInfo, rank) {
		return rank * 10000 / unitInfo.stats.agi;
	},
};
