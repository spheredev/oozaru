/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { from, Random } from 'sphere-runtime';

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class ScottTempleAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.definePhases([ 10000, 5000 ], 100);
		this.defaultSkill = 'swordSlash';

		this.omniCounter = 'tenPointFive';
		this.useQSNext = false;
	}

	strategize()
	{
		if (this.useQSNext || Random.chance(0.50)) {
			const turns = this.predictSkillTurns('quickstrike');
			this.useQSNext = turns[0].unit === this.unit;
			this.queueSkill(this.useQSNext ? 'quickstrike' : 'swordSlash');
		}
		else {
			const turns = this.predictSkillTurns('heal');
			if (turns[0].unit === this.unit)
				this.queueSkill('heal');
			const spellID = Random.sample([ 'hellfire', 'windchill', 'upheaval' ]);
			this.queueSkill(spellID);
		}
	}

	on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
		case 1:
			this.queueSkill('omni', Stance.Normal, 'elysia');
			break;
		case 2:
			this.queueSkill(this.omniCounter);
			break;
		}
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		if (skillID === 'salve' && userID !== 'scottTemple')
			this.omniCounter = 'discharge';
		if (skillID === 'omni' && userID !== 'scottTemple' && this.turnsTaken > 0) {
			if (Random.chance(0.25 * (this.phase - 1)))
				this.queueSkill(this.omniCounter);
		}
	}

	on_unitReady(unitID)
	{
		if (unitID !== 'scottTemple')
			this.useQSNext = false;
	}
}
