import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { UserService } from 'src/user/user.service'

@Injectable()
export class StatisticsService {
	constructor(
		private prisma: PrismaService,
		private userService: UserService
	) {}

	async getMain(userId: number) {
		const user = await this.userService.byId(userId, {
			orders: {
				select: {
					items: true
				}
			},
			reviews: true
		})

		return [
			{
				name: 'user orders',
				value: user.orders
			},
			{
				name: 'Orders length',
				value: user.orders.length
			},
			{
				name: 'Reviews length',
				value: user.reviews.length
			},
			{
				name: 'Favorites length',
				value: user.favorites.length
			},
			{
				name: 'Total amount',
				value: 1000
			}
		]
	}
}
