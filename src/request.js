'use strict'

const http = require('http')
const https = require('https')

module.exports = ({ url, ...opts }) => new Promise((resolve, reject) => {
  const isHTTPS = url.protocol === 'https:'
  const { request } = isHTTPS ? https : http
  const rejectUnauthorized = !!(isHTTPS && opts.insecure)

  Object.entries(opts.headers || {}).forEach(([name, value]) => {
    delete opts.headers[name]
    name = name.toLowerCase()

    if (name === 'content-length') return

    opts.headers[name] = value
  })

  request(url, { ...opts, rejectUnauthorized }, resp => {
    const { headers, statusCode } = resp

    let data = ''

    if (opts.method && opts.method.toUpperCase() === 'HEAD') {
      return resolve({ statusCode, headers, data })
    }

    resp
      .on('data', chunk => {
        data += chunk
      })
      .once('end', () => resolve({ statusCode, headers, data }))
      .once('error', reject)
  }).once('error', reject)
    .end(opts.data || '')
})
