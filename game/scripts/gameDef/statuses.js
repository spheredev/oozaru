/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '/game/lib/sphere-runtime.js';

import { Stance } from '../battleSystem/index.js';

import { Game } from './game.js';
import { Maths } from './maths.js';

export
const Statuses =
{
	// Crackdown status
	// Progressively lowers attack power when the same type of attack is used in succession.
	crackdown: {
		name: "Crackdown",
		tags: [ 'debuff' ],
		initialize(unit) {
			this.lastSkillType = null;
			this.multiplier = 1.0;
		},
		acting(unit, eventData) {
			for (const effect of from(eventData.action.effects)
				.where(it => it.type == 'damage'))
			{
				let oldPower = effect.power;
				effect.power = Math.max(Math.round(effect.power * this.multiplier), 1);
				if (effect.power != oldPower) {
					console.log(`outgoing POW modified by Crackdown to ${effect.power}`,
						`was: ${oldPower}`);
				}
			}
		},
		useSkill(unit, eventData) {
			let oldMultiplier = this.multiplier;
			this.multiplier = eventData.skill.category == this.lastSkillType
				? this.multiplier / Game.bonusMultiplier
				: 1.0;
			this.lastSkillType = eventData.skill.category;
			if (this.multiplier != oldMultiplier) {
				if (this.multiplier < 1.0) {
					console.log("Crackdown POW modifier dropped to ~" + Math.round(this.multiplier * 100) + "%");
				}
				else {
					console.log("Crackdown POW modifier reset to 100%");
				}
			}
		},
	},

	// Curse status
	// Prevents the affected unit from taking on beneficial statuses such as ReGen and Protect.
	// Wears off after 5 turns.
	curse: {
		name: "Curse",
		tags: [ 'debuff' ],
		initialize(unit) {
			unit.liftStatusTags([ 'buff' ]);
			this.turnsLeft = 5;
		},
		afflicted(unit, eventData) {
			let statusDef = Statuses[eventData.statusID];
			if (from(statusDef.tags).anyIs('buff')) {
				console.log("Status " + statusDef.name + " was blocked by Curse");
				eventData.cancel = true;
			}
		},
		beginTurn(unit, eventData) {
			if (this.turnsLeft <= 0) {
				console.log(unit.name + "'s Curse has expired");
				unit.liftStatus('curse');
			}
			else {
				console.log(unit.name + "'s Curse will expire in " + this.turnsLeft + " more turns");
			}
			--this.turnsLeft;
		},
	},

	// Delusion status
	// ...
	delusion: {
		name: "Delusion",
		tags: [ 'ailment', 'acute' ],
		//TODO: implement Delusion status
	},

	// Disarray status
	// Randomizes the rank of any action, excluding stance changes, taken by the affected unit.
	// Expires after 3 actions.
	disarray: {
		name: "Disarray",
		tags: [ 'ailment', 'acute' ],
		initialize(unit) {
			this.actionsTaken = 0;
		},
		acting(unit, eventData) {
			let oldRank = eventData.action.rank;
			eventData.action.rank = Random.discrete(1, 5);
			if (eventData.action.rank != oldRank) {
				console.log("Rank of action changed by Disarray to " + eventData.action.rank,
					"was: " + oldRank);
			}
			++this.actionsTaken;
			console.log(this.actionsTaken < 3
				? unit.name + "'s Disarray will expire in " + (3 - this.actionsTaken) + " more action(s)"
				: unit.name + "'s Disarray has expired");
			if (this.actionsTaken >= 3) {
				unit.liftStatus('disarray');
			}
		},
	},

	// Drunk status
	// Increases attack power, but reduces the affected unit's speed and accuracy and
	// creates a weakness to Earth damage. Also ups the success rate of eaty moves
	// (e.g. Munch).
	drunk: {
		name: "Drunk",
		tags: [ 'acute' ],
		overrules: [ 'immune' ],
		statModifiers: {
			agi: 1 / Game.bonusMultiplier,
		},
		ignoreEvents: [
			'itemUsed',
			'skillUsed',
			'unitDamaged',
			'unitHealed',
			'unitTargeted',
		],
		initialize(unit) {
			this.turnsLeft = 7;
		},
		acting(unit, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.targetHint === 'selected')
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				let oldPower = effect.power;
				effect.power *= Game.bonusMultiplier;
				if (effect.power != oldPower) {
					console.log("Outgoing POW modified by Drunk to " + effect.power,
						"was: " + oldPower);
				}
			}
		},
		aiming(unit, eventData) {
			if (eventData.action.accuracyType === 'devour')
				eventData.aimRate *= Game.bonusMultiplier;
			else
				eventData.aimRate /= Game.bonusMultiplier;
		},
		beginTurn(unit, eventData) {
			--this.turnsLeft;
			if (this.turnsLeft <= 0)
				unit.liftStatus('drunk');
		},
		damaged(unit, eventData) {
			if (from(eventData.tags).anyIs('earth'))
				eventData.amount *= Game.bonusMultiplier;
		},
	},

	// Fear status
	// Causes the affected unit to automatically Guard or use healing items instead
	// of attacking.
	fear: {
		name: "Fear",
		tags: [ 'ailment' ],
		//TODO: implement Fear status
	},

	// Final Stand status
	// Progressively weakens and causes knockback delay to the affected unit when an
	// attack is countered.
	finalStand: {
		name: "Final Stand",
		tags: [ 'special' ],
		overrules: [ 'crackdown', 'disarray' ],
		initialize(unit) {
			this.fatigue = 1.0;
			this.knockback = 5;
		},
		acting(unit, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.targetHint == 'selected')
				.where(it => it.type == 'damage');
			for (const effect of damageEffects) {
				let oldPower = effect.power;
				effect.power = Math.round(effect.power / this.fatigue);
				if (effect.power != oldPower) {
					console.log("Outgoing POW modified by Final Stand to " + effect.power,
						"was: " + oldPower);
				}
			}
		},
		attacked(unit, eventData) {
			if (eventData.stance == Stance.Counter) {
				this.fatigue *= Game.bonusMultiplier;
				unit.resetCounter(this.knockback);
				++this.knockback;
			}
		},
		damaged(unit, eventData) {
			if (!from(eventData.tags).anyIs('zombie')) {
				eventData.amount *= this.fatigue;
			}
		},
	},

	// Frostbite status
	// Inflicts a small amount of Ice damage at the end of the affected unit's turn.
	// The effect progressively worsens, up to double its original severity.
	frostbite: {
		name: "Frostbite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'ignite' ],
		initialize(unit) {
			this.multiplier = 1.0;
		},
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
			if (from(eventData.tags).anyIs('fire') && unit.stance != Stance.Guard) {
				eventData.amount *= Game.bonusMultiplier;
				console.log("Frostbite neutralized by fire, damage increased");
				unit.liftStatus('frostbite');
			}
		},
		endTurn(unit, eventData) {
			let vit = Maths.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(0.5 * vit * this.multiplier, [ 'ice', 'special' ]);
			this.multiplier = Math.min(this.multiplier + 0.1, 2.0);
		},
	},

	// Ghost status
	// Prevents the affected unit from being hit with physical or projectile attacks
	// from a non-Ghost and vice versa.
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

	// Ignite status
	// Inflicts a small amount of Fire damage on the affected unit once per cycle. The
	// effect progressively diminishes, ultimately settling at half of its initial severity.
	ignite: {
		name: "Ignite",
		tags: [ 'ailment', 'damage' ],
		overrules: [ 'frostbite' ],
		initialize(unit) {
			this.multiplier = 1.0;
		},
		beginCycle(unit, eventData) {
			let vit = Maths.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(0.5 * vit * this.multiplier, [ 'fire', 'special' ]);
			this.multiplier = Math.max(this.multiplier - 0.05, 0.5);
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
			if (from(eventData.tags).anyIs('ice') && unit.stance != Stance.Guard) {
				eventData.amount *= Game.bonusMultiplier;
				console.log("Ignite neutralized by ice, damage increased");
				unit.liftStatus('ignite');
			}
		},
	},

	// Immune status
	// Grants the affected unit full immunity to most negative status afflictions.
	// Wears off after 5 turns.
	immune: {
		name: "Immune",
		tags: [ 'buff' ],
		initialize(unit) {
			this.turnsLeft = 5;
		},
		afflicted(unit, eventData) {
			let statusDef = Statuses[eventData.statusID];
			if (from(statusDef.tags).anyIs('ailment')) {
				console.log("Status " + statusDef.name + " was blocked by Immune");
				eventData.cancel = true;
			}
		},
		beginTurn(unit, eventData) {
			if (this.turnsLeft <= 0) {
				console.log(unit.name + "'s Immune has expired");
				unit.liftStatus('immune');
			}
			else {
				console.log(unit.name + "'s Immune will expire in " + this.turnsLeft + " more turns");
			}
			--this.turnsLeft;
		},
	},

	// Off Guard status
	// Inflicted during the first turn of an attack launched from Charge Stance. If
	// the unit is attacked while Off Guard, damage will be increased.
	offGuard: {
		name: "Off Guard",
		tags: [ 'special' ],
		beginTurn(unit, eventData) {
			unit.liftStatus('offGuard');
		},
		damaged(unit, eventData) {
			if (eventData.actingUnit !== null)
				eventData.amount *= Game.bonusMultiplier;
		},
	},

	// Protect status
	// Reduces damage from attacks. Each time the Protected unit is damaged by an attack,
	// the effectiveness of Protect is reduced.
	protect: {
		name: "Protect",
		tags: [ 'buff' ],
		initialize(unit) {
			this.multiplier = 1 / Game.bonusMultiplier;
			this.lossPerHit = (1.0 - this.multiplier) / 10;
		},
		damaged(unit, eventData) {
			let isProtected = !from(eventData.tags).anyIn([ 'special', 'zombie' ]);
			if (isProtected) {
				eventData.amount *= this.multiplier;
				this.multiplier += this.lossPerHit;
				if (this.multiplier >= 1.0) {
					unit.liftStatus('protect');
				}
			}
		},
	},

	// ReGen status
	// Restores a small amount of HP to the affected unit at the beginning of each
	// cycle. Wears off after 10 cycles.
	reGen: {
		name: "ReGen",
		tags: [ 'buff' ],
		initialize(unit) {
			this.turnsLeft = 10;
		},
		beginCycle(unit, eventData) {
			let unitInfo = unit.battlerInfo;
			let cap = Maths.hp(unitInfo, unitInfo.level, 1);
			unit.heal(cap / 10, [ 'cure' ]);
			--this.turnsLeft;
			if (this.turnsLeft <= 0) {
				console.log(unit.name + "'s ReGen has expired");
				unit.liftStatus('reGen');
			}
			else {
				console.log(unit.name + "'s ReGen will expire in " + this.turnsLeft + " more cycle(s)");
			}
		},
	},

	// Skeleton status
	// The affected unit is still able to battle at 0 HP, but with reduced STR and MAG stats.
	// Taking physical or slash damage, or being hit with an HP restorative, while in this state will
	// result in death.
	skeleton: {
		name: "Skeleton",
		tags: [ 'ailment', 'undead' ],
		overrules: [ 'ghost', 'zombie' ],
		statModifiers: {
			str: 1 / Game.bonusMultiplier,
			mag: 1 / Game.bonusMultiplier,
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
		beginTurn(unit, eventData) {
			unit.liftStatus('sniper');
		},
		damaged(unit, eventData) {
			if (!from(eventData.tags).anyIn([ 'special', 'zombie' ])) {
				eventData.amount *= Game.bonusMultiplier;
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

	// Specs Aura status
	// Restores a tiny amount of HP to the affected unit at the beginning of each
	// cycle. Similar to ReGen, except the effect is perpetual and less HP is recovered per
	// cycle.
	specsAura: {
		name: "Specs Aura",
		tags: [ 'special' ],
		beginCycle(unit, eventData) {
			unit.heal(0.01 * unit.maxHP, [ 'specs' ]);
		},
	},

	// Winded status
	// Inflicted after a using a particularly powerful attack, takes one turn
	// to recover from.  Increases damage taken from attacks.
	winded: {
		name: "Winded",
		tags: [ 'special' ],
		beginTurn(unit, eventData) {
			unit.liftStatus('winded');
		},
		damaged(unit, eventData) {
			if (eventData.actingUnit !== null)
				eventData.amount *= Game.bonusMultiplier;
		},
	},

	// Zombie status
	// Causes magic and items which restore HP to inflict an equal amount of damage instead.
	// If the affected unit reaches 0 HP, this status will progress to Skeleton and
	// the unit will be allowed to continue battling. Converted HP restoratives will
	// kill outright, however.
	zombie: {
		name: "Zombie",
		tags: [ 'ailment', 'undead' ],
		initialize(unit) {
			this.allowDeath = false;
		},
		damaged(unit, eventData) {
			// don't allow Specs Aura to kill the afflicted.
			this.allowDeath = from(eventData.tags).anyIs('zombie')
				&& !from(eventData.tags).anyIs('specs');
		},
		dying(unit, eventData) {
			if (!this.allowDeath) {
				unit.addStatus('skeleton');
				eventData.cancel = true;
			}
		},
		healed(unit, eventData) {
			if (from(eventData.tags).anyIn([ 'cure', 'specs' ])) {
				let damageTags = from(eventData.tags).anyIs('specs')
					? [ 'zombie', 'specs' ]
					: [ 'zombie' ];
				unit.takeDamage(eventData.amount, damageTags);
				eventData.cancel = true;
			}
		},
	},
};
