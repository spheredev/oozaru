import Prim from './lib/prim.js';

export default
async function main()
{
	SSj.log(`engine name: ${Sphere.Engine}`);
	SSj.log(`API: Sphere v${Sphere.Version} API level ${Sphere.APILevel}`);
	SSj.log(`Sphere.now() on startup: ${Sphere.now()}`);

	let sound = await Sound.fromFile('music/vegetaSSj.ogg');
	sound.repeat = true;
	SSj.log(`length of BGM track: ~${Math.round(sound.length)} seconds`);
	sound.play();

	let texture = await Texture.fromFile('images/saiyan.png');
	let w = Surface.Screen.width;
	let h = Surface.Screen.height;
	let vbo = new VertexList([
		{ x: 0, y: 0, u: 0.0, v: 1.0, color: Color.Red },
		{ x: w, y: 0, u: 1.0, v: 1.0, color: Color.Yellow },
		{ x: 0, y: h, u: 0.0, v: 0.0, color: Color.Lime },
		{ x: w, y: h, u: 1.0, v: 0.0, color: Color.Blue },
	]);
	let shape = new Shape(ShapeType.TriStrip, texture, vbo);
	let transform = new Transform()
		.translate(-160, -120)
		.scale(0.75, 0.75)
		.rotate(15)
		.translate(160, 120);
	Dispatch.onRender(() => {
		shape.draw(Surface.Screen, transform);
	});
}
