import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { CategoryService } from 'src/category/category.service'
import { PaginationService } from 'src/pagination/pagination.service'
import { PrismaService } from 'src/prisma.service'

import { EnumProductSort, GetAllProductDto } from './dto/get-all.product.dto'
import { ProductDto } from './dto/product.dto'

import { returnProductObject } from './return-product.object'

import { convertToNumber } from 'src/utils/convert-to-number'
import { generateSlug } from 'src/utils/generate-slug'

@Injectable()
export class ProductService {
	constructor(
		private prisma: PrismaService,
		private paginationService: PaginationService,
		private categoryService: CategoryService
	) {}

	private getCategoryFilter(categoryId: number): Prisma.ProductWhereInput {
		return { categoryId }
	}

	private getPriceFilter(
		minPrice: number,
		maxPrice: number
	): Prisma.ProductWhereInput {
		let priceFilter: Prisma.IntFilter | undefined = undefined

		if (minPrice) priceFilter = { ...priceFilter, gte: minPrice }
		if (maxPrice) priceFilter = { ...priceFilter, lte: maxPrice }

		return { price: priceFilter }
	}

	private getRatingFilter(ratings: number[]): Prisma.ProductWhereInput {
		return {
			reviews: {
				some: {
					rating: {
						in: ratings
					}
				}
			}
		}
	}

	private getSearchTermFilter(searchTerm: string): Prisma.ProductWhereInput {
		return {
			OR: [
				{
					category: {
						name: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				},
				{
					name: {
						contains: searchTerm,
						mode: 'insensitive'
					}
				},
				{
					description: {
						contains: searchTerm,
						mode: 'insensitive'
					}
				}
			]
		}
	}

	private getSortOptions(
		sort: EnumProductSort
	): Prisma.ProductOrderByWithRelationInput[] {
		switch (sort) {
			case EnumProductSort.HIGH_PRICE:
				return [{ price: 'desc' }]
			case EnumProductSort.LOW_PRICE:
				return [{ price: 'asc' }]
			case EnumProductSort.OLDEST:
				return [{ createdAt: 'asc' }]
			default:
				return [{ createdAt: 'desc' }]
		}
	}

	private createFilter(dto: GetAllProductDto): Prisma.ProductWhereInput {
		const { categoryId, minPrice, maxPrice, ratings, searchTerm } = dto

		const filters: Prisma.ProductWhereInput[] = []

		if (searchTerm) filters.push(this.getSearchTermFilter(searchTerm))

		if (ratings)
			filters.push(
				this.getRatingFilter(ratings.split('|').map(rating => +rating))
			)

		if (minPrice || maxPrice)
			filters.push(
				this.getPriceFilter(
					convertToNumber(minPrice),
					convertToNumber(maxPrice)
				)
			)

		if (categoryId) filters.push(this.getCategoryFilter(+categoryId))

		return filters.length ? { AND: filters } : {}
	}

	async getAll(dto: GetAllProductDto = {}) {
		const filters = this.createFilter(dto)

		const { perPage, skip } = this.paginationService.getPagination(dto)

		const products = await this.prisma.product.findMany({
			where: filters,
			orderBy: this.getSortOptions(dto.sort),
			skip,
			take: perPage,
			select: returnProductObject
		})

		if (!products) throw new NotFoundException('Products not found')

		return {
			products,
			count: await this.prisma.product.count({
				where: filters
			})
		}
	}

	async byId(id: number) {
		const product = await this.prisma.product.findUnique({
			where: {
				id
			},
			select: returnProductObject
		})

		if (!product) throw new NotFoundException('Product not found')

		return product
	}

	async bySlug(slug: string) {
		const product = await this.prisma.product.findUnique({
			where: {
				slug
			},
			select: returnProductObject
		})

		if (!product) throw new NotFoundException('Product not found')

		return product
	}

	async byCategory(categorySlug: string) {
		const products = await this.prisma.product.findMany({
			where: {
				category: {
					slug: categorySlug
				}
			},
			select: returnProductObject
		})

		if (!products) throw new NotFoundException('Products not found')

		return products
	}

	async getSimilar(id: number) {
		const currentProduct = await this.byId(id)

		if (!currentProduct) throw new NotFoundException('Product not found')

		const products = await this.prisma.product.findMany({
			where: {
				category: {
					name: currentProduct.category.name
				},
				NOT: {
					id: currentProduct.id
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			select: returnProductObject
		})

		if (!products) throw new NotFoundException('Products not found')

		return products
	}

	async create() {
		const product = await this.prisma.product.create({
			data: {
				name: '',
				slug: '',
				description: '',
				price: 0
			}
		})
		// такий метод для того, щоб не створювати на клієнті дві сторінки, - одну для створення, іншу для редагування. Це все буде в одній сторінці. продукт буде створюватись з пустими полями, а потім вони будуть заповнюватись

		return product.id
	}

	async update(id: number, dto: ProductDto) {
		const { name, description, price, categoryId, images } = dto

		await this.categoryService.byId(categoryId)

		return this.prisma.product.update({
			where: {
				id
			},
			data: {
				name,
				slug: generateSlug(name),
				description,
				price,
				images,
				category: {
					connect: {
						id: categoryId
					}
				}
			}
		})
	}

	async delete(id: number) {
		const product = await this.byId(id)

		if (!product) throw new NotFoundException('Product not found')

		return this.prisma.product.delete({
			where: {
				id
			}
		})
	}
}
