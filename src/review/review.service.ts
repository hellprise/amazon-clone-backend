import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { ReviewDto } from './dto/review.dto'
import { returnReviewObject } from './return-review.object'

@Injectable()
export class ReviewService {
	constructor(private prisma: PrismaService) {}

	// TODO: add update and delete methods

	async getAll() {
		const reviews = await this.prisma.review.findMany({
			orderBy: {
				createdAt: 'desc'
			},
			select: returnReviewObject
		})

		if (!reviews) throw new NotFoundException('Reviews not found')

		return reviews
	}

	async create(userId: number, dto: ReviewDto, productId: number) {
		const product = await this.prisma.product.findUnique({
			where: {
				id: productId
			}
		})

		if (!product)
			throw new NotFoundException('Product with your product id not found')

		return this.prisma.review.create({
			data: {
				...dto,
				product: {
					connect: {
						id: productId
					}
				},
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
	}

	async getAverageValueByProductId(productId: number) {
		return this.prisma.review
			.aggregate({
				where: { productId },
				_avg: { rating: true }
			})
			.then(data => data._avg)
	}
}
