/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { execSync } from 'child_process'
import * as models from '../models/index'

// SSRF: fetches arbitrary user-provided URL without validation
// Fix: validate URL against an allowlist of trusted domains
export function proxyFetch () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.query.url as string
    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' })
      return
    }
    try {
      const response = await fetch(url)
      const data = await response.text()
      res.send(data)
    } catch (error) {
      next(error)
    }
  }
}

// Prototype Pollution: merges user-controlled keys into a shared config object
// Fix: reject keys like __proto__, constructor, prototype
const integrationConfig: Record<string, unknown> = {}
export function updateIntegrationConfig () {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userConfig = req.body
      for (const key in userConfig) {
        integrationConfig[key] = userConfig[key]
      }
      res.json({ status: 'updated', config: integrationConfig })
    } catch (error) {
      next(error)
    }
  }
}

// SQL Injection: string concatenation in raw SQL query
// Fix: use parameterized query with bind variables
export function importProducts () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const category = req.body.category as string
    if (!category) {
      res.status(400).json({ error: 'Missing category parameter' })
      return
    }
    try {
      const products = await models.sequelize.query(
        `SELECT * FROM Products WHERE description LIKE '%${category}%' AND deletedAt IS NULL`
      )
      res.json({ imported: products[0].length, products: products[0] })
    } catch (error) {
      next(error)
    }
  }
}

// Command Injection: user input passed directly into shell command
// Fix: use execFileSync with arguments array, or validate input against allowlist
export function runDiagnostic () {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = req.query.target as string
    if (!target) {
      res.status(400).json({ error: 'Missing target parameter' })
      return
    }
    try {
      const output = execSync(`curl -s -o /dev/null -w "%{http_code}" ${target}`)
      res.json({ target, statusCode: output.toString().trim() })
    } catch (error) {
      next(error)
    }
  }
}

// SSRF: sends webhook POST to arbitrary user-provided URL
// Fix: validate webhookUrl against allowlist of registered webhook endpoints
export function notifyWebhook () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const webhookUrl = req.body.url as string
    const payload = req.body.payload
    if (!webhookUrl) {
      res.status(400).json({ error: 'Missing url parameter' })
      return
    }
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      res.json({ status: response.status })
    } catch (error) {
      next(error)
    }
  }
}

// Insecure Randomness: Math.random() used for security-sensitive token
// Fix: use crypto.randomBytes(32).toString('hex')
export function promotionCountdown () {
  return (req: Request, res: Response) => {
    const token = Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    res.json({ promotionToken: token, expiresAt })
  }
}
