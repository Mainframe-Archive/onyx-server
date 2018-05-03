// @flow

import debug from 'debug'
import type { PssAPI } from 'erebos'
import https from 'https'
import http from 'http'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import path from 'path'

import type DB from './db'
import createBzzRoutes from './bzz'
import graphqlServer from './graphql/server'

export default (
  pss: PssAPI,
  db: DB,
  httpUrl: string,
  port: number,
  useTLS: boolean,
  certsDir: string,
): Promise<net$Server> => {
  return new Promise((resolve, reject) => {
    const log = debug('onyx:server')

    const app = express()
    app.use(cors())

    const graphql = graphqlServer(pss, db, port, app)
    createBzzRoutes(httpUrl, app)

    let server
    if (useTLS) {
      const unsecureApp = express()
      unsecureApp.get(
        '/mobile_client_cert',
        (req: express$Request, res: express$Response) => {
          res.download(path.join(certsDir, 'client.p12'))
        },
      )

      unsecureApp.get(
        '/ca_cert',
        (req: express$Request, res: express$Response) => {
          res.download(path.join(certsDir, 'ca.crt'))
        },
      )

      const unsecureServer = http.createServer(unsecureApp)
      unsecureServer.listen(5002)

      const options: { [string]: any } = {
        requestCert: true,
        rejectUnauthorized: true,
      }
      try {
        options.key = fs.readFileSync(path.join(certsDir, 'server-key.pem'))
        options.cert = fs.readFileSync(path.join(certsDir, 'server-crt.pem'))
        options.ca = fs.readFileSync(path.join(certsDir, 'ca-crt.pem'))
      } catch (err) {
        console.warn(
          `error reading ssl certificates, please make sure to run the certificate generation script.\n ${err}`,
        )
        throw err
      }
      server = https.createServer(options, app)
    } else {
      server = http.createServer(app)
    }

    server.listen(
      {
        port,
        host: useTLS ? '0.0.0.0' : 'localhost',
      },
      err => {
        if (err) {
          reject(err)
        } else {
          log(`running on port ${port}`)
          graphql.onCreated(server)
          resolve(server)
        }
      },
    )
  })
}
