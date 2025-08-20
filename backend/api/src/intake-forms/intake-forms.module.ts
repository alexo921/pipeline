import { Module } from '@nestjs/common';
import { IntakeFormsController } from './intake-forms.controller';
import { IntakeFormsService } from './intake-forms.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntakeFormsController],
  providers: [IntakeFormsService],
  exports: [IntakeFormsService],
})
export class IntakeFormsModule {}
