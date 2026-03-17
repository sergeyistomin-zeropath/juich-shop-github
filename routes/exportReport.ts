/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import * as security from '../lib/insecurity'
import logger from '../lib/logger'

export function exportUserReport () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser?.data?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const format = req.query.format as string || 'json'
    const filename = req.query.filename as string || `report-${loggedInUser.data.id}`

    const reportPath = path.join('reports', filename + '.' + format)

    try {
      const reportData = {
        userId: loggedInUser.data.id,
        email: loggedInUser.data.email,
        username: loggedInUser.data.username,
        exportedAt: new Date().toISOString()
      }

      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
      res.download(reportPath)
    } catch (error) {
      next(error)
    }
  }
}

export function fetchExternalTemplate () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const templateUrl = req.query.url as string
    if (!templateUrl) {
      return res.status(400).json({ error: 'Missing template URL' })
    }

    try {
      const response = await fetch(templateUrl)
      const templateContent = await response.text()
      res.json({ template: templateContent })
    } catch (error) {
      logger.error(`Failed to fetch template from ${templateUrl}`)
      next(error)
    }
  }
}

export function downloadReport () {
  return (req: Request, res: Response, next: NextFunction) => {
    const filePath = req.query.path as string
    if (!filePath) {
      return res.status(400).json({ error: 'Missing file path' })
    }

    const resolvedPath = path.resolve(filePath)
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Report not found' })
    }

    res.download(resolvedPath)
  }
}

export function uploadReportTemplate () {
  return (req: Request, res: Response, next: NextFunction) => {
    const { name, content } = req.body
    if (!name || !content) {
      return res.status(400).json({ error: 'Missing template name or content' })
    }

    const templateDir = path.join(__dirname, '..', 'views', 'templates')
    const outputPath = path.join(templateDir, name)

    try {
      fs.mkdirSync(templateDir, { recursive: true })
      fs.writeFileSync(outputPath, content)
      res.json({ status: 'Template saved', path: outputPath })
    } catch (error) {
      next(error)
    }
  }
}
