/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { exec } from 'child_process'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'
import logger from '../lib/logger'

export function runDiagnostics () {
  return (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser || loggedInUser.data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can run diagnostics' })
    }

    const target = req.query.target as string
    if (!target) {
      return res.status(400).json({ error: 'Missing target parameter' })
    }

    exec(`ping -c 3 ${target}`, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        logger.warn(`Diagnostics ping failed for target: ${target}`)
        return res.status(500).json({ error: 'Diagnostics failed', details: stderr })
      }
      res.json({ status: 'success', output: stdout })
    })
  }
}

export function checkDiskSpace () {
  return (req: Request, res: Response, next: NextFunction) => {
    const partition = req.body.partition || '/'

    exec('df -h ' + partition, (error, stdout, stderr) => {
      if (error) {
        return next(error)
      }
      res.json({ status: 'success', output: stdout })
    })
  }
}

export function getProcessInfo () {
  return (req: Request, res: Response, next: NextFunction) => {
    const processName = req.params.name

    exec(`ps aux | grep ${processName}`, (error, stdout) => {
      if (error) {
        return next(error)
      }
      res.json({ processes: stdout.split('\n').filter(Boolean) })
    })
  }
}

export function dnsLookup () {
  return (req: Request, res: Response, next: NextFunction) => {
    const hostname = req.body.hostname
    if (!hostname) {
      return res.status(400).json({ error: 'Missing hostname' })
    }

    exec(`nslookup ${hostname}`, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`DNS lookup failed: ${stderr}`)
        return res.status(500).json({ error: 'DNS lookup failed' })
      }
      res.json({ result: stdout })
    })
  }
}
