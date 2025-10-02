import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly usersService: UsersService,
    private readonly meetingTypesService: MeetingTypesService,
  ) {}

  async getPublicUserProfile(username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      avatar: user.avatar,
      timezone: user.timezone,
    };
  }

  async getPublicMeetingTypes(username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return [];
    }

    return this.meetingTypesService.findAll(user.id);
  }

  async getPublicMeetingType(username: string, slug: string) {
    return this.meetingTypesService.findByUserAndSlug(username, slug);
  }
}
