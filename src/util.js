'use strict'

const { readFile, writeFile } = require('fs').promises

const divider = '='.repeat(60)

/* istanbul ignore next */
const error = x => console.error('\x1b[31m%s\x1b[0m', x)
/* istanbul ignore next */
const log = x => console.log('\x1b[32m%s\x1b[0m', x)
/* istanbul ignore next */
const warn = x => console.warn('\x1b[33m%s\x1b[0m', x)

const headers2string = (headers, joinOn = '\n') =>
  Object.entries(headers)
    .sort(([a], [b]) => a > b ? 1 : -1)
    .map(([name, value]) => name.trim().toLowerCase() + ': ' + ('' + value).trim())
    .join(joinOn)

const isFilename = (str = '') => str.startsWith('@')

const read = input =>
  isFilename(input) ? readFile(input.slice(1), 'utf8') : Promise.resolve(input)

const replacer = (str, idx) => value => str.slice(0, idx) + value + str.slice(idx + 1)

const split = (str, splitOn) =>
  str.split(splitOn)
    .map(part => part.trim())
    .filter(Boolean)

const splitOn = str => isFilename(str) ? '\n' : ','

const string2headers = (str, splitOn = '\n') => {
  const headers = {}

  split(str, splitOn).forEach(line => {
    let [key, ...value] = line.split(':')
    key = key.trim().toLowerCase()
    value = value.join(':').trim()

    if (key && value) {
      headers[key] = value
    }
  })

  return headers
}

module.exports = {
  divider,
  error,
  headers2string,
  isFilename,
  log,
  read,
  readFile,
  replacer,
  split,
  splitOn,
  string2headers,
  warn,
  writeFile
}
