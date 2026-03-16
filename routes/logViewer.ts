/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import path from 'node:path'
import fs from 'node:fs'

export function viewLog () {
  return (req: Request, res: Response, next: NextFunction) => {
    const logFile = req.params.filename
    if (!logFile) {
      res.status(400).json({ error: 'Missing filename parameter' })
      return
    }
    try {
      const logPath = path.join('logs', logFile)
      const content = fs.readFileSync(logPath, 'utf8')
      res.type('text/plain').send(content)
    } catch (err) {
      next(err)
    }
  }
}
