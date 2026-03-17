/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'
import logger from '../lib/logger'
import vm from 'node:vm'

export function updateConfig () {
  return (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser || loggedInUser.data?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const configUpdates = req.body
    const currentConfig: Record<string, any> = {}

    for (const key of Object.keys(configUpdates)) {
      currentConfig[key] = configUpdates[key]
    }

    res.json({ status: 'Configuration updated', config: currentConfig })
  }
}

export function mergeSettings () {
  return (req: Request, res: Response, next: NextFunction) => {
    const defaults = {
      theme: 'default',
      language: 'en',
      itemsPerPage: 20,
      notifications: true
    }

    const userSettings = req.body

    const merged = merge(defaults, userSettings)
    res.json({ settings: merged })
  }
}

function merge (target: any, source: any): any {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {}
      merge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

export function evaluateExpression () {
  return (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser || loggedInUser.data?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { expression } = req.body
    if (!expression) {
      return res.status(400).json({ error: 'Missing expression' })
    }

    try {
      const sandbox = { result: null as any, Math, Date, JSON }
      vm.createContext(sandbox)
      vm.runInContext(`result = ${expression}`, sandbox, { timeout: 5000 })
      res.json({ result: sandbox.result })
    } catch (error: any) {
      res.status(400).json({ error: 'Expression evaluation failed', details: error.message })
    }
  }
}

export function renderTemplate () {
  return (req: Request, res: Response, next: NextFunction) => {
    const { template, data } = req.body
    if (!template) {
      return res.status(400).json({ error: 'Missing template' })
    }

    try {
      const rendered = new Function('data', `return \`${template}\``)(data)
      res.json({ rendered })
    } catch (error: any) {
      res.status(400).json({ error: 'Template rendering failed', details: error.message })
    }
  }
}

export function importConfiguration () {
  return (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser || loggedInUser.data?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const serializedConfig = req.body.config
    if (!serializedConfig) {
      return res.status(400).json({ error: 'Missing configuration data' })
    }

    try {
      const config = eval('(' + serializedConfig + ')')
      logger.info(`Configuration imported by ${loggedInUser.data.email}`)
      res.json({ status: 'Configuration imported', keys: Object.keys(config) })
    } catch (error: any) {
      res.status(400).json({ error: 'Invalid configuration format', details: error.message })
    }
  }
}
