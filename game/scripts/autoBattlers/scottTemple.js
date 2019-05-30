/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random } from '../../lib/sphere-runtime.js';

import { AutoBattler } from '../battleSystem/index.js';

export default
class ScottTempleAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.definePhases([ 9000, 3000 ], 100);
		this.defaultSkill = 'swordSlash';

		this.healingItems = [ 'tonic', 'powerTonic', 'fullTonic' ];
	}

	strategize(stance, phase)
	{
		switch (phase) {
			case 1: {
				let qsTurns = this.predictSkillTurns('quickstrike');
				if (qsTurns[0].unit === this.unit) {
					this.queueSkill('quickstrike');
				}
				else if (Random.chance(0.25)) {
					if (this.battle.hasCondition('inferno'))
						this.queueSkill('hellfire');
					else if (this.battle.hasCondition('subzero'))
						this.queueSkill('windchill');
					else
						this.queueSkill(Random.sample([ 'inferno', 'subzero' ]));
				}
				else {
					this.queueSkill(Random.sample([ 'flare', 'chill', 'lightning', 'quake', 'heal' ]));
				}
				break;
			}
			case 2: {
				if (this.isQSComboStarted) {
					let qsTurns = this.predictSkillTurns('quickstrike');
					if (qsTurns[0].unit === this.unit) {
						this.queueSkill('quickstrike');
					}
					else {
						let skillToUse = Random.sample([ 'flare', 'chill', 'lightning', 'quake' ]);
						this.queueSkill(this.isSkillUsable(skillToUse) ? skillToUse : 'swordSlash');
					}
				}
				else if (this.movesTillReGen <= 0 && this.isSkillUsable('rejuvenate')) {
					this.queueSkill('rejuvenate');
					this.queueSkill('chargeSlash');
					this.movesTillReGen = Random.discrete(3, 5);
				}
				else {
					--this.movesTillReGen;
					let skillToUse = this.unit.hasStatus('reGen')
						? Random.sample([ 'hellfire', 'windchill', 'upheaval', 'quickstrike' ])
						: Random.sample([ 'hellfire', 'windchill', 'upheaval', 'quickstrike', 'heal' ]);
					skillToUse = this.isSkillUsable(skillToUse) ? skillToUse : 'quickstrike';
					if (skillToUse != 'quickstrike') {
						this.queueSkill(skillToUse);
					}
					else {
						let qsTurns = this.predictSkillTurns(skillToUse);
						if (qsTurns[0].unit === this.unit) {
							this.isQSComboStarted = true;
							this.queueSkill(skillToUse);
						}
						else {
							this.queueSkill('chargeSlash');
						}
					}
				}
				break;
			}
			case 3: {
				if (this.isQSComboStarted) {
					let qsTurns = this.predictSkillTurns('quickstrike');
					this.queueSkill(qsTurns[0].unit === this.unit ? 'quickstrike' : 'swordSlash');
				}
				else if (!this.battle.hasCondition('generalDisarray') && Random.chance(0.5)) {
					this.queueSkill('tenPointFive');
				}
				else {
					let skillToUse = Random.sample([ 'quickstrike',
						'hellfire', 'windchill', 'electrocute', 'upheaval',
						'flare', 'chill', 'lightning', 'quake', 'heal' ]);
					this.queueSkill(this.isSkillUsable(skillToUse) ? skillToUse
						: Random.sample([ 'swordSlash', 'quickstrike', 'chargeSlash' ]));
					if (this.isSkillQueued('quickstrike')) {
						let qsTurns = this.predictSkillTurns('quickstrike');
						this.isQSComboStarted = qsTurns[0].unit === this.unit;
					}
				}
				break;
			}
		}
	}

	on_itemUsed(userID, itemID, targetIDs)
	{
		if (this.unit.hasStatus('offGuard'))
			return;

		if (from(this.healingItems).anyIs(itemID)
			&& !from(targetIDs).anyIs('scottTemple')
			&& Random.chance(0.5))
		{
			this.queueSkill('jolt', targetIDs[0]);
		}
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1: {
				this.queueSkill('omni', 'elysia');
				let spellID = Random.sample([ 'inferno', 'subzero' ]);
				this.phase2Opener = spellID === 'inferno' ? 'subzero' : 'inferno';
				this.queueSkill(spellID);
				break;
			}
			case 2: {
				this.queueSkill('rejuvenate');
				this.queueSkill(this.phase2Opener);
				this.isQSComboStarted = false;
				this.movesTillReGen = Random.discrete(3, 5);
				break;
			}
			case 3: {
				this.queueSkill(this.isSkillUsable('renewal')
					? 'renewal' : 'chargeSlash');
				this.isQSComboStarted = false;
				break;
			}
		}
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		if (this.unit.hasStatus('offGuard'))
			return;

		if (skillID == 'rejuvenate' && userID != 'scottTemple' && !from(targetIDs).anyIs('scottTemple')) {
			if (this.phase <= 1 && !this.isSkillQueued('chargeSlash'))
				this.queueSkill('chargeSlash', targetIDs[0]);
			else if (this.phase >= 2 && Random.chance(0.25))
				this.queueSkill('necromancy', targetIDs[0]);
		}
		else if (skillID == 'dispel' && from(targetIDs).anyIs('scottTemple')
			&& this.unit.hasStatus('reGen'))
		{
			this.queueSkill('jolt', userID);
			this.queueSkill('heal', userID);
		}
	}
}
