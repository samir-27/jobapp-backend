import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobSeekerProfile, JobSeekerProfileSchema } from './profile.schema';
import { User, UserSchema } from '../users/users.schema';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobSeekerProfile.name, schema: JobSeekerProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ProfilesService],
  controllers: [ProfilesController],
  exports: [ProfilesService],
})
export class ProfilesModule {}
