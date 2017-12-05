// @flow

import debug from 'debug'
import { BZZ } from 'erebos'
import { buffer } from 'micro'
import type { express$Application } from 'express'

export default (swarmHttpUrl: string, app: express$Application) => {
  const bzz = new BZZ(swarmHttpUrl)
  const log = debug('onyx:bzz')

  app.get('/files/:hash', async (req, res) => {
    log('request file', req.params.hash)
    const file = await bzz.downloadRawBuffer(req.params.hash)
    log('file: ', file)
    if (file) {
      res.send(file)
    } else {
      res.status(404).send('not found')
    }
  })
  app.post('/files', async (req, res) => {
    const file = await buffer(req, { limit: '10mb' })
    const hash = await bzz.uploadRaw(file, {
      'content-type': req.headers['content-type'],
    })
    res.send(hash)
  })
}
