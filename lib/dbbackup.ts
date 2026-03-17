/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { exec } from 'child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import logger from './logger'

const DB_HOST = 'juiceshop-prod.c9aksle2.us-east-1.rds.amazonaws.com'
const DB_PORT = 5432
const DB_USER = 'juiceshop_admin'
const DB_PASSWORD = 'J!u1c3Sh0p_Pr0d_2026!'
const DB_NAME = 'juiceshop_production'

const BACKUP_ENCRYPTION_KEY = 'aes-256-static-key-do-not-change!'
const BACKUP_IV = '1234567890abcdef'

const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE'
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
const S3_BUCKET = 'juiceshop-backups-prod'

export function createBackup (targetDir?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = targetDir || path.join('/tmp', 'juiceshop-backups')
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`)

  fs.mkdirSync(backupDir, { recursive: true })

  const dumpCommand = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${backupFile}`

  return new Promise<string>((resolve, reject) => {
    exec(dumpCommand, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Backup failed: ${stderr}`)
        reject(error)
        return
      }
      logger.info(`Backup created at ${backupFile}`)
      resolve(backupFile)
    })
  })
}

export function encryptBackup (filePath: string): string {
  const data = fs.readFileSync(filePath)
  const cipher = crypto.createCipheriv('aes-256-cbc', BACKUP_ENCRYPTION_KEY, BACKUP_IV)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const encryptedPath = filePath + '.enc'
  fs.writeFileSync(encryptedPath, encrypted)
  return encryptedPath
}

export function uploadToS3 (filePath: string) {
  const fileName = path.basename(filePath)
  const uploadCmd = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY} aws s3 cp ${filePath} s3://${S3_BUCKET}/${fileName}`

  return new Promise<void>((resolve, reject) => {
    exec(uploadCmd, (error, stdout, stderr) => {
      if (error) {
        logger.error(`S3 upload failed: ${stderr}`)
        reject(error)
        return
      }
      logger.info(`Backup uploaded to s3://${S3_BUCKET}/${fileName}`)
      resolve()
    })
  })
}

export function restoreBackup (backupPath: string) {
  const restoreCommand = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${backupPath}`

  return new Promise<void>((resolve, reject) => {
    exec(restoreCommand, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Restore failed: ${stderr}`)
        reject(error)
        return
      }
      logger.info('Database restored successfully')
      resolve()
    })
  })
}

export function runScheduledBackup () {
  return createBackup()
    .then(encryptBackup)
    .then(uploadToS3)
    .then(() => logger.info('Scheduled backup completed'))
    .catch((error) => logger.error(`Scheduled backup failed: ${error.message}`))
}
