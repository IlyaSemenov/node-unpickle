# Unpickle Python data in Node.js

This library allows to unpickle data pickled with Python 3.5 (up to pickle prococol 4).

**WARNING:** Not all pickle opcodes are supported. The library was created from scratch and I only added opcodes that I encountered in my test data.

## Installation

Use npm:

```bash
npm install unpickle
```

## Usage

```js
const unpickle = require ('unpickle');
const data = unpickle.parse(<Buffer>);
const buf = unpickle.dump(data);
```

The following example unpickles Django session from Redis:

```js
const unpickle = require ('unpickle');

async function getDjangoSession (sessionId) {
  const data = await redis.getAsync('django.contrib.sessions.cache' + sessionId)
  return unpickle.parse(data)
}
```

## Testing

```bash
git clone https://github.com/IlyaSemenov/node-unpickle.git
cd node-unpickle
npm test
```

### How to inspect pickle in Python

```python
s = b"\x80\x04\x95....."
import pickle; import pickletools; print(pickle.loads(s)); pickletools.dis(s)
```

### How to inspect pickle at console

```bash
python -m pickletools -a -m ./test/pickles/fail2ban.pickle
```

## Contributing

PRs and general feedback are welcome.
