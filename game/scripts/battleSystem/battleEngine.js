/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Music, Random, Thread } from '/game/lib/sphere-runtime.js';

import { Animations, Battles, Characters, Game, Maths, MoveEffects } from '../gameDef/index.js';
import { clone } from '../utilities.js';

import BattleResult from './battleResult.js';
import BattleScreen from './battleScreen.js';
import BattleUnit from './battleUnit.js';
import FieldCondition from './fieldCondition.js';
import MPPool from './mpPool.js';
import Row from './row.js';

export default
class BattleEngine extends Thread
{
	constructor(session, battleID)
	{
		if (!(battleID in Battles))
			throw new ReferenceError(`no encounter data for '${battleID}'`);

		super();

		console.log(`initialize battle engine for '${battleID}'`);
		this.aiList = [];
		this.battleID = battleID;
		this.mode = null;
		this.parameters = Battles[battleID];
		this.partyMPPool = null;
		this.session = session;
		this.suspendCount = 0;
		this.timer = 0;
		this.battleLevel = 'battleLevel' in this.parameters
			? this.parameters.battleLevel
			: session.party.level;
	}

	addCondition(conditionID)
	{
		if (this.hasCondition(conditionID))
			return;  // nop if already installed
		let eventData = { conditionID: conditionID, cancel: false };
		this.raiseEvent('conditionInstalled', eventData);
		if (!eventData.cancel) {
			let effect = new FieldCondition(eventData.conditionID, this);
			this.conditions.push(effect);
			console.log(`install field condition ${effect.name}`);
		}
		else {
			console.log(`cancel FC '${conditionID}' per existing FC`);
		}
	}

	alliesOf(unit)
	{
		if (unit.isPartyMember())
			return this.playerUnits;
		else
			return this.enemyUnits;
	}

	areEnemies(unit1, unit2)
	{
		return from(this.enemiesOf(unit1))
			.anyIs(unit2);
	}

	enemiesOf(unit)
	{
		if (unit.isPartyMember())
			return this.enemyUnits;
		else
			return this.playerUnits;
	}

	findUnit(unitID)
	{
		let unit = from(this.enemyUnits, this.playerUnits)
			.first(it => it.id == unitID);
		return unit !== undefined ? unit : null;
	}

	getLevel()
	{
		return this.battleLevel;
	}

	async go()
	{
		if (Sphere.Game.disableBattles) {
			console.log("battles disabled, automatic win", `battleID: ${this.battleID}`);
			this.result = BattleResult.Win;
			return null;
		}
		console.log("");
		console.log("start up battle engine", `battleID: ${this.battleID}`);
		let partyMaxMP = 0;
		for (const key in this.session.party.members) {
			let battlerInfo = this.session.party.members[key].getInfo();
			let mpDonated = Math.round(Maths.mp.capacity(battlerInfo));
			partyMaxMP += mpDonated;
			console.log(Characters[battlerInfo.characterID].name + " donated " + mpDonated + " MP to shared pool");
		}
		partyMaxMP = Math.min(Math.max(partyMaxMP, 0), 9999);
		let partyMPPool = new MPPool('partyMP', Math.min(Math.max(partyMaxMP, 0), 9999));
		partyMPPool.gainedMP.addHandler((mpPool, availableMP) => {
			this.ui.hud.mpGauge.set(availableMP);
		});
		partyMPPool.lostMP.addHandler((mpPool, availableMP) => {
			this.ui.hud.mpGauge.set(availableMP);
		});
		this.ui = new BattleScreen(partyMaxMP);
		this.battleUnits = [];
		this.playerUnits = [];
		this.enemyUnits = [];
		this.conditions = [];
		for (let i = 0; i < this.parameters.enemies.length; ++i) {
			let enemyID = this.parameters.enemies[i];
			let unit = new BattleUnit(this, enemyID, i == 0 ? 1 : i == 1 ? 0 : i, Row.Middle);
			await unit.initialize();
			this.battleUnits.push(unit);
			this.enemyUnits.push(unit);
		}
		let i = 0;
		for (const name in this.session.party.members) {
			let unit = new BattleUnit(this, this.session.party.members[name], i == 0 ? 1 : i == 1 ? 0 : i, Row.Middle, partyMPPool);
			await unit.initialize();
			this.battleUnits.push(unit);
			this.playerUnits.push(unit);
			++i;
		}
		let battleBGMTrack = Game.defaultBattleBGM;
		if ('bgm' in this.parameters)
			battleBGMTrack = this.parameters.bgm;
		this.ui.hud.turnPreview.set(this.predictTurns());
		Music.push(`@/music/${battleBGMTrack}.ogg`);
		this.result = null;
		this.timer = 0;
		this.mode = 'setup';
		console.defineObject('battle', this, {
			'spawn': this.spawnEnemy,
		});
		this.start();
		return this;
	}

