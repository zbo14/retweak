'use strict'

const assert = require('assert')
const path = require('path')
const rewire = require('rewire')
const sinon = require('sinon')
const util = require('../../src/util')

const fixturesPath = path.join(__dirname, '..', 'fixtures')
const headersPath = '@' + path.join(fixturesPath, 'headers.txt')
const dataPath = '@' + path.join(fixturesPath, 'data.txt')
const listPath = '@' + path.join(fixturesPath, 'list.txt')

const url = new URL('https://foobar.com/?id=*')
const method = 'POST'

const headers = {
  'x-foobar': 'baz',
  'content-type': 'application/json',
  cookie: 'u=1;v=2;z=3'
}

const strHeaders = Object.entries(headers)
  .map(([name, value]) => name + ': ' + value)
  .join(', ')

const data = '{"foo":"bar"}'

describe('lib/src/retweak', () => {
  beforeEach(() => {
    this.retweak = rewire('../../src/retweak')
    this.retweak.__set__('util.error', () => {})
    this.retweak.__set__('util.log', () => {})
    this.retweak.__set__('util.warn', () => {})
  })

  it('rejects if URL\'s invalid', async () => {
    try {
      await this.retweak('foobar.com')
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid URL: foobar.com')
    }
  })

  it('rejects if method\'s unrecognized', async () => {
    try {
      await this.retweak('https://foobar.com', { method: 'pop' })
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Unrecognized HTTP method: POP')
    }
  })

  it('rejects if tweak parameter\'s invalid', async () => {
    try {
      await this.retweak('https://foobar.com', { tweak: 'body' })
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Expected --tweak to be one of ["url","method","header","data"]')
    }
  })

  it('tweaks URL and mocks requests', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })

    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      list: '1,2,3',
      tweak: 'url'
    })

    sinon.assert.calledThrice(request)

    sinon.assert.calledWithExactly(request.getCall(0), {
      url: new URL('https://foobar.com/?id=1'),
      method: 'GET',
      headers,
      data: undefined
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url: new URL('https://foobar.com/?id=2'),
      method: 'GET',
      headers,
      data: undefined
    })

    sinon.assert.calledWithExactly(request.getCall(2), {
      url: new URL('https://foobar.com/?id=3'),
      method: 'GET',
      headers,
      data: undefined
    })
  })

  it('rejects if it can\'t find * in URL', async () => {
    try {
      await this.retweak('https://foobar.com/?id=x', {
        headers: strHeaders,
        list: '1,2,3',
        tweak: 'URL'
      })

      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Please specify * where you would like to tweak the URL')
    }
  })

  it('tweaks method and mocks requests', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })

    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      list: 'post, put,patch, delete',
      tweak: 'method'
    })

    sinon.assert.callCount(request, 4)

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method: 'POST',
      headers,
      data: undefined
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method: 'PUT',
      headers,
      data: undefined
    })

    sinon.assert.calledWithExactly(request.getCall(2), {
      url,
      method: 'PATCH',
      headers,
      data: undefined
    })

    sinon.assert.calledWithExactly(request.getCall(3), {
      url,
      method: 'DELETE',
      headers,
      data: undefined
    })
  })

  it('rejects if unrecognized method in list', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })

    this.retweak.__set__('request', request)

    try {
      await this.retweak(url, {
        headers: headersPath,
        list: 'post, put,   pop   , delete',
        tweak: 'method'
      })

      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Unrecognized HTTP method in list: POP')
    }
  })

  it('rejects if it can\'t find * in headers', async () => {
    try {
      await this.retweak(url, {
        headers: strHeaders,
        list: '1,2,3',
        tweak: 'header'
      })

      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Please specify * where you would like to tweak the header')
    }
  })

  it('tweaks cookie and mocks requests', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })

    this.retweak.__set__('request', request)

    await this.retweak(url, {
      method: 'GET',
      headers: headersPath,
      data: '...',
      list: '22,222,2222'
    })

    sinon.assert.calledThrice(request)

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method: 'GET',
      headers: { ...headers, cookie: 'u=1;v=22;z=3' },
      data: '...'
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method: 'GET',
      headers: { ...headers, cookie: 'u=1;v=222;z=3' },
      data: '...'
    })

    sinon.assert.calledWithExactly(request.getCall(2), {
      url,
      method: 'GET',
      headers: { ...headers, cookie: 'u=1;v=2222;z=3' },
      data: '...'
    })
  })

  it('defaults to POST, tweaks data, and mocks requests in parallel', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })

    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      data: dataPath,
      list: listPath,
      parallel: true
    })

    sinon.assert.calledThrice(request)

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method,
      headers,
      data: '{"foo":"bar"}'
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method,
      headers,
      data: '{"foo":"baz"}'
    })

    sinon.assert.calledWithExactly(request.getCall(2), {
      url,
      method,
      headers,
      data: '{"foo":"bam"}'
    })
  })

  it('writes responses to file', async () => {
    const request = sinon.stub().resolves({
      statusCode: 200,
      headers: { 'x-foo': 'bar', 'x-bar': 'baz' },
      data: 'idk'
    })

    const stream = { write: sinon.stub() }
    const createWriteStream = sinon.stub().returns(stream)

    this.retweak.__set__('fs', { createWriteStream })
    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      data: dataPath,
      list: 'baz ,  bam',
      output: 'foobar'
    })

    sinon.assert.calledOnce(createWriteStream)
    sinon.assert.calledTwice(request)
    sinon.assert.calledTwice(stream.write)

    sinon.assert.calledWithExactly(createWriteStream, 'foobar')

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method,
      headers,
      data: '{"foo":"baz"}'
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method,
      headers,
      data: '{"foo":"bam"}'
    })

    sinon.assert.calledWithExactly(stream.write.getCall(0), [
      '200 for request#1 data "baz"\n',
      'x-bar: baz',
      'x-foo: bar\n',
      'idk',
      util.divider
    ].join('\n') + '\n')

    sinon.assert.calledWithExactly(stream.write.getCall(1), [
      '200 for request#2 data "bam"\n',
      'x-bar: baz',
      'x-foo: bar\n',
      'idk',
      util.divider
    ].join('\n') + '\n')
  })

  it('is quiet and writes JSON responses to file', async () => {
    const request = sinon.stub().resolves({ statusCode: 200 })
    const stream = { write: sinon.stub() }
    const createWriteStream = sinon.stub().returns(stream)

    this.retweak.__set__('fs', { createWriteStream })
    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      data: dataPath,
      json: true,
      list: 'baz ,  bam',
      output: 'foobar',
      quiet: true
    })

    sinon.assert.calledOnce(createWriteStream)
    sinon.assert.calledTwice(request)
    sinon.assert.calledTwice(stream.write)

    sinon.assert.calledWithExactly(createWriteStream, 'foobar')

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method,
      headers,
      data: '{"foo":"baz"}'
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method,
      headers,
      data: '{"foo":"bam"}'
    })

    sinon.assert.calledWithExactly(
      stream.write.getCall(0),
      JSON.stringify({ statusCode: 200, index: 1 }, null, 2) + '\n'
    )

    sinon.assert.calledWithExactly(
      stream.write.getCall(1),
      JSON.stringify({ statusCode: 200, index: 2 }, null, 2) + '\n'
    )
  })

  it('rejects if it can\'t find * in data', async () => {
    try {
      await this.retweak(url, {
        headers: headersPath,
        data,
        list: listPath
      })

      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Please specify * where you would like to tweak the data')
    }
  })

  it('errors but doesn\'t stop if request() rejects', async () => {
    const error = sinon.stub()
    const request = sinon.stub()
      .onFirstCall().resolves({ statusCode: 200 })
      .onSecondCall().rejects(new Error('whoops'))
      .onThirdCall().resolves({ statusCode: 200 })

    this.retweak.__set__('util.error', error)
    this.retweak.__set__('request', request)

    await this.retweak(url, {
      headers: strHeaders,
      data: dataPath,
      list: 'baz ,  bam '
    })

    sinon.assert.calledTwice(error)
    sinon.assert.calledTwice(request)

    sinon.assert.calledWithExactly(error.getCall(1), '[!] ERROR: whoops')

    sinon.assert.calledWithExactly(request.getCall(0), {
      url,
      method,
      headers,
      data: '{"foo":"baz"}'
    })

    sinon.assert.calledWithExactly(request.getCall(1), {
      url,
      method,
      headers,
      data: '{"foo":"bam"}'
    })
  })
})
