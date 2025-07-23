import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role, ...rest } = createUserDto;

    // Try to extract brandId for staff
    let brandId: Types.ObjectId | undefined = undefined;
    if (role === 'staff') {
      const match = email.match(/^staff\d*\.(.+)$/);
      if (match) {
        const brandOwnerEmail = match[1];
        const brandOwner = await this.userModel.findOne({ email: brandOwnerEmail, role: 'brand_owner' });
        if (brandOwner) {
          brandId = brandOwner._id as Types.ObjectId;
        } else {
          throw new BadRequestException('No brand owner found for this staff email');
        }
      } else {
        throw new BadRequestException('Staff email must be in the format staff1.[brandowner-email]');
      }
    }

    // Check if user already exists
    let existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      // PATCH: If staff and missing brandId, update it
      if (role === 'staff' && brandId && !existingUser.brandId) {
        existingUser.brandId = brandId;
        await existingUser.save();
      }
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      ...rest,
      email,
      password: hashedPassword,
      role,
      ...(brandId ? { brandId } : {}),
    });

    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...updateUserDto };
    
    // Handle password update if provided
    if ('password' in updateUserDto && updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role }).select('-password').exec();
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createStaff(createUserDto: CreateUserDto, brandOwnerId: string) {
    const { email, password, firstName, lastName, phone } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user
    const staffUser = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'staff',
      brandId: brandOwnerId, // Associate with the brand owner
      isEmailVerified: true, // Auto-verify staff accounts
    });

    const savedUser = await staffUser.save();
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  async findStaffByBrand(brandOwnerId: string) {
    const staff = await this.userModel
      .find({ 
        role: 'staff', 
        brandId: brandOwnerId 
      })
      .select('-password')
      .exec();
    
    return staff;
  }
} 