/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { from, Scene } from 'sphere-runtime';

import { ItemUsable } from './battleSystem/index.js';
import { Game } from './gameDef/index.js';
import GameSession from './gameSession.js';

export default
class TestHarness
{
	static async initialize()
	{
		console.log("initializing Specs Engine test harness");

		console.defineObject('harness', this, {
			run(testID) {
				if (!(testID in this.tests))
					return console.log(`unknown test ID '${testID}'`);
				this.run(testID);
			},
		});
		this.tests = {};
		this.isBattleRunning = false;

		const fileNames = from([ 'brucesStoryTests.js', 'lastLucidanTests.js' ])
			.besides(it => console.log(`loading testcases from '${it}'`))
			.select(it => `./testCases/${it}`);
		for (const fileName of fileNames)
			await import(fileName);
	}

	static addBattle(testID, setupData)
	{
		this.tests[testID] = {
			setup: setupData,
			async run() {
				if (TestHarness.isBattleRunning) {
					console.log("cannot start test battle, one is ongoing");
					return;
				}
				console.log("preparing test battle", `battleID: ${this.setup.battleID}`);
				const session = new GameSession();
				for (const characterID of Game.initialParty)
					session.party.remove(characterID);
				for (const id in this.setup.party) {
					const memberInfo = this.setup.party[id];
					session.party.add(id, memberInfo.level);
					if ('weapon' in memberInfo)
						session.party.members[id].setWeapon(memberInfo.weapon);
				}
				for (const itemID of this.setup.items)
					session.items.push(new ItemUsable(itemID));
				TestHarness.isBattleRunning = true;
				await new Scene()
					.battle(this.setup.battleID, session)
					.run();
				TestHarness.isBattleRunning = false;
			},
		};
		console.log(`adding battle test '${testID}'`);
	}

	static addTest(testID, func)
	{
		this.tests[testID] = {
			func: func,
			context: {},
			run() {
				this.func.call(this.context);
			},
		};
		console.defineObject(testID, this.tests[testID], {
			'test'(testID) {
				TestHarness.run(testID);
			},
		});
		console.log(`adding generic test '${testID}'`);
	}

	static async run(testID)
	{
		console.log(`launching test case '${testID}'`);
		await this.tests[testID].run(this.tests[testID].setup, testID);
	}
}
