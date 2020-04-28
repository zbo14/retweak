'use strict'

const path = require('path')

const WORDLISTS = path.join(__dirname, '..', 'wordlists')
const IGNORE_HEADERS = '@' + path.join(WORDLISTS, 'ignore-headers.txt')
const MAX_DATA = 1e3

module.exports = {
  IGNORE_HEADERS,
  MAX_DATA,
  WORDLISTS
}
