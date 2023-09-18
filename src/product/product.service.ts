import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginationService } from 'src/pagination/pagination.service'
import { PrismaService } from 'src/prisma.service'
import { generateSlug } from 'src/utils/generate-slug'
import { EnumProductSort, GetAllProductDto } from './dto/get-all.product.dto'
import { ProductDto } from './dto/product.dto'
import { returnProductObject } from './return-product.object'

@Injectable()
export class ProductService {
	constructor(
		private prisma: PrismaService,
		private paginationService: PaginationService
	) {}

	async getAll(dto: GetAllProductDto = {}) {
		const { sort, searchTerm } = dto

		const prismaSort: Prisma.ProductOrderByWithRelationInput[] = []

		if (sort === EnumProductSort.HIGH_PRICE) {
			prismaSort.push({
				price: 'desc'
			})
		} else if (sort === EnumProductSort.LOW_PRICE) {
			prismaSort.push({
				price: 'asc'
			})
		} else if (sort === EnumProductSort.OLDEST) {
			prismaSort.push({
				createdAt: 'asc'
			})
		} else {
			prismaSort.push({
				createdAt: 'desc'
			})
		}

		const prismaSearchTermFilter: Prisma.ProductWhereInput = searchTerm
			? {
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
			: {}

		const { perPage, skip } = this.paginationService.getPagination(dto)

		const products = await this.prisma.product.findMany({
			where: prismaSearchTermFilter,
			orderBy: prismaSort,
			skip,
			take: perPage,
			select: returnProductObject
		})

		if (!products) throw new NotFoundException('Products not found')

		return {
			products,
			count: await this.prisma.product.count({
				where: prismaSearchTermFilter
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

		const findCategory = await this.prisma.category.findUnique({
			where: {
				id: categoryId
			}
		})

		if (!findCategory) throw new NotFoundException('Category not found')

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
