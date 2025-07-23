import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { PricingService } from './pricing.service';
import { Space, SpaceSchema } from './schemas/space.schema';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Space.name, schema: SpaceSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [SpacesController],
  providers: [SpacesService, PricingService],
  exports: [SpacesService, PricingService],
})
export class SpacesModule {} 