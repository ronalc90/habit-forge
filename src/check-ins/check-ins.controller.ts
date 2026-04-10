import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { BatchCheckInDto } from './dto/batch-check-in.dto';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('check-ins')
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  checkIn(
    @CurrentUser('id') userId: string,
    @Body() createCheckInDto: CreateCheckInDto,
  ) {
    return this.checkInsService.checkIn(userId, createCheckInDto);
  }

  @Post('batch')
  batchCheckIn(
    @CurrentUser('id') userId: string,
    @Body() batchCheckInDto: BatchCheckInDto,
  ) {
    return this.checkInsService.batchCheckIn(userId, batchCheckInDto);
  }

  @Delete(':habitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  undoCheckIn(
    @CurrentUser('id') userId: string,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Query('date') date?: string,
  ) {
    return this.checkInsService.undoCheckIn(userId, habitId, date);
  }

  @Get('range')
  getByDateRange(
    @CurrentUser('id') userId: string,
    @Query() dateRangeDto: DateRangeDto,
  ) {
    return this.checkInsService.getByDateRange(
      userId,
      dateRangeDto.startDate,
      dateRangeDto.endDate,
      dateRangeDto.habitId,
    );
  }

  @Get('today')
  getTodayCheckIns(@CurrentUser('id') userId: string) {
    return this.checkInsService.getTodayCheckIns(userId);
  }

  @Get('status/:habitId')
  isCheckedIn(
    @CurrentUser('id') userId: string,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Query('date') date?: string,
  ) {
    return this.checkInsService.isCheckedIn(userId, habitId, date);
  }
}
