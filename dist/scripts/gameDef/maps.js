/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { Scene } from 'sphere-runtime';

export
const Maps =
{
	main: {
		onEnter() {
			new Scene()
				.fadeTo(Color.Black, 0)
				.playBGM('BruceTellsHisStory')
				.pause(60)
				.talk("Bruce", false, 1.0, 2.0,
					"I tried so hard to make him understand, but for so long, he refused to listen...",
					"So many times I said to myself, \"Bruce, why do you even bother?\" Anything to prove to myself that I wasn't the one at fault--that the reason he wouldn't listen was because of his own denial, not because I was pushing far too hard...",
					"I was so intent on convincing him of Spellbinder's dishonesty that I didn't step back to take a look at the bigger picture. I refused to. And in the end, I wasn't the one hurt by it.")
				.pause(60)
				.talk("Bruce", false, 1.0, 2.0, "He was.")
				.pause(120)
				.talk("Bruce", false, 1.0, 2.0, "The thing that amazes me most, though...")
				.pause(60)
				.adjustBGM(0.0, 300)
				.pause(60)
				.changeMap('Testville.rmp')
				.fork()
					.playBGM('ThePromise')
					.adjustBGM(1.0, 120)
				.end()
				.fadeTo(Color.Transparent, 120)
				.resync()
				.talk("Robert", true, 2.0, Infinity, "There must be some other way, Amanda...")
				.pause(120)  // TODO: Amanda looks into the distance
				.talk("Amanda", true, 2.0, Infinity, "Circumstances beyond my control long ago forced my hand. Frankly, I don't see that I have any other choice. At times I wonder if I ever did...")
				.talk("Robert", true, 2.0, Infinity, "I get it, I really do. It's just... well, I just wish you didn't have to leave Lucida to do it.")
				.pause(60)  // TODO: Amanda faces house
				.talk("Amanda", true, 2.0, Infinity,
					"It's not as though I can't imagine how you feel. We all have a lot of memories here... it's home. But I can't just linger about the manor pretending the prophecy will magically go away.",
					"Robert, if I don't do something...")
				.pause(60)  // TODO: Amanda uses Flare to set the house ablaze
				.talk("Amanda", true, 2.0, Infinity, "Lucida would be destroyed.")
				.pause(30)  // TODO: Robert steps away from burning house
				.talk("Robert", true, 2.0, Infinity, "So this is it? You're just going to walk out on all of us?")
				.talk("Amanda", true, 2.0, Infinity, "Remember something for me, Robert. Not once have I ever left you to fend for yourself. No matter what's happened, I've always come back. Always.")
				.talk("Robert", true, 2.0, Infinity, "Maybe it's nothing. I don't know. But I can't help thinking I'll never see you again. I'm worried, Amanda. More worried than I've ever been about anything. What if something happens? What if you don't return?")
				.talk("Amanda", true, 2.0, Infinity, "I'll come back, Robert. I promise.")
				.fork()
					.pause(30)
					.pause(60)  // TODO: Amanda walks away
				.end()
				.pause(120)
				.fork()
					.adjustBGM(0.0, 300)
				.end()
				.fadeTo(Color.Black, 120)
				.talk("Bruce", false, 1.0, 2.0, "...is that it all began with a promise.")
				.pause(120)
				.changeMap('Portentia.rmp')
				.resetBGM()
				.adjustBGM(1.0)
				.fadeTo(Color.Transparent, 300)
				.pause(300)
				.pause(120)  // TODO: Scott walks out of his house
				.talk("Scott", true, 2.0, Infinity,
					"The lights are out...",
					"What's going on?")
				.run(true);
		},
	},

	testville: {
		bgm: 'LucidaByNight',
		encounterRate: 0.005,
		battleBGM: 'CreepFight',
		canvasColor: Color.DarkGreen,

		onEnter() {
		},
	},
};
