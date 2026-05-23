import { Shift } from '../entities/shift.entity';

export const SHIFT_EVENTS = {
  CLOCKED_IN: 'shift.clocked-in',
  CLOCKED_OUT: 'shift.clocked-out',
  COMPLETED: 'shift.completed',
} as const;

export type ShiftEventName = (typeof SHIFT_EVENTS)[keyof typeof SHIFT_EVENTS];

export class ShiftClockedInEvent {
  constructor(public readonly shift: Shift) {}
}

export class ShiftClockedOutEvent {
  constructor(public readonly shift: Shift) {}
}

export class ShiftCompletedEvent {
  constructor(public readonly shift: Shift) {}
}
