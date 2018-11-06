/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { from, Random, Scene } from '/game/lib/sphere-runtime.js';

import { Characters, Elements, Enemies, Game, Items, Maths, StatNames, Statuses, Weapons } from '../gameDef/index.js';
import { clone } from '../utilities.js';

import ItemUsable from './itemUsable.js';
import MoveMenu from './moveMenu.js';
import MPPool from './mpPool.js';
import PartyMember from './partyMember.js';
import Row from './row.js';
import Stance from './stance.js';
import Stat from './stat.js';
import StatusEffect from './statusEffect.js';

export default
class BattleUnit
{
	constructor(battle, basis, position, startingRow = Row.Middle, mpPool = null)
	{
		this.actionQueue = [];
		this.actor = null;
		this.affinities = [];
		this.ai = null;
		this.allowTargetScan = false;
		this.battle = battle;
		this.battlerInfo = {};
		this.counterTarget = null;
		this.cv = 0;
		this.hp = 0;
		this.lastAttacker = null;
		this.lazarusFlag = false;
		this.moveTargets = null;
		this.mpPool = mpPool;
		this.newSkills = [];
		this.newStance = Stance.Attack;
		this.partyMember = null;
		this.row = startingRow;
		this.skills = [];
		this.stance = Stance.Attack;
		this.stats = {};
		this.statuses = [];
		this.tag = Random.string();
		this.turnRatio = 1.0;
		this.weapon = null;

		if (basis instanceof PartyMember) {
			this.partyMember = basis;
			this.id = this.partyMember.characterID;
			this.character = Characters[this.partyMember.characterID];
			this.baseStats = this.character.baseStats;
			this.tier = 1;
			this.maxHP = Math.round(Math.max(Maths.hp(this.character, this.partyMember.level, this.tier), 1));
			this.hp = this.maxHP;
			this.name = this.partyMember.name;
			this.fullName = this.partyMember.fullName;
			this.allowTargetScan = this.partyMember.isTargetScanOn;
			this.skills = [ ...this.partyMember.getUsableSkills() ];
			this.items = clone(this.partyMember.items);
			for (const statID in this.baseStats)
				this.stats[statID] = this.partyMember.stats[statID];
			this.weapon = Weapons[this.partyMember.weaponID];
		}
		else {
			if (!(basis in Enemies))
				throw new ReferenceError(`enemy template '${basis}' doesn't exist!`);
			this.enemyInfo = Enemies[basis];
			this.baseStats = this.enemyInfo.baseStats;
			this.affinities = 'damageModifiers' in this.enemyInfo ? this.enemyInfo.damageModifiers : [];
			this.id = basis;
			this.name = this.enemyInfo.name;
			this.fullName = 'fullName' in this.enemyInfo ? this.enemyInfo.fullName : this.enemyInfo.name;
			for (const statID in this.baseStats)
				this.stats[statID] = new Stat(this.baseStats[statID], battle.getLevel(), false);
			if ('items' in this.enemyInfo) {
				this.items = from(this.enemyInfo.items)
					.select(it => new ItemUsable(it))
					.toArray();
			}
			else {
				this.items = [];
			}
			this.tier = 'tier' in this.enemyInfo ? this.enemyInfo.tier : 1;
			this.turnRatio = 'turnRatio' in this.enemyInfo ? this.enemyInfo.turnRatio : 1;
			this.maxHP = Math.round(Math.max(Maths.hp(this.enemyInfo, battle.getLevel(), this.tier), 1));
			this.hp = this.maxHP;
			this.weapon = Weapons[this.enemyInfo.weapon];
			if ('hasLifeBar' in this.enemyInfo && this.enemyInfo.hasLifeBar)
				this.battle.ui.hud.createEnemyHPGauge(this);
			this.aiFile = FS.fullPath(`${this.id}.js`, '$/autoBattlers');
		}
		this.attackMenu = new MoveMenu(this, battle, Stance.Attack);
		this.counterMenu = new MoveMenu(this, battle, Stance.Counter);
		this.refreshInfo();
		if (this.mpPool === null)
			this.mpPool = new MPPool(`${this.id}MP`, Math.round(Math.max(Maths.mp.capacity(this.battlerInfo), 0)));
		this.actor = battle.ui.createActor(this.name, position, this.row, this.isPartyMember() ? 'party' : 'enemy');
		if (this.isPartyMember())
			this.battle.ui.hud.setPartyMember(position == 2 ? 0 : position == 0 ? 2 : position, this, this.hp, this.maxHP);
		this.resetCounter(Game.defaultMoveRank, true);
		this.registerCommands();
		let unitType = this.aiFile === undefined ? "player" : "AI";
		console.log(`create ${unitType} unit '${this.name}'`,
			`hp: ${this.hp}/${this.maxHP}`,
			`iid: ${this.tag}`);
	}

