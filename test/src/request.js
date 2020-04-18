'use strict'

const assert = require('assert')
const EventEmitter = require('events')
const rewire = require('rewire')
const sinon = require('sinon')

describe('src/request', () => {
  beforeEach(() => {
    this.request = rewire('../../src/request')
  })

  it('mocks HTTP request', async () => {
    const req = new EventEmitter()
    const resp = new EventEmitter()

    req.end = sinon.stub()
    resp.statusCode = 200
    resp.headers = {}

    const http = {
      request: sinon.spy((url, opts, cb) => {
        cb(resp)
        return req
      })
    }

    const url = new URL('http://foobar.com')

    this.request.__set__('http', http)

    const promise = this.request({ url })

    resp.emit('data', 'foobar')
    resp.emit('end')

    assert.deepStrictEqual(await promise, {
      statusCode: 200,
      headers: {},
      data: 'foobar'
    })

    sinon.assert.calledOnce(http.request)
    sinon.assert.calledWith(http.request, url, { rejectUnauthorized: false })

    sinon.assert.calledOnce(req.end)
    sinon.assert.calledWithExactly(req.end, '')
  })

  it('mocks HTTPS request', async () => {
    const req = new EventEmitter()
    const resp = new EventEmitter()

    req.end = sinon.stub()
    resp.statusCode = 200
    resp.headers = {}

    const https = {
      request: sinon.spy((url, opts, cb) => {
        cb(resp)
        return req
      })
    }

    const url = new URL('https://foobar.com')

    this.request.__set__('https', https)

    const promise = this.request({ url })

    resp.emit('data', 'foobar')
    resp.emit('end')

    assert.deepStrictEqual(await promise, {
      statusCode: 200,
      headers: {},
      data: 'foobar'
    })

    sinon.assert.calledOnce(https.request)
    sinon.assert.calledWith(https.request, url, { rejectUnauthorized: false })

    sinon.assert.calledOnce(req.end)
    sinon.assert.calledWithExactly(req.end, '')
  })

  it('deletes Content-Length header', async () => {
    const req = new EventEmitter()
    const resp = new EventEmitter()

    req.end = sinon.stub()
    resp.statusCode = 200
    resp.headers = {}

    const https = {
      request: sinon.spy((url, opts, cb) => {
        cb(resp)
        return req
      })
    }

    const url = new URL('https://foobar.com')

    this.request.__set__('https', https)

    const promise = this.request({
      url,
      data: 'foobar',
      headers: {
        'X-Foobar': 'baz',
        'cOnTenT-LENgth': 6
      },
      method: 'POST'
    })

    resp.emit('data', 'foobaz')
    resp.emit('end')

    assert.deepStrictEqual(await promise, {
      statusCode: 200,
      headers: {},
      data: 'foobaz'
    })

    sinon.assert.calledOnce(https.request)

    sinon.assert.calledWith(https.request, url, {
      data: 'foobar',
      headers: { 'x-foobar': 'baz' },
      method: 'POST',
      rejectUnauthorized: false
    })

    sinon.assert.calledOnce(req.end)
    sinon.assert.calledWithExactly(req.end, 'foobar')
  })

  it('doesn\'t wait for data if method === HEAD', async () => {
    const req = new EventEmitter()
    const resp = new EventEmitter()

    req.end = sinon.stub()
    resp.statusCode = 200
    resp.headers = {}

    const https = {
      request: sinon.spy((url, opts, cb) => {
        cb(resp)
        return req
      })
    }

    const url = new URL('https://foobar.com')

    this.request.__set__('https', https)

    const promise = this.request({ url, method: 'HEAD' })

    assert.deepStrictEqual(await promise, {
      statusCode: 200,
      headers: {},
      data: ''
    })

    sinon.assert.calledOnce(https.request)

    sinon.assert.calledWith(https.request, url, {
      method: 'HEAD',
      rejectUnauthorized: false
    })

    sinon.assert.calledOnce(req.end)
    sinon.assert.calledWithExactly(req.end, '')
  })
})
