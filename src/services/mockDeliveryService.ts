import type {
  AiCareRecommendation,
  AiCareRecommendationMetadata,
  CareReminderPresetKey,
  CareReminderRecord,
  MockOrderRecord,
  MockOrderStatus,
  MockProductCatalogItem,
  MockProductImageKey,
  SurpriseCareDeliveryMode,
  SurpriseCareRecord,
} from '../types/aiCare.ts';
import type { LanguageCode, PartnerId } from '../types/dualcharge.ts';
import { normalizeRecommendationMetadata } from './recommendationMetadata.ts';

export const MOCK_ORDER_STAGE_SEQUENCE: readonly Exclude<MockOrderStatus, 'Cancelled'>[] = [
  'Order Confirmed',
  'Preparing',
  'Picked Up',
  'Out for Delivery',
  'Delivered',
];

export const MOCK_DEMO_RECIPIENT_ADDRESSES: Record<PartnerId, string> = {
  alex: 'Unit 12B, Harborfront Residence, Cyberport Rd',
  jamie: 'Studio 402, West Kowloon Cultural Lane',
};

export const MOCK_PRODUCT_CATALOG: MockProductCatalogItem[] = [
  {
    id: 'mock-prod-latte',
    imageKey: 'hot_latte',
    actionTypes: ['purchase_coffee', 'warm_drink'],
    keywords: ['milk tea', 'coffee', 'latte', 'tea', 'boba', 'drink', '奶茶', '咖啡', '拿铁', '拿鐵', '热饮', '熱飲'],
    merchantName: {
      en: 'Harbor Roast & Tea Bar (Simulated)',
      'zh-CN': '港湾手冲茶咖馆（模拟商户）',
      'zh-TW': '港灣手沖茶咖館（模擬商戶）',
    },
    title: {
      en: 'Warm Oat Milk Tea & Latte',
      'zh-CN': '暖心燕麦热奶茶 / 轻拿铁',
      'zh-TW': '暖心燕麥熱奶茶 / 輕拿鐵',
    },
    subtitle: {
      en: 'Freshly brewed warm comfort cup with custom sweetness & oat milk option.',
      'zh-CN': '现煮温润饮品，支持低糖与燕麦奶定制，适合补充惬意暖意。',
      'zh-TW': '現煮溫潤飲品，支援微糖與燕麥奶客製，適合補充愜意暖意。',
    },
    variants: {
      en: ['Warm Oat Milk Tea (Less Sweet)', 'Classic Honey Ginger Latte', 'Warm Roasted Oolong Tea'],
      'zh-CN': ['温热燕麦烤奶茶（三分糖）', '蜂蜜姜汁暖拿铁', '温润炭焙乌龙鲜奶茶'],
      'zh-TW': ['溫熱燕麥烤奶茶（微糖）', '蜂蜜薑汁暖拿鐵', '溫潤炭焙烏龍鮮奶茶'],
    },
    unitPrice: 34,
    deliveryFee: 5,
    currencySymbol: 'HK$',
    estimatedEtaMinutes: [20, 30],
  },
  {
    id: 'mock-prod-dessert',
    imageKey: 'dessert_pastry',
    actionTypes: ['purchase_dessert'],
    keywords: ['dessert', 'pastry', 'cake', 'sweet', 'snack', 'bakery', 'tart', 'croissant', '甜品', '点心', '點心', '蛋糕', '烘焙', '下午茶'],
    merchantName: {
      en: 'Mellow Bakehouse (Simulated)',
      'zh-CN': '柔光手作烘焙坊（模拟商户）',
      'zh-TW': '柔光手作烘焙坊（模擬商戶）',
    },
    title: {
      en: 'Artisanal Pastry & Dessert Box',
      'zh-CN': '手作舒缓小甜点礼盒',
      'zh-TW': '手作舒緩小甜點禮盒',
    },
    subtitle: {
      en: 'Lightly sweetened mille-crepe slice & warm butter pastry baked fresh.',
      'zh-CN': '低糖清爽甜点配现烤黄油点心，轻盈不腻，适合晚间或午后享用。',
      'zh-TW': '微甜清爽甜點配現烤奶油點心，輕盈不膩，適合晚間或午後享用。',
    },
    variants: {
      en: ['Light Matcha & Vanilla Pastry Duo', 'Earl Grey Cream Roll & Madeleine', 'Warm Almond Croissant Box'],
      'zh-CN': ['清甜抹茶香草双拼甜点', '伯爵茶轻奶油卷 + 玛德琳', '现烤杏仁可颂小盒'],
      'zh-TW': ['微甜抹茶香草雙拼甜點', '伯爵茶輕奶油捲 + 瑪德蓮', '現烤杏仁可頌小盒'],
    },
    unitPrice: 52,
    deliveryFee: 6,
    currencySymbol: 'HK$',
    estimatedEtaMinutes: [25, 35],
  },
  {
    id: 'mock-prod-flowers',
    imageKey: 'fresh_flowers',
    actionTypes: ['purchase_flowers'],
    keywords: ['flower', 'bouquet', 'floral', 'bloom', 'tulip', 'rose', '花束', '鲜花', '鮮花', '花艺', '花藝'],
    merchantName: {
      en: 'Botanica Studio Express (Simulated)',
      'zh-CN': '森语鲜花工作室（模拟商户）',
      'zh-TW': '森語鮮花工作室（模擬商戶）',
    },
    title: {
      en: 'Fresh Pastel Seasonal Bouquet',
      'zh-CN': '温柔系当季鲜花小花束',
      'zh-TW': '溫柔系當季鮮花小花束',
    },
    subtitle: {
      en: 'Hand-tied soft chamomile, peach roses, and eucalyptus wrapped in linen paper.',
      'zh-CN': '洋甘菊、香槟浅粉花材搭配尤加利叶手扎，附带水培保鲜棉。',
      'zh-TW': '洋甘菊、香檳淺粉花材搭配尤加利葉手紮，附保濕棉包裝。',
    },
    variants: {
      en: ['Soft Peach & Chamomile Mini Bouquet', 'Cream Tulip & Eucalyptus Wrap', 'Pastel Seasonal Desk Arrangement'],
      'zh-CN': ['香槟粉玫瑰与洋甘菊迷你束', '奶油郁金香配尤加利叶', '桌面小巧浅色当季花束'],
      'zh-TW': ['香檳粉玫瑰與洋甘菊迷你束', '奶油鬱金香配尤加利葉', '桌面小巧淺色當季花束'],
    },
    unitPrice: 98,
    deliveryFee: 10,
    currencySymbol: 'HK$',
    estimatedEtaMinutes: [35, 50],
  },
  {
    id: 'mock-prod-gift',
    imageKey: 'cozy_gift',
    actionTypes: ['purchase_gift', 'gift_or_purchase'],
    keywords: ['gift', 'candle', 'plush', 'present', 'cozy', 'care box', '礼物', '禮物', '香薰', '蜡烛', '蠟燭', '礼盒', '禮盒'],
    merchantName: {
      en: 'Keepsake Cozy Corner (Simulated)',
      'zh-CN': '暖隅生活杂货铺（模拟商户）',
      'zh-TW': '暖隅生活選物店（模擬商戶）',
    },
    title: {
      en: 'Cozy Rest Care Gift Set',
      'zh-CN': '舒缓助眠香薰小礼盒',
      'zh-TW': '舒緩香氛溫馨小禮盒',
    },
    subtitle: {
      en: 'Small soy wax cedar-lavender candle & soft linen keepsake pouch.',
      'zh-CN': '天然雪松薰衣草香薰小蜡烛与亚麻棉感护手小物，陪伴安静放松。',
      'zh-TW': '天然雪松薰衣草香氛小蠟燭與亞麻棉感護手小物，陪伴安靜放鬆。',
    },
    variants: {
      en: ['Cedar & Chamomile Soy Candle Set', 'Silk Eye Mask & Mini Hand Cream Box', 'Warm Linen Cozy Care Pouch'],
      'zh-CN': ['雪松洋甘菊天然香薰套装', '真丝眼罩 + 便携护手霜礼袋', '暖绒亚麻居家舒缓礼盒'],
      'zh-TW': ['雪松洋甘菊天然香氛套組', '真絲眼罩 + 輕巧護手霜禮袋', '暖絨亞麻居家舒緩禮盒'],
    },
    unitPrice: 88,
    deliveryFee: 8,
    currencySymbol: 'HK$',
    estimatedEtaMinutes: [30, 45],
  },
];

