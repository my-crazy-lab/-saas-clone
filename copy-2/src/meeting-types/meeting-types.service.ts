import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingType, MeetingTypeStatus } from './entities/meeting-type.entity';
import { AvailabilityWindow } from './entities/availability-window.entity';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { UpdateMeetingTypeDto } from './dto/update-meeting-type.dto';

@Injectable()
export class MeetingTypesService {
  constructor(
    @InjectRepository(MeetingType)
    private readonly meetingTypeRepository: Repository<MeetingType>,
    @InjectRepository(AvailabilityWindow)
    private readonly availabilityWindowRepository: Repository<AvailabilityWindow>,
  ) {}

  async create(userId: string, createDto: CreateMeetingTypeDto): Promise<MeetingType> {
    // Check if slug already exists for this user
    const existingMeetingType = await this.meetingTypeRepository.findOne({
      where: { userId, slug: createDto.slug },
    });

    if (existingMeetingType) {
      throw new ConflictException('Meeting type with this slug already exists');
    }

    // Create meeting type
    const meetingType = this.meetingTypeRepository.create({
      ...createDto,
      userId,
    });

    const savedMeetingType = await this.meetingTypeRepository.save(meetingType);

    // Create availability windows if provided
    if (createDto.availabilityWindows && createDto.availabilityWindows.length > 0) {
      const windows = createDto.availabilityWindows.map(window => 
        this.availabilityWindowRepository.create({
          ...window,
          meetingTypeId: savedMeetingType.id,
        })
      );
      await this.availabilityWindowRepository.save(windows);
    }

    return this.findOne(savedMeetingType.id);
  }

  async findAll(userId?: string): Promise<MeetingType[]> {
    const query = this.meetingTypeRepository.createQueryBuilder('meetingType')
      .leftJoinAndSelect('meetingType.availabilityWindows', 'windows')
      .leftJoinAndSelect('meetingType.user', 'user')
      .where('meetingType.status = :status', { status: MeetingTypeStatus.ACTIVE });

    if (userId) {
      query.andWhere('meetingType.userId = :userId', { userId });
    }

    return query.orderBy('meetingType.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<MeetingType> {
    const meetingType = await this.meetingTypeRepository.findOne({
      where: { id },
      relations: ['availabilityWindows', 'user'],
    });

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    return meetingType;
  }

  async findByUserAndSlug(username: string, slug: string): Promise<MeetingType> {
    const meetingType = await this.meetingTypeRepository
      .createQueryBuilder('meetingType')
      .leftJoinAndSelect('meetingType.availabilityWindows', 'windows')
      .leftJoinAndSelect('meetingType.user', 'user')
      .where('user.username = :username', { username })
      .andWhere('meetingType.slug = :slug', { slug })
      .andWhere('meetingType.status = :status', { status: MeetingTypeStatus.ACTIVE })
      .getOne();

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    return meetingType;
  }

  async update(id: string, userId: string, updateDto: UpdateMeetingTypeDto): Promise<MeetingType> {
    const meetingType = await this.findOne(id);

    if (meetingType.userId !== userId) {
      throw new ForbiddenException('You can only update your own meeting types');
    }

    // Check slug conflict if updating slug
    if (updateDto.slug && updateDto.slug !== meetingType.slug) {
      const existingMeetingType = await this.meetingTypeRepository.findOne({
        where: { userId, slug: updateDto.slug },
      });

      if (existingMeetingType) {
        throw new ConflictException('Meeting type with this slug already exists');
      }
    }

    // Update meeting type
    Object.assign(meetingType, updateDto);
    const updatedMeetingType = await this.meetingTypeRepository.save(meetingType);

    // Update availability windows if provided
    if (updateDto.availabilityWindows) {
      // Remove existing windows
      await this.availabilityWindowRepository.delete({ meetingTypeId: id });

      // Create new windows
      if (updateDto.availabilityWindows.length > 0) {
        const windows = updateDto.availabilityWindows.map(window => 
          this.availabilityWindowRepository.create({
            ...window,
            meetingTypeId: id,
          })
        );
        await this.availabilityWindowRepository.save(windows);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const meetingType = await this.findOne(id);

    if (meetingType.userId !== userId) {
      throw new ForbiddenException('You can only delete your own meeting types');
    }

    // Soft delete by setting status to archived
    meetingType.status = MeetingTypeStatus.ARCHIVED;
    await this.meetingTypeRepository.save(meetingType);
  }

  async getAvailableSlots(
    meetingTypeId: string,
    date: Date,
    timezone: string = 'UTC',
  ): Promise<string[]> {
    const meetingType = await this.findOne(meetingTypeId);
    const dayOfWeek = date.getDay();

    // Get availability windows for the day
    const windows = meetingType.availabilityWindows.filter(
      window => window.dayOfWeek === dayOfWeek && window.isActive
    );

    if (windows.length === 0) {
      return [];
    }

    const slots: string[] = [];
    const slotDuration = meetingType.duration;
    const bufferTime = meetingType.bufferBefore + meetingType.bufferAfter;

    for (const window of windows) {
      const startMinutes = window.startTimeMinutes;
      const endMinutes = window.endTimeMinutes;

      for (let minutes = startMinutes; minutes + slotDuration <= endMinutes; minutes += slotDuration + bufferTime) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }

    return slots;
  }

  async toggleStatus(id: string, userId: string): Promise<MeetingType> {
    const meetingType = await this.findOne(id);

    if (meetingType.userId !== userId) {
      throw new ForbiddenException('You can only modify your own meeting types');
    }

    meetingType.status = meetingType.status === MeetingTypeStatus.ACTIVE 
      ? MeetingTypeStatus.INACTIVE 
      : MeetingTypeStatus.ACTIVE;

    return this.meetingTypeRepository.save(meetingType);
  }
}
