import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  Gift,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { TranslationDictionary } from '@/src/i18n/translations';
import {
  formatEstimatedArrivalLabel,
  getRecommendedDemoAddress,
  matchProductForRecommendation,
} from '@/src/services/mockDeliveryService';
import {
  AiCareRecommendation,
  MockProductCatalogItem,
  SurpriseCareDeliveryMode,
} from '@/src/types/aiCare';
import { LanguageCode } from '@/src/types/dualcharge';
import { getProductImageSrc } from './productImageMap';

export interface MockDeliveryOrderPayload {
  recommendation: AiCareRecommendation;
  product: MockProductCatalogItem;
  selectedVariant: string;
  quantity: number;
  deliveryAddress: string;
  careMessage: string;
  platformNotes?: string;
  revealMode: SurpriseCareDeliveryMode;
  reminderId?: string;
}

interface MockDeliveryPlatformModalProps {
  open: boolean;
  recommendation: AiCareRecommendation | null;
  recipientId: string;
  recipientName: string;
  language: LanguageCode;
  t: TranslationDictionary;
  reminderId?: string;
  isDemoMode?: boolean;
  onClose: () => void;
  onCompleteOrderFlow: (payload: MockDeliveryOrderPayload) => void;
}

type ModalStage = 'storefront' | 'confirmed' | 'reveal_choice';