	async initialize()
	{
		await this.actor.initialize();
		if (!this.isPartyMember())
			this.actor.enter(true);
		if (this.aiFile !== undefined) {
			let battlerClass = (await FS.require(this.aiFile)).default;
			this.ai = new battlerClass(this, this.battle);
			this.battle.registerAI(this.ai);
		}
	}

	dispose()
	{
		if (this.ai !== null)
			this.battle.unregisterAI(this.ai);
		console.undefineObject(this.id);
	}

	get busy()
	{
		return this.actionQueue.length > 0;
	}

	addStatus(statusID, isGuardable = false)
	{
		if (this.isAlive() && !this.hasStatus(statusID)) {
			let statusName = Statuses[statusID].name;
			let isOverruled = from(this.statuses)
				.any(it => it.overrules(statusID));
			if (!this.isPartyMember() && from(this.enemyInfo.immunities).anyIs(statusID)) {
				if (!isGuardable)
					this.actor.showHealing("immune", Color.Silver);
				console.log(`${this.name} is immune to ${statusName}`);
			}
			else if (isOverruled) {
				if (!isGuardable)
					this.actor.showHealing("ward", Color.Silver);
				console.log(`${statusName} overruled by another of ${this.name}'s statuses`);
			}
			else if (this.stance !== Stance.Guard || !isGuardable) {
				let eventData = { unit: this, statusID: statusID, cancel: false };
				this.battle.raiseEvent('unitAfflicted', eventData);
				if (!eventData.cancel)
					this.raiseEvent('afflicted', eventData);
				if (!eventData.cancel) {
					let effect = new StatusEffect(eventData.statusID, this);
					this.statuses.push(effect);
					this.battlerInfo.statuses = from(this.statuses)
						.select(it => it.statusID)
						.toArray();
					console.log(`status ${effect.name} installed on ${this.name}`);
				}
				else {
					if (!isGuardable)
						this.actor.showHealing("ward", Color.Silver);
					console.log(`status ${statusName} for ${this.name} blocked per status/FC`);
				}
			}
			else {
				console.log(`status ${statusName} for ${this.name} blocked by Guard`);
			}
		}
	}

	async announce(text)
	{
		let bannerColor = this.isPartyMember()
			? Color.mix(Color.Blue, Color.White, 75, 25).fadeTo(0.75)
			: Color.mix(Color.Red, Color.White, 75, 25).fadeTo(0.75);
		await this.battle.ui.announceAction(text, this.isPartyMember() ? 'party' : 'enemy', bannerColor);
	}

	beginCycle()
	{
		if (!this.isAlive())
			return;

		this.refreshInfo();
		for (let i = 0; i < this.statuses.length; ++i)
			this.statuses[i].beginCycle();
		let eventData = { battlerInfo: this.battlerInfo };
		this.raiseEvent('beginCycle', eventData);
		let baseStatSum = 0;
		let statSum = 0;
		let numStats = 0;
		for (const statID in this.baseStats) {
			++numStats;
			this.battlerInfo.stats[statID] = Math.round(this.battlerInfo.stats[statID]);
			statSum += this.battlerInfo.stats[statID];
			this.battlerInfo.baseStats[statID] = Math.round(this.battlerInfo.baseStats[statID]);
			baseStatSum += this.battlerInfo.baseStats[statID];
		}
		this.battlerInfo.statAverage = Math.round(statSum / numStats);
		this.battlerInfo.baseStatAverage = Math.round(baseStatSum / numStats);
		this.mpPool.restore(this.battlerInfo.statAverage / 10);
	}

