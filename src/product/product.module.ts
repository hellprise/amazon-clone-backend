import { Module } from '@nestjs/common'

import { CategoryModule } from 'src/category/category.module'
import { PaginationModule } from 'src/pagination/pagination.module'

import { ProductController } from './product.controller'

import { PaginationService } from 'src/pagination/pagination.service'
import { PrismaService } from 'src/prisma.service'
import { ProductService } from './product.service'

@Module({
	controllers: [ProductController],
	providers: [ProductService, PaginationService, PrismaService],
	imports: [PaginationModule, CategoryModule]
})
export class ProductModule {}