export function MockDeliveryPlatformModal({
  open,
  recommendation,
  recipientId,
  recipientName,
  language,
  t,
  reminderId,
  isDemoMode = true,
  onClose,
  onCompleteOrderFlow,
}: MockDeliveryPlatformModalProps) {
  const [stage, setStage] = useState<ModalStage>('storefront');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [careMessage, setCareMessage] = useState<string>('');
  const [platformNotes, setPlatformNotes] = useState<string>('');
  const [revealMode, setRevealMode] = useState<SurpriseCareDeliveryMode>('keep_surprise');
  const [confirmedOrderPreviewId, setConfirmedOrderPreviewId] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);
  const [showAddressError, setShowAddressError] = useState<boolean>(false);

  const product = useMemo(
    () => (recommendation ? matchProductForRecommendation(recommendation) : null),
    [recommendation]
  );

  const demoAddress = useMemo(
    () => (isDemoMode ? getRecommendedDemoAddress(recipientId) : ''),
    [isDemoMode, recipientId]
  );

  useEffect(() => {
    if (!open || !recommendation || !product) return;
    setStage('storefront');
    setSelectedVariant(product.variants[language][0] ?? product.variants.en[0]);
    setQuantity(1);
    setDeliveryAddress(demoAddress);
    setCareMessage(recommendation.defaultMessage || '');
    setPlatformNotes('');
    setRevealMode('keep_surprise');
    setConfirmedOrderPreviewId(
      `DC-ORD-${String(Math.floor(100000 + Math.random() * 900000))}`
    );
    setImgError(false);
    setShowAddressError(false);
  }, [open, recommendation, product, language, demoAddress]);

  if (!open || !recommendation || !product) return null;

  const variants = product.variants[language] ?? product.variants.en;
  const imgSrc = getProductImageSrc(product.imageKey);
  const subtotal = product.unitPrice * quantity;
  const total = subtotal + product.deliveryFee;
  const etaLabel = formatEstimatedArrivalLabel(product.estimatedEtaMinutes, language);

  const handleConfirmPlatformOrder = () => {
    if (!deliveryAddress.trim()) {
      setShowAddressError(true);
      return;
    }
    setShowAddressError(false);
    setStage('confirmed');
  };

  const handleFinalizeRevealSelection = () => {
    onCompleteOrderFlow({
      recommendation,
      product,
      selectedVariant: selectedVariant || variants[0],
      quantity,
      deliveryAddress: deliveryAddress.trim(),
      careMessage: careMessage.trim() || recommendation.defaultMessage,
      platformNotes: platformNotes.trim() || undefined,
      revealMode,
      reminderId,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        stage === 'reveal_choice'
          ? t.deliveryCare.revealChoice.title
          : t.deliveryCare.platform.simulatedBanner
      }
      className="fixed inset-0 z-50 flex flex-col bg-[#FDFBFA] overflow-hidden"
    >
      {stage === 'storefront' && (
        <>
          {/* Simulated Platform Header */}
          <header className="shrink-0 bg-white border-b border-[#292832]/[0.07] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[38px] px-2.5 -ml-1.5 rounded-xl text-[12px] font-semibold text-[#292832] hover:bg-[#F4EFEA] inline-flex items-center gap-1 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.deliveryCare.platform.cancelExitBtn}</span>
              </button>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#EFEDF5] px-2.5 py-1 text-[10.5px] font-semibold text-[#5B527E]">
                <Store className="w-3 h-3" />
                <span>{t.deliveryCare.platform.simulatedBanner}</span>
              </span>
            </div>

            <div className="rounded-xl bg-[#FBF7F5] border border-[#E88C7D]/25 px-3 py-1.5 text-[10.5px] text-[#8E4D42] leading-snug">
              {t.deliveryCare.platform.simulatedDisclaimer}
            </div>
          </header>

          {/* Storefront Scroll Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
            {/* Merchant + Studio Photo Card */}
            <div className="rounded-[22px] bg-white border border-[#292832]/[0.06] shadow-[0_10px_26px_-12px_rgba(41,40,50,0.08)] overflow-hidden">
              <div className="aspect-[4/3] w-full bg-[#F4EFEA] relative overflow-hidden">
                {imgSrc && !imgError ? (
                  <img
                    src={imgSrc}
                    alt={product.title[language]}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#85838D]">
                    <ShoppingBag className="w-8 h-8 text-[#C45E4E]" strokeWidth={1.6} />
                    <span className="text-[11px] font-semibold">{product.title[language]}</span>
                  </div>
                )}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-white/92 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-semibold text-[#292832] shadow-sm">
                    <Store className="w-3 h-3 text-[#C45E4E]" />
                    <span>{product.merchantName[language]}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-white/92 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-semibold text-[#3D5E49] shadow-sm tabular-nums">
                    <Truck className="w-3 h-3" />
                    <span>{etaLabel}</span>
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#706794]">
                      {t.deliveryCare.platform.itemSectionTitle}
                    </div>
                    <h2 className="font-display text-[16px] font-semibold text-[#292832] leading-snug mt-0.5">
                      {product.title[language]}
                    </h2>
                  </div>
                  <div className="text-[15px] font-bold text-[#292832] tabular-nums shrink-0">
                    {product.currencySymbol}
                    {product.unitPrice}
                  </div>
                </div>
                <p className="text-[12px] text-[#85838D] leading-relaxed">
                  {product.subtitle[language]}
                </p>
              </div>
            </div>

            {/* Variant Selector & Quantity */}
            <div className="rounded-[22px] bg-white border border-[#292832]/[0.06] p-3.5 space-y-3">
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-semibold text-[#292832]">
                  {t.deliveryCare.platform.variantLabel}
                </div>
                <div className="space-y-1.5">
                  {variants.map((variant) => {
                    const active = (selectedVariant || variants[0]) === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedVariant(variant)}
                        className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-[12px] font-medium flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                          active
                            ? 'bg-[#F5E8E7] text-[#292832] ring-1 ring-[#E88C7D]'
                            : 'bg-[#FDFBFA] text-[#292832]/85 border border-[#292832]/[0.06] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        <span>{variant}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                            active ? 'border-[#C45E4E] bg-[#C45E4E]' : 'border-[#85838D]/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#292832]/[0.06]">
                <span className="text-[12px] font-semibold text-[#292832]">
                  {t.deliveryCare.platform.quantityLabel}
                </span>
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F4EFEA] disabled:opacity-40 flex items-center justify-center text-[#292832] active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center text-[14px] font-bold text-[#292832] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= 5}
                    onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                    className="w-10 h-10 rounded-xl bg-[#F4EFEA] disabled:opacity-40 flex items-center justify-center text-[#292832] active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Details (Strictly Non-Health) */}
            <div className="rounded-[22px] bg-white border border-[#292832]/[0.06] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11.5px] font-semibold text-[#292832]">
                  {t.deliveryCare.platform.recipientLabel}
                </div>
                <span className="text-[12.5px] font-semibold text-[#706794]">
                  {recipientName}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="dc-delivery-address-input"
                    className="text-[11.5px] font-semibold text-[#292832] inline-flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C45E4E]" />
                    <span>{t.deliveryCare.platform.addressLabel}</span>
                  </label>
                  {demoAddress && deliveryAddress.trim() !== demoAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryAddress(demoAddress);
                        setShowAddressError(false);
                      }}
                      className="text-[11px] font-semibold text-[#706794] hover:underline"
                    >
                      {t.deliveryCare.platform.useDemoAddressBtn}
                    </button>
                  )}
                </div>
                <input
                  id="dc-delivery-address-input"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (e.target.value.trim()) setShowAddressError(false);
                  }}
                  placeholder={t.deliveryCare.platform.addressPlaceholder}
                  className="w-full min-h-[42px] rounded-xl bg-[#FDFBFA] border border-[#292832]/12 px-3 text-[12.5px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                />
                {showAddressError && (
                  <p className="text-[11px] font-medium text-[#C45E4E]">
                    {t.deliveryCare.platform.addressRequiredHint}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dc-gift-note-input"
                  className="block text-[11.5px] font-semibold text-[#292832]"
                >
                  {t.deliveryCare.platform.giftNoteLabel}
                </label>
                <textarea
                  id="dc-gift-note-input"
                  rows={2}
                  value={careMessage}
                  onChange={(e) => setCareMessage(e.target.value)}
                  placeholder={t.deliveryCare.platform.giftNotePlaceholder}
                  className="w-full rounded-xl bg-[#FDFBFA] border border-[#292832]/12 p-2.5 text-[12.5px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dc-platform-note-input"
                  className="block text-[11.5px] font-semibold text-[#85838D]"
                >
                  {t.deliveryCare.platform.platformNoteLabel}
                </label>
                <input
                  id="dc-platform-note-input"
                  type="text"
                  value={platformNotes}
                  onChange={(e) => setPlatformNotes(e.target.value)}
                  placeholder={t.deliveryCare.platform.platformNotePlaceholder}
                  className="w-full min-h-[40px] rounded-xl bg-[#FDFBFA] border border-[#292832]/10 px-3 text-[12px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
                />
              </div>
            </div>

            {/* Order Summary & Privacy Notice */}
            <div className="rounded-[22px] bg-white border border-[#292832]/[0.06] p-3.5 space-y-2">
              <div className="text-[12px] font-semibold text-[#292832]">
                {t.deliveryCare.platform.priceSummaryTitle}
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#85838D] tabular-nums">
                <span>{t.deliveryCare.platform.subtotalLabel}</span>
                <span>
                  {product.currencySymbol}
                  {subtotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#85838D] tabular-nums">
                <span>{t.deliveryCare.platform.deliveryFeeLabel}</span>
                <span>
                  {product.currencySymbol}
                  {product.deliveryFee}
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px] font-bold text-[#292832] pt-1.5 border-t border-[#292832]/[0.06] tabular-nums">
                <span>{t.deliveryCare.platform.totalLabel}</span>
                <span>
                  {product.currencySymbol}
                  {total}
                </span>
              </div>
              <div className="pt-1 flex items-start gap-1.5 text-[10.5px] text-[#3D5E49] leading-snug">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8FA89B] shrink-0 mt-0.5" />
                <span>{t.deliveryCare.platform.privacyNotice}</span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Checkout Bar */}
          <footer className="shrink-0 bg-white border-t border-[#292832]/[0.07] px-4 py-3">
            <button
              type="button"
              onClick={handleConfirmPlatformOrder}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[13px] font-semibold shadow-[0_8px_18px_-6px_rgba(232,140,125,0.6)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {t.deliveryCare.platform.confirmOrderBtn} · {product.currencySymbol}
                {total}
              </span>
            </button>
          </footer>
        </>
      )}

      {stage === 'confirmed' && (
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFEDF5] px-2.5 py-1 text-[10.5px] font-semibold text-[#5B527E]">
              <Store className="w-3 h-3" />
              <span>{t.deliveryCare.platform.simulatedBanner}</span>
            </div>

            <div className="rounded-[26px] bg-white border border-[#292832]/[0.06] shadow-[0_12px_32px_-12px_rgba(41,40,50,0.08)] p-5 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF1EE] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#3D5E49]" />
              </div>
              <div className="text-[11px] font-semibold text-[#3D5E49]">
                {t.deliveryCare.platform.confirmedBadge}
              </div>
              <h2 className="font-display text-[18px] font-semibold text-[#292832] leading-snug">
                {t.deliveryCare.platform.confirmedTitle}
              </h2>
              <p className="text-[12px] text-[#85838D] leading-relaxed">
                {t.deliveryCare.platform.confirmedSubtitle}
              </p>

              <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-3.5 text-left space-y-2 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#85838D]">{t.deliveryCare.platform.orderNumberLabel}</span>
                  <span className="font-semibold text-[#292832] tabular-nums">
                    {confirmedOrderPreviewId}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#85838D]">{t.deliveryCare.platform.merchantLabel}</span>
                  <span className="font-semibold text-[#292832] text-right">
                    {product.merchantName[language]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#85838D]">{t.deliveryCare.platform.etaLabel}</span>
                  <span className="font-semibold text-[#3D5E49] tabular-nums">{etaLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#292832]/[0.06]">
                  <span className="text-[#85838D]">{t.deliveryCare.platform.totalLabel}</span>
                  <span className="font-bold text-[#292832] tabular-nums">
                    {product.currencySymbol}
                    {total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStage('reveal_choice')}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-[#292832] hover:bg-[#3A3846] text-white text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#E88C7D]" />
            <span>{t.deliveryCare.platform.returnToAppBtn}</span>
          </button>
        </div>
      )}

      {stage === 'reveal_choice' && (
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5E8E7] px-2.5 py-1 text-[10.5px] font-semibold text-[#B45A4C]">
                <Gift className="w-3.5 h-3.5" />
                <span>{product.title[language]}</span>
              </div>
              <h2 className="font-display text-[18px] font-semibold text-[#292832] leading-snug pt-1">
                {t.deliveryCare.revealChoice.title}
              </h2>
              <p className="text-[12px] text-[#85838D] leading-relaxed">
                {t.deliveryCare.revealChoice.subtitle}
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Tell Them Now */}
              <button
                type="button"
                aria-pressed={revealMode === 'tell_now'}
                onClick={() => setRevealMode('tell_now')}
                className={`w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98] space-y-1.5 ${
                  revealMode === 'tell_now'
                    ? 'bg-[#FBF7F5] ring-2 ring-[#E88C7D] shadow-sm'
                    : 'bg-white border border-[#292832]/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-[#292832]">
                    {t.deliveryCare.revealChoice.tellNowTitle}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border shrink-0 ${
                      revealMode === 'tell_now'
                        ? 'border-[#C45E4E] bg-[#C45E4E]'
                        : 'border-[#85838D]/40'
                    }`}
                  />
                </div>
                <p className="text-[11.5px] text-[#85838D] leading-relaxed">
                  {t.deliveryCare.revealChoice.tellNowDesc}
                </p>
              </button>

              {/* Keep It a Surprise */}
              <button
                type="button"
                aria-pressed={revealMode === 'keep_surprise'}
                onClick={() => setRevealMode('keep_surprise')}
                className={`w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98] space-y-1.5 ${
                  revealMode === 'keep_surprise'
                    ? 'bg-[#F4F1F9] ring-2 ring-[#9B93B8] shadow-sm'
                    : 'bg-white border border-[#292832]/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-[#292832] inline-flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-[#706794]" />
                    <span>{t.deliveryCare.revealChoice.keepSurpriseTitle}</span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border shrink-0 ${
                      revealMode === 'keep_surprise'
                        ? 'border-[#706794] bg-[#706794]'
                        : 'border-[#85838D]/40'
                    }`}
                  />
                </div>
                <p className="text-[11.5px] text-[#85838D] leading-relaxed">
                  {t.deliveryCare.revealChoice.keepSurpriseDesc}
                </p>
              </button>
            </div>

            {revealMode === 'keep_surprise' && (
              <div className="rounded-2xl bg-[#EFEDF5]/70 border border-[#9B93B8]/30 p-3.5 space-y-1">
                <div className="text-[10.5px] font-semibold text-[#5B527E]">
                  {t.deliveryCare.revealChoice.maskedPreviewTitle}
                </div>
                <div className="text-[12.5px] font-medium text-[#292832]">
                  “{t.deliveryCare.revealChoice.maskedPreviewBody}”
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinalizeRevealSelection}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[13px] font-semibold shadow-[0_8px_18px_-6px_rgba(232,140,125,0.55)] active:scale-[0.98] transition-all"
          >
            {t.deliveryCare.revealChoice.confirmBtn}
          </button>
        </div>
      )}
    </div>
  );
}