	hasCondition(conditionID)
	{
		return from(this.conditions)
			.select(it => it.conditionID)
			.anyIs(conditionID);
	}

	isActive()
	{
		return this.result === null;
	}

	liftCondition(conditionID)
	{
		from(this.conditions)
			.where(it => it.conditionID === conditionID)
			.besides(it => console.log(`lift field condition ${it.name}`))
			.remove();
	}

	async notifyAIs(eventName, ...args)
	{
		for (const ai of this.aiList) {
			console.log(`notify AI battler ${ai.unit.name} '${eventName}'`);
			await ai[`on_${eventName}`](...args);
		}
	}

	predictTurns(actingUnit = null, nextActions = null)
	{
		let forecast = [];
		for (let turnIndex = 0; turnIndex < 8; ++turnIndex) {
			let bias = 0;
			let candidates = from(this.enemyUnits, this.playerUnits)
				.where(it => it !== actingUnit || turnIndex > 0);
			for (const unit of candidates) {
				++bias;
				let remainingTime = unit.timeUntilTurn(turnIndex,
					Game.defaultMoveRank,
					actingUnit === unit ? nextActions : null);
				forecast.push({ bias, remainingTime, turnIndex, unit });
			}
		}
		forecast.sort((a, b) => {
			let sortOrder = a.remainingTime - b.remainingTime;
			let biasOrder = a.bias - b.bias;
			return sortOrder !== 0 ? sortOrder : biasOrder;
		});
		forecast = forecast.slice(0, 10);
		return forecast;
	}

	raiseEvent(eventID, data = null)
	{
		let conditions = [ ...this.conditions ];
		for (const condition of conditions)
			condition.invoke(eventID, data);
	}

	registerAI(ai)
	{
		this.aiList.push(ai);
	}

	resume()
	{
		if (--this.suspendCount < 0)
			this.suspendCount = 0;
	}

	async runAction(action, actingUnit, targetUnits, useAiming = true)
	{
		let eventData = { action: action, targets: targetUnits };
		this.raiseEvent('actionTaken', eventData);
		targetUnits = eventData.targets;
		if ('announceAs' in action && action.announceAs != null)
			await actingUnit.announce(action.announceAs);
		let userEffects = from(action.effects)
			.where(it => it.targetHint === 'user');
		for (const effect of userEffects) {
			console.log(`apply effect '${effect.type}'`, `retarg: ${effect.targetHint}`);
			let effectHandler = MoveEffects[effect.type];
			effectHandler(actingUnit, [ actingUnit ], effect);
		}
		for (const target of targetUnits)
			target.takeHit(actingUnit, action);
		if (action.effects === null)
			return [];
		let targetsHit = [];
		let accuracyRate = 'accuracyRate' in action ? action.accuracyRate : 1.0;
		for (let i = 0; i < targetUnits.length; ++i) {
			let baseOdds = 'accuracyType' in action ? Maths.accuracy[action.accuracyType](actingUnit.battlerInfo, targetUnits[i].battlerInfo) : 1.0;
			let aimRate = 1.0;
			if (useAiming) {
				let eventData = {
					action: clone(action),
					aimRate: 1.0,
					targetInfo: clone(targetUnits[i].battlerInfo),
				};
				actingUnit.raiseEvent('aiming', eventData);
				aimRate = eventData.aimRate;
			}
			let odds = Math.min(Math.max(baseOdds * accuracyRate * aimRate, 0.0), 1.0);
			let isHit = Random.chance(odds);
			console.log(`odds of hitting ${targetUnits[i].name} at ~${Math.round(odds * 100)}%`,
				isHit ? "hit" : "miss");
			if (isHit) {
				await this.notifyAIs('unitTargeted', targetUnits[i].id, action, actingUnit.id);
				targetsHit.push(targetUnits[i]);
			}
			else {
				targetUnits[i].evade(actingUnit, action);
			}
		}
		if (targetsHit.length == 0)
			return [];

		// apply move effects to target(s)
		for (const target of targetsHit)
			target.beginTargeting(actingUnit);
		let animContext = {
			effects: from(action.effects)
				.where(it => from([ 'selected', 'random' ]).anyIs(it.targetHint))
				.where(it => it.type != null)
				.toArray(),
			pc: 0,
			nextEffect() {
				if (this.pc < this.effects.length) {
					let effect = this.effects[this.pc++];
					let targets = effect.targetHint == 'random'
						? [ Random.sample(targetsHit) ]
						: targetsHit;
					console.log(`apply effect '${effect.type}'`, `retarg: ${effect.targetHint}`);
					MoveEffects[effect.type](actingUnit, targets, effect);
				}
				return this.pc < this.effects.length;
			},
		};
		if (action.animation in Animations) {
			Animations[action.animation]
				.call(animContext, actingUnit, targetsHit, false);
		}
		while (animContext.nextEffect());
		for (const target of targetsHit)
			target.endTargeting();
		return targetsHit;
	}

