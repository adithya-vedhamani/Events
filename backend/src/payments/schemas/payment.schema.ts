import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Reservation', required: true })
  reservationId: Types.ObjectId;

  @Prop({ required: true })
  orderId: string;

  @Prop()
  paymentId: string;

  @Prop()
  razorpayPaymentId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ 
    required: true, 
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'authorized'],
    default: 'pending'
  })
  status: string;

  @Prop({ required: true, default: 'razorpay' })
  paymentMethod: string;

  @Prop()
  completedAt: Date;

  @Prop()
  failedAt: Date;

  @Prop()
  authorizedAt: Date;

  @Prop()
  failureReason: string;

  @Prop()
  refundId: string;

  @Prop()
  refundAmount: number;

  @Prop()
  refundReason: string;

  @Prop()
  refundedAt: Date;

  @Prop()
  notes: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment); 