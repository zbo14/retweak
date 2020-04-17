'use strict'

const fs = require('fs')
const path = require('path')

const bannerPath = path.join(__dirname, '..', 'banner.ascii')

module.exports = fs.readFileSync(bannerPath, 'utf8')
