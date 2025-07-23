import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  NO_SHOW = 'no_show',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  NOT_REQUIRED = 'not_required',
}

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  originalAmount: number;

  @Prop()
  discountAmount: number;

  @Prop()
  promoCode: string;

  @Prop({
    required: true,
    enum: ['pending_approval', 'pending_payment', 'confirmed', 'cancelled', 'rejected', 'completed'],
    default: 'pending_approval'
  })
  status: string;

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'not_required'],
    default: 'pending'
  })
  paymentStatus: string;

  @Prop()
  paymentId: string;

  @Prop()
  rejectionReason: string;

  @Prop([{
    type: {
      type: String,
      enum: ['hourly_rate', 'daily_rate', 'peak_hours', 'off_peak_hours', 'bundle', 'monthly_rate', 'free', 'promo_discount']
    },
    description: String,
    amount: Number
  }])
  pricingBreakdown: Array<{
    type: string;
    description: string;
    amount: number;
  }>;

  @Prop()
  checkInTime: Date;

  @Prop()
  checkOutTime: Date;

  @Prop()
  notes: string;

  @Prop({ default: false })
  isRefunded: boolean;

  @Prop()
  refundAmount: number;

  @Prop()
  refundReason: string;

  @Prop()
  razorpayOrderId?: string;

  @Prop()
  razorpayPaymentId?: string;

  @Prop()
  bookingCode: string;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  specialInstructions?: string;

  @Prop({ type: [String], default: [] })
  attendees: string[];

  @Prop()
  eventTitle?: string;

  @Prop()
  eventDescription?: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Generate booking code before saving
ReservationSchema.pre('save', function(next) {
  if (!this.bookingCode) {
    this.bookingCode = 'BK' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
}); 