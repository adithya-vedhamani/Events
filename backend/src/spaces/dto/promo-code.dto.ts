import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional, IsEnum, IsArray, Min, Max, IsNotEmpty } from 'class-validator';
import { PromoCodeType } from '../schemas/space.schema';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(PromoCodeType)
  type: PromoCodeType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBookingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableTimeSlots?: string[];

  @IsOptional()
  @IsBoolean()
  firstTimeUserOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  newUserOnly?: boolean;
}

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsEnum(PromoCodeType)
  type?: PromoCodeType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBookingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableTimeSlots?: string[];

  @IsOptional()
  @IsBoolean()
  firstTimeUserOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  newUserOnly?: boolean;
}

export class ValidatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  bookingAmount: number;

  @IsOptional()
  @IsString()
  userId?: string;
} 