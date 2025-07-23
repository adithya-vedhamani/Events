import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  CONSUMER = 'consumer',
  BRAND_OWNER = 'brand_owner',
  STAFF = 'staff',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.CONSUMER })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  companyName?: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  otp?: string;

  @Prop()
  otpExpires?: Date;

  @Prop()
  passwordResetOtp?: string;

  @Prop()
  passwordResetOtpExpires?: Date;

  // Brand association for staff
  @Prop({ type: Types.ObjectId, ref: 'User' })
  brandId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 