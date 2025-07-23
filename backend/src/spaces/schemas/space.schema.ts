import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PricingType {
  FREE = 'free',
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  PACKAGE = 'package',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum PromoCodeType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_HOURS = 'free_hours',
}

export enum BundleType {
  TIME_BLOCK = 'time_block',
  PACKAGE = 'package',
  SEASONAL = 'seasonal',
  MEMBERSHIP = 'membership',
}

@Schema({ _id: true })
export class TimeBlock {
  _id?: Types.ObjectId | string;
  @Prop({ required: true })
  hours: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  maxBookings?: number;

  @Prop({ default: 0 })
  currentBookings: number;
}

@Schema({ _id: true })
export class PeakHours {
  _id?: Types.ObjectId | string;
  @Prop({ type: String, enum: DayOfWeek, required: true })
  day: DayOfWeek;

  @Prop({ required: true })
  startTime: string; // Format: "09:00"

  @Prop({ required: true })
  endTime: string; // Format: "17:00"

  @Prop({ required: true })
  multiplier: number;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ _id: true })
export class PromoCode {
  _id?: Types.ObjectId | string;
  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: PromoCodeType })
  type: PromoCodeType;

  @Prop({ required: true })
  value: number; // percentage, fixed amount, or free hours

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: 0 })
  maxUses: number; // 0 = unlimited

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  minimumBookingAmount?: number;

  @Prop({ default: 0 })
  maximumDiscountAmount?: number;

  @Prop({ type: [String], default: [] })
  applicableDays?: string[]; // days of week

  @Prop({ type: [String], default: [] })
  applicableTimeSlots?: string[]; // time ranges like "09:00-17:00"

  @Prop({ default: false })
  firstTimeUserOnly: boolean;

  @Prop({ default: false })
  newUserOnly: boolean; // users registered within last 30 days
}

@Schema({ _id: true })
export class Bundle {
  _id?: Types.ObjectId | string;
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: BundleType })
  type: BundleType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  value: number; // actual value in hours/days

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  maxPurchases: number; // 0 = unlimited

  @Prop({ default: 0 })
  currentPurchases: number;

  @Prop({ type: [String], default: [] })
  includedAmenities?: string[];

  @Prop({ default: false })
  transferable: boolean;

  @Prop({ default: 0 })
  validityDays: number; // days after purchase to use the bundle
}

@Schema({ _id: true })
export class SpecialEventPricing {
  _id?: Types.ObjectId | string;
  @Prop({ required: true })
  eventName: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  maxBookings: number;

  @Prop({ default: 0 })
  currentBookings: number;

  @Prop({ type: [String], default: [] })
  includedServices?: string[];
}

@Schema({ _id: false })
export class PricingRule {
  @Prop({ required: true, enum: PricingType })
  type: PricingType;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 1 })
  peakMultiplier: number;

  @Prop({ default: 1 })
  offPeakMultiplier: number;

  @Prop({ type: [PeakHours], default: [] })
  peakHours: PeakHours[];

  @Prop({ type: [TimeBlock], default: [] })
  timeBlocks: TimeBlock[];

  @Prop()
  monthlyPrice?: number;

  @Prop({ type: [PromoCode], default: [] })
  promoCodes: PromoCode[];

  @Prop({ type: [Bundle], default: [] })
  bundles: Bundle[];

  @Prop({ type: [SpecialEventPricing], default: [] })
  specialEvents: SpecialEventPricing[];

  @Prop({ default: 0 })
  minimumBookingHours: number;

  @Prop({ default: 0 })
  maximumBookingHours: number;

  @Prop({ default: 0 })
  advanceBookingDays: number; // how many days in advance can be booked

  @Prop({ default: 0 })
  cancellationHours: number; // hours before booking for free cancellation

  @Prop({ default: 0 })
  lateCancellationFee: number; // percentage of booking amount

  @Prop({ default: false })
  allowPartialBookings: boolean; // allow booking less than minimum hours

  @Prop({ default: true })
  allowSameDayBookings: boolean;

  @Prop({ default: false })
  requireApproval: boolean; // require space owner approval for bookings
}

@Schema({ _id: false })
export class Amenity {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  available: boolean;

  @Prop()
  icon?: string; // For UI display
}

@Schema({ _id: false })
export class SpaceImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string; // Cloudinary public ID

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop()
  caption?: string;
}

@Schema({ timestamps: true })
export class Space extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop({ required: true })
  capacity: number;

  @Prop({ type: [Amenity], default: [] })
  amenities: Amenity[];

  @Prop({ type: [SpaceImage], default: [] })
  images: SpaceImage[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: PricingRule, required: true })
  pricing: PricingRule;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  openingHours?: string;

  @Prop()
  closingHours?: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  totalBookings: number;

  @Prop()
  category?: string;

  @Prop()
  subcategory?: string;
}

export const SpaceSchema = SchemaFactory.createForClass(Space); 