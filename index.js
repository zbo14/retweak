#!/usr/bin/env node

'use strict'

const program = require('./src')

program.parseAsync(process.argv)
  .catch(err => console.error(err.message) || 1)
  .then(process.exit)
