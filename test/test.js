/* global describe, it */
const fs = require('fs')
const path = require('path')
const cjsPackage = require(path.resolve(__dirname, '..', 'src', 'index.cjs'))
const chai = require('chai')
chai.should()

describe('CommonJs parse', function () {
  const dir = path.resolve(__dirname, 'pickles')
  for (const fn of fs.readdirSync(dir)) {
    it(`Should parse ${fn}`, function () {
      cjsPackage.parse(fs.readFileSync(path.join(dir, fn)))
    })
  }
})

describe('CommonJs dump. Make pickle from array', function () {
  it('Should be equals fail2banCmd.pickle=[\'set\',\'ansServices\',\'banip\',\'10.152.64.100\']', function () {
    const etalonBin = fs.readFileSync(path.resolve(__dirname, 'pickles', 'fail2banCmd.pickle'))
    const resultBin = cjsPackage.dump(['set', 'ansServices', 'banip', '10.152.64.100'])
    Buffer.compare(etalonBin, resultBin)
  })
})
