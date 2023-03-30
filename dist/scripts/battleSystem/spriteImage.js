/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { DataStream, Prim } from 'sphere-runtime';

export default
class SpriteImage
{
	static async fromFile(fileName)
	{
		const fs = await DataStream.fromFile(fileName);
		const rss = fs.readStruct({
			signature:   'string/4',
			version:     'uint16-le',
			numImages:   'uint16-le',
			frameWidth:  'uint16-le',
			frameHeight: 'uint16-le',
			numPoses:    'uint16-le',
			baseX1:      'uint16-le',
			baseY1:      'uint16-le',
			baseX2:      'uint16-le',
			baseY2:      'uint16-le',
			reserved:    'nil/106',
		});
		if (rss.signature !== '.rss' || rss.version !== 3)
			throw new Error(`Couldn't load Sphere spriteset '${fileName}'`);
		const images = [];
		for (let i = 0; i < rss.numImages; ++i) {
			const pixels = fs.readBytes(4 * rss.frameWidth * rss.frameHeight);
			images.push(new Texture(rss.frameWidth, rss.frameHeight, pixels));
		}
		const poses = {};
		for (let i = 0; i < rss.numPoses; ++i) {
			const poseInfo = fs.readStruct({
				numFrames: 'uint16-le',
				reserved:  'nil/6',
				name:      'cstr16-le',
			});
			const pose = { frames: [] };
			for (let j = 0; j < poseInfo.numFrames; ++j) {
				const frameInfo = fs.readStruct({
					imageIndex: 'uint16-le',
					delay:      'uint16-le',
					reserved:   'nil/4',
				});
				const frame = { image: images[frameInfo.imageIndex], delay: frameInfo.delay };
				pose.frames.push(frame);
			}
			poses[poseInfo.name] = pose;
		}

		const spriteset = Object.create(this.prototype);
		spriteset.currentPose = Object.keys(poses)[0];
		spriteset.elapsedFrames = 0;
		spriteset.frame = 0;
		spriteset.poses = poses;
		spriteset.xOffset = 0; //-(rss.baseX1 + Math.round((rss.baseX2 + 1 - rss.baseX1) / 2));
		spriteset.yOffset = 0; //-(rss.baseY1 + Math.round((rss.baseY2 + 1 - rss.baseY1) / 2));
		return spriteset;
	}

	constructor(fileName)
	{
		throw new Error("'SpriteImage' constructor is unsupported");
	}

	get pose()
	{
		return this.currentPose;
	}

	set pose(value)
	{
		if (!(value in this.poses))
			throw new ReferenceError(`Spriteset pose '${value}' doesn't exist`);
		this.currentPose = value;
	}

	blit(surface, x, y, alpha = 1.0)
	{
		const pose = this.poses[this.currentPose]
		const image = pose.frames[this.frame % pose.frames.length].image;
		Prim.blit(surface, x + this.xOffset, y + this.yOffset, image, Color.White.fadeTo(alpha));
	}

	reset()
	{
		this.frame = 0;
		this.elapsedFrames = 0;
	}

	resume()
	{
		this.stopped = false;
	}

	stop()
	{
		this.stopped = true;
	}

	update()
	{
		if (this.stopped)
			return;
		let frames = this.poses[this.currentPose].frames;
		if (this.elapsedFrames >= frames[this.frame].delay) {
			this.frame = (this.frame + 1) % frames.length;
			this.elapsedFrames = 0;
		}
		else {
			++this.elapsedFrames;
		}
	}
}