const PURCHASE_ACTION_TYPES = new Set([
  'purchase_coffee',
  'purchase_dessert',
  'purchase_flowers',
  'purchase_gift',
  'gift_or_purchase',
]);

export function isPurchaseOrientedRecommendation(
  rec: Pick<
    AiCareRecommendation,
    'id' | 'title' | 'action' | 'actionType' | 'requiresSpendingMoney' | 'tags'
  > & { why?: string }
): boolean {
  if (rec.requiresSpendingMoney === true) return true;
  if (rec.actionType && PURCHASE_ACTION_TYPES.has(rec.actionType.toLowerCase())) {
    return true;
  }
  if (rec.id.startsWith('fb-purchase-') || rec.id.includes('order-')) {
    return true;
  }
  const meta = normalizeRecommendationMetadata({
    title: rec.title,
    category: 'Small Surprise',
    action: rec.action,
    suggestedTiming: 'Today',
    actionType: rec.actionType,
    requiresSpendingMoney: rec.requiresSpendingMoney,
    tags: rec.tags,
    why: rec.why,
  });
  return meta.requiresSpendingMoney;
}

export function matchProductForRecommendation(
  rec: Pick<AiCareRecommendation, 'id' | 'title' | 'action' | 'actionType'>
): MockProductCatalogItem {
  const actionType = (rec.actionType ?? '').toLowerCase();
  const byAction = MOCK_PRODUCT_CATALOG.find((item) => item.actionTypes.includes(actionType));
  if (byAction) return byAction;

  const combined = `${rec.id} ${rec.title} ${rec.action}`.toLowerCase();
  const byKeyword = MOCK_PRODUCT_CATALOG.find((item) =>
    item.keywords.some((kw) => combined.includes(kw.toLowerCase()))
  );
  return byKeyword ?? MOCK_PRODUCT_CATALOG[0];
}

