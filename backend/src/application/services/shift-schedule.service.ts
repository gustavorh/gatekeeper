import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { ShiftStatus } from '../../domain/entities/shift.entity';
import { SHIFT_EVENTS } from '../../domain/events/shift.events';

const MAX_SHIFT_HOURS = 16;

@Injectable()
export class ShiftScheduleService {
  private readonly logger = new Logger(ShiftScheduleService.name);

  constructor(
    @Inject('IShiftRepository')
    private readonly shiftRepository: IShiftRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoCloseStaleShifts(): Promise<void> {
    this.logger.log('Running auto-close cron for stale active shifts');

    const { shifts } = await this.shiftRepository
      .findAllActiveWithUsers(1000, 0)
      .then((results) => ({ shifts: results }));

    const cutoff = new Date(Date.now() - MAX_SHIFT_HOURS * 60 * 60 * 1000);
    const stale = shifts.filter(
      (s) => s.clockInTime && new Date(s.clockInTime) < cutoff,
    );

    if (stale.length === 0) {
      this.logger.log('No stale shifts found');
      return;
    }

    this.logger.log(`Auto-closing ${stale.length} stale shift(s)`);

    for (const shift of stale) {
      const closed = await this.shiftRepository.update(shift.id, {
        status: ShiftStatus.COMPLETED,
        clockOutTime: new Date(),
      });
      this.eventEmitter.emit(SHIFT_EVENTS.COMPLETED, closed);
    }

    this.logger.log(`Auto-closed ${stale.length} shift(s)`);
  }
}
