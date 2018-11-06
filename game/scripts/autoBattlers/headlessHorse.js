/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '/game/lib/sphere-runtime.js';

import { AutoBattler } from '../battleSystem/index.js';

export default
class HeadlessHorseAI extends AutoBattler
{
	constructor(battleContext, unit)
	{
		super(battleContext, unit);

		this.definePhases([ 500 ], 50);
		this.defaultSkill = 'flare';

		this.damageTaken = {};
		this.ghosts = [];
		this.spectralDrawPending = true;
		this.trampleTarget = null;
	}

	strategize()
	{
		switch (this.phase) {
			case 1: {
				let hellfireTurns = this.predictSkillTurns('hellfire');
				if (!this.unit.hasStatus('ignite')) {
					this.queueSkill('hellfire', 'headlessHorse');
					if (from(hellfireTurns).any(it => it.unit.id === 'elysia'))
						this.queueSkill('spectralDraw', 'elysia');
				}
				else {
					this.queueSkill('rearingKick');
				}
				break;
			}
			case 2: {
				if (this.spectralDrawPending) {
					this.ghostTargetID = null;
					let maxValue = 0;
					for (let unitID in this.damageTaken) {
						if (this.damageTaken[unitID] > maxValue) {
							this.ghostTargetID = unitID;
							maxValue = this.damageTaken[unitID];
						}
						else if (this.damageTaken[unitID] == maxValue && Random.chance(0.5)) {
							this.ghostTargetID = unitID;
						}
					}
					this.queueSkill('spectralDraw', this.ghostTargetID);
					this.spectralDrawPending = false;
					this.trampleTarget = null;
				}
				else {
					this.queueSkill('flare');
				}
				break;
			}
		}
	}

	on_itemUsed(userID, itemID, targetIDs)
	{
	}

	on_phaseChanged(phase, lastPhase)
	{
		switch (phase) {
			case 1: {
				this.queueSkill('flameBreath');
				break;
			}
		}
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		if (from(targetIDs).anyIs('headlessHorse')) {
			let iceSkills = [ 'chillShot', 'chill', 'windchill' ];
			if (from(iceSkills).anyIs(skillID) && (this.unit.hasStatus('ignite') || this.unit.hasStatus('rearing')))
				this.trampleTarget = userID;
		}
	}

	on_unitDamaged(unit, amount, tags, actingUnit)
	{
		if (unit === this.unit && actingUnit !== null) {
			if (from(tags).anyIs('magic') && from(this.ghosts).anyIs(actingUnit.id))
				this.queueSkill('spectralKick', actingUnit.id);
			if (!(actingUnit.id in this.damageTaken))
				this.damageTaken[actingUnit.id] = 0;
			this.damageTaken[actingUnit.id] += amount;
		}
	}

	on_unitReady(unitID)
	{
		if (unitID == 'headlessHorse' && !this.hasMovesQueued && this.phase > 0) {
			if (this.trampleTarget !== null) {
				this.queueSkill('trample', this.trampleTarget);
				this.trampleTarget = null;
			}
		}
	}

	on_unitTargeted(unit, action, actingUnit)
	{
		if (unit === this.unit) {
			let isPhysical = from(action.effects)
				.where(it => it.type === 'damage')
				.any(it => it.damageType === 'physical' || it.element === 'earth');
			if (isPhysical && this.unit.hasStatus('rearing')) {
				if (this.trampleTarget === null)
					this.queueSkill('flameBreath');
				else if (this.trampleTarget !== null)
					this.trampleTarget = actingUnit.id;
			}
			let isMagic = from(action.effects)
				.where(it => it.type === 'damage')
				.any(it => it.damageType === 'magic');
			if (isMagic && this.unit.hasStatus('ghost') && actingUnit.id != this.ghostTargetID)
				this.queueSkill('spectralKick', actingUnit.id);
		}
	}
}
