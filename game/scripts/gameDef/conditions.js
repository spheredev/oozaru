/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '../../lib/sphere-runtime.js';

import { Game } from './game.js';
import { Maths } from './maths.js';

export
const Conditions =
{
	// Blackout field condition
	// Lowers accuracy and sometimes retargets attacks. Wears off after 10 actions.
	blackout:
	{
		name: "Blackout",

		initialize(battle) {
			this.actionsLeft = 10;
		},

		actionTaken(battle, eventData) {
			if (eventData.targets.length == 1 && Random.chance(0.5)) {
				let target = eventData.targets[0];
				let newTargets = Random.chance(0.5) ? battle.alliesOf(target) : battle.enemiesOf(target);
				eventData.targets = [ Random.sample(newTargets) ];
			}
			--this.actionsLeft;
			if (this.actionsLeft <= 0) {
				console.log("Blackout has expired");
				battle.liftCondition('blackout');
			}
			else {
				console.log("Blackout will expire in " + this.actionsLeft + " more action(s)");
			}
		},
	},

	// General Disarray field condition
	// Randomizes the move rank of any skill or item used. Wears off after
	// 15 actions have been taken.
	generalDisarray:
	{
		name: "G. Disarray",

		initialize(battle) {
			this.actionsLeft = 15;
		},

		actionTaken(battle, eventData) {
			let oldRank = eventData.action.rank;
			eventData.action.rank = Random.discrete(1, 5);
			if (eventData.action.rank != oldRank) {
				console.log("Rank of action changed by G. Disarray to " + eventData.action.rank,
					"was: " + oldRank);
			}
			--this.actionsLeft;
			if (this.actionsLeft > 0) {
				console.log("G. Disarray will expire in " + this.actionsLeft + " more action(s)");
			}
			else {
				console.log("G. Disarray has expired");
				battle.liftCondition('generalDisarray');
			}
		},
	},

	// Healing Aura field condition
	// Restores a small amount of health to a random battler at the beginning of
	// each cycle. Wears off after 25 healings.
	healingAura:
	{
		name: "Healing Aura",

		initialize(battle) {
			this.cyclesLeft = 25;
		},

		beginCycle(battle, eventData) {
			let units = from(battle.battleUnits)
				.where(it => it.isAlive())
				.toArray();
			let unit = Random.sample(units);
			let vit = Maths.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.heal(vit, [ 'cure' ]);
			--this.cyclesLeft;
			if (this.cyclesLeft <= 0) {
				console.log("Healing Aura has expired");
				battle.liftCondition('healingAura');
			}
			else {
				console.log("Healing Aura will expire in " + this.cyclesLeft + " more cycle(s)");
			}
		},
	},

	// Inferno field condition
	// Inflicts a small amount of Fire damage on all battlers at the beginning of a
	// cycle and boosts any Fire attacks performed. Residual damage from Inferno diminishes
	// over time, eventually settling at half the original output.
	inferno:
	{
		name: "Inferno",

		initialize(battle) {
			let frostbittenUnits = from(battle.battleUnits)
				.where(it => it.isAlive())
				.where(it => it.hasStatus('frostbite'));
			for (const unit of frostbittenUnits) {
				console.log(unit.name + "'s Frostbite nullified by Inferno installation");
				unit.liftStatus('frostbite');
			}
		},

		actionTaken(battle, eventData) {
			let damageEffects = from(eventData.action.effects)
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				if (effect.element == 'fire') {
					let oldPower = effect.power;
					effect.power = Math.round(effect.power * Game.bonusMultiplier);
					console.log("Fire attack strengthened by Inferno to " + effect.power + " POW",
						"was: " + oldPower);
				}
				else if (effect.element == 'ice') {
					let oldPower = effect.power;
					effect.power = Math.round(effect.power / Game.bonusMultiplier);
					console.log("Ice attack weakened by Inferno to " + effect.power + " POW",
						"was: " + oldPower);
				}
			}
		},

		beginCycle(battle, eventData) {
			let units = from(battle.battleUnits)
				.where(it => it.isAlive())
				.toArray();
			let unit = Random.sample(units);
			let vit = Maths.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
			unit.takeDamage(vit, [ 'special', 'fire' ]);
		},

		conditionInstalled(battle, eventData) {
			if (eventData.conditionID == 'subzero') {
				console.log("Inferno canceled by Subzero installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('inferno');
				from(battle.battleUnits)
					.where(it => it.isAlive())
					.each(it => it.addStatus('zombie', true));
			}
		},

		unitAfflicted(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				console.log("Frostbite is incompatible with Inferno");
			}
		},
	},

	// Subzero field condition
	// Inflicts a small amount of Ice damage on a battler at the end of his turn.
	// The effect intensifies over time per battler, maxing out at double its original
	// output.
	subzero:
	{
		name: "Subzero",

		initialize(battle) {
			this.multiplier = 1.0;
			this.rank = 0;
			let unitsAlive = from(battle.battleUnits)
				.where(it => it.isAlive());
			for (const unit of unitsAlive) {
				if (unit.hasStatus('frostbite')) {
					console.log(unit.name + "'s Frostbite overruled by Subzero installation");
					unit.liftStatus('frostbite');
				}
				if (unit.hasStatus('ignite')) {
					console.log(unit.name + "'s Ignite nullified by Subzero installation");
					unit.liftStatus('ignite');
				}
			}
		},

		actionTaken(battle, eventData) {
			this.rank = eventData.action.rank;
			let damageEffects = from(eventData.action.effects)
				.where(it => it.type === 'damage');
			for (const effect of damageEffects) {
				if (effect.element == 'ice') {
					let oldPower = effect.power;
					effect.power = Math.round(effect.power * Game.bonusMultiplier);
					console.log("Ice attack strengthened by Subzero to " + effect.power + " POW",
						"was: " + oldPower);
				}
				else if (effect.element == 'fire') {
					let oldPower = effect.power;
					effect.power = Math.round(effect.power / Game.bonusMultiplier);
					console.log("Fire attack weakened by Subzero to " + effect.power + " POW",
						"was: " + oldPower);
				}
			}
		},

		conditionInstalled(battle, eventData) {
			if (eventData.conditionID == 'inferno') {
				console.log("Subzero canceled by Inferno installation, both suppressed");
				eventData.cancel = true;
				battle.liftCondition('subzero');
				from(battle.battleUnits)
					.where(it => it.isAlive())
					.each(it => it.addStatus('zombie', true));
			}
		},

		endTurn(battle, eventData) {
			let unit = eventData.actingUnit;
			if (unit.isAlive() && this.rank != 0) {
				let vit = Maths.statValue(unit.battlerInfo.baseStats.vit, unit.battlerInfo.level);
				unit.takeDamage(this.rank * vit * this.multiplier / 5, [ 'special', 'ice' ]);
				let increment = 0.1 * this.rank / 5;
				this.multiplier = Math.min(this.multiplier + increment, 2.0);
			}
			this.rank = 0;
		},

		unitAfflicted(battle, eventData) {
			if (eventData.statusID == 'frostbite') {
				eventData.cancel = true;
				console.log("Frostbite infliction overruled by Subzero");
			}
			else if (eventData.statusID == 'ignite') {
				eventData.cancel = true;
				console.log("Ignite is incompatible with Subzero");
			}
		},
	},

	// Thunderstorm field condition
	// Sometimes drops a lightning bolt on a unit at the end of their turn, dealing a small amount
	// of lightning damage and inflicting Zombie status. Wears off after 10 strikes.
	thunderstorm:
	{
		name: "Thunderstorm",

		initialize(battle) {
			this.strikesLeft = 10;
		},

		endTurn(battle, eventData) {
			if (Random.chance(0.5)) {
				let unit = eventData.actingUnit;
				console.log(unit.name + " struck by lightning from Thunderstorm");
				let level = battle.getLevel();
				let attack = Maths.statValue(100, level);
				let defense = Maths.statValue(0, level);
				let damage = Maths.damage.calculate(5, battle.getLevel(), unit.tier, attack, defense);
				unit.takeDamage(damage, [ 'special', 'lightning' ]);
				unit.liftStatusTags('buff');
				--this.strikesLeft;
				if (this.strikesLeft <= 0) {
					console.log("Thunderstorm has expired");
					battle.liftCondition('thunderstorm');
				}
				else {
					console.log("Thunderstorm will expire in " + this.strikesLeft + " more strike(s)");
				}
			}
		},
	},
};
