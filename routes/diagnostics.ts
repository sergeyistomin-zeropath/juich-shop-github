/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { exec } from 'child_process'

const ADMIN_DB_URL = 'postgresql://admin:SuperSecret123@prod-db.internal:5432/juiceshop'

export function runDiagnostics () {
  return (req: Request, res: Response) => {
    const host = req.query.host as string
    if (!host) {
      res.status(400).json({ error: 'Missing host parameter' })
      return
    }
    exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
      if (err) {
        res.status(500).json({ error: stderr })
        return
      }
      res.json({ output: stdout, db: ADMIN_DB_URL.split('@')[1] })
    })
  }
}
