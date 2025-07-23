import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
  HttpException,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SpacesService } from './spaces.service';
import { PricingService } from './pricing.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreatePromoCodeDto, UpdatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Response } from 'express';

interface SpaceImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
  caption?: string;
}

@Controller('spaces')
export class SpacesController {
  constructor(
    private readonly spacesService: SpacesService,
    private readonly pricingService: PricingService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() body: any,
    @Request() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    try {
      console.log('Received body:', body);
      console.log('Files received:', files?.length || 0);
      
      let images: SpaceImage[] = [];
      if (files && files.length > 0) {
        const uploadResults = await this.cloudinaryService.uploadMultipleImages(files);
        images = uploadResults.map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          isPrimary: index === 0, // First image is primary
        }));
      }

      // Parse the JSON data from the request body
      let createSpaceDto: CreateSpaceDto;
      if (body.data) {
        console.log('Parsing data from body.data');
        createSpaceDto = JSON.parse(body.data);
      } else {
        console.log('Using body directly');
        createSpaceDto = body;
      }

      console.log('Processed DTO:', createSpaceDto);
      console.log('JWT User object:', req.user);
      
      const result = await this.spacesService.create(createSpaceDto, req.user.userId, images);
      console.log('Space created successfully:', result._id);
      return result;
    } catch (error) {
      console.error('Error creating space:', error);
      throw error;
    }
  }

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findAll(@Query() query: any) {
    return this.spacesService.findAll(query);
  }

  @Get('my-spaces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  findMySpaces(@Request() req) {
    console.log('JWT User object in findMySpaces:', req.user);
    return this.spacesService.findByOwner(req.user.userId);
  }

  @Get('search')
  search(@Query() searchParams: any) {
    return this.spacesService.searchSpaces(searchParams);
  }

  @Get('categories')
  getCategories() {
    return this.spacesService.getCategories();
  }

  @Get('amenities')
  getAmenities() {
    return this.spacesService.getAmenities();
  }

  @Post('fix-amenities')
  async fixAmenities() {
    return this.spacesService.fixAmenitiesData();
  }

  @Get(':id')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.spacesService.getAvailability(id, startDate, endDate);
  }

  @Get(':id/pricing')
  getPricing(@Param('id') id: string, @Query() query: any) {
    return this.spacesService.calculatePricing(id, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @Request() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    let newImages: SpaceImage[] = [];
    if (files && files.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultipleImages(files);
      newImages = uploadResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        isPrimary: false,
      }));
    }

    return this.spacesService.update(id, updateSpaceDto, req.user.userId, newImages);
  }

  @Patch(':id/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async updatePricing(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const space = await this.spacesService.findOne(id);
      
      // Transform the pricing data
      const transformedPricing = {
        type: updatePricingDto.pricing.type,
        basePrice: updatePricingDto.pricing.basePrice,
        currency: updatePricingDto.pricing.currency || 'INR',
        monthlyPrice: updatePricingDto.pricing.monthlyPrice,
        peakMultiplier: updatePricingDto.pricing.peakMultiplier || 1,
        offPeakMultiplier: updatePricingDto.pricing.offPeakMultiplier || 1,
        peakHours: updatePricingDto.pricing.peakHours || [],
        minimumBookingHours: updatePricingDto.pricing.minimumBookingHours || 1,
        requireApproval: updatePricingDto.pricing.requireApproval || false,
        allowSameDayBookings: updatePricingDto.pricing.allowSameDayBookings || false,
        timeBlocks: updatePricingDto.pricing.timeBlocks?.map(block => ({
          ...block,
          description: block.description?.trim() || `${block.hours} Hour Block`,
          isActive: block.isActive ?? true,
          maxBookings: block.maxBookings ?? 0,
          currentBookings: block.currentBookings ?? 0,
        })) || [],
        promoCodes: updatePricingDto.pricing.promoCodes?.map(promo => ({
          ...promo,
          code: promo.code.toUpperCase().trim(),
          description: promo.description?.trim() || `${promo.value}% off`,
          validFrom: new Date(promo.validFrom),
          validUntil: new Date(promo.validUntil),
          maxUses: promo.maxUses ?? 0,
          usedCount: promo.usedCount ?? 0,
          isActive: promo.isActive ?? true,
          minimumBookingAmount: promo.minimumBookingAmount ?? 0,
          maximumDiscountAmount: promo.maximumDiscountAmount ?? 0,
          applicableDays: promo.applicableDays ?? [],
          applicableTimeSlots: promo.applicableTimeSlots ?? [],
          firstTimeUserOnly: promo.firstTimeUserOnly ?? false,
          newUserOnly: promo.newUserOnly ?? false,
        })) || [],
        specialEvents: updatePricingDto.pricing.specialEvents?.map(event => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          isActive: event.isActive ?? true,
          maxBookings: event.maxBookings ?? 0,
          currentBookings: event.currentBookings ?? 0,
          includedServices: event.includedServices ?? [],
        })) || [],
      };
      
      // Update only the pricing field
      space.pricing = {
        ...space.pricing,
        ...transformedPricing,
      };

      const updatedSpace = await space.save();
      
      // Set cache invalidation headers for immediate updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Invalidated': 'true',
        'X-Last-Modified': new Date().toISOString(),
      });
      
      // Log the update for debugging
      console.log(`Pricing updated for space ${id} at ${new Date().toISOString()}`);
      console.log('Updated time blocks:', updatedSpace.pricing?.timeBlocks);
      
      return updatedSpace;
    } catch (error) {
      console.error('Error updating pricing:', error);
      throw new HttpException(
        error.message || 'Failed to update pricing',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async remove(@Param('id') id: string, @Request() req) {
    const space = await this.spacesService.findOne(id);
    if (space.images && space.images.length > 0) {
      // Delete images from Cloudinary
      for (const image of space.images) {
        await this.cloudinaryService.deleteImage(image.publicId);
      }
    }
    return this.spacesService.remove(id, req.user.userId);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  @UseInterceptors(FilesInterceptor('images', 10))
  async addImages(
    @Param('id') id: string,
    @Request() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    const uploadResults = await this.cloudinaryService.uploadMultipleImages(files);
    const images: SpaceImage[] = uploadResults.map(result => ({
      url: result.url,
      publicId: result.publicId,
      isPrimary: false,
    }));

    return this.spacesService.addImages(id, req.user.userId, images);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Request() req,
  ) {
    return this.spacesService.removeImage(id, imageId, req.user.userId);
  }

  @Post(':id/promo-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async addPromoCode(
    @Param('id') id: string,
    @Body() createPromoCodeDto: CreatePromoCodeDto,
    @Request() req,
  ) {
    // Verify space ownership
    await this.spacesService.findOne(id);
    const promoCodeData = {
      ...createPromoCodeDto,
      validFrom: new Date(createPromoCodeDto.validFrom),
      validUntil: new Date(createPromoCodeDto.validUntil),
    };
    return this.pricingService.addPromoCode(id, promoCodeData);
  }

  @Patch(':id/promo-codes/:promoCodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async updatePromoCode(
    @Param('id') id: string,
    @Param('promoCodeId') promoCodeId: string,
    @Body() updatePromoCodeDto: UpdatePromoCodeDto,
    @Request() req,
  ) {
    // Verify space ownership
    await this.spacesService.findOne(id);
    const updatePromoCodeData = {
      ...updatePromoCodeDto,
      validFrom: updatePromoCodeDto.validFrom ? new Date(updatePromoCodeDto.validFrom) : undefined,
      validUntil: updatePromoCodeDto.validUntil ? new Date(updatePromoCodeDto.validUntil) : undefined,
    };
    return this.pricingService.updatePromoCode(id, promoCodeId, updatePromoCodeData);
  }

  @Delete(':id/promo-codes/:promoCodeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async deletePromoCode(
    @Param('id') id: string,
    @Param('promoCodeId') promoCodeId: string,
    @Request() req,
  ) {
    // Verify space ownership
    await this.spacesService.findOne(id);
    return this.pricingService.deletePromoCode(id, promoCodeId);
  }

  @Post(':id/promo-codes/validate')
  async validatePromoCode(
    @Param('id') id: string,
    @Body() validatePromoCodeDto: ValidatePromoCodeDto,
    @Request() req,
  ) {
    const space = await this.spacesService.findOne(id);
    return this.pricingService.validatePromoCode(
      space,
      validatePromoCodeDto.code,
      validatePromoCodeDto.bookingAmount,
      validatePromoCodeDto.userId || req.user?.userId,
    );
  }

  @Post(':id/calculate-price')
  async calculatePrice(
    @Param('id') id: string,
    @Body() body: { startTime: string; endTime: string; promoCode?: string },
    @Request() req,
  ) {
    const space = await this.spacesService.findOne(id);
    const userId = req.user?.userId;
    
    return this.pricingService.calculateDynamicPrice(
      space,
      body.startTime,
      body.endTime,
      body.promoCode,
      undefined, // No bundleId
      userId,
    );
  }

  @Get(':id/promo-codes')
  async getPromoCodes(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.pricingService.getAvailablePromoCodes(id, userId);
  }

  @Get(':id/time-blocks')
  async getTimeBlocks(
    @Param('id') id: string,
    @Query('date') date: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const space = await this.spacesService.findOne(id);
    if (!space) {
      throw new HttpException('Space not found', HttpStatus.NOT_FOUND);
    }

    const timeBlocks = space.pricing?.timeBlocks || [];
    const selectedDate = new Date(date);
    
    // Get existing bookings for the date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.spacesService.getReservationsForDate(id, startOfDay, endOfDay);

    // Generate available time slots for each time block
    const availableSlots: Array<{
      startTime: string;
      endTime: string;
      timeBlock: {
        hours: number;
        price: number;
        description?: string;
        maxBookings?: number;
        currentBookings?: number;
      };
    }> = [];

    timeBlocks.forEach((block: any) => {
      if (!block.isActive) return;

      // Generate slots for each time block duration
      const startHour = 9; // 9 AM
      const endHour = 22; // 10 PM

      for (let hour = startHour; hour <= endHour - block.hours; hour++) {
        const startTime = new Date(selectedDate);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(hour + block.hours, 0, 0, 0);

        // Check if this time slot conflicts with existing bookings
        const isAvailable = !existingBookings.some((booking: any) => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return startTime < bookingEnd && endTime > bookingStart;
        });

        // Check if max bookings limit is reached
        const isWithinBookingLimit = !block.maxBookings || 
          (block.currentBookings || 0) < block.maxBookings;

        if (isAvailable && isWithinBookingLimit) {
          availableSlots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            timeBlock: {
              hours: block.hours,
              price: block.price,
              description: block.description,
              maxBookings: block.maxBookings,
              currentBookings: block.currentBookings
            }
          });
        }
      }
    });

    return {
      availableSlots,
      totalSlots: availableSlots.length,
      date: date,
      spaceId: id
    };
  }
} 