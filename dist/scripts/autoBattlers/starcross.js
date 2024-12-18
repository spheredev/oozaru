/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { from, Random } from 'sphere-runtime';

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class ScottStarcrossAI extends AutoBattler
{
	constructor(battleContext, unit)
	{
		super(battleContext, unit);

		this.definePhases([ 14000, 9000, 4000 ], 100);
		this.defaultSkill = 'swordSlash';

		// Scott's move combos
		// Each entry should include the following properties:
		//     phase:  The earliest phase in which the combination will be used.
		//     moves:  The list of moves that make up the combination. Moves will be performed
		//             in the order they are listed.
		//     rating: The power rating of the combination. When combos are chosen at the
		//             start of a combo cycle, the lower-rated combo will typically be used as a
		//             decoy.
		this.combos = [
			{ phase: 1, moves: [ 'electrocute', 'heal' ], rating: 1 },
			{ phase: 1, moves: [ 'hellfire', 'windchill' ], rating: 2 },
			{ phase: 1, moves: [ 'windchill', 'hellfire' ], rating: 2 },
			{ phase: 2, weaponID: 'powerBow', moves: [ 'flareShot', 'chillShot' ], rating: 2 },
			{ phase: 2, moves: [ 'necromancy', 'rejuvenate' ], rating: 3 },
			{ phase: 3, moves: [ 'necromancy', 'rejuvenate', 'renew' ], rating: 4 },
			{ phase: 3, moves: [ 'electrocute', 'heal', 'rejuvenate' ], rating: 4 },
			{ phase: 4, moves: [ 'inferno', 'subzero', 'renew' ], rating: 5 }
		];

		this.isOpenerPending = true;
		this.tactics = null;
		this.targetingMode = 'random';
		this.weaponID = 'templeSword';
	}

	strategize()
	{
		if (this.isOpenerPending) {
			this.queueSkill('berserkCharge', 'bruce');
			this.isOpenerPending = false;
		} else {
			if (this.tactics === null) {
				let targets = from(this.battle.enemiesOf(this.unit))
					.shuffle()
					.toArray();
				let combos = from(this.combos)
					.where(it => this.phase >= it.phase)
					.random(targets.length)
					.descending(it => it.rating)
					.toArray();
				this.tactics = [];
				for (let i = 0; i < targets.length; ++i)
					this.tactics.push({ moves: combos[i].moves, moveIndex: 0, unit: targets[i] });
			}
			this.tactics = from(this.tactics)
				.where(it => it.unit.isAlive())
				.where(it => it.moveIndex < it.moves.length)
				.toArray();
			let tactic;
			do {
				tactic = Random.sample(this.tactics);
			} while (tactic === this.tactics[0] && tactic.moveIndex == tactic.moves.length - 1
				&& this.tactics.length > 1);
			this.queueSkill(tactic.moves[tactic.moveIndex], tactic.unit.id);
			++tactic.moveIndex;
			if (this.tactics[0].moveIndex == this.tactics[0].moves.length) {
				this.tactics = null;
			}
		}
	}
}