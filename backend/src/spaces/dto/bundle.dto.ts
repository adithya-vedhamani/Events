import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional, IsEnum, IsArray, Min, Max } from 'class-validator';
import { BundleType } from '../schemas/space.schema';

export class CreateBundleDto {
  @IsString()
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

export class UpdateBundleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(BundleType)
  type?: BundleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

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
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchases?: number;

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

export class ValidateBundleDto {
  @IsString()
  bundleId: string;

  @IsOptional()
  @IsString()
  userId?: string;
} 