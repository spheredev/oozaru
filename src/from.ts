/*
 *  Oozaru JavaScript game engine
 *  Copyright (c) 2015-2019, Fat Cerberus
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
	private iterator: () => Iterator<T>;

	constructor(...sources: Iterable<T>[])
	{
		if (sources.length > 1)
			this.source = multi(sources);
		else
			this.source = sources[0];
		this.iterator = () => this.source[Symbol.iterator]();
	}

	get [Symbol.iterator]()
	{
		return this.iterator;
	}

	get [Symbol.toStringTag]()
	{
		return this.constructor.name;
	}

	all(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (!predicate(item))
				return false;
		}
		return true;
	}

	any(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (predicate(item))
				return true;
		}
		return false;
	}

	ascending<R>(keymaker: (value: T) => R)
	{
		return new Query(orderBy(this.source, keymaker));
	}

	besides(callback: (value: T) => void)
	{
		return new Query(map(this.source, it => (callback(it), it)));
	}

	descending<R>(keymaker: (value: T) => R)
	{
		return new Query(orderBy(this.source, keymaker, true));
	}

	find(predicate: (value: T) => boolean)
	{
		for (const item of this.source) {
			if (predicate(item))
				return item;
		}
		return undefined;
	}

	forEach(callback: (value: T) => void)
	{
		for (const item of this.source)
			callback(item);
	}

	includes(value: T)
	{
		for (const item of this.source) {
			if (item === value)
				return true;
		}
		return false;
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

	select<R>(mapper: (value: T) => R)
	{
		return new Query(map(this.source, mapper));
	}

	take(count: number)
	{
		return new Query(takeWhile(this.source, () => count-- > 0));
	}

	toArray()
	{
		return [ ...this.source ];
	}

	where(predicate: (value: T) => boolean)
	{
		return new Query(filter(this.source, predicate));
	}
}

function filter<T>(source: Iterable<T>, predicate: (value: T) => boolean)
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

function map<T, R>(source: Iterable<T>, mapper: (value: T) => R)
{
	const iter = source[Symbol.iterator]();
	return {
		[Symbol.iterator]() { return this; },
		next(): IteratorResult<R> {
			const result = iter.next();
			if (!result.done)
				return { done: false, value: mapper(result.value) };
			else
				return { done: true } as IteratorResult<R>;
		},
	};
}

function multi<T>(sources: Iterable<T>[])
{
	let sourceIndex = 0;
	let iter = sources[sourceIndex][Symbol.iterator]();
	return {
		[Symbol.iterator]() { return this; },
		next() {
			let result = iter.next();
			while (result.done) {
				if (++sourceIndex >= sources.length)
					return result;
				iter = sources[sourceIndex][Symbol.iterator]();
				result = iter.next();
			}
			return result;
		}
	}
}

function orderBy<T, R>(source: Iterable<T>, keymaker: (value: T) => R, descending = false)
{
	const items: [ R, T, number ][] = [];
	let index = 0;
	for (const value of source)
		items.push([ keymaker(value), value, index++ ]);
	if (descending)
		items.sort((a, b) => b[0] < a[0] ? -1 : a[0] < b[0] ? +1 : 0);
	else
		items.sort((a, b) => a[0] < b[0] ? -1 : b[0] < a[0] ? +1 : 0);
	const length = items.length;
	index = 0;
	return {
		[Symbol.iterator]() { return this; },
		next() {
			if (index >= length)
				return { done: true } as IteratorResult<T>;
			else
				return { done: false, value: items[index++][1] };
		}
	}
}

function takeWhile<T>(source: Iterable<T>, predicate: (value: T) => boolean)
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
