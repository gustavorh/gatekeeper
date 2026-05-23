import { ApiProperty } from '@nestjs/swagger';

export class ShiftUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rut: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class ShiftWithUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ format: 'date-time' })
  clockInTime: string;

  @ApiProperty({ format: 'date-time', nullable: true, required: false })
  clockOutTime: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, required: false })
  lunchStartTime: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, required: false })
  lunchEndTime: string | null;

  @ApiProperty({ enum: ['pending', 'active', 'completed'] })
  status: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: ShiftUserSummaryDto })
  user: ShiftUserSummaryDto;
}

export class ShiftWithUserListResponseDto {
  @ApiProperty({ type: [ShiftWithUserDto] })
  shifts: ShiftWithUserDto[];

  @ApiProperty()
  total: number;
}
