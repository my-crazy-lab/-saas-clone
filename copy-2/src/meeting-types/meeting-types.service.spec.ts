import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MeetingTypesService } from './meeting-types.service';
import { MeetingType, MeetingTypeStatus, LocationType } from './entities/meeting-type.entity';
import { AvailabilityWindow, DayOfWeek } from './entities/availability-window.entity';

describe('MeetingTypesService', () => {
  let service: MeetingTypesService;
  let meetingTypeRepository: Repository<MeetingType>;
  let availabilityWindowRepository: Repository<AvailabilityWindow>;

  const mockMeetingTypeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAvailabilityWindowRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingTypesService,
        {
          provide: getRepositoryToken(MeetingType),
          useValue: mockMeetingTypeRepository,
        },
        {
          provide: getRepositoryToken(AvailabilityWindow),
          useValue: mockAvailabilityWindowRepository,
        },
      ],
    }).compile();

    service = module.get<MeetingTypesService>(MeetingTypesService);
    meetingTypeRepository = module.get<Repository<MeetingType>>(getRepositoryToken(MeetingType));
    availabilityWindowRepository = module.get<Repository<AvailabilityWindow>>(getRepositoryToken(AvailabilityWindow));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createMeetingTypeDto = {
      title: '30-minute Consultation',
      description: 'A quick consultation call',
      duration: 30,
      bufferBefore: 5,
      bufferAfter: 5,
      locationType: LocationType.GOOGLE_MEET,
      minimumNotice: 60,
      maximumNotice: 10080,
      maxBookingsPerDay: 8,
      availabilityWindows: [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          dayOfWeek: DayOfWeek.TUESDAY,
          startTime: '09:00',
          endTime: '17:00',
        },
      ],
    };

    it('should create a meeting type successfully', async () => {
      const userId = 'user-1';
      const expectedMeetingType = {
        id: 'meeting-type-1',
        userId,
        ...createMeetingTypeDto,
        slug: '30-minute-consultation',
        status: MeetingTypeStatus.ACTIVE,
      };

      const expectedAvailabilityWindows = createMeetingTypeDto.availabilityWindows.map((window, index) => ({
        id: `window-${index}`,
        meetingTypeId: expectedMeetingType.id,
        ...window,
      }));

      mockMeetingTypeRepository.findOne.mockResolvedValue(null); // No existing slug
      mockMeetingTypeRepository.create.mockReturnValue(expectedMeetingType);
      mockMeetingTypeRepository.save.mockResolvedValue(expectedMeetingType);
      mockAvailabilityWindowRepository.create.mockImplementation((data) => data);
      mockAvailabilityWindowRepository.save.mockResolvedValue(expectedAvailabilityWindows);

      const result = await service.create(userId, createMeetingTypeDto);

      expect(meetingTypeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, slug: '30-minute-consultation' },
      });
      expect(meetingTypeRepository.create).toHaveBeenCalled();
      expect(meetingTypeRepository.save).toHaveBeenCalled();
      expect(availabilityWindowRepository.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedMeetingType);
    });

    it('should throw ConflictException if slug already exists', async () => {
      const userId = 'user-1';
      const existingMeetingType = {
        id: 'existing-meeting-type',
        slug: '30-minute-consultation',
      };

      mockMeetingTypeRepository.findOne.mockResolvedValue(existingMeetingType);

      await expect(service.create(userId, createMeetingTypeDto)).rejects.toThrow(ConflictException);
      expect(meetingTypeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, slug: '30-minute-consultation' },
      });
    });

    it('should generate unique slug if title conflicts', async () => {
      const userId = 'user-1';
      const createDto = {
        ...createMeetingTypeDto,
        title: 'Meeting with Special Characters!@#$%',
      };

      mockMeetingTypeRepository.findOne.mockResolvedValue(null);
      mockMeetingTypeRepository.create.mockReturnValue({ id: 'meeting-type-1' });
      mockMeetingTypeRepository.save.mockResolvedValue({ id: 'meeting-type-1' });
      mockAvailabilityWindowRepository.create.mockImplementation((data) => data);
      mockAvailabilityWindowRepository.save.mockResolvedValue([]);

      await service.create(userId, createDto);

      expect(meetingTypeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, slug: 'meeting-with-special-characters' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all meeting types for a user', async () => {
      const userId = 'user-1';
      const expectedMeetingTypes = [
        {
          id: 'meeting-type-1',
          title: '30-minute Consultation',
          status: MeetingTypeStatus.ACTIVE,
        },
        {
          id: 'meeting-type-2',
          title: '60-minute Strategy Session',
          status: MeetingTypeStatus.ACTIVE,
        },
      ];

      mockMeetingTypeRepository.find.mockResolvedValue(expectedMeetingTypes);

      const result = await service.findAll(userId);

      expect(meetingTypeRepository.find).toHaveBeenCalledWith({
        where: { userId, status: MeetingTypeStatus.ACTIVE },
        relations: ['availabilityWindows'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedMeetingTypes);
    });
  });

  describe('findOne', () => {
    it('should return a meeting type by id', async () => {
      const meetingTypeId = 'meeting-type-1';
      const expectedMeetingType = {
        id: meetingTypeId,
        title: '30-minute Consultation',
        status: MeetingTypeStatus.ACTIVE,
      };

      mockMeetingTypeRepository.findOne.mockResolvedValue(expectedMeetingType);

      const result = await service.findOne(meetingTypeId);

      expect(meetingTypeRepository.findOne).toHaveBeenCalledWith({
        where: { id: meetingTypeId },
        relations: ['availabilityWindows', 'user'],
      });
      expect(result).toEqual(expectedMeetingType);
    });

    it('should throw NotFoundException if meeting type not found', async () => {
      const meetingTypeId = 'non-existent-meeting-type';
      mockMeetingTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(meetingTypeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserAndSlug', () => {
    it('should return a meeting type by user and slug', async () => {
      const username = 'johndoe';
      const slug = '30min-consultation';
      const expectedMeetingType = {
        id: 'meeting-type-1',
        title: '30-minute Consultation',
        slug,
        user: { username },
      };

      mockMeetingTypeRepository.findOne.mockResolvedValue(expectedMeetingType);

      const result = await service.findByUserAndSlug(username, slug);

      expect(meetingTypeRepository.findOne).toHaveBeenCalledWith({
        where: {
          slug,
          status: MeetingTypeStatus.ACTIVE,
          user: { username },
        },
        relations: ['availabilityWindows', 'user'],
      });
      expect(result).toEqual(expectedMeetingType);
    });
  });

  describe('update', () => {
    const updateMeetingTypeDto = {
      title: 'Updated 30-minute Consultation',
      description: 'Updated description',
      duration: 45,
      availabilityWindows: [
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: '10:00',
          endTime: '16:00',
        },
      ],
    };

    it('should update a meeting type successfully', async () => {
      const meetingTypeId = 'meeting-type-1';
      const userId = 'user-1';
      const existingMeetingType = {
        id: meetingTypeId,
        userId,
        title: '30-minute Consultation',
        slug: '30-minute-consultation',
      };

      const updatedMeetingType = {
        ...existingMeetingType,
        ...updateMeetingTypeDto,
        slug: 'updated-30-minute-consultation',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingMeetingType as any);
      mockMeetingTypeRepository.findOne.mockResolvedValue(null); // No slug conflict
      mockAvailabilityWindowRepository.remove.mockResolvedValue(undefined);
      mockAvailabilityWindowRepository.create.mockImplementation((data) => data);
      mockAvailabilityWindowRepository.save.mockResolvedValue([]);
      mockMeetingTypeRepository.save.mockResolvedValue(updatedMeetingType);

      const result = await service.update(meetingTypeId, userId, updateMeetingTypeDto);

      expect(service.findOne).toHaveBeenCalledWith(meetingTypeId);
      expect(availabilityWindowRepository.remove).toHaveBeenCalled();
      expect(availabilityWindowRepository.create).toHaveBeenCalled();
      expect(meetingTypeRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedMeetingType);
    });
  });

  describe('remove', () => {
    it('should soft delete a meeting type', async () => {
      const meetingTypeId = 'meeting-type-1';
      const userId = 'user-1';
      const meetingType = {
        id: meetingTypeId,
        userId,
        status: MeetingTypeStatus.ACTIVE,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(meetingType as any);
      mockMeetingTypeRepository.save.mockResolvedValue({
        ...meetingType,
        status: MeetingTypeStatus.ARCHIVED,
      });

      await service.remove(meetingTypeId, userId);

      expect(service.findOne).toHaveBeenCalledWith(meetingTypeId);
      expect(meetingTypeRepository.save).toHaveBeenCalledWith({
        ...meetingType,
        status: MeetingTypeStatus.ARCHIVED,
      });
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available time slots for a meeting type', async () => {
      const meetingTypeId = 'meeting-type-1';
      const date = new Date('2024-01-15'); // Monday
      const meetingType = {
        id: meetingTypeId,
        duration: 30,
        bufferBefore: 5,
        bufferAfter: 5,
        availabilityWindows: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(meetingType as any);

      const result = await service.getAvailableSlots(meetingTypeId, date);

      expect(service.findOne).toHaveBeenCalledWith(meetingTypeId);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Check that slots are properly formatted
      if (result.length > 0) {
        result.forEach(slot => {
          expect(slot).toHaveProperty('startTime');
          expect(slot).toHaveProperty('endTime');
          expect(typeof slot.startTime).toBe('string');
          expect(typeof slot.endTime).toBe('string');
        });
      }
    });

    it('should return empty array if no availability for the day', async () => {
      const meetingTypeId = 'meeting-type-1';
      const date = new Date('2024-01-14'); // Sunday
      const meetingType = {
        id: meetingTypeId,
        duration: 30,
        availabilityWindows: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(meetingType as any);

      const result = await service.getAvailableSlots(meetingTypeId, date);

      expect(result).toEqual([]);
    });
  });
});
