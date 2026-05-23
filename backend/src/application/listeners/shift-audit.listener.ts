import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SHIFT_EVENTS,
  ShiftClockedInEvent,
  ShiftClockedOutEvent,
  ShiftCompletedEvent,
} from '../../domain/events/shift.events';

@Injectable()
export class ShiftAuditListener {
  private readonly logger = new Logger(ShiftAuditListener.name);

  @OnEvent(SHIFT_EVENTS.CLOCKED_IN)
  handleClockedIn(event: ShiftClockedInEvent) {
    this.logger.log(
      `shift.clocked-in user=${event.shift.userId} shift=${event.shift.id}`,
    );
  }

  @OnEvent(SHIFT_EVENTS.CLOCKED_OUT)
  handleClockedOut(event: ShiftClockedOutEvent) {
    this.logger.log(
      `shift.clocked-out user=${event.shift.userId} shift=${event.shift.id}`,
    );
  }

  @OnEvent(SHIFT_EVENTS.COMPLETED)
  handleCompleted(event: ShiftCompletedEvent) {
    this.logger.log(
      `shift.completed user=${event.shift.userId} shift=${event.shift.id}`,
    );
  }
}