export function getRecommendedDemoAddress(recipientId: string): string {
  if (recipientId === 'alex' || recipientId === 'jamie') {
    return MOCK_DEMO_RECIPIENT_ADDRESSES[recipientId];
  }
  return '';
}

export function formatEstimatedArrivalLabel(
  etaRange: [number, number],
  language: LanguageCode
): string {
  const [minM, maxM] = etaRange;
  if (language === 'zh-CN') return `预计 ${minM}–${maxM} 分钟送达（模拟时间）`;
  if (language === 'zh-TW') return `預計 ${minM}–${maxM} 分鐘送達（模擬時間）`;
  return `Est. ${minM}–${maxM} mins (simulated)`;
}

export interface CreateSimulatedOrderInput {
  id?: string;
  senderId: string;
  recipientId: string;
  recipientName: string;
  recommendation: AiCareRecommendation;
  product: MockProductCatalogItem;
  selectedVariant: string;
  quantity: number;
  deliveryAddress: string;
  careMessage: string;
  platformNotes?: string;
  language: LanguageCode;
  nowISO?: string;
}

export function createSimulatedOrderRecord(input: CreateSimulatedOrderInput): MockOrderRecord {
  const nowISO = input.nowISO ?? new Date().toISOString();
  const safeQty = Math.max(1, Math.min(5, Math.round(input.quantity || 1)));
  const unitPrice = input.product.unitPrice;
  const deliveryFee = input.product.deliveryFee;
  const totalAmount = unitPrice * safeQty + deliveryFee;
  const id = input.id ?? `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const orderNumber = `DC-ORD-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const metadata: AiCareRecommendationMetadata = normalizeRecommendationMetadata(input.recommendation);

  return {
    id,
    orderNumber,
    senderId: input.senderId,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    sourceRecommendationId: input.recommendation.id,
    recommendationMetadata: {
      ...metadata,
      requiresSpendingMoney: true,
    },
    productId: input.product.id,
    productImageKey: input.product.imageKey,
    productTitle: input.product.title[input.language],
    merchantName: input.product.merchantName[input.language],
    selectedVariant: input.selectedVariant || input.product.variants[input.language][0],
    quantity: safeQty,
    unitPrice,
    deliveryFee,
    totalAmount,
    currencySymbol: input.product.currencySymbol,
    deliveryAddress: input.deliveryAddress.trim(),
    careMessage: input.careMessage.trim() || input.recommendation.defaultMessage,
    platformNotes: input.platformNotes?.trim() || undefined,
    estimatedArrivalLabel: formatEstimatedArrivalLabel(
      input.product.estimatedEtaMinutes,
      input.language
    ),
    status: 'Order Confirmed',
    revealMode: 'keep_surprise',
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
    deliveredAtISO: null,
    isSimulated: true,
  };
}

export function canTransitionMockOrderStatus(
  current: MockOrderStatus,
  next: MockOrderStatus
): boolean {
  if (current === 'Cancelled' || current === 'Delivered') return false;
  if (next === 'Cancelled') return current === 'Order Confirmed';
  const curIdx = MOCK_ORDER_STAGE_SEQUENCE.indexOf(current);
  const nextIdx = MOCK_ORDER_STAGE_SEQUENCE.indexOf(next);
  if (curIdx === -1 || nextIdx === -1) return false;
  return nextIdx > curIdx;
}

export function getNextMockOrderStage(
  current: MockOrderStatus
): Exclude<MockOrderStatus, 'Cancelled'> | null {
  if (current === 'Cancelled' || current === 'Delivered') return null;
  const idx = MOCK_ORDER_STAGE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= MOCK_ORDER_STAGE_SEQUENCE.length - 1) return null;
  return MOCK_ORDER_STAGE_SEQUENCE[idx + 1];
}

