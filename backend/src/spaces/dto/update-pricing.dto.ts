import { IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingRuleDto } from './create-space.dto';

export class UpdatePricingDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PricingRuleDto)
  pricing: PricingRuleDto;
} 