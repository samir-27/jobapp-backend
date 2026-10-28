import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema } from './offer.schema';
import { ApplyJob, ApplyJobSchema } from '../applyJobs/applyJobs.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: ApplyJob.name, schema: ApplyJobSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    NotificationsModule,
  ],
  providers: [OffersService],
  controllers: [OffersController],
  exports: [OffersService],
})
export class OffersModule {}
