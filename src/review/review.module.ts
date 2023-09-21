import { Module } from '@nestjs/common'

import { ReviewController } from './review.controller'

import { CategoryModule } from 'src/category/category.module'
import { PaginationModule } from 'src/pagination/pagination.module'
import { ProductModule } from 'src/product/product.module'

import { PrismaService } from 'src/prisma.service'
import { ProductService } from 'src/product/product.service'
import { ReviewService } from './review.service'

@Module({
	controllers: [ReviewController],
	providers: [ReviewService, PrismaService, ProductService],
	imports: [ProductModule, PaginationModule, CategoryModule]
})
export class ReviewModule {}
