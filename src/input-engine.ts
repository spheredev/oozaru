/**
 *  Sphere: the JavaScript game platform
 *  Copyright (c) 2015-2021, Fat Cerberus
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name of Spherical nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

export
enum Key
{
	Alt,
	AltGr,
	Apostrophe,
	Backslash,
	Backspace,
	CapsLock,
	CloseBrace,
	Comma,
	Delete,
	Down,
	End,
	Enter,
	Equals,
	Escape,
	F1,
	F2,
	F3,
	F4,
	F5,
	F6,
	F7,
	F8,
	F9,
	F10,
	F11,
	F12,
	Home,
	Hyphen,
	Insert,
	LCtrl,
	LShift,
	Left,
	NumLock,
	OpenBrace,
	PageDown,
	PageUp,
	Period,
	RCtrl,
	RShift,
	Right,
	ScrollLock,
	Semicolon,
	Slash,
	Space,
	Tab,
	Tilde,
	Up,
	A,
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
	J,
	K,
	L,
	M,
	N,
	O,
	P,
	Q,
	R,
	S,
	T,
	U,
	V,
	W,
	X,
	Y,
	Z,
	D1,
	D2,
	D3,
	D4,
	D5,
	D6,
	D7,
	D8,
	D9,
	D0,
	NumPad1,
	NumPad2,
	NumPad3,
	NumPad4,
	NumPad5,
	NumPad6,
	NumPad7,
	NumPad8,
	NumPad9,
	NumPad0,
	NumPadEnter,
	Add,
	Decimal,
	Divide,
	Multiply,
	Subtract,
}

export
interface MouseEvent
{
	key: MouseKey;
	delta?: number;
	x: number;
	y: number;
}

export
enum MouseKey
{
	Left,
	Middle,
	Right,
	Back,
	Forward,
	WheelUp,
	WheelDown,
}

export default
class InputEngine
{
	#buttonDown: { [x: number]: boolean } = {};
	#keyQueue: Key[] = [];
	#lastMouseX: number | undefined = undefined;
	#lastMouseY: number | undefined = undefined;
	#mouseQueue: MouseEvent[] = [];
	#pressed: { [x: string]: boolean } = { '': false };

	constructor(canvas: HTMLCanvasElement)
	{
		canvas.addEventListener('contextmenu', e => e.preventDefault());

		canvas.addEventListener('keydown', e => {
			e.preventDefault();
			this.#pressed[e.code] = true;
			switch (e.code) {
				case 'ArrowLeft': this.#keyQueue.push(Key.Left); break;
				case 'ArrowRight': this.#keyQueue.push(Key.Right); break;
				case 'ArrowDown': this.#keyQueue.push(Key.Down); break;
				case 'ArrowUp': this.#keyQueue.push(Key.Up); break;
				case 'Backquote': this.#keyQueue.push(Key.Tilde); break;
				case 'Backslash': this.#keyQueue.push(Key.Backslash); break;
				case 'Backspace': this.#keyQueue.push(Key.Backspace); break;
				case 'BracketLeft': this.#keyQueue.push(Key.OpenBrace); break;
				case 'BracketRight': this.#keyQueue.push(Key.CloseBrace); break;
				case 'Comma': this.#keyQueue.push(Key.Comma); break;
				case 'Delete': this.#keyQueue.push(Key.Delete); break;
				case 'Digit0': this.#keyQueue.push(Key.D0); break;
				case 'Digit1': this.#keyQueue.push(Key.D1); break;
				case 'Digit2': this.#keyQueue.push(Key.D2); break;
				case 'Digit3': this.#keyQueue.push(Key.D3); break;
				case 'Digit4': this.#keyQueue.push(Key.D4); break;
				case 'Digit5': this.#keyQueue.push(Key.D5); break;
				case 'Digit6': this.#keyQueue.push(Key.D6); break;
				case 'Digit7': this.#keyQueue.push(Key.D7); break;
				case 'Digit8': this.#keyQueue.push(Key.D8); break;
				case 'Digit9': this.#keyQueue.push(Key.D9); break;
				case 'End': this.#keyQueue.push(Key.End); break;
				case 'Enter': this.#keyQueue.push(Key.Enter); break;
				case 'Equal': this.#keyQueue.push(Key.Equals); break;
				case 'Escape': this.#keyQueue.push(Key.Escape); break;
				case 'F1': this.#keyQueue.push(Key.F1); break;
				case 'F2': this.#keyQueue.push(Key.F2); break;
				case 'F3': this.#keyQueue.push(Key.F3); break;
				case 'F4': this.#keyQueue.push(Key.F4); break;
				case 'F5': this.#keyQueue.push(Key.F5); break;
				case 'F6': this.#keyQueue.push(Key.F6); break;
				case 'F7': this.#keyQueue.push(Key.F7); break;
				case 'F8': this.#keyQueue.push(Key.F8); break;
				case 'F9': this.#keyQueue.push(Key.F9); break;
				case 'F10': this.#keyQueue.push(Key.F10); break;
				case 'F11': this.#keyQueue.push(Key.F11); break;
				case 'F12': this.#keyQueue.push(Key.F12); break;
				case 'Home': this.#keyQueue.push(Key.Home); break;
				case 'Insert': this.#keyQueue.push(Key.Insert); break;
				case 'KeyA': this.#keyQueue.push(Key.A); break;
				case 'KeyB': this.#keyQueue.push(Key.B); break;
				case 'KeyC': this.#keyQueue.push(Key.C); break;
				case 'KeyD': this.#keyQueue.push(Key.D); break;
				case 'KeyE': this.#keyQueue.push(Key.E); break;
				case 'KeyF': this.#keyQueue.push(Key.F); break;
				case 'KeyG': this.#keyQueue.push(Key.G); break;
				case 'KeyH': this.#keyQueue.push(Key.H); break;
				case 'KeyI': this.#keyQueue.push(Key.I); break;
				case 'KeyJ': this.#keyQueue.push(Key.J); break;
				case 'KeyK': this.#keyQueue.push(Key.K); break;
				case 'KeyL': this.#keyQueue.push(Key.L); break;
				case 'KeyM': this.#keyQueue.push(Key.M); break;
				case 'KeyN': this.#keyQueue.push(Key.N); break;
				case 'KeyO': this.#keyQueue.push(Key.O); break;
				case 'KeyP': this.#keyQueue.push(Key.P); break;
				case 'KeyQ': this.#keyQueue.push(Key.Q); break;
				case 'KeyR': this.#keyQueue.push(Key.R); break;
				case 'KeyS': this.#keyQueue.push(Key.S); break;
				case 'KeyT': this.#keyQueue.push(Key.T); break;
				case 'KeyU': this.#keyQueue.push(Key.U); break;
				case 'KeyV': this.#keyQueue.push(Key.V); break;
				case 'KeyW': this.#keyQueue.push(Key.W); break;
				case 'KeyX': this.#keyQueue.push(Key.X); break;
				case 'KeyY': this.#keyQueue.push(Key.Y); break;
				case 'KeyZ': this.#keyQueue.push(Key.Z); break;
				case 'Minus': this.#keyQueue.push(Key.Hyphen); break;
				case 'Numpad0': this.#keyQueue.push(Key.NumPad0); break;
				case 'Numpad1': this.#keyQueue.push(Key.NumPad1); break;
				case 'Numpad2': this.#keyQueue.push(Key.NumPad2); break;
				case 'Numpad3': this.#keyQueue.push(Key.NumPad3); break;
				case 'Numpad4': this.#keyQueue.push(Key.NumPad4); break;
				case 'Numpad5': this.#keyQueue.push(Key.NumPad5); break;
				case 'Numpad6': this.#keyQueue.push(Key.NumPad6); break;
				case 'Numpad7': this.#keyQueue.push(Key.NumPad7); break;
				case 'Numpad8': this.#keyQueue.push(Key.NumPad8); break;
				case 'Numpad9': this.#keyQueue.push(Key.NumPad9); break;
				case 'NumpadAdd': this.#keyQueue.push(Key.Add); break;
				case 'NumpadDecimal': this.#keyQueue.push(Key.Decimal); break;
				case 'NumpadDivide': this.#keyQueue.push(Key.Divide); break;
				case 'NumpadEnter': this.#keyQueue.push(Key.NumPadEnter); break;
				case 'NumpadMultiply': this.#keyQueue.push(Key.Multiply); break;
				case 'NumpadSubtract': this.#keyQueue.push(Key.Subtract); break;
				case 'PageDown': this.#keyQueue.push(Key.PageDown); break;
				case 'PageUp': this.#keyQueue.push(Key.PageUp); break;
				case 'Period': this.#keyQueue.push(Key.Period); break;
				case 'Quote': this.#keyQueue.push(Key.Apostrophe); break;
				case 'Semicolon': this.#keyQueue.push(Key.Semicolon); break;
				case 'Slash': this.#keyQueue.push(Key.Slash); break;
				case 'Space': this.#keyQueue.push(Key.Space); break;
				case 'Tab': this.#keyQueue.push(Key.Tab); break;
			}
		});
		canvas.addEventListener('keyup', e => {
			e.preventDefault();
			this.#pressed[e.code] = false;
		});

		canvas.addEventListener('mousemove', e => {
			e.preventDefault();
			this.#lastMouseX = e.offsetX;
			this.#lastMouseY = e.offsetY;
		});
		canvas.addEventListener('mouseout', e => {
			e.preventDefault();
			this.#lastMouseX = undefined;
			this.#lastMouseY = undefined;
		});
		canvas.addEventListener('mousedown', e => {
			e.preventDefault();
			canvas.focus();
			const key = e.button === 1 ? MouseKey.Middle
				: e.button === 2 ? MouseKey.Right
				: e.button === 3 ? MouseKey.Back
				: e.button === 4 ? MouseKey.Forward
				: MouseKey.Left;
			this.#buttonDown[key] = true;
		});
		canvas.addEventListener('mouseup', e => {
			e.preventDefault();
			const key = e.button === 1 ? MouseKey.Middle
				: e.button === 2 ? MouseKey.Right
				: e.button === 3 ? MouseKey.Back
				: e.button === 4 ? MouseKey.Forward
				: MouseKey.Left;
			this.#buttonDown[key] = false;
			this.#mouseQueue.push({
				key,
				x: e.offsetX,
				y: e.offsetY,
			});
		});
		canvas.addEventListener('wheel', e => {
			e.preventDefault();
			const key = e.deltaY < 0.0 ? MouseKey.WheelUp
				: MouseKey.WheelDown;
			this.#mouseQueue.push({
				key,
				delta: Math.abs(e.deltaY),
				x: e.offsetX,
				y: e.offsetY,
			});
		});
	}

	get mouseX()
	{
		return this.#lastMouseX;
	}

	get mouseY()
	{
		return this.#lastMouseY;
	}

	clearKeyQueue()
	{
		this.#keyQueue.length = 0;
	}

	clearMouseQueue()
	{
		this.#mouseQueue.length = 0;
	}

	getKey()
	{
		const key = this.#keyQueue.pop();
		return key !== undefined ? key : null;
	}

	getMouseEvent()
	{
		const event = this.#mouseQueue.pop();
		return event !== undefined ? event : { key: null };
	}

	isKeyDown(key: Key)
	{
		const keySpec = key === Key.Tilde ? 'Backquote'
			: key === Key.D0 ? 'Digit0'
			: key === Key.D1 ? 'Digit1'
			: key === Key.D2 ? 'Digit2'
			: key === Key.D3 ? 'Digit3'
			: key === Key.D4 ? 'Digit4'
			: key === Key.D5 ? 'Digit5'
			: key === Key.D6 ? 'Digit6'
			: key === Key.D7 ? 'Digit7'
			: key === Key.D8 ? 'Digit8'
			: key === Key.D9 ? 'Digit9'
			: key === Key.A ? 'KeyA'
			: key === Key.B ? 'KeyB'
			: key === Key.C ? 'KeyC'
			: key === Key.D ? 'KeyD'
			: key === Key.E ? 'KeyE'
			: key === Key.F ? 'KeyF'
			: key === Key.G ? 'KeyG'
			: key === Key.H ? 'KeyH'
			: key === Key.I ? 'KeyI'
			: key === Key.J ? 'KeyJ'
			: key === Key.K ? 'KeyK'
			: key === Key.L ? 'KeyL'
			: key === Key.M ? 'KeyM'
			: key === Key.N ? 'KeyN'
			: key === Key.O ? 'KeyO'
			: key === Key.P ? 'KeyP'
			: key === Key.Q ? 'KeyQ'
			: key === Key.R ? 'KeyR'
			: key === Key.S ? 'KeyS'
			: key === Key.T ? 'KeyT'
			: key === Key.U ? 'KeyU'
			: key === Key.V ? 'KeyV'
			: key === Key.W ? 'KeyW'
			: key === Key.X ? 'KeyX'
			: key === Key.Y ? 'KeyY'
			: key === Key.Z ? 'KeyZ'
			: key === Key.PageDown ? 'PageDown'
			: key === Key.PageUp ? 'PageUp'
			: key === Key.LShift ? 'ShiftLeft'
			: key === Key.LCtrl ? 'ControlLeft'
			: key === Key.Alt ? 'AltLeft'
			: key === Key.RShift ? 'ShiftRight'
			: key === Key.RCtrl ? 'ControlRight'
			: key === Key.AltGr ? 'AltRight'
			: "";
		return this.#pressed[keySpec];
	}

	isMouseKeyDown(key: MouseKey)
	{
		return !!this.#buttonDown[key];
	}
}
