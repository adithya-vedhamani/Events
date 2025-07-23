import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { WebhooksController } from './webhooks.controller';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { ReservationsModule } from '../reservations/reservations.module';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Webhook, WebhookSchema } from './schemas/webhook.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Space, SpaceSchema } from '../spaces/schemas/space.schema';
import { EmailModule } from '../email/email.module';
import { ReservationsService } from '../reservations/reservations.service';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Webhook.name, schema: WebhookSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
      { name: Space.name, schema: SpaceSchema },
    ]),
    SpacesModule,
    ReservationsModule,
    EmailModule,
  ],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, RazorpayService, ReservationsService],
  exports: [PaymentsService, RazorpayService],
})
export class PaymentsModule {} 