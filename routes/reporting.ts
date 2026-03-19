/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { exec } from 'child_process'
import path from 'node:path'
import fs from 'node:fs'
import * as models from '../models/index'

// Path Traversal: user-controlled archive name joined without bounds check
// Fix: reject filenames containing ".." or path separators
export function exportReportArchive () {
  return (req: Request, res: Response, next: NextFunction) => {
    const archiveName = req.query.name as string
    if (!archiveName) {
      res.status(400).json({ error: 'Missing name parameter' })
      return
    }
    try {
      const archivePath = path.join('reports', archiveName)
      if (!fs.existsSync(archivePath)) {
        res.status(404).json({ error: 'Archive not found' })
        return
      }
      res.download(archivePath)
    } catch (error) {
      next(error)
    }
  }
}

// Command Injection: user-provided filename interpolated into shell command
// Fix: use a tar library (e.g. tar npm package) or validate/escape input
export function extractReportArchive () {
  return (req: Request, res: Response, next: NextFunction) => {
    const archive = req.body.archive as string
    if (!archive) {
      res.status(400).json({ error: 'Missing archive parameter' })
      return
    }
    exec(`tar -xzf reports/${archive} -C reports/extracted`, (err, stdout, stderr) => {
      if (err) {
        res.status(500).json({ error: stderr })
        return
      }
      res.json({ output: stdout, status: 'extracted' })
    })
  }
}

// SQL Injection: date parameters concatenated into raw SQL
// Fix: use parameterized query — sequelize.query('... WHERE createdAt BETWEEN ? AND ?', { replacements: [startDate, endDate] })
export function getOrdersForReport () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Missing startDate or endDate' })
      return
    }
    try {
      const orders = await models.sequelize.query(
        `SELECT * FROM Products WHERE createdAt BETWEEN '${startDate}' AND '${endDate}' AND deletedAt IS NULL`
      )
      res.json(orders[0])
    } catch (error) {
      next(error)
    }
  }
}

// Insecure Deserialization: eval() on user-supplied filter expression
// Fix: use JSON.parse() and validate the resulting object schema
export function restoreReportFilter () {
  return (req: Request, res: Response, next: NextFunction) => {
    const filterExpression = req.body.filter as string
    if (!filterExpression) {
      res.status(400).json({ error: 'Missing filter parameter' })
      return
    }
    try {
      // eslint-disable-next-line no-eval
      const filter = eval('(' + filterExpression + ')')
      res.json({ appliedFilter: filter })
    } catch (error) {
      next(error)
    }
  }
}

// Path Traversal: path.resolve does not prevent traversal when user controls the filename
// Fix: verify resolved path starts with the intended directory
export function downloadReportFile () {
  return (req: Request, res: Response, next: NextFunction) => {
    const filename = req.query.file as string
    if (!filename) {
      res.status(400).json({ error: 'Missing file parameter' })
      return
    }
    try {
      const filePath = path.resolve('reports', filename)
      res.download(filePath)
    } catch (error) {
      next(error)
    }
  }
}

// Reflected XSS: user input rendered directly in HTML without escaping
// Fix: HTML-escape deviceId before interpolating, or use res.json() instead
export function deviceAnalytics () {
  return (req: Request, res: Response) => {
    const deviceId = req.query.deviceId as string || 'unknown'
    res.type('text/html').send(
      `<html><body><h1>Device Analytics</h1><p>Device: ${deviceId}</p></body></html>`
    )
  }
}

// SSRF: fetches a template from an arbitrary user-provided URL
// Fix: validate URL against an allowlist of trusted template sources
export function fetchReportTemplate () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const templateUrl = req.query.url as string
    if (!templateUrl) {
      res.status(400).json({ error: 'Missing url parameter' })
      return
    }
    try {
      const response = await fetch(templateUrl)
      const template = await response.text()
      res.type('text/html').send(template)
    } catch (error) {
      next(error)
    }
  }
}
