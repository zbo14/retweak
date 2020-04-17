'use strict'

const assert = require('assert')
const util = require('../../src/util')

describe('src/util', () => {
  describe('#headers2string()', () => {
    it('returns string with correctly-sorted headers', () => {
      const str = util.headers2string({
        'x-foo': 1,
        'x-bar': 2,
        'x-baz': 3
      })

      assert.deepStrictEqual(str, [
        'x-bar: 2',
        'x-baz: 3',
        'x-foo: 1'
      ].join('\n'))
    })
  })

  describe('#string2headers()', () => {
    it('doesn\'t set header without value', () => {
      const str = [
        'x-foo: 1',
        'x-bar: 2',
        'x-baz:'
      ].join('\n')

      const headers = util.string2headers(str)

      assert.deepStrictEqual(headers, {
        'x-foo': '1',
        'x-bar': '2'
      })
    })
  })
})
