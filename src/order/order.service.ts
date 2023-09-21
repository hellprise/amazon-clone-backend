import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from 'src/prisma.service'
import { returnProductObject } from 'src/product/return-product.object'

import { OrderDto } from './dto/order.dto'
import { PaymentStatusDto } from './dto/payment-status.dto'

@Injectable()
export class OrderService {
	constructor(private prisma: PrismaService) {}

	async getAll() {
		const orders = await this.prisma.order.findMany({
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				items: {
					include: {
						product: {
							select: returnProductObject
						}
					}
				}
			}
		})

		if (!orders) throw new NotFoundException('Orders not found')

		return orders
	}

	async getByUserId(userId: number) {
		const orders = await this.prisma.order.findMany({
			where: {
				userId
			},
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				items: {
					include: {
						product: {
							select: returnProductObject
						}
					}
				}
			}
		})

		if (!orders) throw new NotFoundException('User has no orders')

		return orders
	}

	async placeOrder(dto: OrderDto, userId: number) {
		const total = dto.items.reduce((acc, item) => {
			return acc + item.quantity * item.price
		}, 0)

		const order = await this.prisma.order.create({
			data: {
				status: dto.status,
				items: {
					create: dto.items
				},
				total,
				user: {
					connect: {
						id: userId
					}
				}
			}
		})

		// here will be the logic for payment

		return order
	}

	async updateStatus(dto: PaymentStatusDto) {
		if (dto.event === 'payment.waiting_for_capture') {
			// const payment = await ...
			const payment = 'payment is not implemented yet'

			return payment
		}

		if (dto.event === 'payment.succeeded') {
			const orderId = Number(dto.object.description.split('#')[1])

			await this.prisma.order.update({
				where: {
					// id: +dto.object.id
					id: orderId
				},
				data: {
					status: 'PAYED'
				}
			})

			return true
		}

		return 'Success'
	}
}
