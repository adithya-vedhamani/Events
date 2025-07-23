import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, PricingType, DayOfWeek } from './schemas/space.schema';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Reservation } from '../reservations/schemas/reservation.schema';

interface QueryParams {
  search?: string;
  location?: string;
  capacity?: string;
  priceRange?: string;
  category?: string;
  [key: string]: any;
}

interface FilterQuery {
  isActive: boolean;
  isVerified?: boolean;
  $or?: Array<{ [key: string]: any }>;
  address?: { $regex: string; $options: string };
  capacity?: { $gte: number };
  'pricing.basePrice'?: { $gte: number; $lte: number };
  category?: string;
  [key: string]: any;
}

@Injectable()
export class SpacesService {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<Space>,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
  ) {}

  async create(createSpaceDto: CreateSpaceDto, userId: string, images: any[] = []) {
    try {
      console.log('Creating space with data:', createSpaceDto);
      console.log('User ID:', userId);
      console.log('Images:', images);
      
      const space = new this.spaceModel({
        ...createSpaceDto,
        ownerId: new Types.ObjectId(userId),
        images,
      });

      console.log('Space model created:', space);
      const savedSpace = await space.save();
      console.log('Space saved successfully:', savedSpace._id);
      return savedSpace;
    } catch (error) {
      console.error('Error in create method:', error);
      throw error;
    }
  }

  async findAll(query: QueryParams = {}) {
    const { search, location, capacity, priceRange, category, ...filters } = query;
    let filterQuery: FilterQuery = { isActive: true };

    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (location) {
      filterQuery.address = { $regex: location, $options: 'i' };
    }

    if (capacity) {
      filterQuery.capacity = { $gte: parseInt(capacity) };
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filterQuery['pricing.basePrice'] = { $gte: min, $lte: max };
    }

    if (category) {
      filterQuery.category = category;
    }

    return this.spaceModel
      .find(filterQuery)
      .populate('ownerId', 'firstName lastName companyName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const space = await this.spaceModel
      .findById(id)
      .populate('ownerId', 'firstName lastName companyName')
      .exec();

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  async findByOwner(ownerId: string) {
    try {
      console.log('Finding spaces for owner:', ownerId);
      const spaces = await this.spaceModel
        .find({ ownerId: new Types.ObjectId(ownerId) })
        .populate('ownerId', 'firstName lastName companyName')
        .sort({ createdAt: -1 })
        .exec();
      console.log('Found spaces:', spaces.length);
      return spaces;
    } catch (error) {
      console.error('Error in findByOwner:', error);
      throw error;
    }
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto, userId: string, newImages: any[] = []) {
    const space = await this.spaceModel.findById(id);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    // Add new images to existing ones
    if (newImages.length > 0) {
      updateSpaceDto.images = [...space.images, ...newImages];
    }

    const updatedSpace = await this.spaceModel
      .findByIdAndUpdate(id, updateSpaceDto, { new: true })
      .populate('ownerId', 'firstName lastName companyName')
      .exec();

    if (!updatedSpace) {
      throw new NotFoundException('Space not found');
    }

    return updatedSpace;
  }

  async remove(id: string, userId: string) {
    const space = await this.spaceModel.findById(id);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own spaces');
    }

    await this.spaceModel.findByIdAndDelete(id).exec();
  }

  async searchSpaces(searchParams: QueryParams) {
    const { query, location, date, capacity, priceRange, category } = searchParams;
    let filterQuery: FilterQuery = { isActive: true };

    if (query) {
      filterQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];
    }

    if (location) {
      filterQuery.address = { $regex: location, $options: 'i' };
    }

    if (capacity) {
      filterQuery.capacity = { $gte: parseInt(capacity) };
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filterQuery['pricing.basePrice'] = { $gte: min, $lte: max };
    }

    if (category) {
      filterQuery.category = category;
    }

    return this.spaceModel
      .find(filterQuery)
      .populate('ownerId', 'firstName lastName companyName')
      .exec();
  }

  async getAvailability(spaceId: string, startDate: string, endDate: string) {
    const reservations = await this.reservationModel
      .find({
        spaceId: new Types.ObjectId(spaceId),
        status: { $nin: ['cancelled', 'no_show'] },
        $or: [
          {
            startTime: { $lt: new Date(endDate) },
            endTime: { $gt: new Date(startDate) },
          },
        ],
      })
      .select('startTime endTime status')
      .sort({ startTime: 1 })
      .exec();

    return reservations;
  }

  async getReservationsForDate(spaceId: string, startDate: Date, endDate: Date) {
    const reservations = await this.reservationModel
      .find({
        spaceId: new Types.ObjectId(spaceId),
        status: { $nin: ['cancelled', 'no_show'] },
        $or: [
          {
            startTime: { $lt: endDate },
            endTime: { $gt: startDate },
          },
        ],
      })
      .select('startTime endTime status')
      .sort({ startTime: 1 })
      .exec();

    return reservations;
  }

  async calculatePricing(spaceId: string, query: any) {
    const space = await this.findOne(spaceId);
    const { startDate, endDate, hours, promoCode } = query;

    let basePrice = space.pricing.basePrice;
    let totalPrice = 0;

    // Calculate based on pricing type
    switch (space.pricing.type) {
      case PricingType.FREE:
        totalPrice = 0;
        break;

      case PricingType.HOURLY:
        totalPrice = basePrice * parseInt(hours || '1');
        break;

      case PricingType.DAILY:
        const days = Math.ceil(parseInt(hours || '1') / 24);
        totalPrice = basePrice * days;
        break;

      case PricingType.MONTHLY:
        totalPrice = space.pricing.monthlyPrice || basePrice * 30;
        break;

      case PricingType.PACKAGE:
        // Find best time block
        const timeBlock = space.pricing.timeBlocks.find(tb => tb.hours >= parseInt(hours || '1'));
        totalPrice = timeBlock ? timeBlock.price : basePrice * parseInt(hours || '1');
        break;
    }

    // Apply peak/off-peak multipliers
    if (startDate) {
      const start = new Date(startDate);
      const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayOfWeek;
      const time = start.toTimeString().slice(0, 5);

      const peakHour = space.pricing.peakHours.find(
        ph => ph.day === dayOfWeek && time >= ph.startTime && time <= ph.endTime,
      );

      if (peakHour) {
        totalPrice *= peakHour.multiplier;
      }
    }

    // Apply promo code
    if (promoCode) {
      const promo = space.pricing.promoCodes.find(
        pc => pc.code === promoCode && pc.isActive && pc.usedCount < pc.maxUses,
      );

      if (promo && new Date() >= promo.validFrom && new Date() <= promo.validUntil) {
        totalPrice *= (1 - promo.value / 100);
      }
    }

    // Check special events
    if (startDate && endDate) {
      const specialEvent = space.pricing.specialEvents.find(
        se => new Date(startDate) >= se.startDate && new Date(endDate) <= se.endDate,
      );

      if (specialEvent) {
        totalPrice = specialEvent.price;
      }
    }

    return {
      basePrice,
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: space.pricing.currency,
      pricingType: space.pricing.type,
      appliedPromoCode: promoCode,
      specialEvent: null, // Add logic for special events
    };
  }

  async getCategories() {
    const categories = await this.spaceModel.distinct('category').exec();
    return categories.filter(Boolean);
  }

  async getAmenities() {
    const spaces = await this.spaceModel.find({}, 'amenities').exec();
    const allAmenities = spaces.flatMap(space => space.amenities);
    const uniqueAmenities = [...new Set(allAmenities.map(a => a.name))];
    return uniqueAmenities;
  }

  async fixAmenitiesData() {
    try {
      console.log('Checking and fixing amenities data...');
      const spaces = await this.spaceModel.find({}).exec();
      
      for (const space of spaces) {
        let needsUpdate = false;
        const fixedAmenities: any[] = [];
        
        if (space.amenities && space.amenities.length > 0) {
          for (const amenity of space.amenities) {
            if (typeof amenity === 'string') {
              // Convert string to object format
              fixedAmenities.push({
                name: amenity,
                available: true,
              });
              needsUpdate = true;
              console.log(`Converting amenity "${amenity}" to object format for space ${space._id}`);
            } else if (amenity && typeof amenity === 'object' && amenity.name) {
              // Already in correct format
              fixedAmenities.push(amenity);
            } else {
              console.log(`Skipping invalid amenity for space ${space._id}:`, amenity);
            }
          }
        }
        
        if (needsUpdate) {
          space.amenities = fixedAmenities;
          await space.save();
          console.log(`Updated amenities for space ${space._id}`);
        }
      }
      
      console.log('Amenities data fix completed');
    } catch (error) {
      console.error('Error fixing amenities data:', error);
      throw error;
    }
  }

  async addImages(spaceId: string, userId: string, images: any[]) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.images.push(...images);
    return space.save();
  }

  async removeImage(spaceId: string, imageId: string, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.images = space.images.filter(img => img.publicId !== imageId);
    return space.save();
  }

  async addPromoCode(spaceId: string, promoCode: any, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.pricing.promoCodes.push(promoCode);
    return space.save();
  }

  async removePromoCode(spaceId: string, codeId: string, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.pricing.promoCodes = space.pricing.promoCodes.filter(pc => pc.code !== codeId);
    return space.save();
  }

  async addSpecialEvent(spaceId: string, specialEvent: any, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.pricing.specialEvents.push(specialEvent);
    return space.save();
  }

  async removeSpecialEvent(spaceId: string, eventId: string, userId: string) {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own spaces');
    }

    space.pricing.specialEvents = space.pricing.specialEvents.filter(se => se.eventName !== eventId);
    return space.save();
  }
} 