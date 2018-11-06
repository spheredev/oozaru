/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '/game/lib/sphere-runtime.js';

import { Stance } from '../battleSystem/index.js';
import { Maths } from './maths.js';

export
const Elements =
{
	fire: { name: "Fire", color: Color.Red },
	ice: { name: "Ice", color: Color.DeepSkyBlue },
	lightning: { name: "Lightning", color: Color.Gold },
	earth: { name: "Earth", color: Color.DarkOrange },
	cure: { name: "Cure", color: Color.SpringGreen },
	omni: { name: "Omni", color: Color.White },
	fat: { name: "Fat", color: Color.Magenta },
	zombie: { name: "Zombie", color: Color.MediumSeaGreen },
};

export
const MoveEffects =
{
	addCondition(actor, targets, effect) {
		actor.battle.addCondition(effect.condition);
	},

	addStatus(actor, targets, effect) {
		for (const unit of targets)
			unit.addStatus(effect.status);
	},

	damage(actor, targets, effect) {
		let userInfo = actor.battlerInfo;
		for (let i = 0; i < targets.length; ++i) {
			let targetInfo = targets[i].battlerInfo;
			let damageTags = [ effect.damageType ];
			if ('element' in effect)
				damageTags.push(effect.element);
			let damage = Math.max(Math.round(Maths.damage[effect.damageType](userInfo, targetInfo, effect.power)), 1);
			let tolerance = Math.round(damage / 10);
			targets[i].takeDamage(Math.max(Random.uniform(damage, tolerance), 1), damageTags);
			let recoilFunction = `${effect.damageType}Recoil`;
			if (recoilFunction in Maths.damage) {
				let recoil = Math.round(Maths.damage[recoilFunction](userInfo, targetInfo, effect.power));
				let tolerance = Math.round(recoil / 10);
				actor.takeDamage(Math.max(Random.uniform(recoil, tolerance), 1), [ 'recoil' ], true);
			}
			if ('addStatus' in effect) {
				let statusChance = 'statusChance' in effect ? effect.statusChance / 100 : 1.0;
				let guardable = effect.statusChance < Infinity;
				if (Random.chance(statusChance))
					targets[i].addStatus(effect.addStatus, guardable);
			}
		}
	},

	devour(actor, targets, effect) {
		for (let i = 0; i < targets.length; ++i) {
			if (!targets[i].isPartyMember()) {
				let munchData = targets[i].enemyInfo.munchData;
				let experience = Maths.experience.skill(munchData.skill, actor.battlerInfo, [ targets[i].battlerInfo ]);
				actor.growSkill(munchData.skill, experience);
			}
			console.log(`${targets[i].fullName} got eaten by ${actor.name}`);
			targets[i].die();
		}
		actor.heal(actor.maxHP - actor.hp, [], true);
	},

	fullRecover(actor, targets, effect) {
		let nonZombieUnits = from(targets)
			.where(it => !it.hasStatus('zombie'));
		for (const unit of nonZombieUnits) {
			unit.heal(unit.maxHP - unit.hp, [ 'cure' ]);
		}
	},

	heal(actor, targets, effect) {
		let userInfo = actor.battlerInfo;
		for (let i = 0; i < targets.length; ++i) {
			let targetInfo = targets[i].battlerInfo;
			let healing = Math.max(Math.round(Maths.healing(userInfo, targetInfo, effect.power)), 1);
			let tolerance = Math.round(healing / 10);
			targets[i].heal(Math.max(Random.uniform(healing, tolerance), 1), [ 'cure' ]);
			if ('addStatus' in effect) {
				let statusChance = 'statusChance' in effect ? effect.statusChance / 100 : 1.0;
				if (Random.chance(statusChance))
					targets[i].addStatus(effect.addStatus);
			}
		}
	},

	instaKill(actor, targets, effect) {
		for (let i = 0; i < targets.length; ++i)
			targets[i].takeDamage(Math.max(targets[i].hp, 1), [ effect.damageType, 'deathblow' ]);
	},

	liftStatus(actor, targets, effect) {
		for (let i = 0; i < targets.length; ++i) {
			for (let i2 = 0; i2 < effect.statuses.length; ++i2)
				targets[i].liftStatus(effect.statuses[i2]);
		}
	},

	liftStatusTags(actor, targets, effect) {
		for (const unit of targets)
			unit.liftStatusTags(effect.tags);
	},

	recoverHP(actor, targets, effect) {
		for (let i = 0; i < targets.length; ++i) {
			let unitInfo = targets[i].battlerInfo;
			let cap = Maths.hp(unitInfo, unitInfo.level, 1);
			targets[i].heal(effect.strength * cap / 100, [ 'cure' ]);
		}
	},

	recoverMP(actor, targets, effect) {
		for (const unit of targets) {
			let amount = Math.round(Maths.mp.capacity(unit.battlerInfo));
			unit.restoreMP(amount);
		}
	},

	revive(actor, targets, effect) {
		for (const unit of targets)
			unit.resurrect(effect.healToFull);
	},
};