export function transitionMockOrderStatus(
  order: MockOrderRecord,
  nextStatus: MockOrderStatus,
  nowISO: string = new Date().toISOString()
): { changed: boolean; order: MockOrderRecord } {
  if (!canTransitionMockOrderStatus(order.status, nextStatus)) {
    return { changed: false, order };
  }
  return {
    changed: true,
    order: {
      ...order,
      status: nextStatus,
      updatedAtISO: nowISO,
      deliveredAtISO: nextStatus === 'Delivered' ? nowISO : order.deliveredAtISO,
    },
  };
}

/**
 * Privacy-safe recipient projection for simulated delivery orders.
 * When revealMode === 'keep_surprise' and the order is NOT yet Delivered (and linked surprise is not Revealed/Completed),
 * ALL product details, merchant, image, price, delivery address, ETA, tracking stage, sender identity,
 * care message, and AI reasoning are strictly masked.
 */
export interface RecipientOrderView {
  visible: boolean;
  isMasked: boolean;
  isDelivered: boolean;
  revealMode: SurpriseCareDeliveryMode;
  status?: MockOrderStatus;
  senderId?: string;
  productTitle?: string;
  merchantName?: string;
  selectedVariant?: string;
  quantity?: number;
  productImageKey?: MockProductImageKey;
  estimatedArrivalLabel?: string;
  careMessage?: string;
  deliveredAtISO?: string | null;
}

export function getRecipientVisibleOrderView(
  order: MockOrderRecord,
  linkedSurprise?: SurpriseCareRecord
): RecipientOrderView {
  if (order.status === 'Cancelled' || linkedSurprise?.status === 'Cancelled') {
    return {
      visible: false,
      isMasked: true,
      isDelivered: false,
      revealMode: order.revealMode,
    };
  }

  const isRevealedSurprise =
    linkedSurprise?.status === 'Revealed' || linkedSurprise?.status === 'Completed';
  const isDelivered = order.status === 'Delivered';

  if (order.revealMode === 'keep_surprise' && !isDelivered && !isRevealedSurprise) {
    return {
      visible: true,
      isMasked: true,
      isDelivered: false,
      revealMode: 'keep_surprise',
    };
  }

  return {
    visible: true,
    isMasked: false,
    isDelivered,
    revealMode: order.revealMode,
    status: order.status,
    senderId: order.senderId,
    productTitle: order.productTitle,
    merchantName: order.merchantName,
    selectedVariant: order.selectedVariant,
    quantity: order.quantity,
    productImageKey: order.productImageKey,
    estimatedArrivalLabel: order.estimatedArrivalLabel,
    careMessage: order.careMessage,
    deliveredAtISO: order.deliveredAtISO,
  };
}

export function computeReminderAtISO(
  presetKey: CareReminderPresetKey,
  customISO?: string | null,
  now: Date = new Date()
): string {
  const target = new Date(now.getTime());
  if (presetKey === 'in_1_hour') {
    target.setTime(now.getTime() + 60 * 60 * 1000);
    return target.toISOString();
  }
  if (presetKey === 'later_today') {
    target.setHours(20, 0, 0, 0);
    if (target.getTime() <= now.getTime() + 15 * 60 * 1000) {
      target.setTime(now.getTime() + 3 * 60 * 60 * 1000);
    }
    return target.toISOString();
  }
  if (presetKey === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    target.setHours(10, 0, 0, 0);
    return target.toISOString();
  }
  if (customISO && !Number.isNaN(Date.parse(customISO))) {
    return new Date(customISO).toISOString();
  }
  target.setTime(now.getTime() + 60 * 60 * 1000);
  return target.toISOString();
}

export function isCareReminderDue(
  reminder: CareReminderRecord,
  nowISO: string = new Date().toISOString()
): boolean {
  if (reminder.status !== 'scheduled') return false;
  const dueMs = Date.parse(reminder.remindAtISO);
  const nowMs = Date.parse(nowISO);
  if (Number.isNaN(dueMs) || Number.isNaN(nowMs)) return false;
  return dueMs <= nowMs;
}

export function evaluateDueReminders(
  reminders: CareReminderRecord[],
  nowISO: string = new Date().toISOString()
): {
  dueReminders: CareReminderRecord[];
  upcomingReminders: CareReminderRecord[];
} {
  const scheduled = reminders.filter((r) => r.status === 'scheduled');
  return {
    dueReminders: scheduled.filter((r) => isCareReminderDue(r, nowISO)),
    upcomingReminders: scheduled.filter((r) => !isCareReminderDue(r, nowISO)),
  };
}
