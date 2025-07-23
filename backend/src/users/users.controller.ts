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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.STAFF)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Users can only update their own profile unless they're admin
    if (req.user.role !== UserRole.BRAND_OWNER && req.user.userId !== id) {
      throw new Error('Unauthorized');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('add-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  addStaff(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.createStaff(createUserDto, req.user.userId);
  }

  @Get('my-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  getMyStaff(@Request() req) {
    return this.usersService.findStaffByBrand(req.user.userId);
  }
} 