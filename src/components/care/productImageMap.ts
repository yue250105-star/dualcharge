import cozyGiftImg from '@/src/assets/images/product_cozy_gift_1794640209030.jpg';
import dessertPastryImg from '@/src/assets/images/product_dessert_pastry_1794640207985.jpg';
import freshFlowersImg from '@/src/assets/images/product_fresh_flowers_1794640209143.jpg';
import hotLatteImg from '@/src/assets/images/product_hot_latte_1794640206908.jpg';
import type { MockProductImageKey } from '@/src/types/aiCare';

export const PRODUCT_IMAGE_MAP: Record<MockProductImageKey, string> = {
  hot_latte: hotLatteImg,
  dessert_pastry: dessertPastryImg,
  fresh_flowers: freshFlowersImg,
  cozy_gift: cozyGiftImg,
};

export function getProductImageSrc(key?: MockProductImageKey): string | null {
  if (!key) return null;
  return PRODUCT_IMAGE_MAP[key] ?? null;
}