	beginTargeting(actingUnit)
	{
		this.lastAttacker = actingUnit;
	}

	clearQueue()
	{
		if (this.actionQueue.length > 0) {
			this.actionQueue = [];
			console.log(`clear ${this.name}'s action queue`);
		}
	}

	async die()
	{
		await this.battle.notifyAIs('unitKilled', this.id);
		this.lazarusFlag = false;
		this.hp = 0;
		this.battle.ui.hud.setHP(this, this.hp);
		this.statuses = [];
		this.actor.animate('die');
		console.log(`death comes near ${this.fullName}`);
	}

	async endCycle()
	{
		if (!this.isAlive())
			return;

		if (this.stance === Stance.Counter) {
			this.cv = 0;
			let chosenMove;
			if (this.ai == null) {
				this.actor.animate('active');
				this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
				console.log(`ask player for ${this.name}'s GS counterattack`);
				chosenMove = await this.counterMenu.run();
			}
			else {
				chosenMove = await this.ai.getNextMove();
				chosenMove.targets = [ this.counterTarget ];
			}
			this.queueMove(chosenMove);
			await this.performAction(this.getNextAction(), chosenMove);
			this.actor.animate('dormant');
			this.newStance = Stance.Attack;
		}
		if (this.newStance !== this.stance) {
			this.stance = this.newStance;
			await this.battle.notifyAIs('stanceChanged', this.id, this.stance);
			let stanceName = this.stance === Stance.Guard ? "Guard"
				: this.stance === Stance.Counter ? "Counter"
				: "Attack";
			console.log(`${this.name} now in ${stanceName} Stance`);
		}
	}

	endTargeting()
	{
		this.lastAttacker = null;
	}

	evade(actingUnit, action)
	{
		this.actor.showHealing("miss", Color.Silver);
		console.log(`${this.name} evaded ${actingUnit.name}'s attack`);
		let isGuardBroken = 'preserveGuard' in action ? !action.preserveGuard : true;
		let isMelee = 'isMelee' in action ? action.isMelee : false;
		if (isMelee && this.stance === Stance.Guard && isGuardBroken) {
			this.stance = Stance.Counter;
			this.counterTarget = actingUnit;
			console.log(`${this.name}'s Counter Stance activated`);
		}
	}

	getHealth()
	{
		return Math.ceil(100 * this.hp / this.maxHP);
	}

	getLevel()
	{
		if (this.partyMember != null)
			return this.partyMember.level;
		else
			return this.battle.getLevel();
	}

	growSkill(skillID, experience)
	{
		if (!this.isPartyMember())
			return;

		let hasSkill = false;
		for (let i = 0; i < this.skills.length; ++i) {
			if (skillID == this.skills[i].skillID) {
				hasSkill = true;
				this.skills[i].grow(experience);
			}
		}
		if (!hasSkill) {
			let skill = this.partyMember.learnSkill(skillID);
			this.skills.push(skill);
			this.newSkills.push(skill);
			console.log(`${this.name} learned ${skill.name}`);
		}
	}

	getNextAction()
	{
		if (this.actionQueue.length > 0) {
			console.log(`${this.actionQueue.length} outstanding action(s) for ${this.name}`);
			return this.actionQueue.shift();
		}
		else {
			return null;
		}
	}

	hasStatus(statusID)
	{
		return from(this.statuses)
			.select(it => it.statusID)
			.anyIs(statusID);
	}

	async heal(amount, tags = [], isPriority = false)
	{
		if (!isPriority) {
			let eventData = {
				unit: this,
				amount: Math.round(amount),
				tags: tags,
				cancel: false,
			};
			this.battle.raiseEvent('unitHealed', eventData);
			if (!eventData.cancel)
				this.raiseEvent('healed', eventData);
			if (!eventData.cancel)
				amount = Math.round(eventData.amount);
			else
				return;
		}
		if (amount > 0) {
			this.hp = Math.min(this.hp + amount, this.maxHP);
			this.actor.showHealing(amount);
			this.battle.ui.hud.setHP(this, this.hp);
			await this.battle.notifyAIs('unitHealed', this, amount, tags);
			console.log(`heal ${this.name} for ${amount} HP`, `now: ${this.hp}`);
		}
		else if (amount < 0) {
			this.takeDamage(-amount, [], true);
		}
	}

