const opcodes = require('./opcodes.js')

class State {
  constructor () {
    this.binputCurKey = 0
  }

  BINPUT () {
    const buf = Buffer.allocUnsafe(2)
    buf.writeInt8(opcodes.BINPUT)
    buf.writeInt8(this.binputCurKey, 1)
    this.binputCurKey++
    return buf
  }

  dump (obj) {
    var retBuf = null
    if (typeof (obj) === 'string') {
      const preBuf = Buffer.from([opcodes.BINUNICODE])
      const strBuf = Buffer.from(obj)
      const lenBuf = Buffer.alloc(4)
      lenBuf.writeUInt32LE(strBuf.length)
      retBuf = Buffer.concat([preBuf, lenBuf, strBuf])
    } else if (obj instanceof Array) {
      const forArray = this.BINPUT()
      const preBuf = Buffer.from([
        opcodes.EMPTY_LIST,
        forArray[0], forArray[1],
        opcodes.MARK
      ])

      const itemsBuf = []
      for (var i = 0; i < obj.length; i++) {
        itemsBuf.push(Buffer.concat([
          this.dump(obj[i]),
          this.BINPUT()
        ]))
      }
      const postBuf = Buffer.from([opcodes.APPENDS])
      retBuf = Buffer.concat([preBuf].concat(itemsBuf).concat([postBuf]))
    }

    return retBuf
  }
}

function pickle (topObj) {
  const state = new State()
  return Buffer.concat([
    state.dump(topObj),
    Buffer.from([opcodes.STOP])
  ])
}
module.exports = pickle
