const opcodes = {
  PROTO: 0x80,
  FRAME: 0x95,
  EMPTY_LIST: 0x5d, // ]
  EMPTY_DICT: 0x7d, // }
  REDUCE: 0x52, // R
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
  STACK_GLOBAL: 0x93,
  BINPUT: 0x71
}

module.exports = opcodes
