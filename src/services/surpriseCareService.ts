import type {
  AiCareRecommendation,
  AiCareRecommendationMetadata,
  SurpriseCareCategory,
  SurpriseCareDeliveryMode,
  SurpriseCareNoteStyle,
  SurpriseCareRecord,
  SurpriseCareVisibility,
} from '../types/aiCare.ts';
import type {
  CareMomentRecord,
  CareNotification,
  NotificationPreferences,
} from '../types/dualcharge.ts';
import { normalizeRecommendationMetadata } from './recommendationMetadata.ts';
import { evaluateNotificationDelivery } from './smartNotificationService.ts';

export type SurpriseRevealPresetKey =
  | 'this_evening'
  | 'tomorrow_morning'
  | 'next_pattern_window'
  | 'demo_quick'
  | 'custom';

export const SURPRISE_CARE_CATEGORIES: SurpriseCareCategory[] = [
  'personal_touch',
  'thoughtful_gesture',
  'shared_moments',
];

/**
 * Infers the most natural Surprise Care category from an existing AI or preset recommendation.
 */
export function inferSurpriseCategoryFromRecommendation(
  rec: Partial<AiCareRecommendation> & { id?: string }
): SurpriseCareCategory {
  const id = (rec.id ?? '').toLowerCase();
  const actionType = (rec.actionType ?? '').toLowerCase();
  const style = rec.communicationStyle;
  const cat = rec.category;

  if (
    style === 'Shared Activity' ||
    cat === 'Quality Time' ||
    actionType === 'evening_walk' ||
    id.includes('walk') ||
    id.startsWith('date-')
  ) {
    return 'shared_moments';
  }

  if (
    style === 'Short Text' ||
    style === 'Voice Message' ||
    cat === 'Emotional Support' ||
    actionType === 'supportive_message' ||
    actionType === 'handwritten_note' ||
    id.includes('checkin') ||
    id.includes('note') ||
    id.includes('message')
  ) {
    return 'personal_touch';
  }

  return 'thoughtful_gesture';
}

export function computeSuggestedRevealAtISO(
  presetKey: Exclude<SurpriseRevealPresetKey, 'custom'>,
  now: Date = new Date()
): string {
  const target = new Date(now.getTime());
  if (presetKey === 'demo_quick') {
    target.setSeconds(target.getSeconds() + 5);
    return target.toISOString();
  }
  if (presetKey === 'this_evening') {
    target.setHours(19, 30, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setTime(now.getTime() + 2 * 60 * 60 * 1000);
    }
    return target.toISOString();
  }
  if (presetKey === 'tomorrow_morning') {
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    return target.toISOString();
  }
  // next_pattern_window -> next Thursday 4:00 PM (or +3 days if already past)
  const day = target.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  target.setDate(target.getDate() + daysUntilThursday);
  target.setHours(16, 0, 0, 0);
  return target.toISOString();
}

export interface CreateSurpriseCareInput {
  id?: string;
  senderId: string;
  recipientId: string;
  sourceRecommendation: AiCareRecommendation;
  careCategory: SurpriseCareCategory;
  noteStyle?: SurpriseCareNoteStyle;
  title: string;
  actionDescription: string;
  content: string;
  deliveryMode: SurpriseCareDeliveryMode;
  revealAt?: string | null;
  revealPresetKey?: SurpriseRevealPresetKey;
  relatedDatePlanId?: string;
  visibility?: SurpriseCareVisibility;
  orderId?: string;
  sourceActionMode?: 'in_app' | 'mock_order';
  confirmNow?: boolean;
  nowISO?: string;
}

