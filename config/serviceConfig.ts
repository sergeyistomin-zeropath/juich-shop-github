/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

export const paymentGateway = {
  provider: 'stripe',
  apiKey: 'sk_live_51N8xQRJk4h9mVbG7vT3kZ2nWqYpL8sM4cR6fXdA1bE5hJ7wK9tU0iO3pQ2rS4v',
  webhookSecret: 'whsec_8xK3mN5pQ7rT2vW4yA6bD9eF1gH3jL5n',
  publishableKey: 'pk_live_51N8xQRJk4h9mVbG7test1234567890abcdef'
}

export const emailService = {
  provider: 'sendgrid',
  apiKey: 'SG.x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6.n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2',
  fromAddress: 'noreply@juice-sh.op',
  fromName: 'OWASP Juice Shop'
}

export const oauth = {
  google: {
    clientId: '294716025128-7m1f5n3j4k6l8p9q0r2s3t4u5v6w7x8y.apps.googleusercontent.com',
    clientSecret: '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'
  },
  github: {
    clientId: 'Iv1.a1b2c3d4e5f6g7h8',
    clientSecret: 'ghp_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r'
  }
}

export const monitoring = {
  sentry: {
    dsn: 'https://a1b2c3d4e5f6g7h8i9j0@o123456.ingest.sentry.io/7654321',
    environment: 'production'
  },
  datadog: {
    apiKey: 'dd_api_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    appKey: 'dd_app_q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'
  }
}

export const database = {
  primary: {
    host: 'juiceshop-prod.c9aksle2.us-east-1.rds.amazonaws.com',
    port: 5432,
    username: 'juiceshop_admin',
    password: 'J!u1c3Sh0p_Pr0d_2026!',
    database: 'juiceshop_production',
    ssl: true
  },
  redis: {
    host: 'juiceshop-cache.abc123.ng.0001.use1.cache.amazonaws.com',
    port: 6379,
    password: 'R3d1s_C@che_S3cret_2026'
  }
}

export const internalServices = {
  chatbotApiKey: 'sk-proj-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  recaptchaSecret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
  jwtSigningSecret: 'super-secret-jwt-key-never-share-this-with-anyone-2026'
}
