import type {
  CareNotification,
  CheckInOption,
  DailyCheckInState,
  PartnerId,
  PartnerStatusSnapshot,
  SharingPreferences,
} from '../types/dualcharge.ts';

const VALID_OPTIONS: readonly CheckInOption[] = ['good', 'tired', 'rest'];

export function isValidCheckInOption(value: unknown): value is CheckInOption {
  return typeof value === 'string' && (VALID_OPTIONS as readonly string[]).includes(value);
}

/**
 * Saves an unconfirmed draft check-in locally without triggering partner updates or notifications.
 */
export function setDraftDailyCheckInState(
  prev: DailyCheckInState,
  option: CheckInOption
): DailyCheckInState {
  if (!isValidCheckInOption(option)) return prev;
  return {
    ...prev,
    draftStatus: option,
    confirmationState: prev.status ? prev.confirmationState ?? 'confirmed' : 'draft',
  };
}

export interface ConfirmStatusInput {
  prevCheckIn: DailyCheckInState;
  option: CheckInOption;
  dateISO: string;
  timeLabel: string;
  confirmedAtISO?: string;
  sharingPrefs: SharingPreferences;
  energyIndex?: number;
  sleepHours?: number;
  sleepQuality?: number;
  restingHeartRateBpm?: number | null;
  hrvValueMs?: number | null;
  hrvMetricType?: 'SDNN' | 'RMSSD' | null;
  activityMinutes?: number;
  steps?: number | null;
  recordedCyclePhase?: string | null;
}

export interface ConfirmStatusOutput {
  valid: boolean;
  nextCheckIn: DailyCheckInState;
  confirmationState: 'confirmed' | 'updated';
  snapshot: PartnerStatusSnapshot;
}

/**
 * Validates and confirms today's daily check-in, producing a strictly permission-filtered
 * PartnerStatusSnapshot. Restricted fields are NEVER added when sharing toggles are false.
 */
export function confirmDailyStatusUpdate(input: ConfirmStatusInput): ConfirmStatusOutput {
  const {
    prevCheckIn,
    option,
    dateISO,
    timeLabel,
    confirmedAtISO = new Date().toISOString(),
    sharingPrefs,
    energyIndex,
    sleepHours,
    sleepQuality,
    restingHeartRateBpm,
    hrvValueMs,
    hrvMetricType,
    activityMinutes,
    steps,
    recordedCyclePhase,
  } = input;

  if (!isValidCheckInOption(option)) {
    throw new Error(`Invalid check-in option: ${String(option)}`);
  }

  const alreadyConfirmedToday =
    prevCheckIn.confirmedDateISO === dateISO && prevCheckIn.status !== null;
  const confirmationState: 'confirmed' | 'updated' = alreadyConfirmedToday
    ? 'updated'
    : 'confirmed';

  const nextCheckIn: DailyCheckInState = {
    status: option,
    draftStatus: option,
    confirmationState,
    updatedAtTime: timeLabel,
    confirmedAtISO,
    confirmedDateISO: dateISO,
    historyCount: prevCheckIn.historyCount,
  };

  const heartRateShared = Boolean(sharingPrefs.heartRate);
  const hrvShared = Boolean(sharingPrefs.hrv);
  const cycleShared = Boolean(sharingPrefs.cycleTrackingEnabled && sharingPrefs.cycle);

  // Strict privacy filter: NEVER include fields that are not explicitly enabled
  const snapshot: PartnerStatusSnapshot = {
    dateISO,
    confirmedAtISO,
    updatedAtTime: timeLabel,
    confirmationState,
    energyShared: Boolean(sharingPrefs.energy),
    sleepShared: Boolean(sharingPrefs.sleep),
    ...(heartRateShared ? { heartRateShared: true } : {}),
    ...(hrvShared ? { hrvShared: true } : {}),
    activityShared: Boolean(sharingPrefs.activity),
    ...(cycleShared ? { cycleShared: true } : {}),
    ...(sharingPrefs.energy
      ? {
          checkInStatus: option,
          ...(typeof energyIndex === 'number' ? { energyIndex } : {}),
        }
      : {}),
    ...(sharingPrefs.energy && sharingPrefs.sleep && typeof sleepHours === 'number'
      ? {
          sleepHours,
          ...(typeof sleepQuality === 'number' ? { sleepQuality } : {}),
        }
      : {}),
    ...(sharingPrefs.energy && heartRateShared && typeof restingHeartRateBpm === 'number'
      ? { restingHeartRateBpm }
      : {}),
    ...(sharingPrefs.energy && hrvShared && typeof hrvValueMs === 'number'
      ? { hrvValueMs, ...(hrvMetricType ? { hrvMetricType } : {}) }
      : {}),
    ...(sharingPrefs.energy && sharingPrefs.activity && typeof activityMinutes === 'number'
      ? {
          activityMinutes,
          ...(typeof steps === 'number' ? { steps } : {}),
        }
      : {}),
    ...(sharingPrefs.energy && cycleShared && typeof recordedCyclePhase === 'string'
      ? { recordedCyclePhase }
      : {}),
  };

  return {
    valid: true,
    nextCheckIn,
    confirmationState,
    snapshot,
  };
}