	spawnEnemy(enemyClass)
	{
		console.log(`spawn new enemy '${enemyClass}'`);
		let newUnit = new BattleUnit(this, enemyClass);
		this.battleUnits.push(newUnit);
		this.enemyUnits.push(newUnit);
	}

	suspend()
	{
		++this.suspendCount;
	}

	async tick()
	{
		if (this.suspendCount > 0 || this.result != null)
			return;
		console.log("");
		console.log(`begin CTB turn cycle #${this.timer + 1}`);
		++this.timer;
		let isUnitDead = unit => !unit.isAlive();
		let unitLists = [ this.enemyUnits, this.playerUnits ];
		for (const unit of from(...unitLists))
			unit.beginCycle();
		for (const condition of this.conditions)
			condition.beginCycle();
		this.raiseEvent('beginCycle');
		let actionTaken = false;
		while (!actionTaken) {
			for (const unit of from(...unitLists))
				actionTaken = await unit.tick() || actionTaken;
			if (from(this.playerUnits).all(isUnitDead)) {
				Music.adjustVolume(0.0, 120);
				await this.ui.fadeOut(120);
				this.result = BattleResult.Lose;
				console.log("all player characters have been KO'd");
				return;
			}
			if (from(this.enemyUnits).all(isUnitDead)) {
				Music.adjustVolume(0.0, 60);
				await this.ui.fadeOut(60);
				this.result = BattleResult.Win;
				console.log("all enemies have been KO'd");
				return;
			}
		}
		for (const unit of from(...unitLists))
			await unit.endCycle();
	}

	unregisterAI(ai)
	{
		from(this.aiList)
			.where(it => it === ai)
			.remove();
	}

	async on_update() {
		switch (this.mode) {
			case 'setup': {
				let heading = ('isFinalBattle' in this.parameters && this.parameters.isFinalBattle)
					? "Final Battle: " : "Boss Battle: ";
				await this.ui.go('title' in this.parameters ? heading + this.parameters.title : null);
				for (const unit of from(this.enemyUnits, this.playerUnits))
					await unit.actor.enter();
				this.ui.hud.turnPreview.show();
				if (!from(this.session.battlesSeen).anyIs(this.battleID)) {
					this.session.battlesSeen.push(this.battleID);
					if ('onFirstStart' in this.parameters) {
						console.log(`call onFirstStart() for battle '${this.battleID}'`);
						await this.parameters.onFirstStart.call(this);
					}
				}
				if ('onStart' in this.parameters) {
					console.log(`call onStart() for battle '${this.battleID}'`);
					await this.parameters.onStart.call(this);
				}
				await this.ui.showTitle();
				this.mode = 'battle';
				break;
			}
			case 'battle': {
				await this.tick();
				break;
			}
		}
		if (this.result !== null) {
			console.log("shut down battle engine");
			for (const unit of this.battleUnits)
				unit.dispose();
			this.ui.dispose();
			Music.pop();
			Music.adjustVolume(1.0, 0);
			console.undefineObject('battle');
			this.stop();
		}
	}
}
