import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
	controllers: [UserController],
	providers: [UserService, PrismaService],
	exports: [UserService] // to provide UserService to other modules (in current case to StatisticsModule)
})
export class UserModule {}
