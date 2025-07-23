import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, ValidateNested, IsEnum, Min, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingType, DayOfWeek, PromoCodeType, BundleType } from '../schemas/space.schema';

class AmenityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsString()
  icon?: string;
}

class TimeBlockDto {
  @IsNumber()
  @Min(1)
  hours: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBookings?: number;

  @IsNumber()
  @Min(0)
  currentBookings: number;
}

class PeakHoursDto {
  @IsEnum(DayOfWeek)
  day: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  @Min(1)
  multiplier: number;

  @IsBoolean()
  isActive: boolean;
}

class PromoCodeDto {
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
  @IsNumber()
  @Min(0)
  usedCount?: number;

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

class BundleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(BundleType)
  type: BundleType;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  value: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchases?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPurchases?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedAmenities?: string[];

  @IsOptional()
  @IsBoolean()
  transferable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  validityDays?: number;
}

class SpecialEventPricingDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBookings?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentBookings?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedServices?: string[];
}

export class PricingRuleDto {
  @IsEnum(PricingType)
  type: PricingType;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  peakMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  offPeakMultiplier?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeakHoursDto)
  peakHours?: PeakHoursDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  timeBlocks?: TimeBlockDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromoCodeDto)
  promoCodes?: PromoCodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleDto)
  bundles?: BundleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialEventPricingDto)
  specialEvents?: SpecialEventPricingDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBookingHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumBookingHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateCancellationFee?: number;

  @IsOptional()
  @IsBoolean()
  allowPartialBookings?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSameDayBookings?: boolean;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;
}

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AmenityDto)
  @IsOptional()
  amenities?: AmenityDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ValidateNested()
  @Type(() => PricingRuleDto)
  pricing: PricingRuleDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  openingHours?: string;

  @IsOptional()
  @IsString()
  closingHours?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;
} 