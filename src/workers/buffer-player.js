import Deque from '../deque.js';

class BufferProcessor extends AudioWorkletProcessor
{
	constructor(options)
	{
		super();
		this.buffers = new Deque();
		this.inputPtr = 0.0;
		this.numChannels = options.outputChannelCount[0];
		this.paused = false;
		this.framesLeft = 0.0;
		this.sampleRate = 44100;
		this.port.onmessage = (ev) => {
			this.buffers.push(ev.data);
			this.framesLeft += ev.data.length / this.numChannels;
		};
	}
	
	process(inputs, outputs, parameters)
	{
		outputs = outputs[0];
		if (this.paused || this.framesLeft < 128) {
			// not enough data buffered or stream is paused, fill with silence
			for (let i = 0; i < this.numChannels; ++i)
				outputs[i].fill(0.0);
			return true;
		}
		if ((this.framesLeft -= 128) < 0.0)
			this.framesLeft = 0.0;
		const step = this.sampleRate / sampleRate;
		let input = this.buffers.first;
		let inputPtr = this.inputPtr;
		for (let i = 0, len = outputs[0].length; i < len; ++i) {
			const t1 = Math.floor(inputPtr) * this.numChannels;
			let t2 = t1 + this.numChannels;
			const frac = inputPtr % 1.0;

			// FIXME: if `t2` is past the end of the buffer, the first sample from the
			//        NEXT buffer should be used, but actually doing that requires some
			//        reorganization, so just skip the interpolation for now.
			if (t2 >= input.length)
				t2 = t1;

			for (let j = 0; j < this.numChannels; ++j) {
				const a = input[t1 + j];
				const b = input[t2 + j];
				outputs[j][i] = a + frac * (b - a);
			}
			inputPtr += step;
			if (inputPtr >= Math.floor(input.length / this.numChannels)) {
				this.buffers.shift();
				if (!this.buffers.empty) {
					inputPtr -= Math.floor(input.length / this.numChannels);
					input = this.buffers.first;
				}
				else {
					// no more data, fill the rest with silence and return
					for (let j = 0; j < this.numChannels; ++j)
						outputs[j].fill(0.0, i + 1);
					return true;
				}
			}
		}
		this.inputPtr = inputPtr;
		return true;
	}
}

registerProcessor('buffer-processor', BufferProcessor);
