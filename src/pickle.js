const opcodes=require('./opcodes.js');

/*]    EMPTY_LIST                Push an empty list.
    1: q    BINPUT     0              Store the stack top into the memo.  The stack is not popped.
    3: (    MARK                      Push markobject onto the stack.
    4: X        BINUNICODE 'status'   Push a Python Unicode string object.
   15: q        BINPUT     1          Store the stack top into the memo.  The stack is not popped.
   17: X        BINUNICODE 'ansServices' Push a Python Unicode string object.
   33: q        BINPUT     2             Store the stack top into the memo.  The stack is not popped.
   35: e        APPENDS    (MARK at 3)   Extend a list by a slice of stack objects.
   36: .    STOP                         Stop the unpickling machine.*/

class State {
  constructor (){
    this.binputCurKey=0;
  }

  BINPUT(){
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt8(opcodes.BINPUT);
    buf.writeInt8(this.binputCurKey, 1);
    this.binputCurKey++;
    return buf;
  }

  dump(obj){
    var retBuf=null;
    if (typeof(obj)=="string"){
      let preBuf=Buffer.from([opcodes.BINUNICODE]);
      let strBuf=Buffer.from(obj);
      let lenBuf=Buffer.alloc(4);
      lenBuf.writeUInt32LE(strBuf.length);
      retBuf=Buffer.concat([preBuf,lenBuf,strBuf])
    }else if (obj instanceof Array){
      let forArray=this.BINPUT();
      let preBuf=Buffer.from([
        opcodes.EMPTY_LIST,
        forArray[0],forArray[1],
        opcodes.MARK
      ]);

      let itemsBuf=[];
      for (var i=0;i<obj.length;i++){
        itemsBuf.push(Buffer.concat([
          this.dump(obj[i]),
          this.BINPUT()
        ]));
      }
      let postBuf=Buffer.from([opcodes.APPENDS]);
      retBuf=Buffer.concat([preBuf].concat(itemsBuf).concat([postBuf]));
    }

    return retBuf;
  }
}

function pickle(topObj){
  let state=new State();
  return Buffer.concat([
    state.dump(topObj),
    Buffer.from([opcodes.STOP])
  ])
}
module.exports=pickle;
