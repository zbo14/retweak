'use strict'

const commander = require('commander')
const retweak = require('./retweak')

const methods = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'TRACE',
  'PATCH'
].join(',')

const program = new commander.Command()

program
  .version('1.3.0')
  .option('-d, --data <data/@file>', 'request data to send')
  .option('-H, --headers <headers/@file>', 'request headers to send')
  .option('-j, --json', 'write JSON responses to file (only if -o)')
  .option('-k, --insecure', 'allow insecure TLS connection')
  .option('-l, --list <values/@file>', 'list of values to try')
  .option('-o, --output <file>', 'write all responses to file')
  .option('-p, --parallel', 'send requests in parallel')
  .option('-q, --quiet', 'don\'t show banner and debugging info')
  .option('-t, --tweak <part>', 'part of the request to tweak ["url","method","header","data"]')
  .option('-X, --method <method>', 'request method')

program
  .command('methods <url>')
  .description('test all HTTP methods')
  .action((url, opts) => retweak(url, { ...opts.parent, list: methods, tweak: 'method' }))

program
  .arguments('<url>')
  .action(retweak)

module.exports = program