	isAlive()
	{
		return this.hp > 0 || this.lazarusFlag;
	}

	isPartyMember()
	{
		return this.partyMember != null;
	}

	liftStatus(statusID)
	{
		let eventData = {
			statusID: statusID,
			cancel: false,
		};
		this.raiseEvent('unitCured', eventData);
		if (!eventData.cancel)
			this.raiseEvent('cured', eventData);
		if (!eventData.cancel) {
			from(this.statuses)
				.where(i => i.statusID === statusID)
				.besides(i => console.log(`lift status effect ${this.name}->${i.name}`))
				.remove();
			this.battlerInfo.statuses = from(this.statuses)
				.select(it => it.statusID)
				.toArray();
		}
	}

	liftStatusTags(tags)
	{
		let statusEffects = from([ ...this.statuses ])
			.where(it => from(it.statusDef.tags).anyIn(tags));
		for (let it of statusEffects)
			this.liftStatus(it.statusID);
	}

	async performAction(action, move)
	{
		let targetsInfo = from(move.targets)
			.select(it => it.battlerInfo)
			.toArray();
		let eventData = { action, targetsInfo };
		this.raiseEvent('acting', eventData);
		eventData.action.rank = Math.max(Math.round(eventData.action.rank), 0);
		if (this.isAlive()) {
			if (this.stance === Stance.Counter)
				action.accuracyRate = 2.0;
			let unitsHit = await this.battle.runAction(action, this, move.targets, move.usable.useAiming);
			if (move.usable.givesExperience && unitsHit.length > 0) {
				let experience = {};
				for (let i = 0; i < unitsHit.length; ++i) {
					if (!unitsHit[i].isAlive() && this.battle.areEnemies(this, unitsHit[i])) {
						for (const statID in unitsHit[i].baseStats) {
							if (!(statID in experience))
								experience[statID] = 0;
							experience[statID] += Maths.experience.stat(statID, unitsHit[i].battlerInfo);
						}
					}
				}
				for (const statID in experience) {
					this.stats[statID].grow(experience[statID]);
					console.log(`${this.name} got ${experience[statID]} EXP for ${StatNames[statID]}`,
						`value: ${this.stats[statID].value}`);
				}
			}
			this.resetCounter(action.rank);
		}
	}

