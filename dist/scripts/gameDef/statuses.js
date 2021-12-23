/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { from, Random } from 'sphere-runtime';

import { Stance } from '../battleSystem/index.js';

import { Maths } from './maths.js';

export
const Statuses =
{
	crackdown: {
		name: "Crackdown",
		tags: [ 'ailment' ],
		expiration: { beginTurn: 5 },
		acting(unit, eventData) {
			if (!eventData.action.isMelee)
				return;
			for (const effect of from(eventData.action.effects)
				.where(it => it.type == 'damage'))
			{
				let oldPower = effect.power;
				effect.power = Math.max(Math.round(effect.power / 2.0), 1);
				if (effect.power != oldPower) {
					console.log(
						`effect Power changed by Crackdown to ${effect.power}`,
						`was: ${oldPower}`);
				}
			}
		},
	},

	curse: {
		name: "Curse",
		tags: [ 'ailment' ],
		initialize(unit) {
			unit.liftStatusTags([ 'buff' ]);
		},
		afflicted(unit, eventData) {
			let statusDef = Statuses[eventData.statusID];
			if (from(statusDef.tags).anyIs('buff')) {
				console.log(`status ${statusDef.name} blocked by Curse`);
				eventData.cancel = true;
			}
		},
	},

	disarray: {
		name: "Disarray",
		tags: [ 'ailment', 'acute' ],
		expiration: { endTurn: 5 },
		acting(unit, eventData) {
			let oldRank = eventData.action.rank;
			eventData.action.rank = Random.discrete(1, 5);
			if (eventData.action.rank != oldRank) {
				console.log(
					`action Rank changed by Disarray to ${eventData.action.rank}`,
					`was: ${oldRank}`);
			}
		},
	},

	drunk: {
		name: "Drunk",
		tags: [ 'acute' ],
		expiration: { beginTurn: 5 },
		overrules: [ 'immune' ],
		ignoreEvents: [
			'itemUsed',
			'skillUsed',
			'unitDamaged',
			'unitHealed',
			'unitTargeted',
		],
		acting(unit, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.targetHint === 'selected')
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				let oldPower = effect.power;
				effect.power *= 1.5;
				if (effect.power != oldPower) {
					console.log(
						`effect Power changed by Drunk to ${effect.power}`,
						`was: ${oldPower}`);
				}
			}
		},
		aiming(unit, eventData) {
			eventData.aimRate /= 1.25;
		},
	},

	finalStand: {
		name: "Final Stand",
		tags: [ 'special' ],
		overrules: [ 'crackdown', 'disarray' ],
		initialize(unit) {
			this.fatigue = 1.0;
			this.rankPenalty = 0;
		},
		acting(unit, eventData) {
			eventData.action.rank += this.rankPenalty;
			const damageEffects = from(eventData.action.effects)
				.where(it => it.targetHint == 'selected')
				.where(it => it.type == 'damage');
			for (const effect of damageEffects) {
				const oldPower = effect.power;
				effect.power = Math.round(effect.power / this.fatigue);
				if (effect.power != oldPower) {
					console.log(
						`effect Power changed by Final Stand to ${effect.power}`,
						`was: ${oldPower}`);
				}
			}
		},
		attacked(unit, eventData) {
			this.fatigue *= 1.25;
			++this.rankPenalty;
		},
		damaged(unit, eventData) {
			if (!from(eventData.tags).anyIs('zombie')) {
				eventData.amount *= this.fatigue;
			}
		},
	},

	frostbite: {
		name: "Frostbite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'ignite' ],
		attacked(unit, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				if ('addStatus' in effect && effect.addStatus == 'ignite') {
					delete effect.addStatus;
				}
			}
			let igniteEffects = from(eventData.action.effects)
				.where(it => it.type == 'addStatus' && it.status == 'ignite');
			for (const effect of igniteEffects) {
				effect.type = null;
			}
		},
		damaged(unit, eventData) {
			if (from(eventData.tags).anyIs('fire')) {
				eventData.amount *= 1.5;
				console.log("Frostbite neutralized by fire, damage increased");
				unit.liftStatus('frostbite');
			}
		},
		endTurn(unit, eventData) {
			const unitInfo = unit.battlerInfo;
			const base = Maths.hp(unitInfo, unitInfo.level, 1);
			unit.takeDamage(0.03 * base, [ 'ice', 'special' ]);
		},
	},

	ghost: {
		name: "Ghost",
		tags: [ 'ailment', 'undead' ],
		overrules: [ 'zombie' ],
		aiming(unit, eventData) {
			for (let i = 0; i < eventData.action.effects.length; ++i) {
				let effect = eventData.action.effects[i];
				if (effect.type != 'damage' || effect.damageType == 'magic')
					continue;
				if (!from(eventData.targetInfo.statuses).anyIs('ghost'))
					eventData.aimRate = 0.0;
			}
		},
		attacked(unit, eventData) {
			for (let i = 0; i < eventData.action.effects.length; ++i) {
				let effect = eventData.action.effects[i];
				if (effect.type != 'damage' || effect.damageType == 'magic')
					continue;
				if (!from(eventData.actingUnitInfo.statuses).anyIs('ghost'))
					eventData.action.accuracyRate = 0.0;
			}
		},
	},

	ignite: {
		name: "Ignite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'frostbite' ],
		beginCycle(unit, eventData) {
			const unitInfo = unit.battlerInfo;
			const base = Maths.hp(unitInfo, unitInfo.level, 1);
			unit.takeDamage(0.01 * base, [ 'fire', 'special' ]);
		},
		attacked(unit, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				if ('addStatus' in effect && effect.addStatus == 'frostbite')
					delete effect.addStatus;
			}
			let frostbiteEffects = from(eventData.action.effects)
				.where(it => it.type == 'addStatus' && it.status == 'frostbite');
			for (const effect of frostbiteEffects)
				effect.type = null;
		},
		damaged(unit, eventData) {
			if (from(eventData.tags).anyIs('ice')) {
				eventData.amount *= 1.5;
				console.log("Ignite neutralized by ice, damage increased");
				unit.liftStatus('ignite');
			}
		},
	},

	immune: {
		name: "Immune",
		tags: [ 'buff' ],
		expiration: { beginTurn: 5 },
		afflicted(unit, eventData) {
			let statusDef = Statuses[eventData.statusID];
			if (from(statusDef.tags).anyIs('ailment')) {
				console.log(`status ${statusDef.name} was blocked by Immune`);
				eventData.cancel = true;
			}
		},
	},

	offGuard: {
		name: "Off Guard",
		tags: [ 'special' ],
		expiration: { beginTurn: 1 },
		damaged(unit, eventData) {
			if (eventData.actingUnit !== null)
				eventData.amount *= 1.5;
		},
	},

	protect: {
		name: "Protect",
		tags: [ 'buff' ],
		expiration: { beginTurn: 5 },
		damaged(unit, eventData) {
			let isProtected = !from(eventData.tags).anyIn([ 'special', 'zombie' ]);
			if (isProtected)
				eventData.amount /= 1.5;
		},
	},

	reGen: {
		name: "ReGen",
		tags: [ 'buff' ],
		beginCycle(unit, eventData) {
			const unitInfo = unit.battlerInfo;
			const cap = Maths.hp(unitInfo, unitInfo.level, 1);
			unit.heal(0.05 * cap, [ 'cure' ]);
		},
	},

	skeleton: {
		name: "Skeleton",
		tags: [ 'ailment', 'undead' ],
		overrules: [ 'ghost', 'zombie' ],
		statModifiers: {
			str: 0.5,
			mag: 0.5,
		},
		initialize(unit) {
			this.allowDeath = false;
		},
		cured(unit, eventData) {
			if (eventData.statusID == 'skeleton') {
				unit.heal(1, [], true);
			}
		},
		damaged(unit, eventData) {
			this.allowDeath = from(eventData.tags)
				.anyIn([ 'zombie', 'physical', 'sword', 'earth', 'omni' ]);
			if (!this.allowDeath) {
				eventData.cancel = true;
			}
		},
		dying(unit, eventData) {
			eventData.cancel = !this.allowDeath;
		},
		healed(unit, eventData) {
			if (from(eventData.tags).anyIs('cure')) {
				unit.takeDamage(eventData.amount, [ 'zombie' ]);
			}
			eventData.cancel = true;
		},
	},

	sniper: {
		name: "Sniper",
		tags: [ 'special' ],
		expiration: { beginTurn: 1 },
		damaged(unit, eventData) {
			if (!from(eventData.tags).anyIn([ 'special', 'zombie' ])) {
				eventData.amount *= 1.5;
				unit.clearQueue();
				unit.liftStatus('sniper');
				unit.resetCounter(1);
			}
		},
	},

	sleep: {
		name: "Sleep",
		tags: [ 'acute' ],
		overrules: [ 'drunk', 'offGuard' ],
		initialize(unit) {
			unit.actor.animate('sleep');
			this.wakeChance = 0.0;
		},
		beginCycle(unit, eventData) {
			if (Random.chance(this.wakeChance)) {
				unit.liftStatus('sleep');
			}
			this.wakeChance += 0.01;
		},
		beginTurn(unit, eventData) {
			eventData.skipTurn = true;
			unit.actor.animate('snore');
		},
		damaged(unit, eventData) {
			let healthLost = 100 * eventData.amount / unit.maxHP;
			if (Random.chance(healthLost * 5 * this.wakeChance)
				&& eventData.tags.indexOf('magic') === -1
				&& eventData.tags.indexOf('special') === -1)
			{
				unit.liftStatus('sleep');
			}
		},
	},

	specsAura: {
		name: "Specs Aura",
		tags: [ 'special' ],
		beginCycle(unit, eventData) {
			unit.heal(0.01 * unit.maxHP, [ 'specs' ]);
		},
	},

	winded: {
		name: "Winded",
		tags: [ 'special' ],
		expiration: { beginTurn: 1 },
		damaged(unit, eventData) {
			if (eventData.actingUnit !== null)
				eventData.amount *= 1.5;
		},
	},

	zombie: {
		name: "Zombie",
		tags: [ 'ailment', 'undead' ],
		healed(unit, eventData) {
			if (from(eventData.tags).anyIn([ 'cure', 'specs' ])) {
				let damageTags = from(eventData.tags).anyIs('specs')
					? [ 'zombie', 'specs' ] : [ 'zombie' ];
				unit.takeDamage(eventData.amount, damageTags);
				eventData.cancel = true;
			}
		},
	},
};
