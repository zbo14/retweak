'use strict'

const commander = require('commander')
const path = require('path')
const retweak = require('./retweak')
const util = require('./util')

const wordlists = path.join(__dirname, '..', 'wordlists')
const hosts = '@' + path.join(wordlists, 'hosts.txt')
const methods = '@' + path.join(wordlists, 'methods.txt')
const urlEncoded = '@' + path.join(wordlists, 'url-encoded.txt')

const program = new commander.Command()

program
  .version('1.5.0')
  .option('-d, --data <data/@file>', 'request data to send')
  .option('-H, --headers <headers/@file>', 'request headers to send')
  .option('-i, --ignore-headers <names/@file>', 'don\'t report changes in these headers')
  .option('-j, --json', 'write JSON responses to file (only if -o)')
  .option('-k, --insecure', 'allow insecure TLS connection')
  .option('-l, --list <values/@file>', 'list of values to try')
  .option('-m, --max-data <size>B/KB', 'don\'t report data when it\'s over this size')
  .option('-o, --output <file>', 'write all responses to file')
  .option('-p, --parallel', 'send requests in parallel')
  .option('-q, --quiet', 'don\'t show banner and debugging info')
  .option('-t, --tweak <part>', 'part of the request to tweak ["url","method","header","data"]')
  .option('-X, --method <method>', 'request method')

program
  .command('hosts <url>')
  .description('test a bunch of values for the Host header')
  .action(async (url, opts) => {
    const data = await util.read(opts.headers) || ''
    let headers = util.string2headers(data, util.splitOn(opts.headers))
    headers.host = '*'
    headers = util.headers2string(headers, ',')

    return retweak(url, { list: hosts, ...opts.parent, headers, tweak: 'header' })
  })

program
  .command('methods <url>')
  .description('test all HTTP methods')
  .action((url, opts) => retweak(url, { ...opts.parent, list: methods, tweak: 'method' }))

program
  .command('urls <url>')
  .description('test URL encodings')
  .action((url, opts) => retweak(url, { ...opts.parent, list: urlEncoded, tweak: 'url' }))

program
  .arguments('<url>')
  .action(retweak)

module.exports = program
