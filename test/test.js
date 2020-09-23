const fs = require('fs')
const path = require('path')
const thisPackage = require('..');

require('./setup')

describe('Binary test samples', function () {
	const dir = path.resolve(__dirname, 'pickles')
	for (const fn of fs.readdirSync(dir)) {
		it(`Should parse ${fn}`, function () {
			thisPackage.parse(fs.readFileSync(path.join(dir, fn)));

			///fail2ban\./.test(fn) && console.dir(thisPackage.parse(fs.readFileSync(path.join(dir, fn)))[1]);
		})
	}
})

describe('Make pickle from array', function () {
	it(`Should be equals fail2banCmd.pickle=['set','ansServices','banip','10.152.64.100']`, function () {
		let etalonBin=fs.readFileSync(path.resolve(__dirname, 'pickles','fail2banCmd.pickle'));
		let resultBin=thisPackage.dump(['set','ansServices','banip','10.152.64.100']);
		Buffer.compare(etalonBin, resultBin);
	});
});
