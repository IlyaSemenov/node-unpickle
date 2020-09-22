/*
Modified version of https://github.com/IlyaSemenov/node-unpickle

improve fail2ban compatibility
*/

module.exports.unpickle=function (buffer) {
	const state = new State(buffer)
	return state.parse()
};

const opcodes = {
	PROTO: 0x80,
	FRAME: 0x95,
	EMPTY_LIST: 0x5d, // ]
	EMPTY_DICT: 0x7d, // }
	REDUCE:0x52, //R
	MEMOIZE: 0x94,
	BINGET: 0x68, // h
	MARK: 0x28, // (
	NONE: 0x4e, // N
	BININT: 0x4a, // J
	BININT1: 0x4b,
	BININT2: 0x4d,
	BINFLOAT: 0X47, // G
	SHORT_BINUNICODE: 0x8c,
	BINUNICODE: 0x58, // X
	APPEND: 0x61, // a
	APPENDS: 0x65, // e
	SETITEM: 0x73, // s
	SETITEMS: 0x75, // u
	TUPLE1: 0x85,
	TUPLE2: 0x86,
	STOP: 0x2e, // .
	STACK_GLOBAL: 0x93
}

const reduceTypes={
	'builtins':{
		'str':(ar)=>{
			let ret=[];
			ar.forEach((val)=>{
				ret.push(String(val))
			});
			return ret.join(', ')
		}
	}
}

const operatorNameForOpcode = (function reverseMap (map) {
	let revMap = {}
	for (const key of Object.keys(map)) {
		revMap[map[key]] = key
	}
	return revMap
})(opcodes)

const mark = Object()

class State {

	constructor (buffer) {
		this.buffer = buffer
		this.position = 0
		this.stack = []
		this.memos = []
		this.stopped = false
	}

	parse () {
		let iter=0;
		while (!this.stopped) {
			iter++;
			const opcode = this.buffer[this.position++]
			const operatorName = operatorNameForOpcode[opcode]
			if (!operatorName) {
				throw new Error('Unknown opcode: 0x' + opcode.toString(16)+' pos:'+this.position)
			}
			operatorName && this[operatorName]()
		}
		//return this.stack;
		return this.stack[0]
	}

	PROTO () {
		this.position++
	}

	FRAME () {
		this.position += 8
	}

	EMPTY_LIST () {
		this.stack.push([])
	}

	EMPTY_DICT () {
		this.stack.push({})
	}

	REDUCE () {
		let val=this.stack.pop();
		let typeFunc=this.stack.pop();
		if (typeof(typeFunc)=='function'){
			val=typeFunc(val);
		}
		this.stack.push(val);
	}

	MEMOIZE () {
		this.memos.push(this.stack[this.stack.length - 1])
	}

	BINGET () {
		const memoPos = this.buffer[this.position++]
		const memo = this.memos[memoPos]
		this.stack.push(memo)
	}

	MARK () {
		this.stack.push(mark)
	}

	NONE () {
		this.stack.push(null)
	}

	BININT () {
		const value = this.buffer.readUInt32LE(this.position)
		this.position += 4
		this.stack.push(value)
	}

	BININT1 () {
		const value = this.buffer.readUInt8(this.position)
		this.position += 1
		this.stack.push(value)
	}

	BININT2 () {
		const value = this.buffer.readUInt16LE(this.position)
		this.position += 2
		this.stack.push(value)
	}

	BINFLOAT () {
		const value = this.buffer.readDoubleBE(this.position)
		this.position += 8
		this.stack.push(value)
	}

	SHORT_BINUNICODE () {
		const len = this.buffer.readUInt8(this.position++)
		const str = this.buffer.slice(this.position, this.position + len).toString()
		this.position += len
		this.stack.push(str)
	}

	BINUNICODE () {
		const len = this.buffer.readUInt32LE(this.position)
		this.position += 4
		const str = this.buffer.slice(this.position, this.position + len).toString()
		this.position += len
		this.stack.push(str)
	}

	APPEND () {
		const value = this.stack.pop()
		this.stack[this.stack.length - 1].push(value)
	}

	STACK_GLOBAL () {
		const type2 = this.stack.pop();
		const type1 = this.stack.pop();
		let typeFunc=(reduceTypes[type1] && reduceTypes[type1][type2])||null
		this.stack.push(typeFunc);
	}

	APPENDS () {
		const items = []
		for (;;) {
			const value = this.stack.pop()
			if (value === mark) {
				break
			}
			items.push(value)
		}
		let last=this.stack.pop();
		if (!last.concat) last=[last];
		this.stack.push(last.concat(items))
	}

	SETITEM () {
		const value = this.stack.pop()
		const key = this.stack.pop()
		this.stack[this.stack.length - 1][key] = value
	}

	SETITEMS () {
		const items = {}
		for (;;) {
			const value = this.stack.pop()
			if (value === mark) {
				break
			}
			const key = this.stack.pop()
			items[key] = value
		}
		Object.assign(this.stack[this.stack.length - 1], items)
	}
	TUPLE1 () {
		const value1 = this.stack.pop()
		this.stack.push([value1]);
	}
	TUPLE2 () {
		const value2 = this.stack.pop()
		const value1 = this.stack.pop()
		this.stack.push([value1, value2])
	}

	STOP () {
		this.stopped = true
	}
}