export function createSurpriseCareRecord(input: CreateSurpriseCareInput): SurpriseCareRecord {
  const nowISO = input.nowISO ?? new Date().toISOString();
  const id =
    input.id ?? `surp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const metadata: AiCareRecommendationMetadata = normalizeRecommendationMetadata(
    input.sourceRecommendation
  );

  const confirmNow = input.confirmNow !== false;
  const resolvedRevealAt =
    input.deliveryMode === 'keep_surprise'
      ? input.revealAt ?? computeSuggestedRevealAtISO('this_evening', new Date(nowISO))
      : null;

  const status = !confirmNow
    ? 'Draft'
    : input.deliveryMode === 'tell_now'
      ? 'Sent'
      : 'Scheduled';

  return {
    id,
    senderId: input.senderId,
    recipientId: input.recipientId,
    sourceRecommendationId: input.sourceRecommendation.id,
    recommendationMetadata: metadata,
    careCategory: input.careCategory,
    noteStyle: input.noteStyle ?? 'standard',
    title: input.title.trim() || input.sourceRecommendation.title,
    actionDescription:
      input.actionDescription.trim() || input.sourceRecommendation.action,
    content: input.content.trim() || input.sourceRecommendation.defaultMessage,
    deliveryMode: input.deliveryMode,
    createdAt: nowISO,
    updatedAt: nowISO,
    revealAt: resolvedRevealAt,
    revealedAt: input.deliveryMode === 'tell_now' && confirmNow ? nowISO : null,
    completedAt: null,
    status,
    relatedDatePlanId:
      input.careCategory === 'shared_moments' ? input.relatedDatePlanId : undefined,
    visibility: input.visibility ?? 'shared',
    notificationId: `notif-surprise-${id}`,
    orderId: input.orderId,
    sourceActionMode: input.sourceActionMode ?? (input.orderId ? 'mock_order' : 'in_app'),
    sourceWhy: input.sourceRecommendation.why,
    sourceSuggestedTiming: input.sourceRecommendation.suggestedTiming,
    revealPresetKey: input.revealPresetKey,
  };
}

/**
 * Only Draft or unrevealed Scheduled surprises can be edited by the sender.
 */
export function canEditOrCancelSurprise(record: SurpriseCareRecord): boolean {
  return record.status === 'Draft' || record.status === 'Scheduled';
}

export function editSurpriseCareRecord(
  record: SurpriseCareRecord,
  patch: Partial<
    Pick<
      SurpriseCareRecord,
      | 'careCategory'
      | 'noteStyle'
      | 'title'
      | 'actionDescription'
      | 'content'
      | 'revealAt'
      | 'revealPresetKey'
      | 'relatedDatePlanId'
      | 'visibility'
    >
  >,
  nowISO: string = new Date().toISOString()
): { updated: boolean; record: SurpriseCareRecord } {
  if (!canEditOrCancelSurprise(record)) {
    return { updated: false, record };
  }
  const nextCategory = patch.careCategory ?? record.careCategory;
  return {
    updated: true,
    record: {
      ...record,
      ...patch,
      careCategory: nextCategory,
      title: patch.title !== undefined ? patch.title.trim() || record.title : record.title,
      actionDescription:
        patch.actionDescription !== undefined
          ? patch.actionDescription.trim() || record.actionDescription
          : record.actionDescription,
      content:
        patch.content !== undefined ? patch.content.trim() || record.content : record.content,
      relatedDatePlanId:
        nextCategory === 'shared_moments'
          ? patch.relatedDatePlanId !== undefined
            ? patch.relatedDatePlanId
            : record.relatedDatePlanId
          : undefined,
      updatedAt: nowISO,
    },
  };
}

export function cancelSurpriseCareRecord(
  record: SurpriseCareRecord,
  senderId: string,
  nowISO: string = new Date().toISOString()
): { cancelled: boolean; record: SurpriseCareRecord } {
  if (record.senderId !== senderId || !canEditOrCancelSurprise(record)) {
    return { cancelled: false, record };
  }
  return {
    cancelled: true,
    record: {
      ...record,
      status: 'Cancelled',
      updatedAt: nowISO,
    },
  };
}

export function isSurpriseReadyToReveal(
  record: SurpriseCareRecord,
  nowISO: string = new Date().toISOString()
): boolean {
  if (record.status !== 'Scheduled' || record.deliveryMode !== 'keep_surprise') {
    return false;
  }
  if (!record.revealAt) return false;
  const revealMs = Date.parse(record.revealAt);
  const nowMs = Date.parse(nowISO);
  if (Number.isNaN(revealMs) || Number.isNaN(nowMs)) return false;
  return revealMs <= nowMs;
}

export function revealSurpriseCareRecord(
  record: SurpriseCareRecord,
  actorId: string,
  nowISO: string = new Date().toISOString(),
  options?: { forceDemoUnlock?: boolean }
): { revealed: boolean; record: SurpriseCareRecord } {
  if (record.recipientId !== actorId) {
    return { revealed: false, record };
  }
  if (record.status !== 'Scheduled') {
    return { revealed: false, record };
  }
  if (!options?.forceDemoUnlock && !isSurpriseReadyToReveal(record, nowISO)) {
    return { revealed: false, record };
  }
  return {
    revealed: true,
    record: {
      ...record,
      status: 'Revealed',
      revealedAt: nowISO,
      updatedAt: nowISO,
    },
  };
}

export function completeSurpriseCareRecord(
  record: SurpriseCareRecord,
  actorId: string,
  nowISO: string = new Date().toISOString()
): { completed: boolean; record: SurpriseCareRecord } {
  if (actorId !== record.recipientId && actorId !== record.senderId) {
    return { completed: false, record };
  }
  if (record.status !== 'Sent' && record.status !== 'Revealed') {
    return { completed: false, record };
  }
  return {
    completed: true,
    record: {
      ...record,
      status: 'Completed',
      completedAt: nowISO,
      updatedAt: nowISO,
    },
  };
}

/**
 * Privacy-safe projection for the recipient UI.
 * Guarantees:
 * - Cancelled / Draft surprises are invisible.
 * - Unrevealed keep_surprise records mask title, content, actionDescription, sender, noteStyle, and relatedDatePlanId.
 * - Private health metrics and AI reasoning (sourceWhy, personalizationReason) are NEVER included.
 */
export interface RecipientSurpriseView {
  visible: boolean;
  isMasked: boolean;
  isRevealed: boolean;
  isReadyToReveal: boolean;
  canOpenSurprise: boolean;
  careCategory?: SurpriseCareCategory;
  noteStyle?: SurpriseCareNoteStyle;
  title?: string;
  actionDescription?: string;
  content?: string;
  senderId?: string;
  relatedDatePlanId?: string;
  revealAt: string | null;
  status: SurpriseCareRecord['status'];
}

export function getRecipientVisibleSurpriseView(
  record: SurpriseCareRecord,
  nowISO: string = new Date().toISOString()
): RecipientSurpriseView {
  if (record.status === 'Cancelled' || record.status === 'Draft') {
    return {
      visible: false,
      isMasked: true,
      isRevealed: false,
      isReadyToReveal: false,
      canOpenSurprise: false,
      revealAt: null,
      status: record.status,
    };
  }

  if (record.deliveryMode === 'keep_surprise' && record.status === 'Scheduled') {
    const ready = isSurpriseReadyToReveal(record, nowISO);
    return {
      visible: true,
      isMasked: true,
      isRevealed: false,
      isReadyToReveal: ready,
      canOpenSurprise: ready,
      revealAt: record.revealAt,
      status: record.status,
    };
  }

  return {
    visible: true,
    isMasked: false,
    isRevealed: true,
    isReadyToReveal: false,
    canOpenSurprise: false,
    careCategory: record.careCategory,
    noteStyle: record.noteStyle,
    title: record.title,
    actionDescription: record.actionDescription,
    content: record.content,
    senderId: record.senderId,
    relatedDatePlanId: record.relatedDatePlanId,
    revealAt: record.revealAt,
    status: record.status,
  };
}

/**
 * Checks whether a date plan invite belongs to an unrevealed Surprise Care so CarePage
 * never leaks surprise date details prematurely.
 */
export function isDatePlanHiddenAsSurprise(
  planId: string,
  surpriseRecords: SurpriseCareRecord[] | undefined,
  viewerId: string
): boolean {
  if (!surpriseRecords || surpriseRecords.length === 0) return false;
  return surpriseRecords.some(
    (rec) =>
      rec.recipientId === viewerId &&
      rec.relatedDatePlanId === planId &&
      rec.deliveryMode === 'keep_surprise' &&
      rec.status === 'Scheduled'
  );
}

/**
 * Builds or updates a deduplicated CareNotification for a SurpriseCareRecord.
 * Respects Quiet Hours and frequency preferences.
 */
export function buildSurpriseCareNotification(params: {
  record: SurpriseCareRecord;
  recipientPrefs: NotificationPreferences;
  timeLabel: string;
  dateISO: string;
  nowOrHHMM?: Date | string;
}): CareNotification {
  const { record, recipientPrefs, timeLabel, dateISO, nowOrHHMM } = params;
  const delivery = evaluateNotificationDelivery({
    kind: 'surprise_care',
    importance: 'ordinary',
    recipientPrefs,
    nowOrHHMM,
  });

  const isKeepSurpriseUnrevealed =
    record.deliveryMode === 'keep_surprise' && record.status === 'Scheduled';

  return {
    id: record.notificationId ?? `notif-surprise-${record.id}`,
    kind: 'surprise_care',
    sender: record.senderId as CareNotification['sender'],
    recipient: record.recipientId as CareNotification['recipient'],
    suggestionId: record.sourceRecommendationId,
    surpriseCareId: record.id,
    mockOrderId: record.orderId,
    suggestionTitle: isKeepSurpriseUnrevealed ? undefined : record.title,
    suggestionDefaultMessage: isKeepSurpriseUnrevealed ? undefined : record.content,
    recommendationMetadata: record.recommendationMetadata,
    importance: 'ordinary',
    suppressedByQuietHours: delivery.suppressedByQuietHours,
    suppressedReason: delivery.suppressedReason,
    timeLabel,
    dateISO,
    isToday: true,
    status:
      record.status === 'Completed'
        ? 'Completed'
        : record.status === 'Revealed'
          ? 'Received'
          : 'Sent',
  };
}

export function upsertSurpriseNotification(
  notifications: CareNotification[],
  nextNotif: CareNotification
): CareNotification[] {
  const existingIdx = notifications.findIndex(
    (n) =>
      n.id === nextNotif.id ||
      (n.surpriseCareId && nextNotif.surpriseCareId && n.surpriseCareId === nextNotif.surpriseCareId)
  );
  if (existingIdx >= 0) {
    return notifications.map((n, idx) =>
      idx === existingIdx
        ? {
            ...nextNotif,
            feedbackSubmitted: n.feedbackSubmitted,
          }
        : n
    );
  }
  return [nextNotif, ...notifications];
}

export function buildCareMomentFromSurprise(
  record: SurpriseCareRecord,
  meta: {
    dateISO: string;
    timeLabel: string;
    nowISO?: string;
  }
): CareMomentRecord | null {
  if (record.status !== 'Completed') {
    return null;
  }
  const notifId = record.notificationId ?? `notif-surprise-${record.id}`;
  return {
    id: `moment-surprise-${record.id}`,
    sourceNotificationId: notifId,
    dateTimeISO: meta.nowISO ?? record.completedAt ?? new Date().toISOString(),
    timeLabel: meta.timeLabel,
    dateISO: meta.dateISO,
    careActionTitle: record.title,
    sender: record.senderId as CareMomentRecord['sender'],
    recipient: record.recipientId as CareMomentRecord['recipient'],
    status: 'Completed',
    optionalNote: record.content,
    noteAuthor: record.senderId as CareMomentRecord['noteAuthor'],
    sharedVisibility: record.visibility === 'shared',
    isSurprise: true,
    surpriseCareId: record.id,
    surpriseCategory: record.careCategory,
  };
}

export function upsertSurpriseCareMoment(
  existingMoments: CareMomentRecord[],
  record: SurpriseCareRecord,
  meta: {
    dateISO: string;
    timeLabel: string;
    nowISO?: string;
  }
): CareMomentRecord[] {
  const moment = buildCareMomentFromSurprise(record, meta);
  if (!moment) return existingMoments;

  const exists = existingMoments.some(
    (m) =>
      m.surpriseCareId === record.id ||
      m.sourceNotificationId === moment.sourceNotificationId ||
      m.id === moment.id
  );
  if (exists) return existingMoments;
  return [moment, ...existingMoments];
}
