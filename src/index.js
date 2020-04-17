'use strict'

const commander = require('commander')
const retweak = require('./retweak')

const program = new commander.Command()

program
  .version('1.0.0')
  .arguments('<url>')
  .option('-d, --data <data/@file>', 'request data to send')
  .option('-H, --headers <headers/@file>', 'request headers to send')
  .option('-l, --list <values/@file>', 'list of values to try')
  .option('-j, --json', 'write JSON responses to file (only if -o)')
  .option('-o, --output <file>', 'write all responses to file')
  .option('-p, --parallel', 'send requests in parallel')
  .option('-q, --quiet', 'don\'t show banner and debugging info')
  .option('-t, --tweak <part>', 'part of the request to tweak ["url","method","header","data"]')
  .option('-X, --method <method>', 'request method')
  .action(retweak)

module.exports = program