	queueMove(move)
	{
		this.moveUsed = move;
		let alliesInBattle = this.battle.alliesOf(this.moveUsed.targets[0]);
		let alliesAlive = from(alliesInBattle)
			.where(it => it.isAlive())
			.toArray();
		this.moveUsed.targets = this.moveUsed.usable.isGroupCast
			? this.moveUsed.usable.allowDeadTarget ? alliesInBattle : alliesAlive
			: this.moveUsed.targets;
		if (!this.moveUsed.usable.isGroupCast
			&& !this.moveUsed.targets[0].isAlive()
			&& !this.moveUsed.usable.allowDeadTarget)
		{
			this.moveUsed.targets[0] = Random.sample(alliesAlive);
		}
		let nextActions = this.moveUsed.usable.use(this, this.moveUsed.targets);
		if (move.stance === Stance.Counter || move.stance === Stance.Charge) {
			let damageEffects = from(nextActions)
				.from(action => action.effects)
				.where(effect => 'power' in effect);
			for (let effect of damageEffects) {
				// note: statusChance being set to Infinity bypasses Guard
				effect.power *= Game.bonusMultiplier;
				effect.statusChance = Infinity;
				console.log("boost applied for Counter/Charge", `pow: ${effect.power}`);
			}
		}
		if (move.stance === Stance.Charge) {
			let targetName = this.moveUsed.targets.length == 1
				? this.moveUsed.targets[0].name : "Multi";
			nextActions.splice(0, 0, {
				announceAs: `Charge [${targetName}]`,
				rank: 1,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard',
					},
				],
			});
		}
		if (nextActions !== null) {
			this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this, nextActions));
			for (let i = 0; i < nextActions.length; ++i)
				this.actionQueue.push(nextActions[i]);
			if (this.actionQueue.length > 0)
				console.log(`queue ${this.actionQueue.length} action(s) for ${this.moveUsed.usable.name}`);
		}
		else {
			this.battle.ui.hud.turnPreview.set(this.battle.predictTurns());
		}
	}

	raiseEvent(eventID, data = null)
	{
		// event handlers can change the objects referenced in the data object, for example to
		// change the effects of an action taken by a battler.  if you pass in any objects from
		// the gamedef, they should be cloned first to prevent the event from inadvertantly
		// modifying the original definition.

		// clone the status array as it may be modified by an event
		let statusEffects = [ ...this.statuses ];

		for (let it of statusEffects)
			it.invoke(eventID, data);
	}

	refreshInfo()
	{
		this.battlerInfo.name = this.name;
		this.battlerInfo.affinities = clone(this.affinities);
		this.battlerInfo.health = Math.ceil(100 * this.hp / this.maxHP);
		this.battlerInfo.level = this.getLevel();
		this.battlerInfo.weapon = clone(this.weapon);
		this.battlerInfo.tier = this.tier;
		this.battlerInfo.baseStats = {};
		this.battlerInfo.stats = { maxHP: this.maxHP };
		for (const statID in this.baseStats) {
			this.battlerInfo.baseStats[statID] = this.baseStats[statID];
			this.battlerInfo.stats[statID] = this.stats[statID].value;
		}
		this.battlerInfo.statuses = from(this.statuses)
			.select(it => it.statusID)
			.toArray();
		this.battlerInfo.stance = this.stance;
	}

	registerCommands()
	{
		console.defineObject(this.id, this, {
			'add'(statusID) {
				if (statusID in Statuses)
					this.addStatus(statusID);
				else
					console.log(`invalid status ID '${statusID}'`);
			},
			'lift'(statusID) {
				if (statusID in Statuses)
					this.liftStatus(statusID);
				else
					console.log(`invalid status ID '${statusID}'`);
			},
			'damage'(amount, ...tags) {
				amount = Math.max(parseInt(amount), 0);
				this.takeDamage(amount, tags);
			},
			'heal'(amount, ...tags) {
				amount = Math.max(parseInt(amount), 0);
				this.heal(amount, tags);
			},
			'inv'(instruction) {
				if (instruction === undefined) {
					console.log("'" + this.id + " inv': No instruction provided");
					return;
				}
				let itemCount, itemID;
				switch (instruction) {
					case 'add': {
						if (arguments.length < 2) {
							console.log("'" + this.id + " inv add': Item ID required");
							return;
						}
						itemID = arguments[1];
						if (!(itemID in Items))
							return console.log("no such item ID '" + itemID + "'");
						let defaultUses = 'uses' in Items[itemID] ? Items[itemID].uses : 1;
						itemCount = arguments[2] > 0 ? arguments[2] : defaultUses;
						let usables = from(this.items)
							.where(it => it.itemID === itemID);
						let addCount = 0;
						for (const usable of usables) {
							usable.usesLeft += itemCount;
							addCount += itemCount;
						}
						if (addCount == 0) {
							let usable = new ItemUsable(itemID);
							usable.usesLeft = itemCount;
							this.items.push(usable);
							addCount = itemCount;
						}
						console.log(addCount + "x " + Items[itemID].name + " added to " + this.name + "'s inventory");
						break;
					}
					case 'munch': {
						new Scene().playSound('Munch.wav').run();
						this.items.length = 0;
						console.log("maggie ate " + this.name + "'s entire inventory");
						break;
					}
					case 'rm': {
						if (arguments.length < 2)
							return console.log("'" + this.id + " inv add': Item ID required");
						itemID = arguments[1];
						itemCount = 0;
						from(this.items)
							.where(it => it.itemID === itemID)
							.besides(it => itemCount += it.usesLeft)
							.remove();
						if (itemCount > 0)
							console.log(itemCount + "x " + Items[itemID].name
								+ " deleted from " + this.name + "'s inventory");
						else
							console.log("No " + Items[itemID].name + " in " + this.name + "'s inventory");
						break;
					}
					default: {
						return console.log("'" + this.id + " inv': Unknown instruction '" + instruction + "'");
					}
				}
			},
			'revive'() {
				this.resurrect();
			},
			'scan'(flag) {
				flag = flag.toLowerCase();
				if (flag == 'on')
					this.allowTargetScan = true;
				if (flag == 'off')
					this.allowTargetScan = false;
				console.log(`Target Scan for ${this.name} is ${this.allowTargetScan ? "ON" : "OFF"}`);
			},
		});
	}

	resetCounter(rank, isFirstTurn = false)
	{
		// note: Rank 0 is treated as a special case; passing 0 or less for rank will always give
		//       the unit its next turn immediately.

		let divisor = isFirstTurn ? 1.0 : this.turnRatio;
		this.cv = rank > 0
			? Math.max(Math.round(Maths.timeUntilNextTurn(this.battlerInfo, rank) / divisor), 1)
			: 1;
		console.log(`update ${this.name}'s CV to ${this.cv}`, `rank: ${rank}`);
	}

	restoreMP(amount)
	{
		amount = Math.round(amount);
		this.mpPool.restore(amount);
		let color = Color.mix(Color.Magenta, Color.White, 33, 66);
		this.actor.showHealing(`${amount}MP`, color);
	}

	resurrect(isFullHeal = false)
	{
		if (!this.isAlive()) {
			this.lazarusFlag = true;
			this.heal(isFullHeal ? this.maxHP : 1);
			this.actor.animate('revive');
			this.resetCounter(Game.reviveRank);
			console.log(`${this.name} brought back from the dead`);
		}
		else {
			this.actor.showHealing("ward", Color.Silver);
		}
	}

	async setGuard()
	{
		console.log(`${this.name} will switch to Guard Stance`);
		await this.announce("Guard");
		this.newStance = Stance.Guard;
		this.resetCounter(Game.stanceChangeRank);
	}

	async setWeapon(weaponID)
	{
		let weaponDef = Weapons[weaponID];
		await this.announce(`Equip: ${weaponDef.name}`);
		this.weapon = weaponDef;
		console.log(`${this.name} equipped weapon ${weaponDef.name}`);
		this.resetCounter(Game.equipWeaponRank);
	}

	async takeDamage(amount, tags = [], isPriority = false)
	{
		amount = Math.round(amount);
		let multiplier = 1.0;
		for (let i = 0; i < tags.length; ++i) {
			if (tags[i] in this.affinities)
				multiplier *= this.affinities[tags[i]];
		}
		amount = Math.round(amount * multiplier);
		if (amount > 0 && !isPriority) {
			let eventData = {
				unit: this,
				amount,
				tags,
				actingUnit: this.lastAttacker,
				cancel: false,
			};
			this.battle.raiseEvent('unitDamaged', eventData);
			if (!eventData.cancel)
				this.raiseEvent('damaged', eventData);
			if (!eventData.cancel)
				amount = Math.round(eventData.amount);
			else
				return;
		}
		if (amount >= 0) {
			if (this.stance != Stance.Attack && this.lastAttacker !== null) {
				amount = Math.round(Maths.guardStance.damageTaken(amount, tags));
				console.log(`${this.name} hit in Guard Stance, reduce damage`);
			}
			let oldHPValue = this.hp;
			if (this.stance !== Stance.Hippo || amount < this.hp)
				this.hp = Math.max(this.hp - amount, 0);
			else
				this.hp = 1;
			await this.battle.notifyAIs('unitDamaged', this, amount, tags, this.lastAttacker);
			console.log(`damage ${this.name} for ${amount} HP`, `left: ${this.hp}`);
			if (oldHPValue > 0 || this.lazarusFlag) {
				let elementTags = from(tags).where(it => it in Elements);
				let damageColor = null;
				for (const tag of elementTags) {
					damageColor = damageColor !== null
						? Color.mix(damageColor, Elements[tag].color)
						: Elements[tag].color;
				}
				damageColor = damageColor !== null
					? Color.mix(damageColor, Color.White, 33, 66)
					: Color.White;
				this.actor.showDamage(amount, damageColor);
			}
			this.battle.ui.hud.setHP(this, this.hp);
			if (this.hp <= 0 && (oldHPValue > 0 || this.lazarusFlag)) {
				console.log(`${this.name} dying due to lack of HP`);
				this.lazarusFlag = true;
				let eventData = { unit: this, cancel: false };
				this.battle.raiseEvent('unitDying', eventData);
				if (!eventData.cancel)
					this.raiseEvent('dying', eventData);
				this.lazarusFlag = eventData.cancel;
				if (!this.lazarusFlag)
					this.die();
				else
					console.log(`suspend KO for ${this.name} per status/FC`);
			}
		}
		else if (amount < 0) {
			this.heal(Math.abs(amount), tags);
		}
	}

	takeHit(actingUnit, action)
	{
		let eventData = {
			actingUnitInfo: actingUnit.battlerInfo,
			action: action,
			stance: actingUnit.stance,
		};
		this.raiseEvent('attacked', eventData);
		let isGuardBroken = 'preserveGuard' in action ? !action.preserveGuard : true;
		let isMelee = 'isMelee' in action ? action.isMelee : false;
		if (this.stance === Stance.Guard && isMelee && isGuardBroken) {
			action.accuracyRate = 0.0; //'accuracyRate' in action ? 0.5 * action.accuracyRate : 0.5;
		}
		if (this.stance === Stance.Guard && isGuardBroken) {
			console.log(`${this.name}'s Guard Stance broken`, `by: ${actingUnit.name}`);
			this.newStance = Stance.Attack;
			this.resetCounter(Game.guardBreakRank);
		}
	}

	async tick()
	{
		if (!this.isAlive())
			return false;
		if (--this.cv == 0) {
			this.battle.suspend();
			if (this.stance === Stance.Guard) {
				this.stance = this.newStance = Stance.Attack;
				await this.battle.notifyAIs('stanceChanged', this.id, this.stance);
				console.log(`${this.name}'s Guard Stance expired`);
			}
			else if (this.stance === Stance.Counter) {
				this.newStance = Stance.Attack;
			}
			console.log(`${this.name}'s turn is up`);
			this.actor.animate('active');
			this.battle.notifyAIs('unitReady', this.id);
			let eventData = { skipTurn: false };
			this.raiseEvent('beginTurn', eventData);
			if (!this.isAlive()) {
				this.battle.resume();
				return true;
			}
			if (eventData.skipTurn) {
				this.clearQueue();
				console.log(`skip ${this.name}'s turn per status/FC`);
				this.resetCounter(Game.defaultMoveRank);
				this.battle.resume();
				return true;
			}
			let action = this.getNextAction();
			if (action == null) {
				let chosenMove = null;
				if (this.ai == null) {
					this.battle.ui.hud.turnPreview.set(this.battle.predictTurns(this));
					console.log(`ask player for ${this.name}'s next move`);
					chosenMove = await this.attackMenu.run();
				}
				else {
					chosenMove = await this.ai.getNextMove();
				}
				if (chosenMove.stance != Stance.Guard) {
					this.queueMove(chosenMove);
					action = this.getNextAction();
				}
				else {
					await this.setGuard();
				}
			}
			if (this.isAlive()) {
				if (action !== null) {
					await this.performAction(action, this.moveUsed);
				}
				this.raiseEvent('endTurn');
			}
			eventData = { actingUnit: this };
			this.battle.raiseEvent('endTurn', eventData);
			this.actor.animate('dormant');
			console.log(`end of ${this.name}'s turn`);
			this.battle.resume();
			return true;
		}
		else {
			return false;
		}
	}

	timeUntilNextTurn()
	{
		return this.cv;
	}

	timeUntilTurn(turnIndex, assumedRank = Game.defaultMoveRank, nextActions = null)
	{
		if (this.isAlive()) {
			nextActions = nextActions !== null
				? this.actionQueue.concat(nextActions)
				: this.actionQueue;
			let timeLeft = this.cv;
			for (let i = 1; i <= turnIndex; ++i) {
				let rank = assumedRank;
				if (i <= nextActions.length) {
					rank = isNaN(nextActions[i - 1]) ? nextActions[i - 1].rank
						: nextActions[i - 1];
				}
				timeLeft += Math.max(Math.round(Maths.timeUntilNextTurn(this.battlerInfo, rank) / this.turnRatio), 1);
			}
			return timeLeft;
		}
		else {
			return Infinity;
		}
	}

	turnIntoAHippo()
	{
		this.actor.animate('hippo');
		this.stance = Stance.Hippo;
	}
}
