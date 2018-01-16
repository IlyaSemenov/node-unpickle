export default function unpickle (buffer) {
	const state = new State(buffer)
	return state.parse()
}

const opcodes = {
	PROTO: 0x80,
	FRAME: 0x95,
	EMPTY_LIST: 0x5d, // ]
	EMPTY_DICT: 0x7d, // }
	MEMOIZE: 0x94,
	BINGET: 0x68, // h
	MARK: 0x28, // (
	NONE: 0x4e, // N
	BININT: 0x4a, // J
	BINFLOAT: 0X47, // G
	SHORT_BINUNICODE: 0x8c,
	BINUNICODE: 0x58, // X
	APPEND: 0x61, // a
	APPENDS: 0x65, // e
	SETITEM: 0x73, // s
	SETITEMS: 0x75, // u
	TUPLE2: 0x86,
	STOP: 0x2e, // .
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
		while (!this.stopped) {
			const opcode = this.buffer[this.position++]
			const operatorName = operatorNameForOpcode[opcode]
			if (!operatorName) {
				throw new Error('Unknown opcode: 0x' + opcode.toString(16))
			}
			this[operatorName]()
		}
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

	APPENDS () {
		const items = []
		for (;;) {
			const value = this.stack.pop()
			if (value === mark) {
				break
			}
			items.push(value)
		}
		this.stack.push(this.stack.pop().concat(items))
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

	TUPLE2 () {
		const value2 = this.stack.pop()
		const value1 = this.stack.pop()
		this.stack.push([value1, value2])
	}

	STOP () {
		this.stopped = true
	}
}

