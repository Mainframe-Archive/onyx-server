// @flow

import { createServer } from 'http'

const KEY_RE = /^0x[0-9a-f]{130}$/gi

const keys = new Set()

const sendKeys = res => {
  const body = JSON.stringify(Array.from(keys))
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body).toString(),
    'Content-Type': 'application/json',
  })
  res.end(body)
}

const sendError = (res, code) => {
  res.statusCode = code
  res.end()
}

createServer((req, res) => {
  if (req.method === 'PUT') {
    const pk = req.url.slice(1)
    if (KEY_RE.test(pk)) {
      KEY_RE.lastIndex = 0
      keys.add(pk)
      sendKeys(res)
    } else sendError(res, 400)
  } else if (req.method === 'GET') {
    if (req.url === '/') sendKeys(res)
    else sendError(res, 404)
  } else sendError(res, 405)
}).listen(5050, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log('server listening on port 5050')
  }
})

process.on('uncaughtException', ex => {
  console.log('exception', ex)
})
