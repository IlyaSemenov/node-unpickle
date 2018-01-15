export default function unpickle (buffer) {
	const state = {
		buffer: buffer,
		position: 0,
		stack: [],
		memos: [],
		stopped: false,
	}
	while (!state.stopped) {
		const opcode = state.buffer[state.position++]
		const operatorName = operatorNameForOpcode[opcode]
		if (!operatorName) {
			throw new Error('Unknown opcode: 0x' + opcode.toString(16))
		}
		operators[operatorName](state)
	}
	return state.stack[0]
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

const operatorNameForOpcode = {}
for (const operatorName of Object.keys(opcodes)) {
	operatorNameForOpcode[opcodes[operatorName]] = operatorName
}

const mark = Object()

const operators = {
	PROTO (state) {
		state.position++
	},
	FRAME (state) {
		state.position += 8
	},
	EMPTY_LIST (state) {
		state.stack.push([])
	},
	EMPTY_DICT (state) {
		state.stack.push({})
	},
	MEMOIZE (state) {
		state.memos.push(state.stack[state.stack.length - 1])
	},
	BINGET (state) {
		const memoPos = state.buffer[state.position++]
		const memo = state.memos[memoPos]
		state.stack.push(memo)
	},
	MARK (state) {
		state.stack.push(mark)
	},
	NONE (state) {
		state.stack.push(null)
	},
	BININT (state) {
		const value = state.buffer.readUInt32LE(state.position)
		state.position += 4
		state.stack.push(value)
	},
	BINFLOAT (state) {
		const value = state.buffer.readDoubleBE(state.position)
		state.position += 8
		state.stack.push(value)
	},
	SHORT_BINUNICODE (state) {
		const len = state.buffer.readUInt8(state.position++)
		const str = state.buffer.slice(state.position, state.position + len).toString()
		state.position += len
		state.stack.push(str)
	},
	BINUNICODE (state) {
		const len = state.buffer.readUInt32LE(state.position)
		state.position += 4
		const str = state.buffer.slice(state.position, state.position + len).toString()
		state.position += len
		state.stack.push(str)
	},
	APPEND (state) {
		const value = state.stack.pop()
		state.stack[state.stack.length - 1].push(value)
	},
	APPENDS (state) {
		const items = []
		for (;;) {
			const value = state.stack.pop()
			if (value === mark) {
				break
			}
			items.push(value)
		}
		state.stack.push(state.stack.pop().concat(items))
	},
	SETITEM (state) {
		const value = state.stack.pop()
		const key = state.stack.pop()
		state.stack[state.stack.length - 1][key] = value
	},
	SETITEMS (state) {
		const items = {}
		for (;;) {
			const value = state.stack.pop()
			if (value === mark) {
				break
			}
			const key = state.stack.pop()
			items[key] = value
		}
		Object.assign(state.stack[state.stack.length - 1], items)
	},
	TUPLE2 (state) {
		const value2 = state.stack.pop()
		const value1 = state.stack.pop()
		state.stack.push([value1, value2])
	},
	STOP (state) {
		state.stopped = true
	},
}

