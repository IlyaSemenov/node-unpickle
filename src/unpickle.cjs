const opcodes = require('./opcodes.cjs')

function unpickle (buffer) {
  const state = new State(buffer)
  return state.parse()
}
module.exports = unpickle

const reduceTypes = {
  builtins: {
    str: ar => ar.map(String).join(', ')
  }
}

const operatorNameForOpcode = (function reverseMap (map) {
  const revMap = {}
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
        throw new Error('Unknown opcode: 0x' + opcode.toString(16) + ' pos:' + this.position)
      }
      operatorName && this[operatorName]()
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

  REDUCE () {
    let val = this.stack.pop()
    const typeFunc = this.stack.pop()
    if (typeof (typeFunc) === 'function') {
      val = typeFunc(val)
    }
    this.stack.push(val)
  }

  MEMOIZE () {
    this.memos.push(this.stack[this.stack.length - 1])
  }

  BINPUT () {
    const value = this.buffer.readUInt8(this.position)
    this.position += 1
    this.memos[value] = this.stack[this.stack.length - 1]
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
    const type2 = this.stack.pop()
    const type1 = this.stack.pop()
    const typeFunc = (reduceTypes[type1] && reduceTypes[type1][type2]) || null
    this.stack.push(typeFunc)
  }

  APPENDS () {
    const items = []
    for (;;) {
      const value = this.stack.pop()
      if (value === mark) {
        break
      }
      items.unshift(value)
    }
    let last = this.stack.pop()
    if (!last.concat) last = [last]
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
    this.stack.push([value1])
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
