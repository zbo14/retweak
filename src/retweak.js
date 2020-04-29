'use strict'

const fs = require('fs')
const http = require('http')
const banner = require('./banner')
const env = require('./env')
const request = require('./request')
const util = require('./util')

module.exports = async (url, opts) => {
  url = new URL(url)

  let method

  if (opts.method) {
    method = opts.method.trim().toUpperCase()

    if (!http.METHODS.includes(method)) {
      throw new Error('Unrecognized HTTP method: ' + method)
    }
  }

  let tweak

  if (opts.tweak) {
    tweak = opts.tweak.trim().toLowerCase()

    if (!['url', 'method', 'header', 'data'].includes(tweak)) {
      throw new Error('Expected --tweak to be one of ["url","method","header","data"]')
    }
  }

  opts.ignoreHeaders = (opts.ignoreHeaders || '').trim() || env.IGNORE_HEADERS

  let [strHeaders, data, list, ignoreHeaders] = await Promise.all([
    util.read(opts.headers),
    util.read(opts.data),
    util.read(opts.list),
    util.read(opts.ignoreHeaders)
  ])

  const headers = strHeaders && util.string2headers(strHeaders, util.splitOn(opts.headers))
  data = data && data.trim()
  list = list && util.split(list, util.splitOn(opts.list))

  method = method || (data ? 'POST' : 'GET')
  tweak = tweak || (data && ['POST', 'PUT', 'PATCH'].includes(method) ? 'data' : 'url')
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
    if (!strHeaders) {
      throw new Error('No headers provided')
    }

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
    if (!data) {
      throw new Error('No data provided')
    }

    const idx = data.indexOf('*')

    if (idx === -1) {
      throw new Error('Please specify * where you would like to tweak the data')
    }

    const replace = util.replacer(data, idx)
    tweak = value => ({ url, method, headers, data: replace(value) })
  }

  ignoreHeaders = new Set(util.split(ignoreHeaders, util.splitOn(opts.ignoreHeaders)))

  let maxData = (opts.maxData || '').replace(/\s/g, '').toUpperCase()

  if (opts.maxData) {
    let [, num, units] = opts.maxData.match(/([0-9]+(?:\.[0-9]+)?)(K?B)/) || []
    num = +num

    if (!num) {
      throw new Error('Expected --max-data to be a positive number followed by B/KB')
    }

    maxData = num * (units === 'KB' ? 1e3 : 1)
  } else {
    maxData = env.MAX_DATA
  }

  maxData = Math.floor(maxData)

  if (maxData < 1) {
    throw new Error('Please specify --max-data that is >= 1B')
  }

  if (!opts.quiet) {
    util.error(banner)
    util.warn('Tweaking request ' + part)
    util.warn(`Sending ${list.length} requests`)
  }

  const json = !!opts.json
  const parallel = opts.parallel || false
  const results = []

  const respCodes = new Set()
  const respHeaders = new Map()
  const respData = new Set()

  const stream = opts.output && fs.createWriteStream(opts.output)

  for (const value of list) {
    const opts = tweak(value)
    const arr = [`[REQUEST] "${value}"`]

    const promise = request(opts).then(resp => {
      if (!respCodes.has(resp.statusCode)) {
        respCodes.add(resp.statusCode)
        arr.push(`  CODE   - ${resp.statusCode}`)
      }

      Object.entries(resp.headers).forEach(([name, value]) => {
        if (ignoreHeaders.has(name)) return

        const values = respHeaders.get(name)

        if (values) {
          if (!values.includes(value)) {
            respHeaders.set(name, values.concat(value))
            arr.push(`  HEADER > "${name}: ${value}"`)
          }
        } else {
          respHeaders.set(name, [value])
          arr.push(`  HEADER > "${name}: ${value}"`)
        }
      })

      if (resp.data && resp.data.length < maxData && !respData.has(resp.data)) {
        respData.add(resp.data)
        const size = resp.data.length > 1e3 ? Math.round(resp.data.length / 100) / 10 + 'KB' : resp.data.length + 'B'
        const data = resp.data.slice(0, 80).replace(/\r?\n/g, '') + ` (SIZE:${size})`
        arr.push('  DATA   ~ ' + data)
      }

      arr.length > 1 && util.log(arr.join('\n'))

      if (stream) {
        const result = json
          ? JSON.stringify({ ...resp, value }, null, 2)
          : [
            `[REQUEST] "${value}"`,
            'CODE - ' + resp.statusCode + '\n',
            util.headers2string(resp.headers) + '\n',
            resp.data,
            util.divider
          ].join('\n')

        stream.write(result + '\n')
      }
    }).catch(err => opts.quiet || util.error('[!] ERROR: ' + err.message))

    results.push(parallel ? promise : await promise)
  }

  opts.parallel && await Promise.all(results)
}
