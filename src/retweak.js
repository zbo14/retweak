'use strict'

const fs = require('fs')
const http = require('http')
const banner = require('./banner')
const request = require('./request')
const util = require('./util')

module.exports = async (url, opts) => {
  url = new URL(url)

  let method

  if (opts.method) {
    method = opts.method.toUpperCase()

    if (!http.METHODS.includes(method)) {
      throw new Error('Unrecognized HTTP method: ' + method)
    }
  }

  let tweak

  if (opts.tweak) {
    tweak = opts.tweak.toLowerCase()

    if (!['url', 'method', 'header', 'data'].includes(tweak)) {
      throw new Error('Expected --tweak to be one of ["url","method","header","data"]')
    }
  }

  let [strHeaders, data, list] = await Promise.all([
    util.read(opts.headers),
    util.read(opts.data),
    util.read(opts.list)
  ])

  const headers = strHeaders && util.string2headers(strHeaders, util.splitOn(opts.headers))
  data = data && data.trim()
  list = list && util.split(list, util.splitOn(opts.list))

  method = method || (data ? 'POST' : 'GET')
  tweak = tweak || (data && ['POST', 'PUT', 'PATCH'].includes(method) ? 'data' : 'header')
  const part = tweak

  if (tweak === 'url') {
    const idx = url.href.indexOf('*')

    if (idx === -1) {
      throw new Error('Please specify * where you would like to tweak the URL')
    }

    const replacer = util.replacer(url.href, idx)
    tweak = value => ({ url: new URL(replacer(value)), method, headers, data })
  } else if (tweak === 'method') {
    list = list.map(value => value.toUpperCase())

    const method = list.find(value => !http.METHODS.includes(value))

    if (method) {
      throw new Error('Unrecognized HTTP method in list: ' + method)
    }

    tweak = value => ({ url, method: value, headers, data })
  } else if (tweak === 'header') {
    const idx = strHeaders.indexOf('*')

    if (idx === -1) {
      throw new Error('Please specify * where you would like to tweak the header')
    }

    const replace = util.replacer(strHeaders, idx)

    tweak = value => ({
      url,
      method,
      headers: util.string2headers(replace(value), util.splitOn(opts.headers)),
      data
    })
  } else {
    const idx = data.indexOf('*')

    if (idx === -1) {
      throw new Error('Please specify * where you would like to tweak the data')
    }

    const replace = util.replacer(data, idx)
    tweak = value => ({ url, method, headers, data: replace(value) })
  }

  const stream = opts.output && fs.createWriteStream(opts.output)

  if (!opts.quiet) {
    util.error(banner)
    util.warn('[-] Tweaking request ' + part)
    util.warn(`[-] Sending ${list.length} requests`)
  }

  const arr = []
  const codes = new Set()
  const json = !!opts.json
  const parallel = opts.parallel || false

  let count = 0

  for (const value of list) {
    const index = ++count
    const opts = tweak(value)

    const promise = request(opts).then(resp => {
      const status = `${resp.statusCode} for request#${index} ${part} "${value}"`

      if (!codes.has(resp.statusCode)) {
        codes.add(resp.statusCode)
        opts.quiet || util.log('[+] ' + status)
      }

      if (stream) {
        const result = json
          ? JSON.stringify({ ...resp, index }, null, 2)
          : [
            status + '\n',
            util.headers2string(resp.headers) + '\n',
            resp.data,
            util.divider
          ].join('\n')

        stream.write(result + '\n')
      }
    }).catch(err => opts.quiet || util.error('[!] ERROR: ' + err.message))

    arr.push(parallel ? promise : await promise)
  }

  opts.parallel && await Promise.all(arr)
}
