import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationStatus, PaymentStatus } from './schemas/reservation.schema';
import { Space } from '../spaces/schemas/space.schema';
import { User } from '../users/schemas/user.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PricingService } from '../spaces/pricing.service';
import { createEvent } from 'ics';
import type { EventAttributes } from 'ics';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Space.name) private spaceModel: Model<Space>,
    @InjectModel(User.name) private userModel: Model<User>,
    private pricingService: PricingService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<Reservation> {
    const { spaceId, startTime, endTime, totalAmount, promoCode, bundleId } = createReservationDto;
    
    console.log('Creating reservation with data:', {
      spaceId,
      userId,
      startTime,
      endTime,
      totalAmount,
      promoCode,
      bundleId
    });

    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new HttpException('Space not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check availability
    const conflictingReservation = await this.reservationModel.findOne({
      spaceId,
      status: { $in: ['confirmed', 'pending_payment', 'pending_approval'] },
      $or: [
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) },
        },
      ],
    });

    if (conflictingReservation) {
      throw new HttpException('Space is not available for the selected time', HttpStatus.CONFLICT);
    }

    // Calculate dynamic pricing using the new pricing service
    const calculatedPrice = await this.pricingService.calculateDynamicPrice(
      space,
      startTime,
      endTime,
      promoCode,
      bundleId,
      userId
    );

    // Create reservation with proper ObjectId conversion and status
    const reservation = new this.reservationModel({
      spaceId: new Types.ObjectId(spaceId),
      userId: new Types.ObjectId(userId),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalAmount: calculatedPrice.totalPrice,
      originalAmount: calculatedPrice.originalPrice,
      discountAmount: calculatedPrice.discountAmount,
      promoCode: calculatedPrice.promoCode,
      bundleId: calculatedPrice.appliedBundle?._id?.toString(),
      status: calculatedPrice.totalPrice > 0 ? 'pending_payment' : 'pending_approval',
      paymentStatus: calculatedPrice.totalPrice > 0 ? 'pending' : 'not_required',
      pricingBreakdown: calculatedPrice.breakdown,
      createdAt: new Date(),
    });

    console.log('Saving reservation:', {
      spaceId: reservation.spaceId,
      userId: reservation.userId,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      totalAmount: reservation.totalAmount
    });

    const savedReservation = await reservation.save();
    
    // Increment promo code usage if applied
    if (calculatedPrice.appliedPromoCode) {
      await this.pricingService.incrementPromoCodeUsage(spaceId, calculatedPrice.appliedPromoCode.code);
    }

    // Increment bundle usage if applied
    if (calculatedPrice.appliedBundle) {
      await this.pricingService.incrementBundleUsage(spaceId, calculatedPrice.appliedBundle._id?.toString() || '');
    }
    
    console.log('Reservation saved successfully:', {
      id: savedReservation._id,
      bookingCode: savedReservation.bookingCode,
      status: savedReservation.status,
      spaceOwnerId: space.ownerId
    });

    // Populate the saved reservation before returning
    const populatedReservation = await this.reservationModel
      .findById(savedReservation._id)
      .populate('spaceId', 'name address ownerId')
      .populate('userId', 'firstName lastName email')
      .exec();

    if (!populatedReservation) {
      throw new HttpException('Failed to retrieve created reservation', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return populatedReservation;
  }

  async calculateDynamicPrice(space: any, startTime: string, endTime: string, promoCode?: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    let basePrice = 0;
    let breakdown: Array<{
      type: string;
      description: string;
      amount: number;
    }> = [];

    // Use the correct pricing structure from space schema
    const pricing = space.pricing || {};
    const basePriceRate = pricing.basePrice || 0;
    const monthlyPrice = pricing.monthlyPrice || 0;

    // If no pricing type is set, default to hourly
    if (!pricing.type) {
      pricing.type = 'hourly';
    }

    // If no base price is set, set a default
    if (basePriceRate === 0 && pricing.type !== 'free') {
      pricing.basePrice = 100;
    }

    // Recalculate basePriceRate after potential default setting
    const finalBasePriceRate = pricing.basePrice || 0;

    // Calculate base price based on pricing type
    switch (pricing.type) {
      case 'hourly':
        basePrice = finalBasePriceRate * durationHours;
        breakdown.push({
          type: 'hourly_rate',
          description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${finalBasePriceRate})`,
          amount: finalBasePriceRate * durationHours,
        });
        break;

      case 'daily':
        const days = Math.ceil(durationHours / 24);
        basePrice = finalBasePriceRate * days;
        breakdown.push({
          type: 'daily_rate',
          description: `Daily rate (${days} days × ₹${finalBasePriceRate})`,
          amount: finalBasePriceRate * days,
        });
        break;

      case 'monthly':
        const months = Math.ceil(durationHours / (24 * 30));
        basePrice = monthlyPrice * months;
        breakdown.push({
          type: 'monthly_rate',
          description: `Monthly rate (${months} months × ₹${monthlyPrice})`,
          amount: monthlyPrice * months,
        });
        break;

      case 'package':
        const timeBlocks = pricing.timeBlocks || [];
        const timeBlock = timeBlocks.find((tb: any) => tb.hours >= durationHours);
        if (timeBlock) {
          basePrice = timeBlock.price;
          breakdown.push({
            type: 'package',
            description: `Package (${timeBlock.hours} hours)`,
            amount: timeBlock.price,
          });
        } else {
          basePrice = finalBasePriceRate * durationHours;
          breakdown.push({
            type: 'hourly_rate',
            description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${finalBasePriceRate})`,
            amount: finalBasePriceRate * durationHours,
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
        // Default to hourly pricing
        basePrice = finalBasePriceRate * durationHours;
        breakdown.push({
          type: 'hourly_rate',
          description: `Hourly rate (${durationHours.toFixed(1)} hours × ₹${finalBasePriceRate})`,
          amount: finalBasePriceRate * durationHours,
        });
    }

    // Apply peak/off-peak multipliers if configured
    if (pricing.peakHours && pricing.peakHours.length > 0) {
      const startDate = new Date(startTime);
      const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const time = startDate.toTimeString().slice(0, 5);
      
      const peakHour = pricing.peakHours.find((ph: any) => 
        ph.day === dayOfWeek && time >= ph.startTime && time <= ph.endTime
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

    // Apply promo code discount
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode && pricing.promoCodes) {
      const promo = pricing.promoCodes.find((p: any) => p.code === promoCode);
      if (promo && promo.isActive && new Date() >= new Date(promo.validFrom) && new Date() <= new Date(promo.validUntil)) {
        discountAmount = (basePrice * promo.discountPercentage) / 100;
        appliedPromoCode = promoCode;
        breakdown.push({
          type: 'promo_discount',
          description: `Promo code: ${promoCode} (${promo.discountPercentage}% off)`,
          amount: -discountAmount,
        });
      }
    }

    // Apply minimum booking hours check
    const minimumHours = pricing.minimumBookingHours || 1;
    if (durationHours < minimumHours) {
      const additionalHours = minimumHours - durationHours;
      const additionalCost = finalBasePriceRate * additionalHours;
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
      promoCode: appliedPromoCode,
      breakdown,
      durationHours: Math.max(durationHours, minimumHours),
    };
  }

  async findAll(query: any = {}): Promise<Reservation[]> {
    const { status, spaceId, userId, date, ...rest } = query;
    
    let filterQuery: any = { ...rest };
    
    if (status) {
      filterQuery.status = status;
    }
    
    if (spaceId) {
      filterQuery.spaceId = new Types.ObjectId(spaceId);
    }
    
    if (userId) {
      filterQuery.userId = new Types.ObjectId(userId);
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filterQuery.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.reservationModel
      .find(filterQuery)
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .populate('cancelledBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone')
      .populate('spaceId', 'name address capacity amenities')
      .populate('cancelledBy', 'firstName lastName')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    console.log('Finding reservations for user:', userId);
    
    const userObjectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', userObjectId);
    
    const reservations = await this.reservationModel
      .find({ userId: userObjectId })
      .populate('spaceId', 'name address')
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`Found ${reservations.length} reservations for user ${userId}`);
    reservations.forEach(r => {
      const spaceName = typeof r.spaceId === 'object' && r.spaceId !== null ? (r.spaceId as any).name : 'Unknown';
      console.log(`  - Reservation: ${r._id}, Status: ${r.status}, Space: ${spaceName}`);
    });
    
    return reservations;
  }

  async findBySpace(spaceId: string): Promise<Reservation[]> {
    return this.reservationModel
      .find({ spaceId: new Types.ObjectId(spaceId) })
      .populate('userId', 'firstName lastName email')
      .sort({ startTime: 1 })
      .exec();
  }

  async findByBookingCode(bookingCode: string): Promise<Reservation> {
    const reservation = await this.reservationModel
      .findOne({ bookingCode })
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async findOneByRazorpayOrderId(orderId: string): Promise<Reservation | null> {
    return this.reservationModel.findOne({ razorpayOrderId: orderId }).exec();
  }

  async findOneByRazorpayPaymentId(paymentId: string): Promise<Reservation | null> {
    return this.reservationModel.findOne({ razorpayPaymentId: paymentId }).exec();
  }

  async update(id: string, updateReservationDto: UpdateReservationDto, userId: string, userRole: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check permissions (allow system updates for webhooks)
    if (userRole !== 'system') {
      const isOwner = reservation.userId.toString() === userId;
      const isSpaceOwner = userRole === 'brand_owner';
      const isStaff = userRole === 'staff';

      if (!isOwner && !isSpaceOwner && !isStaff) {
        throw new ForbiddenException('You can only update your own reservations');
      }
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, updateReservationDto, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .populate('cancelledBy', 'firstName lastName')
      .exec();

    if (!updatedReservation) {
      throw new NotFoundException('Reservation not found');
    }

    return updatedReservation;
  }

  async cancel(id: string, userId: string, userRole: string, reason?: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check permissions
    const isOwner = reservation.userId.toString() === userId;
    const isSpaceOwner = userRole === 'brand_owner';
    const isStaff = userRole === 'staff';

    if (!isOwner && !isSpaceOwner && !isStaff) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }

    // Check if reservation can be cancelled
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.CHECKED_IN) {
      throw new BadRequestException('Cannot cancel a checked-in reservation');
    }

    const updateData: any = {
      status: ReservationStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: new Types.ObjectId(userId),
    };

    if (reason) {
      updateData.cancellationReason = reason;
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .populate('cancelledBy', 'firstName lastName')
      .exec();

    if (!updatedReservation) {
      throw new NotFoundException('Reservation not found');
    }

    return updatedReservation;
  }

  async checkIn(id: string, userId: string, userRole: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Only staff or space owner can check in
    if (userRole !== 'staff' && userRole !== 'brand_owner') {
      throw new ForbiddenException('Only staff can check in guests');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed reservations can be checked in');
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          status: ReservationStatus.CHECKED_IN,
          checkInTime: new Date(),
        },
        { new: true }
      )
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .exec();

    if (!updatedReservation) {
      throw new NotFoundException('Reservation not found');
    }

    return updatedReservation;
  }

  async checkOut(id: string, userId: string, userRole: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Only staff or space owner can check out
    if (userRole !== 'staff' && userRole !== 'brand_owner') {
      throw new ForbiddenException('Only staff can check out guests');
    }

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException('Only checked-in reservations can be checked out');
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          status: ReservationStatus.COMPLETED,
          checkOutTime: new Date(),
        },
        { new: true }
      )
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .exec();

    if (!updatedReservation) {
      throw new NotFoundException('Reservation not found');
    }

    return updatedReservation;
  }

  async markNoShow(id: string, userId: string, userRole: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Only staff or space owner can mark no-show
    if (userRole !== 'staff' && userRole !== 'brand_owner') {
      throw new ForbiddenException('Only staff can mark no-shows');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed reservations can be marked as no-show');
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          status: ReservationStatus.NO_SHOW,
        },
        { new: true }
      )
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address')
      .exec();

    if (!updatedReservation) {
      throw new NotFoundException('Reservation not found');
    }

    return updatedReservation;
  }

  async getDailyReservations(date: string, spaceId?: string): Promise<Reservation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let filterQuery: any = {
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [ReservationStatus.CANCELLED] },
    };

    if (spaceId) {
      filterQuery.spaceId = new Types.ObjectId(spaceId);
    }

    return this.reservationModel
      .find(filterQuery)
      .populate('userId', 'firstName lastName email phone')
      .populate('spaceId', 'name address')
      .sort({ startTime: 1 })
      .exec();
  }

  async getAvailability(spaceId: string, startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const reservations = await this.reservationModel
      .find({
        spaceId: new Types.ObjectId(spaceId),
        status: { $nin: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW] },
        $or: [
          {
            startTime: { $lt: end },
            endTime: { $gt: start },
          },
        ],
      })
      .select('startTime endTime status')
      .sort({ startTime: 1 })
      .exec();

    return reservations;
  }

  async findBySpaceOwner(ownerId: string, query: any = {}): Promise<Reservation[]> {
    try {
      console.log('Finding reservations for space owner:', ownerId);
      console.log('Query parameters:', query);

      // Find all spaces owned by this user
      const spaces = await this.spaceModel.find({ ownerId: new Types.ObjectId(ownerId) });
      console.log('Found spaces:', spaces.length);
      console.log('Space IDs:', spaces.map((s: any) => s._id.toString()));

      if (spaces.length === 0) {
        console.log('No spaces found for owner');
        return [];
      }

      const spaceIds = spaces.map(space => space._id);

      // Build filter query
      const filterQuery: any = {
        spaceId: { $in: spaceIds }
      };

      // Add date filter if provided
      if (query.date) {
        const startOfDay = new Date(query.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(query.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        filterQuery.startTime = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      // Add status filter if provided
      if (query.status && query.status !== 'all') {
        filterQuery.status = query.status;
      }

      console.log('Filter query:', JSON.stringify(filterQuery, null, 2));
      
      // Find all reservations matching the criteria
      const reservations = await this.reservationModel
        .find(filterQuery)
        .populate('userId', 'firstName lastName email phone')
        .populate('spaceId', 'name address ownerId')
        .populate('cancelledBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .exec();
      
      console.log('Found reservations:', reservations.length);
      console.log('Reservation details:', reservations.map((r: any) => ({
        id: r._id,
        spaceName: (r.spaceId as any)?.name,
        customerName: `${(r.userId as any)?.firstName} ${(r.userId as any)?.lastName}`,
        status: r.status,
        amount: r.totalAmount,
        startTime: r.startTime
      })));
      
      return reservations;
      
    } catch (error) {
      console.error('Error in findBySpaceOwner:', error);
      throw error;
    }
  }

  async findByStaffBrand(staffId: string, query: any = {}): Promise<Reservation[]> {
    try {
      console.log('Finding reservations for staff:', staffId);

      // Find the staff user to get their brand association
      const staffUser = await this.userModel.findById(staffId);
      if (!staffUser || staffUser.role !== 'staff') {
        throw new ForbiddenException('User is not staff');
      }

      if (!staffUser.brandId) {
        console.log('Staff not associated with any brand');
        return [];
      }

      console.log('Staff associated with brand:', staffUser.brandId.toString());

      // Find all spaces owned by this brand
      const spaces = await this.spaceModel.find({ ownerId: staffUser.brandId });
      console.log('Found spaces for brand:', spaces.length);

      if (spaces.length === 0) {
        console.log('No spaces found for brand');
        return [];
      }

      const spaceIds = spaces.map(space => space._id);

      // Build filter query
      const filterQuery: any = {
        spaceId: { $in: spaceIds }
      };

      // Add date filter if provided
      if (query.date) {
        const startOfDay = new Date(query.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(query.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        filterQuery.startTime = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      // Add status filter if provided
      if (query.status && query.status !== 'all') {
        filterQuery.status = query.status;
      }

      console.log('Filter query:', JSON.stringify(filterQuery, null, 2));
      
      // Find all reservations matching the criteria
      const reservations = await this.reservationModel
        .find(filterQuery)
        .populate('userId', 'firstName lastName email phone')
        .populate('spaceId', 'name address ownerId')
        .populate('cancelledBy', 'firstName lastName')
        .sort({ startTime: 1 })
        .exec();
      
      console.log('Found reservations for staff:', reservations.length);
      
      return reservations;
      
    } catch (error) {
      console.error('Error in findByStaffBrand:', error);
      throw error;
    }
  }

  async approveReservation(id: string, userId: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Check if user owns the space
    const space = await this.spaceModel.findById(reservation.spaceId);
    if (!space || space.ownerId.toString() !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    if (reservation.status !== 'pending_approval') {
      throw new HttpException('Reservation cannot be approved', HttpStatus.BAD_REQUEST);
    }

    reservation.status = 'confirmed';
    reservation.paymentStatus = 'completed';
    return await reservation.save();
  }

  async rejectReservation(id: string, userId: string, reason?: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Check if user owns the space
    const space = await this.spaceModel.findById(reservation.spaceId);
    if (!space || space.ownerId.toString() !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    if (reservation.status !== 'pending_approval') {
      throw new HttpException('Reservation cannot be rejected', HttpStatus.BAD_REQUEST);
    }

    reservation.status = 'rejected';
    reservation.rejectionReason = reason || 'Rejected by space owner';
    return await reservation.save();
  }

  async cancelReservation(id: string, userId: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    if (reservation.userId.toString() !== userId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    if (!['pending_approval', 'pending_payment'].includes(reservation.status)) {
      throw new HttpException('Reservation cannot be cancelled', HttpStatus.BAD_REQUEST);
    }

    reservation.status = 'cancelled';
    return await reservation.save();
  }

  async remove(id: string, userId: string, role: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Check if user has access to this reservation
    if (role === 'brand_owner') {
      const space = await this.spaceModel.findById(reservation.spaceId);
      if (!space || space.ownerId.toString() !== userId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
    } else {
      if (reservation.userId.toString() !== userId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
    }

    return await this.reservationModel.findByIdAndDelete(id);
  }

  async calculatePrice(spaceId: string, startTime: string, endTime: string, promoCode?: string, bundleId?: string) {
    // Check if space exists
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new HttpException('Space not found', HttpStatus.NOT_FOUND);
    }

    // Use the new pricing service for dynamic pricing
    return await this.pricingService.calculateDynamicPrice(
      space,
      startTime,
      endTime,
      promoCode,
      bundleId,
      undefined  // userId
    );
  }

  async handlePaymentSuccess(reservationId: string, paymentId: string, orderId: string): Promise<Reservation> {
    console.log('Handling payment success for reservation:', reservationId);
    
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Update reservation status
    reservation.status = 'confirmed';
    reservation.paymentStatus = 'success';
    reservation.paymentId = paymentId;
    reservation.razorpayOrderId = orderId;
    reservation.razorpayPaymentId = paymentId;

    const updatedReservation = await reservation.save();
    
    console.log('Reservation updated after payment:', {
      id: updatedReservation._id,
      status: updatedReservation.status,
      paymentStatus: updatedReservation.paymentStatus
    });

    // Return populated reservation
    const populatedReservation = await this.reservationModel
      .findById(updatedReservation._id)
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address ownerId')
      .exec();

    if (!populatedReservation) {
      throw new HttpException('Failed to retrieve updated reservation', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return populatedReservation;
  }

  async handlePaymentFailure(reservationId: string, reason?: string): Promise<Reservation> {
    console.log('Handling payment failure for reservation:', reservationId);
    
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Update reservation status
    reservation.status = 'pending_payment';
    reservation.paymentStatus = 'failed';

    const updatedReservation = await reservation.save();
    
    console.log('Reservation updated after payment failure:', {
      id: updatedReservation._id,
      status: updatedReservation.status,
      paymentStatus: updatedReservation.paymentStatus
    });

    return updatedReservation;
  }

  /**
   * Generate an ICS file for a reservation
   */
  async generateIcsForReservation(reservationId: string): Promise<{ ics: string, filename: string }> {
    // Fetch reservation with populated space and user
    const reservation = await this.reservationModel.findById(reservationId)
      .populate('spaceId', 'name address')
      .populate('userId', 'firstName lastName email')
      .exec();
    if (!reservation) throw new NotFoundException('Reservation not found');

    // Fix: Type assertions for populated fields (cast to unknown first)
    const space = reservation.spaceId as unknown as { name: string; address: string };
    const user = reservation.userId as unknown as { firstName: string; lastName: string; email: string };

    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    // Fix: Explicitly type start/end arrays
    const startArr: [number, number, number, number, number] = [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ];
    const endArr: [number, number, number, number, number] = [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ];
    const eventTitle = reservation.eventTitle || `Booking at ${space.name}`;
    const eventDescription = reservation.eventDescription || `Booking code: ${reservation.bookingCode}`;
    const location = space.address;
    const attendeeEmail = user.email;
    const attendeeName = `${user.firstName} ${user.lastName}`;

    // Fix: Explicitly type event as EventAttributes and use status literal
    const event: EventAttributes = {
      start: startArr,
      end: endArr,
      title: eventTitle,
      description: eventDescription,
      location,
      status: "CONFIRMED",
      organizer: { name: 'Events', email: 'support@events.live' },
      attendees: [
        { name: attendeeName, email: attendeeEmail, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
      ],
      url: undefined,
      geo: undefined,
      categories: ['Booking'],
      alarms: [
        { action: 'display', description: 'Booking Reminder', trigger: { hours: 1, before: true } },
      ],
    };

    return new Promise((resolve, reject) => {
      createEvent(event, (error, value) => {
        if (error) return reject(error);
        resolve({ ics: value, filename: `booking-${reservation.bookingCode}.ics` });
      });
    });
  }
} 