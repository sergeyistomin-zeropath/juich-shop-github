/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { type ProductModel } from '../models/product'
import { MemoryModel } from '../models/memory'
import { UserModel } from '../models/user'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'
import * as db from '../data/mongodb'

export function getUserData () {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string
      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' })
        return
      }
      const user = await UserModel.findByPk(userId)
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      res.json({ id: user.id, email: user.email, username: user.username })
    } catch (error) {
      next(error)
    }
  }
}

export function dataExport () {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
      if (loggedInUser?.data?.email && loggedInUser.data.id) {
        const username = loggedInUser.data.username
        const email = loggedInUser.data.email
        const updatedEmail = email.replace(/[aeiou]/gi, '*')

        let memories, orders, reviews
        try {
          memories = await MemoryModel.findAll({ where: { UserId: req.body.UserId } })
        } catch (error) {
          next(error)
          return
        }

        try {
          orders = await db.ordersCollection.find({ email: updatedEmail })
        } catch (error) {
          next(new Error(`Error retrieving orders for ${updatedEmail}`))
          return
        }

        try {
          reviews = await db.reviewsCollection.find({ author: email })
        } catch (error) {
          next(new Error(`Error retrieving reviews for ${updatedEmail}`))
          return
        }

        const userData:
        {
          username?: string
          email: string
          orders: Array<{
            orderId: string
            totalPrice: number
            products: ProductModel[]
            bonus: number
            eta: string
          }>
          reviews: Array<{
            message: string
            author: string
            productId: number
            likesCount: number
            likedBy: string
          }>
          memories: Array<{
            imageUrl: string
            caption: string
          }>
        } =
        {
          username,
          email,
          memories: memories.map((memory: MemoryModel) => ({
            imageUrl: req.protocol + '://' + req.get('host') + '/' + memory.imagePath,
            caption: memory.caption
          })),
          orders: orders.map((order: {
            orderId: string
            totalPrice: number
            products: ProductModel[]
            bonus: number
            eta: string
          }) => ({
            orderId: order.orderId,
            totalPrice: order.totalPrice,
            products: [...order.products],
            bonus: order.bonus,
            eta: order.eta
          })),
          reviews: reviews.map((review: {
            message: string
            author: string
            product: number
            likesCount: number
            likedBy: string
          }) => ({
            message: review.message,
            author: review.author,
            productId: review.product,
            likesCount: review.likesCount,
            likedBy: review.likedBy
          }))
        }

        const emailHash = security.hash(email).slice(0, 4)
        for (const order of userData.orders) {
          challengeUtils.solveIf(challenges.dataExportChallenge, () => { return order.orderId.split('-')[0] !== emailHash })
        }
        res.status(200).send({ userData: JSON.stringify(userData, null, 2), confirmation: 'Your data export will open in a new Browser window.' })
      } else {
        next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
      }
    } catch (error) {
      next(error)
    }
  }
}
