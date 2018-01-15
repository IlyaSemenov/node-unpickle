const fs = require('fs')
const path = require('path')
const unpickle = require('..')

require('./setup')

describe('Binary test samples', function () {
	const dir = path.resolve(__dirname, 'pickles')
	for (const fn of fs.readdirSync(dir)) {
		it(`Should parse ${fn}`, function () {
			unpickle(fs.readFileSync(path.join(dir, fn)))
		})
	}
})
