import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, PromoCode, Bundle, SpecialEventPricing, PromoCodeType, BundleType } from './schemas/space.schema';
import { User } from '../users/schemas/user.schema';

export interface PricingCalculation {
  originalPrice: number;
  totalPrice: number;
  discountAmount: number;
  promoCode?: string;
  bundle?: string;
  breakdown: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  durationHours: number;
  appliedPromoCode?: PromoCode;
  appliedBundle?: Bundle;
}

export interface PromoCodeValidation {
  isValid: boolean;
  error?: string;
  promoCode?: PromoCode;
}

export interface BundleValidation {
  isValid: boolean;
  error?: string;
  bundle?: Bundle;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<Space>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async calculateDynamicPrice(
    space: Space,
    startTime: string,
    endTime: string,
    promoCode?: string,
    bundleId?: string,
    userId?: string
  ): Promise<PricingCalculation> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    let basePrice = 0;
    let breakdown: Array<{ type: string; description: string; amount: number }> = [];
    let appliedPromoCode: PromoCode | undefined;
    let appliedBundle: Bundle | undefined;

    const pricing = space.pricing || {};
    const basePriceRate = pricing.basePrice || 0;

    // Calculate base price based on pricing type
    switch (pricing.type) {
      case 'hourly':
        basePrice = basePriceRate * durationHours;
        breakdown.push({
          type: 'hourly_rate',
          description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${basePriceRate})`,
          amount: basePrice,
        });
        break;

      case 'daily':
        const days = Math.ceil(durationHours / 24);
        basePrice = basePriceRate * days;
        breakdown.push({
          type: 'daily_rate',
          description: `Daily rate (${days} days × ₹${basePriceRate})`,
          amount: basePrice,
        });
        break;

      case 'monthly':
        const months = Math.ceil(durationHours / (24 * 30));
        basePrice = (pricing.monthlyPrice || 0) * months;
        breakdown.push({
          type: 'monthly_rate',
          description: `Monthly rate (${months} months × ₹${pricing.monthlyPrice})`,
          amount: basePrice,
        });
        break;

      case 'package':
        const timeBlocks = pricing.timeBlocks || [];
        const timeBlock = timeBlocks.find((tb: any) => tb.hours >= durationHours && tb.isActive);
        if (timeBlock) {
          basePrice = timeBlock.price;
          breakdown.push({
            type: 'package',
            description: `Package (${timeBlock.hours} hours)`,
            amount: timeBlock.price,
          });
        } else {
          basePrice = basePriceRate * durationHours;
          breakdown.push({
            type: 'hourly_rate',
            description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${basePriceRate})`,
            amount: basePrice,
          });
        }
        break;

      case 'free':
        basePrice = 0;
        breakdown.push({
          type: 'free',
          description: 'Free space',
          amount: 0,
        });
        break;

      default:
        basePrice = basePriceRate * durationHours;
        breakdown.push({
          type: 'hourly_rate',
          description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${basePriceRate})`,
          amount: basePrice,
        });
    }

    // Apply peak/off-peak multipliers
    if (pricing.peakHours && pricing.peakHours.length > 0) {
      const startDate = new Date(startTime);
      const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const time = startDate.toTimeString().slice(0, 5);
      
      const peakHour = pricing.peakHours.find((ph: any) => 
        ph.day === dayOfWeek && time >= ph.startTime && time <= ph.endTime && ph.isActive
      );
      
      if (peakHour) {
        const originalPrice = basePrice;
        basePrice = basePrice * peakHour.multiplier;
        breakdown.push({
          type: 'peak_multiplier',
          description: `Peak hours multiplier (${peakHour.multiplier}x)`,
          amount: basePrice - originalPrice,
        });
      }
    }

    // Apply bundle if specified
    if (bundleId) {
      const bundleValidation = await this.validateBundle(space, bundleId, userId);
      if (bundleValidation.isValid && bundleValidation.bundle) {
        appliedBundle = bundleValidation.bundle;
        basePrice = appliedBundle.price;
        breakdown.push({
          type: 'bundle',
          description: `Bundle: ${appliedBundle.name} (${appliedBundle.value} hours)`,
          amount: appliedBundle.price,
        });
      }
    }

    // Apply promo code discount
    let discountAmount = 0;
    if (promoCode && !bundleId) { // Don't apply promo codes to bundles
      const promoValidation = await this.validatePromoCode(space, promoCode, basePrice, userId);
      if (promoValidation.isValid && promoValidation.promoCode) {
        appliedPromoCode = promoValidation.promoCode;
        
        switch (appliedPromoCode.type) {
          case PromoCodeType.PERCENTAGE:
            discountAmount = (basePrice * appliedPromoCode.value) / 100;
            if (appliedPromoCode.maximumDiscountAmount && discountAmount > appliedPromoCode.maximumDiscountAmount) {
              discountAmount = appliedPromoCode.maximumDiscountAmount;
            }
            breakdown.push({
              type: 'promo_discount',
              description: `Promo code: ${promoCode} (${appliedPromoCode.value}% off)`,
              amount: -discountAmount,
            });
            break;

          case PromoCodeType.FIXED_AMOUNT:
            discountAmount = Math.min(appliedPromoCode.value, basePrice);
            breakdown.push({
              type: 'promo_discount',
              description: `Promo code: ${promoCode} (₹${appliedPromoCode.value} off)`,
              amount: -discountAmount,
            });
            break;

          case PromoCodeType.FREE_HOURS:
            const freeHoursValue = (appliedPromoCode.value * basePriceRate);
            discountAmount = Math.min(freeHoursValue, basePrice);
            breakdown.push({
              type: 'promo_discount',
              description: `Promo code: ${promoCode} (${appliedPromoCode.value} free hours)`,
              amount: -discountAmount,
            });
            break;
        }
      }
    }

    // Apply minimum booking hours check
    const minimumHours = pricing.minimumBookingHours || 1;
    if (durationHours < minimumHours && !pricing.allowPartialBookings) {
      const additionalHours = minimumHours - durationHours;
      const additionalCost = basePriceRate * additionalHours;
      basePrice += additionalCost;
      breakdown.push({
        type: 'minimum_booking',
        description: `Minimum booking (${minimumHours} hours)`,
        amount: additionalCost,
      });
    }

    const totalPrice = Math.max(0, basePrice - discountAmount);

    return {
      originalPrice: basePrice,
      totalPrice,
      discountAmount,
      promoCode: appliedPromoCode?.code,
      bundle: appliedBundle?.name,
      breakdown,
      durationHours: Math.max(durationHours, minimumHours),
      appliedPromoCode,
      appliedBundle,
    };
  }

  async validatePromoCode(
    space: Space,
    code: string,
    bookingAmount: number,
    userId?: string
  ): Promise<PromoCodeValidation> {
    const pricing = space.pricing || {};
    const promoCode = pricing.promoCodes?.find(p => p.code === code && p.isActive);

    if (!promoCode) {
      return { isValid: false, error: 'Invalid or inactive promo code' };
    }

    const now = new Date();
    if (now < new Date(promoCode.validFrom) || now > new Date(promoCode.validUntil)) {
      return { isValid: false, error: 'Promo code has expired or not yet valid' };
    }

    if (promoCode.maxUses > 0 && promoCode.usedCount >= promoCode.maxUses) {
      return { isValid: false, error: 'Promo code usage limit exceeded' };
    }

    if (promoCode.minimumBookingAmount && bookingAmount < promoCode.minimumBookingAmount) {
      return { isValid: false, error: `Minimum booking amount of ₹${promoCode.minimumBookingAmount} required` };
    }

    if (userId) {
      const user = await this.userModel.findById(userId);
      if (!user) {
        return { isValid: false, error: 'User not found' };
      }

      if (promoCode.firstTimeUserOnly) {
        const existingBookings = await this.spaceModel.aggregate([
          { $unwind: '$reservations' },
          { $match: { 'reservations.userId': new Types.ObjectId(userId) } },
          { $count: 'total' }
        ]);
        if (existingBookings.length > 0 && existingBookings[0].total > 0) {
          return { isValid: false, error: 'Promo code is for first-time users only' };
        }
      }

      if (promoCode.newUserOnly) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (user.createdAt && user.createdAt > thirtyDaysAgo) {
          return { isValid: false, error: 'Promo code is for new users only (registered within 30 days)' };
        }
      }
    }

    return { isValid: true, promoCode };
  }

  async validateBundle(
    space: Space,
    bundleId: string,
    userId?: string
  ): Promise<BundleValidation> {
    const pricing = space.pricing || {};
    const bundle = pricing.bundles?.find(b => b._id?.toString() === bundleId && b.isActive);

    if (!bundle) {
      return { isValid: false, error: 'Invalid or inactive bundle' };
    }

    const now = new Date();
    if (now < new Date(bundle.validFrom) || now > new Date(bundle.validUntil)) {
      return { isValid: false, error: 'Bundle has expired or not yet valid' };
    }

    if (bundle.maxPurchases > 0 && bundle.currentPurchases >= bundle.maxPurchases) {
      return { isValid: false, error: 'Bundle purchase limit exceeded' };
    }

    return { isValid: true, bundle };
  }

  async getAvailablePromoCodes(spaceId: string, userId?: string): Promise<PromoCode[]> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const pricing = space.pricing || {};
    const now = new Date();
    
    return pricing.promoCodes?.filter(promo => 
      promo.isActive &&
      now >= new Date(promo.validFrom) &&
      now <= new Date(promo.validUntil) &&
      (promo.maxUses === 0 || promo.usedCount < promo.maxUses)
    ) || [];
  }

  async getAvailableBundles(spaceId: string): Promise<Bundle[]> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const pricing = space.pricing || {};
    const now = new Date();
    
    return pricing.bundles?.filter(bundle => 
      bundle.isActive &&
      now >= new Date(bundle.validFrom) &&
      now <= new Date(bundle.validUntil) &&
      (bundle.maxPurchases === 0 || bundle.currentPurchases < bundle.maxPurchases)
    ) || [];
  }

  async incrementPromoCodeUsage(spaceId: string, promoCode: string): Promise<void> {
    await this.spaceModel.updateOne(
      { 
        _id: spaceId,
        'pricing.promoCodes.code': promoCode 
      },
      { 
        $inc: { 'pricing.promoCodes.$.usedCount': 1 } 
      }
    );
  }

  async incrementBundleUsage(spaceId: string, bundleId: string): Promise<void> {
    await this.spaceModel.updateOne(
      { 
        _id: spaceId,
        'pricing.bundles._id': bundleId 
      },
      { 
        $inc: { 'pricing.bundles.$.currentPurchases': 1 } 
      }
    );
  }

  async addPromoCode(spaceId: string, promoCodeData: Partial<PromoCode>): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.pricing) {
      space.pricing = {} as any;
    }
    if (!space.pricing.promoCodes) {
      space.pricing.promoCodes = [];
    }

    // Check if promo code already exists
    const existingCode = space.pricing.promoCodes.find(p => p.code === promoCodeData.code);
    if (existingCode) {
      throw new BadRequestException('Promo code already exists');
    }

    space.pricing.promoCodes.push(promoCodeData as PromoCode);
    return space.save();
  }

  async updatePromoCode(spaceId: string, promoCodeId: string, updateData: Partial<PromoCode>): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const promoCodeIndex = space.pricing?.promoCodes?.findIndex(p => p._id?.toString() === promoCodeId);
    if (promoCodeIndex === -1 || promoCodeIndex === undefined) {
      throw new NotFoundException('Promo code not found');
    }

    Object.assign(space.pricing.promoCodes[promoCodeIndex], updateData);
    return space.save();
  }

  async deletePromoCode(spaceId: string, promoCodeId: string): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    space.pricing.promoCodes = space.pricing.promoCodes?.filter(p => p._id?.toString() !== promoCodeId) || [];
    return space.save();
  }

  async addBundle(spaceId: string, bundleData: Partial<Bundle>): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.pricing) {
      space.pricing = {} as any;
    }
    if (!space.pricing.bundles) {
      space.pricing.bundles = [];
    }

    space.pricing.bundles.push(bundleData as Bundle);
    return space.save();
  }

  async updateBundle(spaceId: string, bundleId: string, updateData: Partial<Bundle>): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const bundleIndex = space.pricing?.bundles?.findIndex(b => b._id?.toString() === bundleId);
    if (bundleIndex === -1 || bundleIndex === undefined) {
      throw new NotFoundException('Bundle not found');
    }

    Object.assign(space.pricing.bundles[bundleIndex], updateData);
    return space.save();
  }

  async deleteBundle(spaceId: string, bundleId: string): Promise<Space> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    space.pricing.bundles = space.pricing.bundles?.filter(b => b._id?.toString() !== bundleId) || [];
    return space.save();
  }
} 