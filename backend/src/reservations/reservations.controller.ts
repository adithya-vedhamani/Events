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
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { Response } from 'express';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  create(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(createReservationDto, req.user.userId);
  }

  @Post('calculate-price')
  calculatePrice(@Body() body: { spaceId: string; startTime: string; endTime: string; promoCode?: string; bundleId?: string }) {
    return this.reservationsService.calculatePrice(body.spaceId, body.startTime, body.endTime, body.promoCode, body.bundleId);
  }

  @Get('availability/:spaceId')
  getAvailability(
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationsService.getAvailability(spaceId, startDate, endDate);
  }

  @Get('my-reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  findMyReservations(@Request() req) {
    return this.reservationsService.findByUser(req.user.userId);
  }

  @Get('space-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  findSpaceOwnerReservations(@Request() req, @Query() query: any) {
    return this.reservationsService.findBySpaceOwner(req.user.userId, query);
  }

  @Get('staff-brand')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  findStaffBrandReservations(@Request() req, @Query() query: any) {
    return this.reservationsService.findByStaffBrand(req.user.userId, query);
  }

  @Get('daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  findDailyReservations(@Query('date') date: string, @Query('spaceId') spaceId?: string) {
    return this.reservationsService.getDailyReservations(date, spaceId);
  }

  @Get('by-code/:bookingCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.BRAND_OWNER)
  findByBookingCode(@Param('bookingCode') bookingCode: string) {
    return this.reservationsService.findByBookingCode(bookingCode);
  }

  @Get('test/create-sample')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async createSampleBooking(@Request() req) {
    // Find a space owned by this user
    const space = await this.reservationsService['spaceModel'].findOne({ ownerId: req.user.userId });
    if (!space) {
      throw new HttpException('No spaces found for this user', HttpStatus.NOT_FOUND);
    }

    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(Date.now() + 26 * 60 * 60 * 1000); // Tomorrow + 2 hours
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Create a sample booking
    const sampleBooking = {
      spaceId: (space as any)._id.toString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalHours: totalHours,
      totalAmount: 500,
      basePrice: 250,
      promoCode: undefined
    };

    console.log('Creating sample booking:', sampleBooking);
    return this.reservationsService.create(sampleBooking, req.user.userId);
  }

  @Get(':id/ical')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async downloadIcal(@Param('id') id: string, @Res() res: Response) {
    try {
      const { ics, filename } = await this.reservationsService.generateIcsForReservation(id);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(ics);
    } catch (error) {
      console.error('Error generating ICS file:', error);
      res.status(500).json({ message: 'Failed to generate calendar file' });
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Request() req) {
    if (req.user.role === UserRole.BRAND_OWNER) {
      return this.reservationsService.findBySpaceOwner(req.user.userId);
    }
    return this.reservationsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto, @Request() req) {
    return this.reservationsService.update(id, updateReservationDto, req.user.userId, req.user.role);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  approveReservation(@Param('id') id: string, @Request() req) {
    return this.reservationsService.approveReservation(id, req.user.userId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  rejectReservation(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    return this.reservationsService.rejectReservation(id, req.user.userId, body.reason);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  cancelReservation(@Param('id') id: string, @Request() req) {
    return this.reservationsService.cancelReservation(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.userId, req.user.role);
  }

  @Post(':id/check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.BRAND_OWNER)
  checkIn(@Param('id') id: string, @Request() req) {
    return this.reservationsService.checkIn(id, req.user.userId, req.user.role);
  }

  @Post(':id/check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.BRAND_OWNER)
  checkOut(@Param('id') id: string, @Request() req) {
    return this.reservationsService.checkOut(id, req.user.userId, req.user.role);
  }

  @Post(':id/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.BRAND_OWNER)
  markNoShow(@Param('id') id: string, @Request() req) {
    return this.reservationsService.markNoShow(id, req.user.userId, req.user.role);
  }

  @Post(':id/payment-success')
  handlePaymentSuccess(
    @Param('id') id: string,
    @Body() body: { paymentId: string; orderId: string }
  ) {
    return this.reservationsService.handlePaymentSuccess(id, body.paymentId, body.orderId);
  }

  @Post(':id/payment-failure')
  handlePaymentFailure(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    return this.reservationsService.handlePaymentFailure(id, body.reason);
  }
} 