/**
 * Creates or updates the partner's same-day status-update notification in place.
 * Uses a deterministic ID (`status-notif-${sender}-${dateISO}`) so confirming again
 * on the same day never produces duplicate conflicting notifications.
 * If energy sharing is disabled, no permitted status notification is emitted.
 */
export function upsertPartnerStatusNotification(params: {
  notifications: CareNotification[];
  sender: PartnerId;
  recipient: PartnerId;
  snapshot: PartnerStatusSnapshot;
  shareStatusNotifications?: boolean;
  suppressedByQuietHours?: boolean;
  suppressedReason?: 'quiet_hours' | 'frequency_filter' | 'status_disabled' | null;
}): CareNotification[] {
  const {
    notifications,
    sender,
    recipient,
    snapshot,
    shareStatusNotifications = true,
    suppressedByQuietHours = false,
    suppressedReason = null,
  } = params;
  const stableId = `status-notif-${sender}-${snapshot.dateISO}`;

  // If status sharing or status notifications are disabled, strip any same-day status notification
  if (!snapshot.energyShared || !shareStatusNotifications) {
    return notifications.filter((n) => n.id !== stableId);
  }

  const nextNotif: CareNotification = {
    id: stableId,
    kind: 'status_update',
    sender,
    recipient,
    suggestionId: stableId,
    statusSnapshot: snapshot,
    importance: 'important',
    suppressedByQuietHours,
    suppressedReason,
    timeLabel: snapshot.updatedAtTime,
    dateISO: snapshot.dateISO,
    isToday: true,
    status: 'Sent',
  };

  const withoutExisting = notifications.filter((n) => n.id !== stableId);
  return [nextNotif, ...withoutExisting];
}

/**
 * Projects a stored status snapshot through the partner's LIVE sharing permissions,
 * ensuring that toggling sharing OFF later immediately hides restricted fields everywhere.
 */
export function getAuthorizedPartnerStatusView(
  snapshot: PartnerStatusSnapshot | null | undefined,
  liveSharing: SharingPreferences
): {
  hasConfirmedStatus: boolean;
  isPrivate: boolean;
  dateISO?: string;
  updatedAtTime?: string;
  confirmedAtISO?: string;
  confirmationState?: 'confirmed' | 'updated';
  checkInStatus?: CheckInOption;
  energyIndex?: number;
  sleepHours?: number;
  sleepQuality?: number;
  restingHeartRateBpm?: number | null;
  hrvValueMs?: number | null;
  hrvMetricType?: 'SDNN' | 'RMSSD' | null;
  activityMinutes?: number;
  steps?: number | null;
  recordedCyclePhase?: string | null;
} {
  if (!snapshot) {
    return { hasConfirmedStatus: false, isPrivate: false };
  }

  if (!liveSharing.energy || !snapshot.energyShared) {
    return {
      hasConfirmedStatus: true,
      isPrivate: true,
      dateISO: snapshot.dateISO,
      updatedAtTime: snapshot.updatedAtTime,
    };
  }

  return {
    hasConfirmedStatus: true,
    isPrivate: false,
    dateISO: snapshot.dateISO,
    updatedAtTime: snapshot.updatedAtTime,
    confirmedAtISO: snapshot.confirmedAtISO,
    confirmationState: snapshot.confirmationState,
    checkInStatus: snapshot.checkInStatus,
    energyIndex: snapshot.energyIndex,
    sleepHours: liveSharing.sleep && snapshot.sleepShared ? snapshot.sleepHours : undefined,
    sleepQuality: liveSharing.sleep && snapshot.sleepShared ? snapshot.sleepQuality : undefined,
    restingHeartRateBpm:
      liveSharing.heartRate && snapshot.heartRateShared ? snapshot.restingHeartRateBpm : undefined,
    hrvValueMs: liveSharing.hrv && snapshot.hrvShared ? snapshot.hrvValueMs : undefined,
    hrvMetricType: liveSharing.hrv && snapshot.hrvShared ? snapshot.hrvMetricType : undefined,
    activityMinutes:
      liveSharing.activity && snapshot.activityShared ? snapshot.activityMinutes : undefined,
    steps: liveSharing.activity && snapshot.activityShared ? snapshot.steps : undefined,
    recordedCyclePhase:
      liveSharing.cycleTrackingEnabled && liveSharing.cycle && snapshot.cycleShared
        ? snapshot.recordedCyclePhase
        : undefined,
  };
}
