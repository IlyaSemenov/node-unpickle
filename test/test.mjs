/* global describe, it */
import fs from 'fs'
import path  from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import unpickle from '../src/index.mjs'
import chai from 'chai'
chai.should()

describe('ES6 module unpickle, Binary test samples', function () {
  const dir = path.resolve(__dirname, 'pickles')
  for (const fn of fs.readdirSync(dir)) {
    it(`Should parse ${fn}`, function () {
      unpickle(fs.readFileSync(path.join(dir, fn)))
    })
  }
})
