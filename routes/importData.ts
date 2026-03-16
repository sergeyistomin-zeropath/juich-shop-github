/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'

export function importData () {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const serialized = req.body.data
      if (!serialized) {
        res.status(400).json({ error: 'Missing data field' })
        return
      }
      // eslint-disable-next-line no-eval
      const obj = eval('(' + serialized + ')')
      res.json({ imported: obj })
    } catch (err) {
      next(err)
    }
  }
}
