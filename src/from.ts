/*
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2018, Fat Cerberus
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
 *  * Neither the name of miniSphere nor the names of its contributors may be
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

export default
function from<T>(...sources: Iterable<T>[])
{
	return new Query(...sources);
}

class Query<T> implements Iterable<T>
{
	private source: Iterable<T>;

	constructor(...sources: Iterable<T>[])
	{
		if (sources.length > 1)
			this.source = multi(...sources);
		else
			this.source = sources[0];
	}

	get [Symbol.iterator]()
	{
		return this.source[Symbol.iterator];
	}

	get [Symbol.toStringTag]()
	{
		return this.constructor.name;
	}

	besides(callback: (value: T) => void)
	{
		return new Query(map(this.source, it => (callback(it), it)));
	}

	every(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (!predicate(item))
				return false;
		}
		return true;
	}

	find(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (predicate(item))
				return item;
		}
		return undefined;
	}

	first(count: number)
	{
		return new Query(takeWhile(this.source, () => count-- > 0));
	}

	forEach(callback: (value: T) => void)
	{
		for (const item of this.source)
			callback(item);
	}

	filter(predicate: (value: T) => boolean)
	{
		return new Query(filter(this.source, predicate));
	}

	includes(value: T)
	{
		for (const item of this.source) {
			if (item === value)
				return true;
		}
		return false;
	}

	map<R>(mapper: (value: T) => R)
	{
		return new Query(map(this.source, mapper));
	}

	reduce<R>(reducer: (accumulator: R | T, value: T) => R, initialValue?: R)
	{
		let accumulator: T | R | undefined = initialValue;
		for (const item of this.source) {
			if (accumulator === undefined)
				accumulator = item;
			else
				accumulator = reducer(accumulator, item);
		}
		return accumulator;
	}

	some(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (predicate(item))
				return true;
		}
		return false;
	}

	toArray()
	{
		return [ ...this.source ];
	}
}

function filter<T>(source: Iterable<T>, predicate: (value: T) => boolean): IterableIterator<T>
{
	const iter = source[Symbol.iterator]();
	return {
		[Symbol.iterator]() { return this; },
		next() {
			for (;;) {
				const result = iter.next();
				if (result.done || predicate(result.value))
					return result;
			}
		},
	};
}

function map<T, R>(source: Iterable<T>, mapper: (value: T) => R): IterableIterator<R>
{
	const iter = source[Symbol.iterator]();
	return {
		[Symbol.iterator]() { return this; },
		next(): IteratorResult<R> {
			const result = iter.next();
			if (!result.done)
				return { done: false, value: mapper(result.value) }
			else
				return { done: true } as IteratorResult<R>;
		},
	};
}

function takeWhile<T>(source: Iterable<T>, predicate: (value: T) => boolean): IterableIterator<T>
{
	const iter = source[Symbol.iterator]();
	return {
		[Symbol.iterator]() { return this; },
		next() {
			const result = iter.next();
			if (result.done || !predicate(result.value))
				result.done = true;
			return result;
		},
	};
}

function* multi<T>(...sources: Iterable<T>[])
{
	for (const source of sources) {
		for (const item of source)
			yield item;
	}
}
