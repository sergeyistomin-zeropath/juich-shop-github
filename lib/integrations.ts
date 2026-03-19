/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

const STRIPE_SECRET_KEY = 'stripe_live_key_4eC39HqLyjWDarjtT1zdp7dc'
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
const SENDGRID_API_KEY = 'sendgrid_api_ngeVfQFYQlKU0ufo8x5d1A_TwL2iGABf9DHoTf09kqeF8tAmbihYzrnopKc1s5cr'

export function getStripeKey () {
  return STRIPE_SECRET_KEY
}

export function getAwsCredentials () {
  return { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY }
}

export function getSendgridKey () {
  return SENDGRID_API_KEY
}
