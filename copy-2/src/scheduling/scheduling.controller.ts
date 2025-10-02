import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get(':username')
  @ApiOperation({ summary: 'Get public user profile and meeting types' })
  @ApiResponse({ status: 200, description: 'User profile and meeting types retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('username') username: string) {
    const user = await this.schedulingService.getPublicUserProfile(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const meetingTypes = await this.schedulingService.getPublicMeetingTypes(username);

    return {
      user,
      meetingTypes,
    };
  }

  @Get(':username/:slug')
  @ApiOperation({ summary: 'Get specific meeting type for booking' })
  @ApiResponse({ status: 200, description: 'Meeting type retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting type not found' })
  async getPublicMeetingType(
    @Param('username') username: string,
    @Param('slug') slug: string,
  ) {
    const meetingType = await this.schedulingService.getPublicMeetingType(username, slug);
    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    return meetingType;
  }
}
