import type {
  CareNotification,
  NotificationImportance,
  NotificationPreferences,
} from '../types/dualcharge.ts';

function parseHHMMToMinutes(hhmm: string, fallbackMinutes: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return fallbackMinutes;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return fallbackMinutes;
  }
  return h * 60 + m;
}

/**
 * Checks whether a given local time (HH:MM or Date) falls inside a Quiet Hours window,
 * supporting both same-day windows (e.g. 13:00-15:00) and overnight windows (e.g. 22:30-07:30).
 */
export function isWithinQuietHours(
  prefs: NotificationPreferences,
  nowOrHHMM?: Date | string
): boolean {
  if (!prefs.quietHoursEnabled) return false;
  let currentMinutes: number;
  if (typeof nowOrHHMM === 'string') {
    currentMinutes = parseHHMMToMinutes(nowOrHHMM, 12 * 60);
  } else {
    const d = nowOrHHMM ?? new Date();
    currentMinutes = d.getHours() * 60 + d.getMinutes();
  }

  const start = parseHHMMToMinutes(prefs.quietStartTime, 22 * 60 + 30);
  const end = parseHHMMToMinutes(prefs.quietEndTime, 7 * 60 + 30);

  if (start === end) {
    return false;
  }
  if (start < end) {
    return currentMinutes >= start && currentMinutes < end;
  }
  // Overnight window (e.g. 22:30 -> 07:30)
  return currentMinutes >= start || currentMinutes < end;
}

export interface NotificationDeliveryDecision {
  deliverNow: boolean;
  suppressedByQuietHours: boolean;
  suppressedReason: 'quiet_hours' | 'frequency_filter' | 'status_disabled' | null;
}

/**
 * Evaluates whether an incoming notification should alert immediately, be queued quietly
 * under Quiet Hours / Frequency settings, or respect status notification opt-out.
 */
export function evaluateNotificationDelivery(params: {
  kind: 'care_message' | 'status_update' | 'surprise_care';
  importance: NotificationImportance;
  recipientPrefs: NotificationPreferences;
  senderShareStatusNotifications?: boolean;
  nowOrHHMM?: Date | string;
}): NotificationDeliveryDecision {
  const {
    kind,
    importance,
    recipientPrefs,
    senderShareStatusNotifications = true,
    nowOrHHMM,
  } = params;

  if (kind === 'status_update' && !senderShareStatusNotifications) {
    return {
      deliverNow: false,
      suppressedByQuietHours: false,
      suppressedReason: 'status_disabled',
    };
  }

  if (recipientPrefs.frequency === 'important_only' && importance === 'ordinary') {
    return {
      deliverNow: false,
      suppressedByQuietHours: false,
      suppressedReason: 'frequency_filter',
    };
  }

  if (isWithinQuietHours(recipientPrefs, nowOrHHMM)) {
    if (recipientPrefs.allowImportantDuringQuietHours && importance === 'important') {
      return {
        deliverNow: true,
        suppressedByQuietHours: false,
        suppressedReason: null,
      };
    }
    return {
      deliverNow: false,
      suppressedByQuietHours: true,
      suppressedReason: 'quiet_hours',
    };
  }

  return {
    deliverNow: true,
    suppressedByQuietHours: false,
    suppressedReason: null,
  };
}

/**
 * Determines whether a notification should count toward the live unread alert badge
 * after accounting for Quiet Hours suppression and frequency filtering.
 */
export function isNotificationAlertActive(
  notif: CareNotification,
  recipientPrefs?: NotificationPreferences
): boolean {
  if (notif.status !== 'Sent') return false;
  if (notif.suppressedByQuietHours || notif.suppressedReason === 'status_disabled') {
    return false;
  }
  if (
    recipientPrefs &&
    recipientPrefs.frequency === 'important_only' &&
    (notif.importance ?? 'ordinary') === 'ordinary'
  ) {
    return false;
  }
  return true;
}

/**
 * Returns whether the recipient prefers neutral notification previews to protect sensitive health details.
 */
export function shouldMaskSensitivePreview(prefs?: NotificationPreferences | null): boolean {
  return prefs?.sensitivePreview === 'neutral';
}
