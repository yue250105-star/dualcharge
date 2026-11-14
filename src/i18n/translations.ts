import {
  CareReminderPresetKey,
  MockOrderStatus,
} from '@/src/types/aiCare';
import {
  AvoidTagKey,
  CheckInOption,
  CommunicationStyleKey,
  LanguageCode,
  NotificationStatus,
  OnboardingAvatarId,
  PreferredCareTagKey,
} from '@/src/types/dualcharge';

export interface TranslationDictionary {
  meta: {
    presentationSubtitle: string;
    partnerALabel: string;
    partnerBLabel: string;
    activePhone: string;
    resetDemo: string;
    resetConfirmTitle: string;
    resetConfirmBody: string;
    resetConfirmNote: string;
    cancel: string;
    confirmReset: string;
    simulatedDemoData: string;
    todayDateLabel: string;
  };
  nav: {
    home: string;
    insights: string;
    care: string;
    profile: string;
    notificationsAria: string;
  };
  greetings: {
    alex: string;
    jamie: string;
  };
  energyStates: {
    steady: string;
    moderate: string;
    low: string;
  };
  home: {
    connectedWith: string;
    myEnergy: string;
    partnerSharedEnergy: string;
    estimatedEnergyIndex: string;
    personalSpaceTag: string;
    sharedSpaceTag: string;
    sharingPaused: string;
    sharingPausedNote: string;
    todaysSummary: string;
    personalView: string;
    sleepDuration: string;
    sleepQuality: string;
    activity: string;
    selfReported: string;
    pendingCheckIn: string;
    hoursUnit: string;
    minutesUnit: string;
    partnerSharedContext: string;
    privacyControlled: string;
    partnerEnergyHiddenNotice: string;
    partnerDefaultPrivacyNotice: string;
    sleepLabel: string;
    activityLabel: string;
    dailyCheckIn: string;
    howAreYouFeeling: string;
    checkInOptions: Record<CheckInOption, { label: string; hint: string }>;
    checkInConfirmed: string;
    checkInPreservedNote: string;
    aiInsightPreview: string;
    insightPreviewPartnerDip: string;
    insightPreviewSelfDip: string;
    insightPreviewPartnerSteady: string;
    insightPreviewSelfSteady: string;
    viewInsights: string;
    recentCareActivity: string;
    openCare: string;
    draftStatusBadge: string;
    confirmedStatusBadge: string;
    updatedStatusBadge: string;
    confirmTodayStatusBtn: string;
    updateConfirmedStatusBtn: string;
    draftNotSharedHint: string;
    localOnlyStatusNote: string;
    partnerStatusUpdatedBanner: string;
    latestConfirmedStatusLabel: string;
    predictedBaselineLabel: string;
    respondWithCareBtn: string;
    partnerStatusPrivateNotice: string;
    rhrShortLabel: string;
    hrvShortLabel: string;
    cyclePhaseLabel: string;
    stepsShortLabel: string;
    weeklyRechargeCardTitle: string;
    weeklyRechargeBadgeDone: string;
    weeklyRechargeBadgeSkipped: string;
    weeklyRechargeBadgeNew: string;
    weeklyRechargePromptDesc: string;
    weeklyRechargeOpenBtn: string;
    weeklyRechargeEditBtn: string;
    weeklyRechargeSkipBtn: string;
    weeklyRechargeModalTitle: string;
    weeklyRechargeQ1: string;
    weeklyRechargeQ1Options: Record<
      'emotional_support' | 'practical_help' | 'rest_recovery' | 'quality_time',
      string
    >;
    weeklyRechargeQ2: string;
    weeklyRechargeQ2Options: Record<
      'more_quiet_time' | 'more_light_help' | 'more_gentle_checkins' | 'more_shared_outings',
      string
    >;
    weeklyRechargeCommentLabel: string;
    weeklyRechargeCommentPlaceholder: string;
    weeklyRechargeShareLabel: string;
    weeklyRechargeShareDesc: string;
    weeklyRechargeSaveBtn: string;
    weeklyRechargePrivateTag: string;
    weeklyRechargeSharedTag: string;
    weeklyRechargePartnerTitle: string;
    weeklyRechargePartnerNote: string;
    weeklyRechargeNormalNote: string;
  };
  insights: {
    title: string;
    subtitle: string;
    myPatternTab: string;
    partnerSharedTab: string;
    sharedInsightsPausedTitle: string;
    sharedInsightsPausedBody: string;
    historicalTrendTitle: string;
    last60Days: string;
    dateRangeTapHintTemplate: string;
    weekdayDipTagTemplate: string;
    restReminderAnnotationTemplate: string;
    historicalBadge: string;
    forecastBadge: string;
    indexLabel: string;
    sleepShortLabel: string;
    sleepPrivateLabel: string;
    legendDailyEnergy: string;
    legendObservedWeekdayTemplate: string;
    patternDetectionPrefix: string;
    noPatternTitle: string;
    noPatternNoteTemplate: string;
    overallAvgLabelTemplate: string;
    recent7DayAvgLabel: string;
    belowBaselineLabel: string;
    belowBaselineValueTemplate: string;
    weekdayPatternTitleTemplate: string;
    weekdayPatternNoteTemplate: string;
    overallAvgEnergy: string;
    weekdayAvgEnergyTemplate: string;
    weekdayObservationsTemplate: string;
    prevDayAvgSleep: string;
    future7DayTitle: string;
    estimatedIndexColon: string;
    confidenceColon: string;
    confidenceLevels: {
      Moderate: string;
      Low: string;
      'Insufficient Data': string;
    };
    insufficientDataTitle: string;
    insufficientDataBody: string;
    insufficientDataShort: string;
    forecastFooterLabel: string;
    whyIdentifiedTitle: string;
    observedHistoricalTitle: string;
    estimatedFutureTitle: string;
    evidenceSteadyObserved: string[];
    evidenceSteadyObservedNoSleep: string[];
    evidenceSteadyEstimated: string[];
    evidencePatternObserved: string[];
    evidencePatternSleepPrivate: string;
    evidencePatternSleepUnavailable: string;
    evidencePatternEstimated: string[];
    evidenceInsufficientEstimated: string[];
    viewCareSuggestions: string;
    sectionTodayOverview: string;
    sectionSleepPatterns: string;
    sectionHrvTrends: string;
    sectionRhrTrends: string;
    sectionActivityPatterns: string;
    personalBaselineLabel: string;
    latestReadingLabel: string;
    deviationLabel: string;
    sleepStagesTitle: string;
    sleepStagesAvgNote: string;
    stageDeep: string;
    stageRem: string;
    stageLight: string;
    stageAwake: string;
    hrvMetricNoteTemplate: string;
    rhrUnit: string;
    hrvUnit: string;
    stepsLabel: string;
    steps7dAvgLabel: string;
    intensityLabel: string;
    intensityLevels: Record<'Low' | 'Moderate' | 'Vigorous', string>;
    weeklyActivityTitle: string;
    missingDaysNoteTemplate: string;
    metricUnavailable: string;
    metricPrivateTemplate: string;
    metricEnableHint: string;
    cycleOptInNoteTemplate: string;
    nonDiagnosticBanner: string;
    freeTierInsightsBanner: string;
    premiumTierInsightsBanner: string;
    last30DaysFree: string;
    membershipLock: {
      freeTrendBanner: string;
      unlock60DayBtn: string;
      advancedBadge: string;
      advancedTitle: string;
      advancedDesc: string;
      advancedBenefits: string[];
      teaserPrivacyNote: string;
      upgradeCta: string;
      returnHomeBtn: string;
      basicForecastBadge: string;
    };
  };
  care: {
    title: string;
    subtitle: string;
    defaultRecipient: string;
    predictedWindowLabel: string;
    reasonLabel: string;
    patternWindowTemplate: string;
    patternReasonTemplate: string;
    patternReasonNoSleepTemplate: string;
    steadyWindowLabel: string;
    steadyReasonTemplate: string;
    sharingPausedWindow: string;
    sharingPausedReasonTemplate: string;
    personalizedSuggestionsTitle: string;
    forRecipient: string;
    whyThisFits: string;
    suggestedTiming: string;
    nonPurchaseTag: string;
    homeGestureTag: string;
    editMessage: string;
    hideMessageEditor: string;
    customMessageLabel: string;
    sendCare: string;
    saveSuggestion: string;
    saved: string;
    viewNotifications: string;
    sentToastTitle: string;
    savedToastText: string;
    alreadySavedText: string;
    respondingToStatusTitle: string;
    respondingToStatusClear: string;
    suggestions: Record<
      string,
      {
        title: string;
        description: string;
        reason: string;
        timing: string;
        defaultMessage: string;
      }
    >;
    aiEngine: {
      panelTitle: string;
      panelSubtitle: string;
      generateBtn: string;
      regenerateBtn: string;
      generatingLabel: string;
      initialPromptTitle: string;
      initialPromptBody: string;
      initialGenerateCta: string;
      sourceGeminiBadge: string;
      sourceFallbackBadge: string;
      fallbackNoticePrefix: string;
      fallbackReasons: {
        missing_api_key: string;
        api_error: string;
        network_error: string;
        timeout: string;
        invalid_response: string;
      };
      evidenceTitle: string;
      limitationsTitle: string;
      whyLabel: string;
      whatLabel: string;
      whenLabel: string;
      personalizationLabel: string;
      confidenceLabel: string;
      categories: {
        'Emotional Support': string;
        'Practical Help': string;
        'Rest & Recovery': string;
        'Small Surprise': string;
        'Quality Time': string;
      };
      confidenceLevels: {
        Moderate: string;
        Low: string;
        'Preference-Based': string;
      };
      notRelevantBtn: string;
      moreLikeThisBtn: string;
      notRelevantToast: string;
      moreLikeThisToast: string;
      feedbackNote: string;
      feedbackWeightedBadge: string;
      likedBadge: string;
      emptyAfterFilterTitle: string;
      emptyAfterFilterBody: string;
      dismissBtn: string;
      dismissToast: string;
      recipientLearningNote: string;
      maturityLabels: {
        Initial: string;
        Developing: string;
        Established: string;
      };
      requiresMoneyTag: string;
      communicationStyles: {
        'Short Text': string;
        'Voice Message': string;
        'Practical Action': string;
        'Shared Activity': string;
        Surprise: string;
      };
      effortLevels: {
        Low: string;
        Medium: string;
        High: string;
      };
    };
    tabSuggestions: string;
    tabDatePlanning: string;
    skipBtn: string;
    skippedToast: string;
    senderVsReceiverNote: string;
    datePlanning: {
      headerTitle: string;
      headerSubtitle: string;
      simulatedScheduleNotice: string;
      normalModeNotice: string;
      partnerEnergyBannerTemplate: string;
      partnerHighEnergyBannerTemplate: string;
      partnerPrivateEnergyBanner: string;
      allCategories: string;
      categories: Record<
        | 'Outdoor Activities'
        | 'Movie Nights'
        | 'Restaurant Dates'
        | 'Weekend Trips'
        | 'Shared Hobbies'
        | 'Relaxing Time at Home',
        string
      >;
      energyFitLabels: Record<'low_pressure' | 'balanced' | 'active', string>;
      budgetLabels: Record<'free_or_low' | 'moderate', string>;
      likeBtn: string;
      likedBtn: string;
      skipBtn: string;
      skippedBtn: string;
      invitePartnerBtn: string;
      invitedBadge: string;
      incomingInviteTitle: string;
      acceptInviteBtn: string;
      declineInviteBtn: string;
      markAgreedBtn: string;
      statusLabels: Record<'none' | 'invited' | 'accepted' | 'declined' | 'agreed', string>;
      plans: Record<string, { title: string; desc: string }>;
    };
    membershipLock: {
      aiUsageFreeBadge: string;
      aiUsagePremiumBadge: string;
      aiLimitReachedBadge: string;
      aiLimitReachedTitle: string;
      aiLimitReachedDesc: string;
      aiLimitBenefits: string[];
      basicActivityTitle: string;
      basicActivitySubtitle: string;
      datePlanLockedBadge: string;
      datePlanLockedTitle: string;
      datePlanLockedDesc: string;
      datePlanLockedBenefits: string[];
      upgradeCta: string;
      backToSuggestions: string;
      backToPresets: string;
    };
  };
  notifications: {
    title: string;
    subtitle: string;
    receivedTab: string;
    sentTab: string;
    newCountSuffix: string;
    emptyReceivedTitle: string;
    emptyReceivedBody: string;
    emptySentTitle: string;
    emptySentBody: string;
    exploreAiCare: string;
    relatedSuggestion: string;
    markAsReceived: string;
    markAsCompleted: string;
    statuses: Record<NotificationStatus, string>;
    todayPrefix: string;
    yesterdayPrefix: string;
    statusUpdateLabel: string;
    statusUpdateConfirmedBody: string;
    statusUpdateUpdatedBody: string;
    statusUpdatePrivateBody: string;
    viewOnHomeBtn: string;
    respondWithCareBtn: string;
    feedbackPrompt: string;
    feedbackHelpful: string;
    feedbackMoreLikeThis: string;
    feedbackNotRelevant: string;
    feedbackRecordedNote: string;
    feedbackSelectedBadge: string;
    tabNotifications: string;
    tabCareMoments: string;
    feedbackNotHelpful: string;
    feedbackNotSuitable: string;
    quietHoursActiveBanner: string;
    suppressedQuietLabel: string;
    suppressedFrequencyLabel: string;
    neutralPreviewStatusBody: string;
    neutralPreviewCareTitle: string;
    neutralPreviewCareBody: string;
    careMomentsTitle: string;
    careMomentsSubtitle: string;
    careMomentsEmptyTitle: string;
    careMomentsEmptyBody: string;
    careMomentAddNotePlaceholder: string;
    careMomentSaveNoteBtn: string;
    careMomentSharedBadge: string;
    careMomentPrivateBadge: string;
    careMomentToggleShare: string;
    membershipLock: {
      recentWindowBadge: string;
      fullHistoryBadge: string;
      lockedArchiveBadge: string;
      lockedArchiveTitle: string;
      lockedArchiveDesc: string;
      lockedArchiveBenefits: string[];
      upgradeCta: string;
      backToNotifications: string;
    };
  };
  surpriseCare: {
    sendAsSurpriseBtn: string;
    preparedSectionTitle: string;
    preparedSectionSubtitle: string;
    normalPreparedSubtitle: string;
    normalUnpairedHint: string;
    normalLocalSentHint: string;
    editSurpriseBtn: string;
    cancelSurpriseBtn: string;
    demoUnlockNowBtn: string;
    demoUnlockedToast: string;
    createdSentToast: string;
    createdScheduledToast: string;
    updatedToast: string;
    cancelledToast: string;
    categories: Record<
      'personal_touch' | 'thoughtful_gesture' | 'shared_moments',
      { label: string; examples: string; desc: string }
    >;
    noteStyles: Record<'standard' | 'handwritten_note' | 'voice_placeholder', string>;
    voicePlaceholderBadge: string;
    handwrittenBadge: string;
    modal: {
      createTitle: string;
      editTitle: string;
      stepLabel: string;
      step1Title: string;
      step2Title: string;
      step3Title: string;
      sourceIdeaLabel: string;
      whyFitsLabel: string;
      suggestedTimingLabel: string;
      categoryLabel: string;
      noteStyleLabel: string;
      titleInputLabel: string;
      actionInputLabel: string;
      messageInputLabel: string;
      linkDatePlanLabel: string;
      noDatePlanOption: string;
      datePlanHiddenNote: string;
      nonCommercialNotice: string;
      tellNowTitle: string;
      tellNowDesc: string;
      keepSurpriseTitle: string;
      keepSurpriseDesc: string;
      revealTimeLabel: string;
      revealPresets: Record<
        'this_evening' | 'tomorrow_morning' | 'next_pattern_window' | 'demo_quick' | 'custom',
        string
      >;
      customRevealInputLabel: string;
      neutralPreviewTitle: string;
      neutralPreviewHeading: string;
      neutralPreviewBody: string;
      simulatedScheduleNote: string;
      visibilityLabel: string;
      visibilityShared: string;
      visibilityPrivate: string;
      summaryCategory: string;
      summaryTitle: string;
      summaryAction: string;
      summaryMessage: string;
      summaryDelivery: string;
      summaryRevealAt: string;
      summaryImmediate: string;
      summaryVisibility: string;
      summaryLinkedDate: string;
      backBtn: string;
      nextBtn: string;
      confirmSendNowBtn: string;
      confirmScheduleBtn: string;
      confirmEditBtn: string;
    };
    statuses: Record<
      'Draft' | 'Scheduled' | 'Sent' | 'Revealed' | 'Completed' | 'Cancelled',
      string
    >;
    recipient: {
      tellNowCardTitle: string;
      maskedCardTitle: string;
      maskedCardBody: string;
      maskedWaitingHint: string;
      maskedReadyHint: string;
      openSurpriseBtn: string;
      openedBanner: string;
      revealScheduledLabel: string;
      linkedDateTitle: string;
      markCompletedBtn: string;
      completedBadge: string;
      momentsSurpriseBadge: string;
      feedbackPrompt: string;
      feedbackMadeMyDay: string;
      feedbackHelpful: string;
      feedbackNotMyThing: string;
      senderStatusWaiting: string;
      senderStatusSent: string;
      senderStatusRevealed: string;
      senderStatusCompleted: string;
      senderStatusCancelled: string;
      senderOnlyReadonlyHint: string;
    };
  };
  deliveryCare: {
    purchaseBadge: string;
    orderNowBtn: string;
    remindLaterBtn: string;
    notNowBtn: string;
    notNowToast: string;
    reminder: {
      sheetTitle: string;
      sheetSubtitle: string;
      presetInOneHour: string;
      presetLaterToday: string;
      presetTomorrow: string;
      presetCustom: string;
      customDateTimeLabel: string;
      confirmBtn: string;
      scheduledToast: string;
      clientOnlyNote: string;
      dueSectionTitle: string;
      dueSectionSubtitle: string;
      dueBadge: string;
      rescheduleBtn: string;
      dismissBtn: string;
      actNowBtn: string;
      presets: Record<CareReminderPresetKey, string>;
    };
    platform: {
      simulatedBanner: string;
      simulatedDisclaimer: string;
      merchantLabel: string;
      itemSectionTitle: string;
      variantLabel: string;
      quantityLabel: string;
      recipientLabel: string;
      addressLabel: string;
      addressPlaceholder: string;
      addressRequiredHint: string;
      useDemoAddressBtn: string;
      giftNoteLabel: string;
      giftNotePlaceholder: string;
      platformNoteLabel: string;
      platformNotePlaceholder: string;
      priceSummaryTitle: string;
      subtotalLabel: string;
      deliveryFeeLabel: string;
      totalLabel: string;
      privacyNotice: string;
      confirmOrderBtn: string;
      cancelExitBtn: string;
      confirmedBadge: string;
      confirmedTitle: string;
      confirmedSubtitle: string;
      orderNumberLabel: string;
      etaLabel: string;
      returnToAppBtn: string;
    };
    revealChoice: {
      title: string;
      subtitle: string;
      tellNowTitle: string;
      tellNowDesc: string;
      keepSurpriseTitle: string;
      keepSurpriseDesc: string;
      maskedPreviewTitle: string;
      maskedPreviewBody: string;
      confirmBtn: string;
    };
    tracking: {
      sectionTitle: string;
      sectionSubtitle: string;
      demoSimControlsTitle: string;
      etaPrefix: string;
      revealModeTellNow: string;
      revealModeSurprise: string;
      cancelOrderBtn: string;
      cancelledToast: string;
      stageUpdatedToast: string;
      deliveredSurpriseToast: string;
      noAutoCompleteHint: string;
      stages: Record<MockOrderStatus, string>;
      simulateButtons: {
        preparing: string;
        pickedUp: string;
        outForDelivery: string;
        delivered: string;
      };
    };
    recipient: {
      maskedTitle: string;
      maskedBody: string;
      maskedProgressHint: string;
      revealedTitle: string;
      deliveredSurpriseBanner: string;
      orderDetailsLabel: string;
      deliveryProgressLabel: string;
      feedbackPrompt: string;
      feedbackLovedIt: string;
      feedbackThankYou: string;
      feedbackNotPreference: string;
      feedbackSavedNote: string;
      markCompletedBtn: string;
      completedMomentToast: string;
      senderReadonlyNote: string;
    };
  };
  profile: {
    roles: {
      alex: string;
      jamie: string;
    };
    simulatedDemoProfile: string;
    languageSectionTitle: string;
    languageSectionDesc: string;
    languages: Record<LanguageCode, string>;
    coupleSettingsTitle: string;
    partnerName: string;
    demoPairingCode: string;
    connectionStatus: string;
    connectedStatusValue: string;
    dataSharingTitle: string;
    dataSharingDesc: string;
    energySummaryTitle: string;
    energySummaryDesc: string;
    sleepSummaryTitle: string;
    sleepSummaryDesc: string;
    activitySummaryTitle: string;
    activitySummaryDesc: string;
    cycleTitle: string;
    cycleDesc: string;
    sharingFeedbackOn: string;
    sharingFeedbackOff: string;
    carePreferencesTitle: string;
    carePreferencesDesc: string;
    newPreferencePlaceholder: string;
    addButton: string;
    removeTagAria: string;
    presetTags: Record<string, string>;
    membershipTitle: string;
    demoPricingProposal: string;
    freePlanTitle: string;
    freePrice: string;
    perMonth: string;
    freeBenefits: string[];
    premiumPlanTitle: string;
    premiumPrice: string;
    perCoupleMonth: string;
    premiumBenefits: string[];
    pricingProposalNote: string;
    explorePremium: string;
    premiumModalTitle: string;
    premiumModalBody: string;
    premiumModalDisclaimer: string;
    premiumConfirmButton: string;
    premiumConfirmedBanner: string;
    closePreview: string;
    savedLibraryTitle: string;
    savedLibraryDesc: string;
    savedEmptyText: string;
    goToCareBtn: string;
    viewDetailsBtn: string;
    hideDetailsBtn: string;
    removeSavedBtn: string;
    savedOnLabel: string;
    sourceLabels: {
      gemini: string;
      fallback: string;
      preset: string;
    };
    learnedProfileTitle: string;
    learnedProfileDesc: string;
    learningMaturityLabel: string;
    maturityDescriptions: {
      Initial: string;
      Developing: string;
      Established: string;
    };
    feedbackCountsLabel: string;
    preferredCategoriesLabel: string;
    preferredStylesLabel: string;
    noLearnedDataYet: string;
    clearLearnedBtn: string;
    clearLearnedDone: string;
    connectedHealthTitle: string;
    connectedHealthDesc: string;
    platformLabel: string;
    connectionLabel: string;
    permissionLabel: string;
    lastSyncLabel: string;
    statusConnected: string;
    statusDisconnected: string;
    permissionGranted: string;
    permissionNone: string;
    syncNowBtn: string;
    syncedToast: string;
    simulatedHealthNotice: string;
    normalHealthEmptyNote: string;
    heartRateTitle: string;
    heartRateDesc: string;
    hrvTitle: string;
    hrvDesc: string;
    cycleTrackingOptInTitle: string;
    cycleTrackingOptInDesc: string;
    cycleShareTitle: string;
    cycleShareDesc: string;
    notifPrefsTitle: string;
    notifPrefsDesc: string;
    quietHoursToggle: string;
    quietHoursDesc: string;
    quietStartLabel: string;
    quietEndLabel: string;
    allowImportantQuietLabel: string;
    allowImportantQuietDesc: string;
    frequencyLabel: string;
    frequencyOptions: Record<'low' | 'standard' | 'important_only', string>;
    shareStatusNotifsLabel: string;
    shareStatusNotifsDesc: string;
    sensitivePreviewLabel: string;
    sensitivePreviewOptions: Record<'full' | 'neutral', string>;
    reuseCareBtn: string;
    reusedCareToast: string;
    oneCouplePlanBadge: string;
    billingMonthlyLabel: string;
    billingYearlyLabel: string;
    monthlyPrice: string;
    monthlyUnit: string;
    yearlyPrice: string;
    yearlyUnit: string;
    yearlySavingsNote: string;
    premiumActiveBadge: string;
    premiumActiveBothNote: string;
    upgradeCtaBtn: string;
    managePlanNote: string;
    normalPremiumUnavailableNote: string;
    widgetPreviewTitle: string;
    widgetPreviewBadge: string;
    widgetPreviewDesc: string;
    widgetStyles: Record<
      'shared_energy' | 'care_reminder' | 'daily_goal' | 'date_countdown',
      string
    >;
    widgetMockCopy: {
      sharedEnergySub: string;
      careReminderTitle: string;
      careReminderSub: string;
      dailyGoalTitle: string;
      dailyGoalSub: string;
      dateCountdownTitle: string;
      dateCountdownSub: string;
      sensitiveHiddenNote: string;
    };
    membershipUpgrade: {
      subTabMain: string;
      subTabMembership: string;
      backToProfile: string;
      openMembershipPageBtn: string;
      currentStatusLabel: string;
      freeStatusTitle: string;
      freeStatusDesc: string;
      premiumStatusTitle: string;
      premiumStatusDesc: string;
      purchasedByTemplate: string;
      welcomeBanner: string;
      illustrativePricingLabel: string;
      comparisonTitle: string;
      comparisonSubtitle: string;
      colFeature: string;
      colFree: string;
      colPremium: string;
      accessBadges: Record<'free_included' | 'premium_enhanced' | 'premium_exclusive', string>;
      matrixRows: Record<
        | 'pairing'
        | 'daily_checkin'
        | 'privacy_controls'
        | 'weekly_recharge'
        | 'energy_trends'
        | 'ai_care'
        | 'feedback_learning'
        | 'care_history'
        | 'date_planning'
        | 'multidimensional_insights'
        | 'notifications_custom'
        | 'couple_widgets',
        { label: string; free: string; premium: string }
      >;
      selectPlanBtn: string;
      selectedPlanBtn: string;
      reviewModalTitle: string;
      reviewPlanLabel: string;
      reviewBillingLabel: string;
      reviewPriceLabel: string;
      reviewSharedLabel: string;
      reviewSharedValue: string;
      reviewNoPaymentNote: string;
      confirmPurchaseBtn: string;
      unpairedGuardTitle: string;
      unpairedGuardBody: string;
      unpairedGuardLinkBtn: string;
      normalModePrototypeNote: string;
      widgetLockedBadge: string;
      widgetLockedTitle: string;
      widgetLockedDesc: string;
      widgetLockedBenefits: string[];
      notifAdvancedLockedBadge: string;
      notifAdvancedLockedTitle: string;
      notifAdvancedLockedDesc: string;
      learnedAdvancedLockedNote: string;
      upgradeCta: string;
    };
  };
  activityTemplates: {
    sentCare: string;
    savedCare: string;
    completedCare: string;
    confirmedStatus: string;
    weeklyRecharge: string;
    dateInvite: string;
    dateAgreed: string;
    surpriseScheduled: string;
    surpriseSent: string;
    surpriseRevealed: string;
    surpriseCompleted: string;
    orderPlacedRevealed: string;
    orderSecretPrepared: string;
    orderProgress: string;
    orderDelivered: string;
    seedSupportive: string;
    seedSavedEvening: string;
  };
  calendar: {
    weekdaysShort: string[];
    weekdaysFull: string[];
    monthsShort: string[];
    monthsFull: string[];
  };
  welcome: {
    headline: string;
    subtitle: string;
    startJourney: string;
    exploreDemo: string;
    demoFootnote: string;
    returnToWelcome: string;
    enterDemoMode: string;
    exitDemoMode: string;
    personalModeBadge: string;
    resumePersonalApp: string;
    loadingPresentationDemo: string;
  };
  onboarding: {
    stepCounter: string;
    back: string;
    continue: string;
    skipForNow: string;
    completeSetup: string;
    localSetupTag: string;
    step1: {
      title: string;
      subtitle: string;
      nicknameLabel: string;
      nicknamePlaceholder: string;
      nicknameRequiredError: string;
      avatarLabel: string;
      avatarOptions: Record<OnboardingAvatarId, string>;
      languageLabel: string;
    };
    step2: {
      title: string;
      subtitle: string;
      optionCreate: string;
      optionJoin: string;
      optionLater: string;
      createDesc: string;
      inviteCodeLabel: string;
      copyCode: string;
      copiedCode: string;
      partnerJoinedButton: string;
      partnerJoinedConfirmed: string;
      joinDesc: string;
      joinCodeLabel: string;
      joinCodePlaceholder: string;
      verifyCodeButton: string;
      invalidCodeError: string;
      pairingSuccessBanner: string;
      laterTitle: string;
      laterDesc: string;
      laterConfirmedBanner: string;
      pairingRequiredError: string;
      localSimulationNote: string;
    };
    step3: {
      title: string;
      subtitle: string;
      offByDefaultNote: string;
      privacyFootnote: string;
      cycleFutureBadge: string;
    };
    step4: {
      title: string;
      subtitle: string;
      preferredCareTitle: string;
      avoidTitle: string;
      communicationTitle: string;
      preferredCareOptions: Record<PreferredCareTagKey, string>;
      avoidOptions: Record<AvoidTagKey, string>;
      communicationOptions: Record<CommunicationStyleKey, string>;
    };
    step5: {
      title: string;
      subtitle: string;
      startBaselineTitle: string;
      startBaselineBody: string;
      day1Badge: string;
      zeroHistoryBadge: string;
      firstInsightBadge: string;
      futureIntegrationsNote: string;
      noHealthClaimNote: string;
      completeBaselineCta: string;
    };
  };
  normalMode: {
    greetingTemplate: string;
    partnerDisplayName: string;
    personalRoleLabel: string;
    dayBadgeTemplate: string;
    baselineBuildingBadge: string;
    earlyBaselineBadge: string;
    baselineStartingTitle: string;
    baselineStartingBody: string;
    firstInsightTimingNote: string;
    recordedDaysProgress: string;
    checkInSavesBaselineNote: string;
    noEnergyIndexYet: string;
    avgSelfReportedLabel: string;
    notEnteredYet: string;
    invitePartnerTitle: string;
    invitePartnerBody: string;
    invitePartnerCta: string;
    waitingForPartnerTitle: string;
    waitingForPartnerCheckInBody: string;
    pairedStatusValue: string;
    unpairedStatusValue: string;
    pairLaterActionHint: string;
    simulatePartnerJoinNow: string;
    noCareActivityYet: string;
    insightPreviewBuilding: string;
    insightPreviewEarly: string;
    insightsBuildingTitle: string;
    insightsBuildingBody: string;
    observedSoFarTitle: string;
    observedSoFarEmpty: string;
    selfReportedScaleNote: string;
    earlyInsightBadge: string;
    earlyInsightTitle: string;
    earlyInsightSubtitle: string;
    avgScoreLabel: string;
    scoreRangeLabel: string;
    dayTransitionsLabel: string;
    mostCommonFeelingLabel: string;
    variationNotes: {
      steady: string;
      fluctuating: string;
      low_reserve: string;
    };
    weeklyPatternTitle: string;
    notEnoughWeekdayRepeats: string;
    weeklyPatternRequirementNote: string;
    preliminaryWeeklyPatternBadge: string;
    preliminaryWeeklyPatternBody: string;
    futureEstimatesInactiveTitle: string;
    futureEstimatesInactiveBody: string;
    careColdStartTitle: string;
    careColdStartBody: string;
    careSourcePreferenceBadge: string;
    careSourceEarlyBaselineBadge: string;
    carePartnerNotPairedNote: string;
    careLocalSentNote: string;
    careSuggestions: Record<
      string,
      {
        title: string;
        description: string;
        reason: string;
        timing: string;
        defaultMessage: string;
      }
    >;
    careContextWindowBuilding: string;
    careContextWindowEarly: string;
    notificationsOutgoingOnlyNote: string;
    modeAndDemoTitle: string;
    modeAndDemoDesc: string;
    enterPresentationDemo: string;
    returnToWelcomeBtn: string;
    resetOnboardingBtn: string;
    resetOnboardingTitle: string;
    resetOnboardingBody: string;
    confirmResetOnboarding: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    meta: {
      presentationSubtitle: 'AI-Powered Couple Care Companion · Interactive Dual-Device Prototype',
      partnerALabel: 'PARTNER A',
      partnerBLabel: 'PARTNER B',
      activePhone: 'Active Phone',
      resetDemo: 'Reset Demo',
      resetConfirmTitle: 'Reset Demo Interactions?',
      resetConfirmBody:
        'This will clear newly sent care messages, reset notification statuses, clear saved suggestions, and restore default check-in and sharing preferences.',
      resetConfirmNote: 'Your current language selection will be preserved.',
      cancel: 'Cancel',
      confirmReset: 'Reset Demo',
      simulatedDemoData: 'Simulated Demo Data',
      todayDateLabel: 'Friday, 13 Nov 2026',
    },
    nav: {
      home: 'Home',
      insights: 'Insights',
      care: 'Care',
      profile: 'Profile',
      notificationsAria: 'Notifications',
    },
    greetings: {
      alex: 'Good morning, Alex',
      jamie: 'Good morning, Jamie',
    },
    energyStates: {
      steady: 'Steady',
      moderate: 'Moderate',
      low: 'Low',
    },
    home: {
      connectedWith: 'Connected with {partner}',
      myEnergy: 'My Energy',
      partnerSharedEnergy: "{partner}'s Shared Energy",
      estimatedEnergyIndex: 'Estimated Energy Index',
      personalSpaceTag: 'Private',
      sharedSpaceTag: 'Shared',
      sharingPaused: 'Sharing paused',
      sharingPausedNote: '{partner} turned off Energy Summary sharing in Profile.',
      todaysSummary: "Today's Summary",
      personalView: 'Personal view',
      sleepDuration: 'Sleep duration',
      sleepQuality: 'Sleep quality',
      activity: 'Activity',
      selfReported: 'Self-reported',
      pendingCheckIn: 'Pending check-in',
      hoursUnit: 'hours',
      minutesUnit: 'minutes',
      partnerSharedContext: "{partner}'s Shared Context",
      privacyControlled: 'Privacy controlled',
      partnerEnergyHiddenNotice:
        '{partner} has paused sharing their Energy Summary. Only explicitly authorized summaries are displayed.',
      partnerDefaultPrivacyNotice:
        "Showing shared energy summary only. Detailed sleep and activity data stay private on {partner}'s phone unless explicitly authorized.",
      sleepLabel: 'Sleep',
      activityLabel: 'Activity',
      dailyCheckIn: 'Daily Check-in',
      howAreYouFeeling: 'How are you feeling?',
      checkInOptions: {
        good: { label: 'Feeling Good', hint: 'Steady & capable' },
        tired: { label: 'A Bit Tired', hint: 'Need gentle pace' },
        rest: { label: 'Need Rest', hint: 'Low reserve today' },
      },
      checkInConfirmed: "Today's self-reported status updated to {status} ({time}).",
      checkInPreservedNote: '{count} historical records preserved (manual check-in, non-wearable).',
      aiInsightPreview: 'AI Insight Preview',
      insightPreviewPartnerDip: '{partner} has shown a recurring lower-energy pattern on {weekday}.',
      insightPreviewSelfDip: 'You have shown a recurring lower-energy pattern on {weekday}.',
      insightPreviewPartnerSteady:
        '{partner} has maintained steady energy across recorded weekdays.',
      insightPreviewSelfSteady: 'Your energy has remained steady across recorded weekdays.',
      viewInsights: 'View Insights',
      recentCareActivity: 'Recent Care Activity',
      openCare: 'Open Care',
      draftStatusBadge: 'Draft (not confirmed)',
      confirmedStatusBadge: 'Confirmed',
      updatedStatusBadge: 'Updated',
      confirmTodayStatusBtn: "Confirm Today's Status",
      updateConfirmedStatusBtn: 'Update Confirmed Status',
      draftNotSharedHint: 'Selected locally — tap Confirm to save and update.',
      localOnlyStatusNote: 'Confirmed locally on this device (no remote cross-device sync in prototype).',
      partnerStatusUpdatedBanner: "{partner}'s daily status has been updated",
      latestConfirmedStatusLabel: 'Latest confirmed status',
      predictedBaselineLabel: 'Historical estimate',
      respondWithCareBtn: 'Respond with Care',
      partnerStatusPrivateNotice:
        "{partner} confirmed today's check-in, but status details stay private.",
      rhrShortLabel: 'Resting HR',
      hrvShortLabel: 'HRV',
      cyclePhaseLabel: 'Cycle phase',
      stepsShortLabel: 'Steps',
      weeklyRechargeCardTitle: 'Weekly Couple Recharge',
      weeklyRechargeBadgeDone: 'Completed',
      weeklyRechargeBadgeSkipped: 'Skipped',
      weeklyRechargeBadgeNew: 'This week',
      weeklyRechargePromptDesc:
        'Reflect on what care felt most supportive this week and what you wish for next week — or keep it private.',
      weeklyRechargeOpenBtn: 'Complete Check-in',
      weeklyRechargeEditBtn: 'Edit Response',
      weeklyRechargeSkipBtn: 'Skip This Week',
      weeklyRechargeModalTitle: 'Weekly Couple Recharge',
      weeklyRechargeQ1: 'What kind of care made you feel most supported this week?',
      weeklyRechargeQ1Options: {
        emotional_support: 'Emotional reassurance & gentle words',
        practical_help: 'Practical everyday help',
        rest_recovery: 'Quiet rest & breathing room',
        quality_time: 'Unhurried quality time together',
      },
      weeklyRechargeQ2: 'What would you like more of next week?',
      weeklyRechargeQ2Options: {
        more_quiet_time: 'More quiet wind-down evenings',
        more_light_help: 'More light practical support',
        more_gentle_checkins: 'More no-pressure check-ins',
        more_shared_outings: 'More relaxed shared outings',
      },
      weeklyRechargeCommentLabel: 'Optional note (kept private unless shared)',
      weeklyRechargeCommentPlaceholder: 'Add a short reflection for this week...',
      weeklyRechargeShareLabel: 'Share with partner',
      weeklyRechargeShareDesc:
        'When ON, your partner can see your reflection in Care insights. When OFF, it stays strictly private.',
      weeklyRechargeSaveBtn: 'Save Reflection',
      weeklyRechargePrivateTag: 'Private (not shared)',
      weeklyRechargeSharedTag: 'Shared with partner',
      weeklyRechargePartnerTitle: "{partner}'s Weekly Recharge",
      weeklyRechargePartnerNote: 'Shared by {partner} to guide thoughtful care next week.',
      weeklyRechargeNormalNote:
        'Saved locally on your device. Partner reflection stays hidden until real remote sync is connected.',
    },
    insights: {
      title: 'AI Insights',
      subtitle: 'Understand patterns. Anticipate tomorrow.',
      myPatternTab: 'My Pattern ({name})',
      partnerSharedTab: '{name} (Shared)',
      sharedInsightsPausedTitle: 'Shared Insights Paused',
      sharedInsightsPausedBody:
        '{name} has paused sharing their Energy Summary in Profile settings.',
      historicalTrendTitle: 'Historical Energy Trend',
      last60Days: 'Last 60 days',
      dateRangeTapHintTemplate: '{range} · Tap any day to inspect',
      weekdayDipTagTemplate: '{weekday} dip',
      restReminderAnnotationTemplate: 'A Little More Rest on {weekday}',
      historicalBadge: 'Observed',
      forecastBadge: 'Estimated',
      indexLabel: 'Index',
      sleepShortLabel: 'Sleep',
      sleepPrivateLabel: 'Private',
      legendDailyEnergy: 'Daily Energy Index',
      legendObservedWeekdayTemplate: 'Observed {weekday} ({count})',
      patternDetectionPrefix: 'Pattern Detection · {name}',
      noPatternTitle: 'No significant recurring low-energy weekday pattern detected.',
      noPatternNoteTemplate:
        'Energy remains steady across weekdays based on {count} days of simulated historical records.',
      overallAvgLabelTemplate: 'Overall average energy ({count}d)',
      recent7DayAvgLabel: 'Recent 7-day average',
      belowBaselineLabel: 'Records below personal average',
      belowBaselineValueTemplate: '{count} ({pct}%)',
      weekdayPatternTitleTemplate: 'Recurring {weekday} Energy Dip Detected',
      weekdayPatternNoteTemplate:
        'Derived from {count} days of simulated records ({pct}% of {weekday} entries ≥8 pts below average across {weeks} weeks).',
      overallAvgEnergy: 'Overall average energy',
      weekdayAvgEnergyTemplate: '{weekday} average energy',
      weekdayObservationsTemplate: '{weekday} observations',
      prevDayAvgSleep: 'Prev-day avg sleep',
      future7DayTitle: 'Future 7-Day Estimate',
      estimatedIndexColon: 'Estimated Energy Index:',
      confidenceColon: 'Confidence:',
      confidenceLevels: {
        Moderate: 'Moderate',
        Low: 'Low',
        'Insufficient Data': 'Insufficient Data',
      },
      insufficientDataTitle: 'Insufficient Data for Estimate',
      insufficientDataBody:
        'Not enough historical records exist yet to calculate a meaningful pattern-based estimate for this day.',
      insufficientDataShort: 'Insufficient Data',
      forecastFooterLabel: 'Pattern-based estimate — demo data',
      whyIdentifiedTitle: 'Why did the system identify this pattern?',
      observedHistoricalTitle: 'Observed historical data',
      estimatedFutureTitle: 'Estimated future values',
      evidenceSteadyObserved: [
        '{count} days of simulated energy entries show a steady range between {min} and {max} (mean {mean}, recent 7-day average {recent7}).',
        'Previous-night sleep averaged {sleep} hours across recorded weekdays, with {belowCount} entries ({belowPct}%) below the personal baseline.',
      ],
      evidenceSteadyObservedNoSleep: [
        '{count} days of simulated energy entries show a steady range between {min} and {max} (mean {mean}, recent 7-day average {recent7}).',
        '{belowCount} entries ({belowPct}%) fell below the personal baseline. Detailed sleep values remain hidden unless Sleep Summary sharing is enabled.',
      ],
      evidenceSteadyEstimated: [
        'Next 7 days remain in a {minForecast}–{maxForecast} range computed from weekday historical averages (75%) and the recent 7-day average ({recent7}, 25%).',
        'Estimates reflect recent routine stability rather than guaranteed outcomes.',
      ],
      evidencePatternObserved: [
        'Across {count} observed {weekday}s ({weeks} distinct weeks), recorded energy averaged {weekdayMean} compared to an overall {totalDays}-day average of {overallMean} ({belowPct}% ≥8 pts below baseline).',
        'Previous-night sleep preceding those {weekday}s averaged {prevSleep} hours, roughly {sleepDiff} hours shorter than other weeknights.',
      ],
      evidencePatternSleepPrivate:
        "{name}'s sleep details remain private until Sleep Summary sharing is enabled in Profile.",
      evidencePatternSleepUnavailable:
        'Not enough valid previous-night sleep records were available to compare sleep duration before {weekday}s.',
      evidencePatternEstimated: [
        '{date} is estimated at {score} / 100 ({confidence} confidence) from 75% historical {weekday} mean ({weekdayMean}) and 25% recent 7-day average ({recent7}).',
        'This forecast is a pattern-based estimate to help plan lighter routines — not a guaranteed outcome or medical assessment.',
      ],
      evidenceInsufficientEstimated: [
        'Insufficient historical data is available for {weekday} to generate a reliable pattern-based estimate.',
      ],
      viewCareSuggestions: 'View Care Suggestions',
      sectionTodayOverview: 'Today Overview',
      sectionSleepPatterns: 'Sleep Patterns',
      sectionHrvTrends: 'HRV Trends',
      sectionRhrTrends: 'Resting Heart Rate',
      sectionActivityPatterns: 'Activity Patterns',
      personalBaselineLabel: 'Personal baseline',
      latestReadingLabel: 'Latest reading',
      deviationLabel: 'vs baseline',
      sleepStagesTitle: 'Sleep Stage Breakdown',
      sleepStagesAvgNote: '60-day avg · latest night',
      stageDeep: 'Deep',
      stageRem: 'REM',
      stageLight: 'Light',
      stageAwake: 'Awake',
      hrvMetricNoteTemplate: 'Metric: {metric} · Personal baseline only (never compared across partners)',
      rhrUnit: 'bpm',
      hrvUnit: 'ms',
      stepsLabel: 'Daily steps',
      steps7dAvgLabel: '7-day avg steps',
      intensityLabel: 'Intensity',
      intensityLevels: {
        Low: 'Light',
        Moderate: 'Moderate',
        Vigorous: 'Vigorous',
      },
      weeklyActivityTitle: 'Activity by Weekday',
      missingDaysNoteTemplate: '{valid} of {total} days recorded · Missing days left blank',
      metricUnavailable: 'Unavailable',
      metricPrivateTemplate: '{name} keeps this metric private.',
      metricEnableHint: 'Enable sharing in Profile to view together.',
      cycleOptInNoteTemplate: 'Optional recorded cycle phase: {phase} (Day {day}) · Simulated opt-in',
      nonDiagnosticBanner:
        'Wellness trend summary only — not a medical diagnosis or emotional inference.',
      freeTierInsightsBanner:
        'Free Plan: Basic overview · Upgrade to Couple Premium for deeper multi-metric trends.',
      premiumTierInsightsBanner:
        'Couple Premium Active · Full multi-metric history unlocked for both partners',
      last30DaysFree: 'Last 30 days (Free)',
      membershipLock: {
        freeTrendBanner:
          'Free includes a 30-day energy trend. Couple Premium unlocks the full 60-day history & recurring pattern timeline.',
        unlock60DayBtn: 'Unlock 60-Day History',
        advancedBadge: 'Couple Premium · Multi-Dimensional Insights',
        advancedTitle: 'Sleep Stages, HRV, Resting Heart Rate & Pattern Evidence',
        advancedDesc:
          'Explore multi-dimensional recovery metrics, personal HRV/RHR baselines, weekly activity breakdowns, and deeper statistical evidence — strictly respecting sharing toggles.',
        advancedBenefits: [
          '60-day extended energy trends & weekly breakdown',
          'Sleep architecture stages (Deep / REM / Light / Awake)',
          'HRV (SDNN / RMSSD separated) & resting heart rate personal baselines',
          'Expanded observed & forecast statistical evidence',
        ],
        teaserPrivacyNote:
          'All deeper metrics still honor individual privacy & data-sharing toggles.',
        upgradeCta: 'Upgrade to Premium',
        returnHomeBtn: 'Back to Home',
        basicForecastBadge: 'Basic 7d estimate (Free)',
      },
    },
    care: {
      title: 'AI Care',
      subtitle: 'Small actions. Thoughtful moments.',
      defaultRecipient: 'Default Recipient',
      predictedWindowLabel: 'Predicted window:',
      reasonLabel: 'Reason:',
      patternWindowTemplate: '{date} · Afternoon & Evening',
      patternReasonTemplate:
        'Recurring {weekday} energy dip pattern detected (estimated {score} / 100), often following shorter prior-night sleep ({prevSleep}h avg).',
      patternReasonNoSleepTemplate:
        'Recurring {weekday} energy dip pattern detected (estimated {score} / 100 based on historical energy records; sleep details stay private).',
      steadyWindowLabel: 'This Evening · 6:30 PM – 9:00 PM',
      steadyReasonTemplate:
        'Steady weekly energy observed (overall avg {overallMean}, recent 7d {recent7}) — a calm shared ritual supports evening wind-down and mutual connection.',
      sharingPausedWindow: 'Shared summary paused',
      sharingPausedReasonTemplate:
        '{name} has paused sharing their Energy Summary. Suggestions below rely on saved care preferences.',
      personalizedSuggestionsTitle: 'Personalized Care Suggestions',
      forRecipient: 'For {name}',
      whyThisFits: 'Why this fits:',
      suggestedTiming: 'Suggested timing:',
      nonPurchaseTag: 'Non-purchase care',
      homeGestureTag: 'Thoughtful gesture',
      editMessage: 'Customize note',
      hideMessageEditor: 'Use default note',
      customMessageLabel: 'Care message to {name}',
      sendCare: 'Send Care',
      saveSuggestion: 'Save Suggestion',
      saved: 'Saved',
      viewNotifications: 'View Sent',
      sentToastTitle: 'Care sent to {name}',
      savedToastText: 'Saved "{title}" to your care list.',
      alreadySavedText: '"{title}" is already in your saved suggestions.',
      respondingToStatusTitle: "Responding to {name}'s confirmed status",
      respondingToStatusClear: 'Clear focus',
      suggestions: {
        'care-jamie-warm-drink': {
          title: 'Prepare a Warm Drink',
          description: 'Offer Jamie a warm milk tea.',
          reason: "Matches Jamie's explicitly stated preference for warm milk tea.",
          timing: 'Thursday, 19 Nov · 4:00 PM',
          defaultMessage:
            'Thinking of your busy Thursday — would you like a warm milk tea waiting when you wrap up?',
        },
        'care-jamie-quiet-evening': {
          title: 'Plan a Quiet Evening',
          description: 'Suggest a relaxing dinner or quiet time at home.',
          reason: "Matches Jamie's preference for calm activities and a light dinner without crowds.",
          timing: 'Thursday, 19 Nov · 7:00 PM',
          defaultMessage:
            "Let's keep Thursday evening completely low-key — light dinner at home and zero errands.",
        },
        'care-jamie-gentle-checkin': {
          title: 'Send a Gentle Check-in',
          description: 'Share a short, supportive message with no pressure to reply quickly.',
          reason: "A non-purchase care option aligned with Jamie's preference for gentle check-ins.",
          timing: 'Thursday, 19 Nov · Midday',
          defaultMessage:
            'I thought you might appreciate a relaxing evening. Take it easy today!',
        },
        'care-alex-evening-walk': {
          title: 'Invite for an Evening Walk',
          description: 'Suggest an unhurried 20-minute walk around the neighborhood.',
          reason: "Matches Alex's preference for relaxed evening walks.",
          timing: 'This Evening · 6:30 PM',
          defaultMessage:
            'Want to take a slow evening walk together after dinner for some fresh air?',
        },
        'care-alex-fruit-tea': {
          title: 'Brew Warm Fruit Tea',
          description: 'Prepare a pot of fruit tea to unwind together.',
          reason: "Matches Alex's explicitly stated preference for fruit tea.",
          timing: 'Tonight · 8:30 PM',
          defaultMessage: 'Making a pot of fruit tea later tonight — saving a cup for you.',
        },
        'care-alex-supportive-note': {
          title: 'Send a Short Note',
          description: 'Share a brief, warm thank-you message.',
          reason: "A non-purchase care option matching Alex's preference for short supportive messages.",
          timing: 'Anytime Today',
          defaultMessage: "Appreciate how steady and thoughtful you've been this week. Thank you!",
        },
        'care-jamie-order-milk-tea': {
          title: 'Order a Cup of Warm Milk Tea',
          description: 'Send Jamie a warm roasted milk tea delivery for an effortless afternoon lift.',
          reason: "Matches Jamie's love for warm milk tea when mid-afternoon energy dips.",
          timing: 'Thursday, 19 Nov · 3:30 PM',
          defaultMessage: 'Sent a warm milk tea your way for your afternoon break — take a calm sip!',
        },
        'care-alex-order-dessert': {
          title: 'Order a Light Evening Dessert',
          description: 'Send Alex a light artisanal pastry box for after dinner.',
          reason: 'An optional treat order to share a cozy sweet finish to the day.',
          timing: 'Tonight · 7:30 PM',
          defaultMessage: 'Ordered a small light pastry treat for tonight — enjoy!',
        },
      },
      aiEngine: {
        panelTitle: 'Gemini Personalized Care Engine',
        panelSubtitle: 'Context-aware suggestions built strictly from authorized preferences and patterns.',
        generateBtn: 'Generate New Suggestions',
        regenerateBtn: 'Generate New Suggestions',
        generatingLabel: 'Generating thoughtful care ideas...',
        initialPromptTitle: 'Ready for tailored care ideas',
        initialPromptBody:
          'Generate fresh, non-commercial care ideas shaped by authorized energy context, saved preferences, and explicit recipient feedback.',
        initialGenerateCta: 'Generate New Suggestions',
        sourceGeminiBadge: 'Gemini AI',
        sourceFallbackBadge: 'Local Fallback Engine',
        fallbackNoticePrefix: 'Fallback active:',
        fallbackReasons: {
          missing_api_key:
            'Server Gemini secret is not configured in this environment, so deterministic local suggestions are shown.',
          api_error:
            'Gemini returned a temporary service error, so deterministic local suggestions are shown.',
          network_error:
            'Could not reach the backend AI endpoint, so deterministic local suggestions are shown.',
          timeout:
            'The AI request timed out, so deterministic local suggestions are shown.',
          invalid_response:
            'The AI response did not match the safety schema, so deterministic local suggestions are shown.',
        },
        evidenceTitle: 'Context & Evidence Used',
        limitationsTitle: 'Responsible Interpretation & Limits',
        whyLabel: 'Why:',
        whatLabel: 'What to do:',
        whenLabel: 'When:',
        personalizationLabel: 'Personalization:',
        confidenceLabel: 'Confidence:',
        categories: {
          'Emotional Support': 'Emotional Support',
          'Practical Help': 'Practical Help',
          'Rest & Recovery': 'Rest & Recovery',
          'Small Surprise': 'Small Surprise',
          'Quality Time': 'Quality Time',
        },
        confidenceLevels: {
          Moderate: 'Moderate',
          Low: 'Low',
          'Preference-Based': 'Preference-Based',
        },
        notRelevantBtn: 'Not Relevant',
        moreLikeThisBtn: 'More Like This',
        notRelevantToast: 'Noted — "{title}" hidden and future suggestions adjusted.',
        moreLikeThisToast: 'Boosted "{category}" ideas in future suggestions.',
        feedbackNote:
          'Recommendations adapt only to explicit recipient feedback on received care (without retraining the underlying model).',
        feedbackWeightedBadge: 'Feedback-guided ({count})',
        likedBadge: 'Preferred style',
        emptyAfterFilterTitle: 'All current suggestions hidden',
        emptyAfterFilterBody:
          'Generate new suggestions to see fresh ideas.',
        dismissBtn: 'Hide suggestion',
        dismissToast: 'Hidden "{title}" from this view.',
        recipientLearningNote:
          "Learning stage for {name}'s received-care preferences: {stage}.",
        maturityLabels: {
          Initial: 'Initial (<3 ratings)',
          Developing: 'Developing (3–5 ratings)',
          Established: 'Established (6+ ratings)',
        },
        requiresMoneyTag: 'May involve cost',
        communicationStyles: {
          'Short Text': 'Short Text',
          'Voice Message': 'Voice Message',
          'Practical Action': 'Practical Action',
          'Shared Activity': 'Shared Activity',
          Surprise: 'Surprise',
        },
        effortLevels: {
          Low: 'Low effort',
          Medium: 'Medium effort',
          High: 'High effort',
        },
      },
      tabSuggestions: 'Care Suggestions',
      tabDatePlanning: 'Date Planning',
      skipBtn: 'Skip',
      skippedToast: 'Skipped "{title}" — recorded only for sender view, never alters {name}\'s preferences.',
      senderVsReceiverNote:
        "Sender actions (Send, Save, Skip) never modify your partner's learned care preferences.",
      datePlanning: {
        headerTitle: 'Couple Date Planning',
        headerSubtitle: 'Mood-aware couple date ideas shaped by permitted energy and avoid tags.',
        simulatedScheduleNotice:
          'Simulated free-time windows for demo — no external Google or Apple Calendar connected.',
        normalModeNotice:
          'Personal prototype mode — date ideas use your preferences and simulated windows without live partner calendar sync.',
        partnerEnergyBannerTemplate:
          "{partner}'s permitted energy: {score} / 100 · Prioritizing low-pressure options",
        partnerHighEnergyBannerTemplate:
          "{partner}'s permitted energy: {score} / 100 · Balanced options including calm time at home",
        partnerPrivateEnergyBanner:
          'Partner energy is private — showing balanced low-pressure & shared date options.',
        allCategories: 'All',
        categories: {
          'Outdoor Activities': 'Outdoor Activities',
          'Movie Nights': 'Movie Nights',
          'Restaurant Dates': 'Restaurant Dates',
          'Weekend Trips': 'Weekend Trips',
          'Shared Hobbies': 'Shared Hobbies',
          'Relaxing Time at Home': 'Relaxing Time at Home',
        },
        energyFitLabels: {
          low_pressure: 'Low pressure',
          balanced: 'Balanced pace',
          active: 'Active outing',
        },
        budgetLabels: {
          free_or_low: 'Free / low cost',
          moderate: 'Moderate budget',
        },
        likeBtn: 'Like',
        likedBtn: 'Liked',
        skipBtn: 'Pass',
        skippedBtn: 'Passed',
        invitePartnerBtn: 'Invite Partner',
        invitedBadge: 'Invite sent',
        incomingInviteTitle: 'Date Invitation from {partner}',
        acceptInviteBtn: 'Accept',
        declineInviteBtn: 'Decline',
        markAgreedBtn: 'Mark Date Agreed',
        statusLabels: {
          none: 'Idea',
          invited: 'Invited',
          accepted: 'Accepted',
          declined: 'Declined',
          agreed: 'Date Agreed',
        },
        plans: {
          homeTeaSession: {
            title: 'Warm Tea & Vinyl Listening at Home',
            desc: 'Unwind together with hot tea and gentle music — zero travel required.',
          },
          cozyMovieNight: {
            title: 'Cozy Home Movie Night',
            desc: 'Pick a comfort film and blankets for a zero-pressure evening in.',
          },
          harborEveningWalk: {
            title: 'Golden-Hour Waterfront Stroll',
            desc: 'An unhurried 45-minute walk in open air at an easy pace.',
          },
          sharedSlowCooking: {
            title: 'Weekend Slow Brunch & Sketching',
            desc: 'Cook a simple recipe or do a relaxed creative hobby side by side.',
          },
          quietNeighborhoodDinner: {
            title: 'Quiet Neighborhood Noodle Dinner',
            desc: 'A calm early dinner at a tucked-away spot away from weekend crowds.',
          },
          unhurriedHalfDayEscape: {
            title: 'Botanical Garden Half-Day Escape',
            desc: 'An unscheduled half-day nature outing when both partners feel steady.',
          },
        },
      },
      membershipLock: {
        aiUsageFreeBadge: 'Free Plan: {used} / {limit} AI generations this month',
        aiUsagePremiumBadge: 'Couple Premium · Unlimited Personalized AI Care',
        aiLimitReachedBadge: 'Monthly Free Limit Reached ({limit} / {limit})',
        aiLimitReachedTitle: 'Continue with Preset Care or Upgrade for Unlimited AI Care',
        aiLimitReachedDesc:
          'You have used all {limit} free monthly AI Care generations. Preset personalized suggestions remain unlimited on Free, or upgrade to Couple Premium for unlimited Gemini recommendations.',
        aiLimitBenefits: [
          'Unlimited Gemini AI Care generations for both partners',
          'Deeper feedback-weighted style & timing personalization',
          'Preset non-purchase suggestions always stay available on Free',
        ],
        basicActivityTitle: 'Basic Activity Suggestions (Free)',
        basicActivitySubtitle:
          'Essential low-pressure couple ideas stay available on Free. Upgrade for energy-matched Personalized Date Planning.',
        datePlanLockedBadge: 'Couple Premium · Personalized Date Planning',
        datePlanLockedTitle: 'Unlock Energy-Matched Date Planning & Partner Invites',
        datePlanLockedDesc:
          'Get all 6 curated categories ranked by permitted partner energy, avoid preferences, and Weekly Recharge wishes — plus cross-phone Date Invites.',
        datePlanLockedBenefits: [
          'Energy- & recharge-aware ranking across all 6 date categories',
          'Cross-phone Partner Date Invites & Date Agreed status sync',
          'Respects partner avoid tags & privacy settings automatically',
        ],
        upgradeCta: 'Upgrade to Premium',
        backToSuggestions: 'Back to Care Suggestions',
        backToPresets: 'Browse Preset Suggestions',
      },
    },
    notifications: {
      title: 'Notifications',
      subtitle: 'Care messages shared between you and your partner.',
      receivedTab: 'Received',
      sentTab: 'Sent',
      newCountSuffix: 'new',
      emptyReceivedTitle: 'No received care notes yet',
      emptyReceivedBody:
        'When your partner sends a care suggestion from their phone, it will appear right here.',
      emptySentTitle: 'No sent care notes yet',
      emptySentBody: 'Visit AI Care to send a thoughtful message or gesture to your partner.',
      exploreAiCare: 'Explore AI Care',
      relatedSuggestion: 'Related suggestion:',
      markAsReceived: 'Mark as Received',
      markAsCompleted: 'Mark as Completed',
      statuses: {
        Sent: 'Sent',
        Received: 'Received',
        Completed: 'Completed',
      },
      todayPrefix: 'Today',
      yesterdayPrefix: 'Yesterday',
      statusUpdateLabel: 'Daily status update',
      statusUpdateConfirmedBody: "{sender} confirmed today's status: {status}.",
      statusUpdateUpdatedBody: "{sender} updated today's status: {status}.",
      statusUpdatePrivateBody: "{sender} confirmed today's check-in (details kept private).",
      viewOnHomeBtn: 'View on Home',
      respondWithCareBtn: 'Respond with Care',
      feedbackPrompt: 'Did this care feel right for you?',
      feedbackHelpful: 'Helpful',
      feedbackMoreLikeThis: 'More Like This',
      feedbackNotRelevant: 'Not Relevant',
      feedbackRecordedNote: 'Saved privately to refine future suggestions you receive.',
      feedbackSelectedBadge: 'Rated: {type}',
      tabNotifications: 'Notifications',
      tabCareMoments: 'Our Care Moments',
      feedbackNotHelpful: 'Not Helpful',
      feedbackNotSuitable: 'Not Suitable for Me',
      quietHoursActiveBanner:
        'Quiet Hours active ({start}–{end}) — ordinary notifications are held quietly.',
      suppressedQuietLabel: 'Held during Quiet Hours',
      suppressedFrequencyLabel: 'Muted by Frequency setting',
      neutralPreviewStatusBody: 'Your partner shared a daily update.',
      neutralPreviewCareTitle: 'Personal care note',
      neutralPreviewCareBody: 'New message from your partner (neutral preview mode).',
      careMomentsTitle: 'Our Care Moments',
      careMomentsSubtitle: 'Completed care gestures preserved as shared couple memories.',
      careMomentsEmptyTitle: 'No completed care moments yet',
      careMomentsEmptyBody:
        'When a received care message is marked Completed, it is added here automatically.',
      careMomentAddNotePlaceholder: 'Add a short memory note...',
      careMomentSaveNoteBtn: 'Save Note',
      careMomentSharedBadge: 'Shared',
      careMomentPrivateBadge: 'Private',
      careMomentToggleShare: 'Share in Couple Moments',
      membershipLock: {
        recentWindowBadge: 'Free Plan: Recent 7-day Care History',
        fullHistoryBadge: 'Couple Premium · Full Care History',
        lockedArchiveBadge: 'Couple Premium · Full Care History',
        lockedArchiveTitle: '{count} Older Completed Care Moment(s) Preserved in Archive',
        lockedArchiveDesc:
          'Free displays your recent 7 days of Care Moments. Upgrade to Couple Premium to browse your full historical care archive together.',
        lockedArchiveBenefits: [
          'Unlimited multi-week Care Moments memory timeline',
          'Revisit saved notes and completed gestures anytime',
          'Shared visibility stays controlled by both partners',
        ],
        upgradeCta: 'Upgrade to Premium',
        backToNotifications: 'Back to Notifications',
      },
    },
    surpriseCare: {
      sendAsSurpriseBtn: 'Send as a Surprise',
      preparedSectionTitle: 'Prepared Surprises',
      preparedSectionSubtitle:
        'Manage surprises prepared for {partner}. Unrevealed surprises can be edited or cancelled.',
      normalPreparedSubtitle:
        'Your outgoing Surprise Care log. Edit or cancel scheduled surprises anytime.',
      normalUnpairedHint:
        'Pair your partner locally in Profile before sending partner-directed Surprise Care.',
      normalLocalSentHint:
        'Partner-side reveal & recipient feedback require two-device pairing; outgoing status is saved locally.',
      editSurpriseBtn: 'Edit',
      cancelSurpriseBtn: 'Cancel',
      demoUnlockNowBtn: 'Demo: Make Ready Now',
      demoUnlockedToast: 'Surprise unlocked for {partner} — ready to open on their phone.',
      createdSentToast: 'Surprise Care sent right away to {partner}.',
      createdScheduledToast: 'Surprise Care scheduled for {partner} (neutral preview sent).',
      updatedToast: 'Scheduled Surprise Care updated.',
      cancelledToast: 'Scheduled Surprise Care cancelled.',
      categories: {
        personal_touch: {
          label: 'Personal Touch',
          examples: 'Encouraging note · Handwritten card · Voice concept',
          desc: 'Thoughtful words, digital handwritten notes, or a gentle appreciation message.',
        },
        thoughtful_gesture: {
          label: 'Thoughtful Gesture',
          examples: 'Warm drink · Cozy evening · Restful break',
          desc: 'Everyday acts of care like preparing a favorite drink, snack, or quiet break.',
        },
        shared_moments: {
          label: 'Shared Moments',
          examples: 'Online movie · Music together · Plan a date',
          desc: 'Low-pressure shared activities or a linked date plan to enjoy together.',
        },
      },
      noteStyles: {
        standard: 'Warm Card',
        handwritten_note: 'Handwritten Note',
        voice_placeholder: 'Voice Concept',
      },
      voicePlaceholderBadge:
        'Simulated Voice Note Concept — Live audio recording is not active in this prototype',
      handwrittenBadge: 'Handwritten Digital Note',
      modal: {
        createTitle: 'Send as a Surprise',
        editTitle: 'Edit Scheduled Surprise',
        stepLabel: 'Step {current} of {total}',
        step1Title: '1. Choose Care',
        step2Title: '2. Choose Delivery Mode',
        step3Title: '3. Review & Confirm',
        sourceIdeaLabel: 'Based on AI Care Idea',
        whyFitsLabel: 'Why this fits',
        suggestedTimingLabel: 'Suggested timing',
        categoryLabel: 'Care Category',
        noteStyleLabel: 'Note Format',
        titleInputLabel: 'Surprise Title',
        actionInputLabel: 'Action Description',
        messageInputLabel: 'Personal Message for {partner}',
        linkDatePlanLabel: 'Link a Date Plan (Optional)',
        noDatePlanOption: 'No date plan linked',
        datePlanHiddenNote:
          'When Keep It a Surprise is selected, this date invite stays hidden from your partner until reveal time.',
        nonCommercialNotice:
          'All Surprise Care options support non-commercial, everyday gestures — no spending required.',
        tellNowTitle: 'Option A: Tell Them Now',
        tellNowDesc: 'Share your care with your partner right away.',
        keepSurpriseTitle: 'Option B: Keep It a Surprise',
        keepSurpriseDesc: 'Keep the details hidden and reveal them at a special moment.',
        revealTimeLabel: 'Reveal Time',
        revealPresets: {
          this_evening: 'This Evening (7:30 PM)',
          tomorrow_morning: 'Tomorrow Morning (9:00 AM)',
          next_pattern_window: 'Next Thu Energy Window (4:00 PM)',
          demo_quick: 'Demo Quick Reveal (+5s)',
          custom: 'Custom Time',
        },
        customRevealInputLabel: 'Custom Reveal Date & Time',
        neutralPreviewTitle: 'Neutral Notification Preview (Recipient Screen)',
        neutralPreviewHeading: 'Surprise Care',
        neutralPreviewBody: 'Someone has prepared a little surprise for you.',
        simulatedScheduleNote:
          'Simulated client-side schedule — reveal checks run locally while the app is active (no remote push server).',
        visibilityLabel: 'Our Care Moments Visibility',
        visibilityShared: 'Shared when completed',
        visibilityPrivate: 'Keep private',
        summaryCategory: 'Category',
        summaryTitle: 'Title',
        summaryAction: 'Action',
        summaryMessage: 'Message',
        summaryDelivery: 'Delivery Mode',
        summaryRevealAt: 'Reveal Schedule',
        summaryImmediate: 'Immediate delivery',
        summaryVisibility: 'Care Moments',
        summaryLinkedDate: 'Linked Date Plan',
        backBtn: 'Back',
        nextBtn: 'Next',
        confirmSendNowBtn: 'Send Care Surprise Now',
        confirmScheduleBtn: 'Schedule Surprise Care',
        confirmEditBtn: 'Save Changes',
      },
      statuses: {
        Draft: 'Draft',
        Scheduled: 'Scheduled',
        Sent: 'Sent',
        Revealed: 'Revealed',
        Completed: 'Completed',
        Cancelled: 'Cancelled',
      },
      recipient: {
        tellNowCardTitle: 'A little care from {sender} ❤️',
        maskedCardTitle: 'Surprise Care',
        maskedCardBody: 'Someone has prepared a little surprise for you.',
        maskedWaitingHint: 'Scheduled for {time}. Details stay gently hidden until then.',
        maskedReadyHint: 'Your surprise moment has arrived. Tap below when you are ready.',
        openSurpriseBtn: 'Open My Surprise',
        openedBanner: 'Opened · Surprise Revealed',
        revealScheduledLabel: 'Reveal time',
        linkedDateTitle: 'Linked Shared Date Invite',
        markCompletedBtn: 'Mark as Completed',
        completedBadge: 'Saved in Our Care Moments',
        momentsSurpriseBadge: 'Surprise Care',
        feedbackPrompt: 'How did this surprise feel?',
        feedbackMadeMyDay: '❤️ That Made My Day',
        feedbackHelpful: '😊 Helpful',
        feedbackNotMyThing: 'Not Quite My Thing',
        senderStatusWaiting: 'Hidden until {time}',
        senderStatusSent: 'Delivered to {partner}',
        senderStatusRevealed: 'Opened by {partner}',
        senderStatusCompleted: 'Completed together',
        senderStatusCancelled: 'Cancelled',
        senderOnlyReadonlyHint: 'Only the recipient submits feedback for future learning.',
      },
    },
    deliveryCare: {
      purchaseBadge: 'Delivery Treat Option',
      orderNowBtn: 'Order Now',
      remindLaterBtn: 'Remind Me Later',
      notNowBtn: 'Not Now',
      notNowToast: 'Dismissed "{title}" for now — this will not affect {name}’s learned preferences.',
      reminder: {
        sheetTitle: 'Remind Me Later',
        sheetSubtitle: 'Keep "{title}" aside and resurface it when the time feels right.',
        presetInOneHour: 'In 1 hour',
        presetLaterToday: 'Later today (6:00 PM)',
        presetTomorrow: 'Tomorrow morning (9:30 AM)',
        presetCustom: 'Choose custom date & time',
        customDateTimeLabel: 'Custom reminder date & time',
        confirmBtn: 'Save Reminder',
        scheduledToast: 'Reminder saved for {time}. It will appear here while the app is open.',
        clientOnlyNote: 'Reminders are evaluated locally when DualCharge is active or reopened (no background OS push).',
        dueSectionTitle: 'Care Reminders Due Now',
        dueSectionSubtitle: 'Postponed care treats ready when you are.',
        dueBadge: 'Due Now',
        rescheduleBtn: 'Reschedule',
        dismissBtn: 'Dismiss',
        actNowBtn: 'Order Now',
        presets: {
          in_1_hour: 'In 1 hour',
          later_today: 'Later today',
          tomorrow: 'Tomorrow',
          custom: 'Custom time',
        },
      },
      platform: {
        simulatedBanner: 'Simulated External Delivery Platform',
        simulatedDisclaimer:
          'Demo storefront simulation — no real merchant account, card payment, or courier dispatch occurs.',
        merchantLabel: 'Local Partner Kitchen & Floral',
        itemSectionTitle: 'Selected Care Item',
        variantLabel: 'Style / Sweetness Option',
        quantityLabel: 'Quantity',
        recipientLabel: 'Recipient Name',
        addressLabel: 'Delivery Address (Demo / Local)',
        addressPlaceholder: 'Enter delivery address or neighborhood note',
        addressRequiredHint: 'Please enter a delivery destination to place this simulated order.',
        useDemoAddressBtn: 'Use Demo Address',
        giftNoteLabel: 'Care Message Card',
        giftNotePlaceholder: 'Write a warm note for your partner...',
        platformNoteLabel: 'Courier / Storefront Note (Optional)',
        platformNotePlaceholder: 'e.g., Leave gently at reception or lobby table',
        priceSummaryTitle: 'Simulated Order Summary',
        subtotalLabel: 'Item Subtotal',
        deliveryFeeLabel: 'Simulated Delivery Fee',
        totalLabel: 'Simulated Total',
        privacyNotice: 'Health metrics, sleep data, and AI reasoning are never shared with external platforms.',
        confirmOrderBtn: 'Confirm Simulated Order',
        cancelExitBtn: 'Back to DualCharge',
        confirmedBadge: 'Simulated Order Confirmed',
        confirmedTitle: 'Order Confirmed on Simulated Platform',
        confirmedSubtitle: 'Your simulated delivery order is queued. Return to DualCharge to choose when to reveal it.',
        orderNumberLabel: 'Order ID',
        etaLabel: 'Estimated Arrival',
        returnToAppBtn: 'Return to DualCharge',
      },
      revealChoice: {
        title: 'How Would You Like to Share This?',
        subtitle: 'Choose whether to share order tracking immediately or keep it hidden until delivered.',
        tellNowTitle: 'Tell Them Now',
        tellNowDesc:
          'Immediately sends an unmasked notification showing the treat, care message, ETA, and live progress.',
        keepSurpriseTitle: 'Keep It a Surprise',
        keepSurpriseDesc:
          'Shows only a gentle mysterious note now. Item details, photo, and tracking stay hidden until Delivered.',
        maskedPreviewTitle: 'Recipient Preview While Hidden:',
        maskedPreviewBody: 'Someone has prepared a little surprise for you. ❤️',
        confirmBtn: 'Save Delivery Reveal Choice',
      },
      tracking: {
        sectionTitle: 'Simulated Order & Surprise Delivery',
        sectionSubtitle: 'Track simulated courier stages and test the delivery reveal flow.',
        demoSimControlsTitle: 'Demo Delivery Stage Simulator',
        etaPrefix: 'Est. arrival:',
        revealModeTellNow: 'Shared Immediately',
        revealModeSurprise: 'Hidden Surprise Until Delivered',
        cancelOrderBtn: 'Cancel Order',
        cancelledToast: 'Simulated order #{orderNumber} cancelled.',
        stageUpdatedToast: 'Order #{orderNumber} updated to: {stage}.',
        deliveredSurpriseToast: 'Order #{orderNumber} arrived — Surprise Care unlocked for {partner}!',
        noAutoCompleteHint: 'Confirm completion explicitly in Notifications once enjoyed.',
        stages: {
          'Order Confirmed': 'Order Confirmed',
          Preparing: 'Preparing',
          'Picked Up': 'Picked Up',
          'Out for Delivery': 'Out for Delivery',
          Delivered: 'Delivered',
          Cancelled: 'Cancelled',
        },
        simulateButtons: {
          preparing: 'Simulate Preparing',
          pickedUp: 'Simulate Picked Up',
          outForDelivery: 'Simulate Out for Delivery',
          delivered: 'Simulate Delivered',
        },
      },
      recipient: {
        maskedTitle: 'A Little Surprise Is on the Way',
        maskedBody: 'Someone has prepared a little surprise for you. ❤️',
        maskedProgressHint: 'Details stay safely tucked away until your surprise arrives.',
        revealedTitle: 'A Thoughtful Delivery Arrived',
        deliveredSurpriseBanner: 'Your surprise has arrived!',
        orderDetailsLabel: 'Simulated Delivery Treat',
        deliveryProgressLabel: 'Delivery Progress',
        feedbackPrompt: 'How did this surprise feel?',
        feedbackLovedIt: 'Loved It',
        feedbackThankYou: 'Thank You',
        feedbackNotPreference: 'Not My Preference',
        feedbackSavedNote: 'Feedback recorded from recipient.',
        markCompletedBtn: 'Mark as Completed',
        completedMomentToast: 'Added to Our Care Moments!',
        senderReadonlyNote: 'Recipient feedback and completion confirmation appear once {partner} responds.',
      },
    },
    profile: {
      roles: {
        alex: 'Partner A · Demo Account',
        jamie: 'Partner B · Demo Account',
      },
      simulatedDemoProfile: 'Simulated Demo Profile',
      languageSectionTitle: 'Language',
      languageSectionDesc: 'Updates both phones immediately and persists locally.',
      languages: {
        en: 'English',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
      },
      coupleSettingsTitle: 'Couple Settings',
      partnerName: 'Partner name',
      demoPairingCode: 'Demo pairing code',
      connectionStatus: 'Connection status',
      connectedStatusValue: 'Connected · Shared Couple',
      dataSharingTitle: 'Data Sharing Preferences',
      dataSharingDesc:
        'You control which summaries {partner} can view on their phone. Changes apply immediately.',
      energySummaryTitle: 'Energy Summary',
      energySummaryDesc: 'Share your daily Estimated Energy Index',
      sleepSummaryTitle: 'Sleep Summary',
      sleepSummaryDesc: 'Share sleep duration and quality score',
      activitySummaryTitle: 'Activity Summary',
      activitySummaryDesc: 'Share daily active minutes',
      cycleTitle: 'Menstrual Cycle Information',
      cycleDesc: 'Optional · Reserved for a future release (inactive by default)',
      sharingFeedbackOn: '{label} is now visible to {partner}.',
      sharingFeedbackOff: '{label} is now hidden from {partner}.',
      carePreferencesTitle: 'Care Preferences',
      carePreferencesDesc: 'Personal preferences that shape thoughtful AI Care suggestions.',
      newPreferencePlaceholder: 'Add a care preference...',
      addButton: 'Add',
      removeTagAria: 'Remove {tag}',
      presetTags: {
        alex_short_messages: 'Short supportive messages',
        alex_evening_walks: 'Relaxed evening walks',
        alex_fruit_tea: 'Fruit tea',
        alex_no_surprise_visits: 'Avoid surprise visits',
        jamie_quiet_time: 'Quiet time',
        jamie_light_dinner: 'Light dinner',
        jamie_warm_milk_tea: 'Warm milk tea',
        jamie_gentle_checkins: 'Gentle check-ins',
        jamie_no_crowds: 'Avoid crowded activities after a busy day',
      },
      membershipTitle: 'Membership Plans',
      demoPricingProposal: 'Demo pricing proposal',
      freePlanTitle: 'Free',
      freePrice: 'HK$0',
      perMonth: '/ month',
      freeBenefits: ['Basic energy summaries', 'Basic insights', 'Limited care suggestions'],
      premiumPlanTitle: 'Couple Premium',
      premiumPrice: 'HK$28–38',
      perCoupleMonth: '/ couple / mo',
      premiumBenefits: [
        'Deeper historical pattern analysis',
        'More detailed future estimates',
        'Personalized care suggestions',
        'Historical care preference insights',
      ],
      pricingProposalNote: 'Illustrative HKD pricing — proposal for university demonstration',
      explorePremium: 'Explore Premium',
      premiumModalTitle: 'Couple Premium Overview',
      premiumModalBody:
        'One shared couple plan at a proposed rate of HK$28–38 per couple / month unlocks deeper 60-day pattern analysis, detailed 7-day forecasts, and preference-aware care ideas for both Alex and Jamie.',
      premiumModalDisclaimer:
        'Simulated membership preview — no real payments or subscriptions are processed.',
      premiumConfirmButton: 'Confirm Demo Preview',
      premiumConfirmedBanner:
        'Demo preview noted! In the live product, both partners share one Couple Premium plan.',
      closePreview: 'Close',
      savedLibraryTitle: 'Saved Suggestions',
      savedLibraryDesc:
        'Your personal care library ({count} saved). Saving does not alter partner learning.',
      savedEmptyText:
        'No saved suggestions yet. Save useful care ideas from AI Care to revisit them later.',
      goToCareBtn: 'Go to AI Care',
      viewDetailsBtn: 'View details',
      hideDetailsBtn: 'Hide details',
      removeSavedBtn: 'Remove',
      savedOnLabel: 'Saved',
      sourceLabels: {
        gemini: 'Gemini AI',
        fallback: 'Fallback Engine',
        preset: 'Curated Care',
      },
      learnedProfileTitle: 'What DualCharge Is Learning',
      learnedProfileDesc:
        'Derived strictly from explicit feedback you submit on received care — never from sender actions or psychological guesses.',
      learningMaturityLabel: 'Learning stage',
      maturityDescriptions: {
        Initial: 'Initial (<3 ratings) — Still getting to know your preferences gently.',
        Developing: 'Developing (3–5 ratings) — Early preference patterns are emerging.',
        Established: 'Established (6+ ratings) — Clearer signals from repeated explicit feedback.',
      },
      feedbackCountsLabel: '{total} ratings ({positive} positive · {negative} negative)',
      preferredCategoriesLabel: 'Preferred categories',
      preferredStylesLabel: 'Preferred styles',
      noLearnedDataYet: 'No explicit received-care feedback submitted yet.',
      clearLearnedBtn: 'Clear Learned Preferences',
      clearLearnedDone: 'Learned preference scores cleared.',
      connectedHealthTitle: 'Connected Health Data',
      connectedHealthDesc: 'Simulated wellness data connection status for this device.',
      platformLabel: 'Platform',
      connectionLabel: 'Status',
      permissionLabel: 'Permission',
      lastSyncLabel: 'Last sync',
      statusConnected: 'Connected',
      statusDisconnected: 'Not connected',
      permissionGranted: 'Granted (Sleep, HR, HRV, Activity)',
      permissionNone: 'No device linked',
      syncNowBtn: 'Sync Now',
      syncedToast: 'Simulated health sync refreshed ({time}).',
      simulatedHealthNotice:
        'Simulated Apple Health / Health Connect dataset for interactive prototype demonstration.',
      normalHealthEmptyNote:
        'Health integrations are not connected in this prototype. Daily check-ins remain self-reported.',
      heartRateTitle: 'Resting Heart Rate',
      heartRateDesc: 'Share daily resting heart rate trend with {partner}',
      hrvTitle: 'Heart Rate Variability (HRV)',
      hrvDesc: 'Share personal HRV trend (no cross-partner comparison)',
      cycleTrackingOptInTitle: 'Enable Menstrual Cycle Tracking',
      cycleTrackingOptInDesc:
        'Optional personal tracking (OFF by default). Required before sharing cycle data.',
      cycleShareTitle: 'Share Cycle Phase Summary',
      cycleShareDesc: 'Separate consent required. Only active when Cycle Tracking is enabled.',
      notifPrefsTitle: 'Notification & Quiet Hours',
      notifPrefsDesc: 'Manage quiet hours, alert frequency, and neutral lock-screen previews.',
      quietHoursToggle: 'Quiet Hours',
      quietHoursDesc: 'Pause ordinary notification alerts during rest hours',
      quietStartLabel: 'Start',
      quietEndLabel: 'End',
      allowImportantQuietLabel: 'Allow important updates during Quiet Hours',
      allowImportantQuietDesc: 'Daily status confirmations & date invites can still notify',
      frequencyLabel: 'Alert Frequency',
      frequencyOptions: {
        low: 'Low',
        standard: 'Standard',
        important_only: 'Important Only',
      },
      shareStatusNotifsLabel: 'Share Daily Status Notifications',
      shareStatusNotifsDesc: 'Notify partner when you confirm your daily check-in',
      sensitivePreviewLabel: 'Sensitive Notification Preview',
      sensitivePreviewOptions: {
        full: 'Full permitted details',
        neutral: 'Neutral preview (hide details)',
      },
      reuseCareBtn: 'Send Care',
      reusedCareToast: 'Sent "{title}" to {partner}.',
      oneCouplePlanBadge: 'One Couple Plan, Two Members',
      billingMonthlyLabel: 'Monthly',
      billingYearlyLabel: 'Yearly',
      monthlyPrice: 'HK$38',
      monthlyUnit: '/ couple / mo',
      yearlyPrice: 'HK$288',
      yearlyUnit: '/ couple / yr',
      yearlySavingsNote: 'Save ~37% vs monthly · Proposed pricing assumption',
      premiumActiveBadge: 'Couple Premium Active',
      premiumActiveBothNote: 'Active for both Alex & Jamie (started {date} · simulated checkout).',
      upgradeCtaBtn: 'Upgrade Couple Plan',
      managePlanNote: 'Simulated demo checkout — Reset Demo restores Free tier. No real billing.',
      normalPremiumUnavailableNote:
        'Couple Premium purchase is not active in Personal prototype mode.',
      widgetPreviewTitle: 'Couple Widget Preview',
      widgetPreviewBadge: 'Widget Preview — Coming with the Native App',
      widgetPreviewDesc:
        'Interactive preview of upcoming iOS & Android home-screen widgets. Sensitive biometrics stay hidden by default.',
      widgetStyles: {
        shared_energy: 'Shared Energy',
        care_reminder: 'Care Reminder',
        daily_goal: 'Daily Goal',
        date_countdown: 'Date Countdown',
      },
      widgetMockCopy: {
        sharedEnergySub: 'Gentle energy check-in',
        careReminderTitle: 'Afternoon Warm Drink',
        careReminderSub: 'Suggested around 4:00 PM',
        dailyGoalTitle: 'Evening Wind-Down',
        dailyGoalSub: '18 min light walk · Shared calm',
        dateCountdownTitle: 'Cozy Movie Night',
        dateCountdownSub: 'Fri · 8:00 PM · Agreed',
        sensitiveHiddenNote:
          'Sensitive metrics (HR, HRV, sleep, cycle) remain hidden on home widgets.',
      },
      membershipUpgrade: {
        subTabMain: 'My Profile',
        subTabMembership: 'Premium Membership',
        backToProfile: 'Back to Profile',
        openMembershipPageBtn: 'Manage / Compare Plans',
        currentStatusLabel: 'Current Plan',
        freeStatusTitle: 'Free Plan',
        freeStatusDesc:
          'Includes essential daily check-ins, basic energy insights, 5 monthly AI Care generations, 7-day care history, and full privacy controls.',
        premiumStatusTitle: 'Couple Premium Active',
        premiumStatusDesc:
          'One Couple Plan, Two Members — unlocked across both phones.',
        purchasedByTemplate: 'Activated by {name} on {date} ({plan})',
        welcomeBanner:
          'Welcome to Couple Premium! Your shared experience has been upgraded.',
        illustrativePricingLabel:
          'Illustrative proposed pricing for prototype demonstration — not actual commercial subscription billing.',
        comparisonTitle: 'Free vs. Couple Premium Comparison',
        comparisonSubtitle:
          'Essential check-ins, privacy toggles, and core care stay Free forever. Premium deepens shared insights and personalization.',
        colFeature: 'Capability',
        colFree: 'Free',
        colPremium: 'Couple Premium',
        accessBadges: {
          free_included: 'Included in Free',
          premium_enhanced: 'Enhanced in Premium',
          premium_exclusive: 'Exclusive to Premium',
        },
        matrixRows: {
          pairing: {
            label: 'Couple pairing & link',
            free: 'Included',
            premium: 'Included',
          },
          daily_checkin: {
            label: 'Daily check-in & overview',
            free: 'Included',
            premium: 'Included',
          },
          privacy_controls: {
            label: 'Privacy & data-sharing controls',
            free: 'Full control',
            premium: 'Full control',
          },
          weekly_recharge: {
            label: 'Weekly Couple Recharge',
            free: 'Included',
            premium: 'Included',
          },
          energy_trends: {
            label: 'Historical trends & estimates',
            free: '30-day trend + basic 7d',
            premium: '60-day history + pattern evidence',
          },
          ai_care: {
            label: 'Personalized AI Care',
            free: '5 / month + unlimited presets',
            premium: 'Unlimited AI generations',
          },
          feedback_learning: {
            label: 'Feedback preference learning',
            free: 'Basic learning summary',
            premium: 'Full style & affinity insights',
          },
          care_history: {
            label: 'Care Moments history',
            free: 'Recent 7 days',
            premium: 'Full multi-week archive',
          },
          date_planning: {
            label: 'Activity & date planning',
            free: 'Basic activity ideas',
            premium: 'Energy-matched + Partner Invites',
          },
          multidimensional_insights: {
            label: 'Sleep stages, HRV & RHR trends',
            free: 'Locked preview',
            premium: 'Included (respects privacy)',
          },
          notifications_custom: {
            label: 'Quiet Hours & neutral masking',
            free: 'Status sharing & standard alerts',
            premium: 'Quiet Hours, Low digest, Neutral',
          },
          couple_widgets: {
            label: 'Couple Widget Preview',
            free: 'Locked preview',
            premium: 'All 4 interactive styles',
          },
        },
        selectPlanBtn: 'Upgrade to Premium',
        selectedPlanBtn: 'Review Upgrade ({price})',
        reviewModalTitle: 'Review Couple Premium Upgrade',
        reviewPlanLabel: 'Selected Plan',
        reviewBillingLabel: 'Billing Period',
        reviewPriceLabel: 'Proposed Price',
        reviewSharedLabel: 'Shared Coverage',
        reviewSharedValue: 'One Couple Plan covers both {a} and {b}',
        reviewNoPaymentNote:
          'Simulated prototype upgrade — no payment card, bank info, or real charge is collected.',
        confirmPurchaseBtn: 'Confirm Purchase',
        unpairedGuardTitle: 'Link Your Partner Account First',
        unpairedGuardBody:
          'Couple Premium requires a linked partner account because one plan covers both partners together.',
        unpairedGuardLinkBtn: 'Back to Couple Connection',
        normalModePrototypeNote:
          'Personal prototype mode keeps real billing disabled. Experience the shared Couple Premium upgrade flow inside Presentation Demo Mode.',
        widgetLockedBadge: 'Couple Premium · Widget Preview',
        widgetLockedTitle: 'Preview Upcoming Couple Home-Screen Widgets',
        widgetLockedDesc:
          'Try 4 interactive widget styles designed for future iOS & Android release, keeping sensitive biometrics hidden.',
        widgetLockedBenefits: [
          'Shared Energy, Care Reminder, Daily Goal & Date Countdown styles',
          'Widget Preview — Coming with the Native App',
        ],
        notifAdvancedLockedBadge: 'Couple Premium · Notification Customization',
        notifAdvancedLockedTitle: 'Quiet Hours Schedule, Low Digest & Neutral Lock-Screen Mode',
        notifAdvancedLockedDesc:
          'Essential daily status sharing stays Free. Upgrade to customize overnight Quiet Hours, Important-only overrides, Low digest frequency, and neutral sensitive previews.',
        learnedAdvancedLockedNote:
          'Free shows your basic learning stage & rating count. Upgrade to Couple Premium to inspect detailed preferred categories and communication styles.',
        upgradeCta: 'Upgrade to Premium',
      },
    },
    activityTemplates: {
      sentCare: '{actor} sent "{suggestion}" to {target}.',
      savedCare: '{actor} saved "{suggestion}".',
      completedCare: '{actor} marked "{suggestion}" as completed.',
      confirmedStatus: "{actor} confirmed today's status ({status}).",
      weeklyRecharge: '{actor} shared a Weekly Couple Recharge reflection.',
      dateInvite: '{actor} invited {target} to "{plan}".',
      dateAgreed: '{actor} & {target} agreed on "{plan}".',
      surpriseScheduled: '{actor} prepared a Surprise Care for {target}.',
      surpriseSent: '{actor} sent a Surprise Care to {target}.',
      surpriseRevealed: '{actor} opened a Surprise Care from {target}.',
      surpriseCompleted: '{actor} completed a Surprise Care moment.',
      orderPlacedRevealed: '{actor} ordered "{suggestion}" for {target}.',
      orderSecretPrepared: '{actor} has prepared a thoughtful surprise. ❤️',
      orderProgress: 'Care delivery for {target} is now: {stage}.',
      orderDelivered: 'A care surprise for {target} has arrived!',
      seedSupportive: 'Alex sent a supportive message to Jamie.',
      seedSavedEvening: 'Jamie saved a relaxing evening suggestion.',
    },
    calendar: {
      weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      monthsFull: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
    welcome: {
      headline: 'Care Begins with Understanding.',
      subtitle: "Understand your partner's energy patterns and discover thoughtful ways to care.",
      startJourney: 'Start Your DualCharge Journey',
      exploreDemo: 'Explore Couple Demo',
      demoFootnote: 'Fresh Day 1 personal setup · Separate 60-day Alex & Jamie couple demo',
      returnToWelcome: 'Welcome',
      enterDemoMode: 'Couple Demo',
      exitDemoMode: 'Exit Demo',
      personalModeBadge: 'Personal View',
      resumePersonalApp: 'Continue as {name}',
      loadingPresentationDemo: 'Loading 60-day couple demonstration...',
    },
    onboarding: {
      stepCounter: 'Step {current} of {total}',
      back: 'Back',
      continue: 'Continue',
      skipForNow: 'Skip for now',
      completeSetup: 'Start Building My Energy Baseline',
      localSetupTag: 'Day 1 Personal Setup',
      step1: {
        title: "Let's get to know you.",
        subtitle:
          'Create your local profile. No phone number, password, or real health records are collected.',
        nicknameLabel: 'Your Name / Nickname',
        nicknamePlaceholder: 'Enter your name or nickname',
        nicknameRequiredError: 'Please enter a name or nickname to continue.',
        avatarLabel: 'Profile Avatar (Optional)',
        avatarOptions: {
          'coral-glow': 'Coral',
          'lavender-mist': 'Lavender',
          'sage-calm': 'Sage',
          'warm-amber': 'Amber',
          'photo-a': 'Portrait A',
          'photo-b': 'Portrait B',
        },
        languageLabel: 'Preferred Language',
      },
      step2: {
        title: 'Connect with Your Partner',
        subtitle:
          'Create an invitation code, enter a partner code, or continue and invite your partner later.',
        optionCreate: 'Create Code',
        optionJoin: 'Enter Code',
        optionLater: 'Invite Later',
        createDesc:
          'Share this local prototype invitation code with your partner, or tap below to simulate partner pairing on this device.',
        inviteCodeLabel: 'Local Invitation Code',
        copyCode: 'Copy Code',
        copiedCode: 'Copied',
        partnerJoinedButton: 'Simulate Partner Joined',
        partnerJoinedConfirmed: 'Partner Paired (Local Prototype Simulation)',
        joinDesc:
          'Enter a 4-digit partner code (e.g. DC-4829) to simulate local pairing on this device.',
        joinCodeLabel: 'Partner Invitation Code',
        joinCodePlaceholder: 'Enter DC-4829',
        verifyCodeButton: 'Pair',
        invalidCodeError: 'Please enter a valid invitation code (format DC-XXXX, e.g. DC-4829).',
        pairingSuccessBanner: 'Paired locally (prototype simulation) with code {code}.',
        laterTitle: 'Continue without pairing right now',
        laterDesc:
          'You can start building your Day 1 personal baseline immediately and invite your partner anytime from Profile.',
        laterConfirmedBanner: 'Partner pairing set to "Invite Later". You can connect anytime in Profile.',
        pairingRequiredError:
          'Please simulate pairing, enter a partner code, or choose "Invite Later" to continue.',
        localSimulationNote:
          'Local prototype simulation only — does not sync with a real remote partner across devices.',
      },
      step3: {
        title: 'Your Data, Your Choice.',
        subtitle: 'Choose which personal summaries you are comfortable sharing with your partner.',
        offByDefaultNote:
          'All sharing switches start OFF. Enable only what you explicitly want to share.',
        privacyFootnote: 'You can change these permissions at any time.',
        cycleFutureBadge: 'Optional future feature · Disabled in prototype',
      },
      step4: {
        title: 'How do you like to be cared for?',
        subtitle:
          'Select preferences that help guide thoughtful care ideas. You may skip this step.',
        preferredCareTitle: 'Preferred care',
        avoidTitle: 'Things to avoid',
        communicationTitle: 'Communication style',
        preferredCareOptions: {
          warm_drinks: 'Warm drinks',
          gentle_messages: 'Gentle messages',
          quiet_time: 'Quiet time',
          light_meals: 'Light meals',
          relaxing_walks: 'Relaxing walks',
          small_surprises: 'Small surprises',
        },
        avoidOptions: {
          crowded_places: 'Crowded places',
          surprise_visits: 'Surprise visits',
          frequent_messages: 'Frequent messages',
          last_minute_plans: 'Last-minute plans',
        },
        communicationOptions: {
          gentle_supportive: 'Gentle and supportive',
          short_direct: 'Short and direct',
          playful_cheerful: 'Playful and cheerful',
        },
      },
      step5: {
        title: 'Start Your Energy Baseline',
        subtitle:
          'Your personal baseline begins today. DualCharge will learn from the daily information you choose to share.',
        startBaselineTitle: 'Day 1 · Clean Personal Baseline',
        startBaselineBody:
          'You start with zero pre-filled records. Each daily check-in builds your own baseline toward your first 7-day preliminary insight.',
        day1Badge: 'Starts on Day 1',
        zeroHistoryBadge: '0 historical records',
        firstInsightBadge: 'First insight after 7 recorded days',
        futureIntegrationsNote:
          'Optional Apple Health / Health Connect integrations are reserved for a future release.',
        noHealthClaimNote:
          'No wearable data or demo sample records are imported into your personal account.',
        completeBaselineCta: 'Start Building My Energy Baseline',
      },
    },
    normalMode: {
      greetingTemplate: 'Good morning, {name}',
      partnerDisplayName: 'Partner',
      personalRoleLabel: 'Day {day} · Personal Account',
      dayBadgeTemplate: 'Day {day}',
      baselineBuildingBadge: 'Baseline Building',
      earlyBaselineBadge: 'Early Insight Available',
      baselineStartingTitle: 'Your Energy Baseline Is Starting',
      baselineStartingBody:
        'DualCharge is beginning to learn your daily energy patterns. Complete your daily check-ins to build your personal baseline.',
      firstInsightTimingNote:
        'Your first preliminary insight will be available after 7 days of recorded check-ins.',
      recordedDaysProgress: '{count} of {target} recorded days',
      checkInSavesBaselineNote:
        'Saved to your personal history ({count} of 7 recorded days toward early insight).',
      noEnergyIndexYet: 'Building baseline',
      avgSelfReportedLabel: 'Avg self-reported ({score} / 5)',
      notEnteredYet: 'Not recorded',
      invitePartnerTitle: 'Invite your partner',
      invitePartnerBody:
        'Waiting for your partner to connect. Pair anytime in Profile to share summaries.',
      invitePartnerCta: 'Invite Partner',
      waitingForPartnerTitle: 'Connected (Local)',
      waitingForPartnerCheckInBody: "Waiting for your partner's first check-in.",
      pairedStatusValue: 'Paired (Local Simulation · {code})',
      unpairedStatusValue: 'Waiting for your partner',
      pairLaterActionHint:
        'Pair with a local simulation code in Profile or invite your partner when ready.',
      simulatePartnerJoinNow: 'Simulate Partner Pairing ({code})',
      noCareActivityYet: 'No personal care activity recorded yet.',
      insightPreviewBuilding:
        'Your personal energy baseline is being built. Complete 7 days of daily check-ins to receive your first preliminary insight.',
      insightPreviewEarly:
        'Early Insight — Based on {count} recorded days, your average self-reported energy is {avg} / 5.',
      insightsBuildingTitle: 'Your personal energy baseline is being built.',
      insightsBuildingBody:
        'Complete 7 days of daily check-ins to receive your first preliminary insight.',
      observedSoFarTitle: 'Observed So Far ({count} / 7 days)',
      observedSoFarEmpty:
        'No daily check-ins recorded yet. Complete your first check-in on Home to record Day 1.',
      selfReportedScaleNote: 'Self-reported check-in scale (1–5)',
      earlyInsightBadge: 'Early Insight',
      earlyInsightTitle: 'Early Insight — Based on Your First 7 Days',
      earlyInsightSubtitle:
        'Computed exclusively from your {count} recorded personal check-in days.',
      avgScoreLabel: 'Average self-reported',
      scoreRangeLabel: 'Recorded range',
      dayTransitionsLabel: 'Day-to-day shifts',
      mostCommonFeelingLabel: 'Most frequent check-in',
      variationNotes: {
        steady: 'Your recorded check-ins stayed fairly steady across your recorded days.',
        fluctuating: 'Your energy showed noticeable day-to-day shifts across your recorded days.',
        low_reserve: 'Several recorded days leaned toward lower reserve or needing extra rest.',
      },
      weeklyPatternTitle: 'Weekday Pattern Analysis',
      notEnoughWeekdayRepeats:
        'Not enough repeated observations to identify a weekly pattern yet.',
      weeklyPatternRequirementNote:
        'Requires at least 4 valid observations of the same weekday across 4 distinct weeks (currently max {weeks} week(s) observed for any weekday).',
      preliminaryWeeklyPatternBadge: 'Preliminary Weekly Pattern',
      preliminaryWeeklyPatternBody:
        'Preliminary observation across {weeks} distinct weeks: {weekday} averaged {mean} / 5.',
      futureEstimatesInactiveTitle: 'Future Estimates Not Yet Available',
      futureEstimatesInactiveBody:
        'History-based future estimates stay disabled until sufficient multi-week personal records are collected.',
      careColdStartTitle: 'Your personalized care insights are just getting started.',
      careColdStartBody:
        'Once we learn more about your daily patterns, we can offer more tailored suggestions.',
      careSourcePreferenceBadge: 'Based on selected preferences',
      careSourceEarlyBaselineBadge: 'Based on preferences & early check-ins',
      carePartnerNotPairedNote:
        'Partner not paired yet — you can save suggestions now, or connect in Profile to log outgoing care notes.',
      careLocalSentNote: 'Logged locally in your Personal Notifications (prototype simulation).',
      careSuggestions: {
        'norm-care-warm-drinks': {
          title: 'Prepare a Warm Drink',
          description: 'Offer a comforting cup of warm tea, cocoa, or hot water.',
          reason: 'Suggested from your selected preference for warm drinks.',
          timing: 'Whenever convenient today',
          defaultMessage: 'Thinking of you today — would a warm drink help you unwind later?',
        },
        'norm-care-gentle-messages': {
          title: 'Send a Gentle Check-in',
          description: 'Share a brief, no-pressure note letting your partner know you are thinking of them.',
          reason: 'Matches your preference for gentle messages without pressure.',
          timing: 'Midday or evening',
          defaultMessage: 'No rush to reply — just sending a gentle hello and hoping your day feels calm.',
        },
        'norm-care-quiet-time': {
          title: 'Protect Quiet Time Together',
          description: 'Set aside 30 unhurried, low-stimulus minutes at home without extra errands.',
          reason: 'Suggested from your selected preference for quiet time.',
          timing: 'This evening',
          defaultMessage: 'How about keeping tonight extra quiet and relaxed with zero extra plans?',
        },
        'norm-care-light-meals': {
          title: 'Plan an Easy, Light Meal',
          description: 'Keep dinner simple so neither partner feels stretched at the end of the day.',
          reason: 'Suggested from your selected preference for light meals.',
          timing: 'Dinner time',
          defaultMessage: 'Let us keep dinner light and effortless tonight so we can both rest well.',
        },
        'norm-care-relaxing-walks': {
          title: 'Invite for a Relaxing Walk',
          description: 'Take a slow, unhurried walk around a quiet neighborhood block.',
          reason: 'Matches your preference for relaxing walks.',
          timing: 'Late afternoon or evening',
          defaultMessage: 'Want to take a slow, easy walk together later to stretch and breathe?',
        },
        'norm-care-small-surprises': {
          title: 'Leave a Small Thoughtful Note',
          description: 'Write a short encouraging sticky note or small everyday gesture.',
          reason: 'Matches your preference for thoughtful small surprises.',
          timing: 'Anytime today',
          defaultMessage: 'Left a tiny reminder that I appreciate you — hope today treats you gently!',
        },
      },
      careContextWindowBuilding: 'Day 1+ · Preference-guided suggestions only',
      careContextWindowEarly: 'Early baseline · Not a predictive forecast',
      notificationsOutgoingOnlyNote:
        'Outgoing care notes created in Personal Mode are stored locally on this device.',
      modeAndDemoTitle: 'Presentation & Setup',
      modeAndDemoDesc:
        'Explore the separate 60-day Alex & Jamie classroom demo without affecting your personal Day 1+ records.',
      enterPresentationDemo: 'Enter Presentation Demo Mode',
      returnToWelcomeBtn: 'Return to Welcome',
      resetOnboardingBtn: 'Reset Personal Data',
      resetOnboardingTitle: 'Reset Personal Account & Onboarding?',
      resetOnboardingBody:
        'This will permanently clear your personal profile, daily check-in records, local pairing, sharing consent, and preferences, then return to Welcome. Presentation Demo Mode will not be affected.',
      confirmResetOnboarding: 'Reset Personal Data',
    },
  },

  'zh-CN': {
    meta: {
      presentationSubtitle: 'AI 伴侣关怀助手 · 双手机交互演示原型',
      partnerALabel: '伴侣 A',
      partnerBLabel: '伴侣 B',
      activePhone: '当前手机',
      resetDemo: '重置演示',
      resetConfirmTitle: '确认重置演示状态？',
      resetConfirmBody:
        '此操作将清空新发送的关怀消息、重置通知状态、清空已收藏建议，并恢复默认的每日签到与隐私共享设置。',
      resetConfirmNote: '您当前选择的语言偏好将会保留。',
      cancel: '取消',
      confirmReset: '确认重置',
      simulatedDemoData: '模拟演示数据',
      todayDateLabel: '2026年11月13日 周五',
    },
    nav: {
      home: '首页',
      insights: '洞察',
      care: '关怀',
      profile: '我的',
      notificationsAria: '通知中心',
    },
    greetings: {
      alex: '早上好，Alex',
      jamie: '早上好，Jamie',
    },
    energyStates: {
      steady: '平稳充沛',
      moderate: '中等平稳',
      low: '偏低需休息',
    },
    home: {
      connectedWith: '已与 {partner} 温柔连接',
      myEnergy: '我的精力',
      partnerSharedEnergy: '{partner} 的共享精力',
      estimatedEnergyIndex: '预估精力指数',
      personalSpaceTag: '个人私密',
      sharedSpaceTag: '伴侣共享',
      sharingPaused: '已暂停共享',
      sharingPausedNote: '{partner} 已在个人设置中关闭精力摘要共享。',
      todaysSummary: '今日摘要',
      personalView: '个人视图',
      sleepDuration: '睡眠时长',
      sleepQuality: '睡眠质量',
      activity: '活动时长',
      selfReported: '主观状态',
      pendingCheckIn: '待签到',
      hoursUnit: '小时',
      minutesUnit: '分钟',
      partnerSharedContext: '{partner} 的共享信息',
      privacyControlled: '隐私受控',
      partnerEnergyHiddenNotice:
        '{partner} 已暂停共享精力摘要。仅展示对方明确授权的摘要信息。',
      partnerDefaultPrivacyNotice:
        '默认仅展示共享精力摘要。睡眠与活动等详细数据仅保存在 {partner} 的手机上，除非对方主动开启共享。',
      sleepLabel: '睡眠',
      activityLabel: '活动',
      dailyCheckIn: '每日状态签到',
      howAreYouFeeling: '今天感觉如何？',
      checkInOptions: {
        good: { label: '状态不错', hint: '精力平稳' },
        tired: { label: '有点疲惫', hint: '放慢节奏' },
        rest: { label: '需要休息', hint: '今日偏低' },
      },
      checkInConfirmed: '今日主观状态已更新为「{status}」（{time}）。',
      checkInPreservedNote: '已保留 {count} 条历史记录（手动签到，非穿戴设备数据）。',
      aiInsightPreview: 'AI 洞察预览',
      insightPreviewPartnerDip: '{partner} 在{weekday}呈现出重复性的精力偏低规律。',
      insightPreviewSelfDip: '您在{weekday}呈现出重复性的精力偏低规律。',
      insightPreviewPartnerSteady: '{partner} 在已记录的工作日内精力保持平稳。',
      insightPreviewSelfSteady: '您在已记录的工作日内精力水平保持平稳。',
      viewInsights: '查看洞察',
      recentCareActivity: '近期关怀动态',
      openCare: '前往关怀',
      draftStatusBadge: '草稿（尚未确认）',
      confirmedStatusBadge: '已确认',
      updatedStatusBadge: '已更新',
      confirmTodayStatusBtn: '确认今日状态',
      updateConfirmedStatusBtn: '更新已确认状态',
      draftNotSharedHint: '已选择草稿——点击确认后才会正式保存并更新。',
      localOnlyStatusNote: '已在本机确认记录（本原型不包含远程跨设备实时同步）。',
      partnerStatusUpdatedBanner: '{partner} 的今日状态已更新',
      latestConfirmedStatusLabel: '最新已确认状态',
      predictedBaselineLabel: '历史趋势参考',
      respondWithCareBtn: '用关怀回应',
      partnerStatusPrivateNotice: '{partner} 已确认今日签到，但具体状态依据隐私设置保持隐藏。',
      rhrShortLabel: '静息心率',
      hrvShortLabel: 'HRV',
      cyclePhaseLabel: '周期阶段',
      stepsShortLabel: '步数',
      weeklyRechargeCardTitle: '每周伴侣充能小问卷',
      weeklyRechargeBadgeDone: '已完成',
      weeklyRechargeBadgeSkipped: '已跳过',
      weeklyRechargeBadgeNew: '本周待填',
      weeklyRechargePromptDesc:
        '记录本周最让你感到被支持的关怀方式以及下周期待——可自主选择私密保存或分享给伴侣。',
      weeklyRechargeOpenBtn: '填写本周问卷',
      weeklyRechargeEditBtn: '修改回答',
      weeklyRechargeSkipBtn: '本周跳过',
      weeklyRechargeModalTitle: '每周伴侣充能小问卷',
      weeklyRechargeQ1: '这周哪种关怀最让你感到被支持？',
      weeklyRechargeQ1Options: {
        emotional_support: '情感安慰与温柔话语',
        practical_help: '分担日常实际事务',
        rest_recovery: '安静休息与缓冲空间',
        quality_time: '不被打扰的共同相处时光',
      },
      weeklyRechargeQ2: '下周你希望多一些什么？',
      weeklyRechargeQ2Options: {
        more_quiet_time: '更多安静放松的夜晚',
        more_light_help: '更多轻量实际分担',
        more_gentle_checkins: '更多无压力的轻柔问候',
        more_shared_outings: '更多轻松的共同外出',
      },
      weeklyRechargeCommentLabel: '补充感想（可选，未分享时仅本机可见）',
      weeklyRechargeCommentPlaceholder: '写下这周的一点温柔感受...',
      weeklyRechargeShareLabel: '分享给伴侣',
      weeklyRechargeShareDesc: '开启后，伴侣可在关怀洞察中看到你的本周回答；关闭则严格保留私密。',
      weeklyRechargeSaveBtn: '保存本周反馈',
      weeklyRechargePrivateTag: '私密（未分享）',
      weeklyRechargeSharedTag: '已分享给伴侣',
      weeklyRechargePartnerTitle: '{partner} 的每周充能分享',
      weeklyRechargePartnerNote: '由 {partner} 主动分享，作为下周贴心关怀的温柔参考。',
      weeklyRechargeNormalNote: '已保存于本机。在真实跨设备同步接入前，伴侣分享卡片保持隐藏。',
    },
    insights: {
      title: 'AI 洞察',
      subtitle: '读懂日常规律，提前温柔关照。',
      myPatternTab: '我的规律 ({name})',
      partnerSharedTab: '{name} (已共享)',
      sharedInsightsPausedTitle: '共享洞察已暂停',
      sharedInsightsPausedBody: '{name} 已在个人隐私设置中暂停共享精力摘要。',
      historicalTrendTitle: '历史精力趋势',
      last60Days: '近 60 天',
      dateRangeTapHintTemplate: '{range} · 点击任意日期查看详情',
      weekdayDipTagTemplate: '{weekday}低谷',
      restReminderAnnotationTemplate: '{weekday}可以多一点休息',
      historicalBadge: '已记录',
      forecastBadge: '预估',
      indexLabel: '指数',
      sleepShortLabel: '睡眠',
      sleepPrivateLabel: '未共享',
      legendDailyEnergy: '每日精力指数',
      legendObservedWeekdayTemplate: '观察到的{weekday} ({count}次)',
      patternDetectionPrefix: '规律识别 · {name}',
      noPatternTitle: '未检测到显著的周中重复性精力偏低规律。',
      noPatternNoteTemplate: '根据 {count} 天模拟历史记录，您在工作日内的精力水平保持平稳。',
      overallAvgLabelTemplate: '{count} 天整体平均精力',
      recent7DayAvgLabel: '近 7 天平均精力',
      belowBaselineLabel: '低于个人均值的记录数',
      belowBaselineValueTemplate: '{count} ({pct}%)',
      weekdayPatternTitleTemplate: '检测到{weekday}重复性精力下降规律',
      weekdayPatternNoteTemplate:
        '基于 {count} 天模拟历史记录计算（跨 {weeks} 周，{pct}% 的{weekday}低于均值 ≥8 分）。',
      overallAvgEnergy: '整体平均精力',
      weekdayAvgEnergyTemplate: '{weekday}平均精力',
      weekdayObservationsTemplate: '{weekday}观察次数',
      prevDayAvgSleep: '前一日平均睡眠',
      future7DayTitle: '未来 7 天趋势预估',
      estimatedIndexColon: '预估精力指数：',
      confidenceColon: '置信度：',
      confidenceLevels: {
        Moderate: '中等',
        Low: '较低',
        'Insufficient Data': '数据不足',
      },
      insufficientDataTitle: '历史数据不足，暂无预估',
      insufficientDataBody: '当前缺少足够的历史记录，尚无法为该日生成有参考意义的规律预估。',
      insufficientDataShort: '数据不足',
      forecastFooterLabel: '基于规律的预估 — 演示数据',
      whyIdentifiedTitle: '系统为何识别出这一规律？',
      observedHistoricalTitle: '已观察到的历史数据',
      estimatedFutureTitle: '未来预估参考值',
      evidenceSteadyObserved: [
        '{count} 天模拟精力记录显示您的指数稳定在 {min} 至 {max} 之间（均值 {mean}，近 7 天均值 {recent7}）。',
        '所有记录的前一晚平均睡眠时长为 {sleep} 小时，共有 {belowCount} 天（{belowPct}%）低于个人均值。',
      ],
      evidenceSteadyObservedNoSleep: [
        '{count} 天模拟精力记录显示您的指数稳定在 {min} 至 {max} 之间（均值 {mean}，近 7 天均值 {recent7}）。',
        '共有 {belowCount} 天（{belowPct}%）低于个人均值。睡眠摘要未开启共享前，具体睡眠数据保持隐藏。',
      ],
      evidenceSteadyEstimated: [
        '基于各工作日历史均值（75%）与近 7 天均值（{recent7}，25%），未来 7 天预计维持在 {minForecast}–{maxForecast} 区间。',
        '预估仅反映近期规律稳定性，并非绝对确定的结果。',
      ],
      evidencePatternObserved: [
        '在连续 {count} 个{weekday}（跨 {weeks} 周）的记录中，精力平均值为 {weekdayMean}，低于 {totalDays} 天整体均值 {overallMean}（{belowPct}% 的记录低于均值 ≥8 分）。',
        '这些{weekday}对应的前一晚平均睡眠为 {prevSleep} 小时，比其他工作日夜晚少约 {sleepDiff} 小时。',
      ],
      evidencePatternSleepPrivate: '在个人设置开启「睡眠摘要」共享前，{name} 的睡眠详情保持私密。',
      evidencePatternSleepUnavailable: '缺少足够的有效前一晚睡眠记录，暂无法比较{weekday}前的睡眠时长。',
      evidencePatternEstimated: [
        '结合 75% 历史{weekday}均值（{weekdayMean}）与 25% 近 7 天均值（{recent7}），预计 {date} 精力指数为 {score} / 100（{confidence}置信度）。',
        '此预估仅作为合理安排轻松日程的参考，并非确定结果或医疗判断。',
      ],
      evidenceInsufficientEstimated: ['{weekday}的历史数据不足，暂无法生成可靠的规律预估。'],
      viewCareSuggestions: '查看关怀建议',
      sectionTodayOverview: '今日多维概览',
      sectionSleepPatterns: '睡眠节律与阶段',
      sectionHrvTrends: '心率变异性 (HRV) 趋势',
      sectionRhrTrends: '静息心率趋势',
      sectionActivityPatterns: '活动与步数规律',
      personalBaselineLabel: '个人基线均值',
      latestReadingLabel: '最新读数',
      deviationLabel: '较个人基线',
      sleepStagesTitle: '睡眠阶段分布',
      sleepStagesAvgNote: '60 天均值 · 最近一晚',
      stageDeep: '深睡',
      stageRem: '快速眼动',
      stageLight: '浅睡',
      stageAwake: '清醒',
      hrvMetricNoteTemplate: '指标：{metric} · 仅对比个人历史基线（绝不跨伴侣横向比较）',
      rhrUnit: '次/分',
      hrvUnit: 'ms',
      stepsLabel: '今日步数',
      steps7dAvgLabel: '近 7 天日均步数',
      intensityLabel: '活动强度',
      intensityLevels: {
        Low: '轻度',
        Moderate: '中等',
        Vigorous: '较高',
      },
      weeklyActivityTitle: '周内各日活动分布',
      missingDaysNoteTemplate: '已记录 {valid} / {total} 天 · 缺失日期留空处理',
      metricUnavailable: '暂无数据',
      metricPrivateTemplate: '{name} 已将该指标设为私密。',
      metricEnableHint: '在「我的」页面开启共享后即可共同查看。',
      cycleOptInNoteTemplate: '可选已记录周期阶段：{phase}（第 {day} 天）· 模拟推算周期',
      nonDiagnosticBanner: '仅作健康节律趋势参考——不构成医疗诊断或情绪判断。',
      freeTierInsightsBanner: '免费版：基础摘要预览 · 升级伴侣尊享版解锁完整多维趋势详情。',
      premiumTierInsightsBanner: '伴侣尊享版已激活 · 双方均已解锁完整多维历史趋势',
      last30DaysFree: '最近 30 天（免费版）',
      membershipLock: {
        freeTrendBanner:
          '免费版支持查看最近 30 天精力趋势；升级伴侣尊享版可解锁完整 60 天历史与规律详析。',
        unlock60DayBtn: '解锁 60 天趋势',
        advancedBadge: '伴侣尊享版 · 多维深度洞察',
        advancedTitle: '睡眠分期、HRV、静息心率与规律依据详情',
        advancedDesc:
          '查看多维恢复指标、个人 HRV/静息心率基线对比、周内活动分布以及更完整的统计规律依据（始终严格遵循隐私共享开关）。',
        advancedBenefits: [
          '60 天完整精力历史趋势与周规律对比',
          '睡眠结构分期分布（深睡 / REM / 浅睡 / 清醒）',
          'HRV（严格区分 SDNN/RMSSD）与静息心率个人基线偏离',
          '更详尽的历史观测与未来预测统计学依据',
        ],
        teaserPrivacyNote: '所有进阶健康指标依然严格受个人隐私与数据共享开关控制。',
        upgradeCta: '升级伴侣尊享版',
        returnHomeBtn: '返回首页',
        basicForecastBadge: '基础 7 天预估（免费版）',
      },
    },
    care: {
      title: 'AI 关怀',
      subtitle: '微小行动，暖心时刻。',
      defaultRecipient: '默认关怀对象',
      predictedWindowLabel: '预计需要关怀时段：',
      reasonLabel: '推荐依据：',
      patternWindowTemplate: '{date} · 下午至晚间',
      patternReasonTemplate:
        '检测到{weekday}重复性精力偏低规律（预估 {score} / 100），通常出现在前一晚睡眠偏少（平均 {prevSleep} 小时）之后。',
      patternReasonNoSleepTemplate:
        '基于历史精力记录检测到{weekday}重复性精力偏低规律（预估 {score} / 100；睡眠详情保持私密）。',
      steadyWindowLabel: '今晚 · 18:30 – 21:00',
      steadyReasonTemplate:
        '近期精力状态平稳（整体均值 {overallMean}，近 7 天 {recent7}），轻松的晚间互动有助于共同放松与情感联结。',
      sharingPausedWindow: '精力摘要已暂停共享',
      sharingPausedReasonTemplate:
        '{name} 已暂停共享精力摘要。以下建议基于对方已保存的个人关怀偏好生成。',
      personalizedSuggestionsTitle: '个性化关怀建议',
      forRecipient: '为 {name} 准备',
      whyThisFits: '契合原因：',
      suggestedTiming: '建议时间：',
      nonPurchaseTag: '无需消费关怀',
      homeGestureTag: '日常暖心举动',
      editMessage: '编辑留言',
      hideMessageEditor: '收起编辑',
      customMessageLabel: '发送给 {name} 的关怀留言',
      sendCare: '发送关怀',
      saveSuggestion: '收藏建议',
      saved: '已收藏',
      viewNotifications: '查看已发送',
      sentToastTitle: '已向 {name} 发送关怀',
      savedToastText: '已将「{title}」加入收藏列表。',
      alreadySavedText: '「{title}」已在您的收藏列表中。',
      respondingToStatusTitle: '正在回应 {name} 的最新已确认状态',
      respondingToStatusClear: '清除上下文',
      suggestions: {
        'care-jamie-warm-drink': {
          title: '准备一杯热饮',
          description: '为 Jamie 准备一杯热奶茶。',
          reason: '符合 Jamie 明确记录的偏好：喜欢热奶茶。',
          timing: '11月19日 周四 · 16:00',
          defaultMessage: '想到你周四会比较忙碌，忙完后想喝杯热奶茶放松一下吗？',
        },
        'care-jamie-quiet-evening': {
          title: '安排安静的夜晚',
          description: '提议在家享用清淡晚餐或安静共度晚间时光。',
          reason: '符合 Jamie 偏好安静活动和忙碌后清淡晚餐的习惯。',
          timing: '11月19日 周四 · 19:00',
          defaultMessage: '周四晚上我们轻松一点吧，在家吃顿清淡晚餐，不安排任何奔波。',
        },
        'care-jamie-gentle-checkin': {
          title: '发送轻柔问候',
          description: '发一句简短温暖的关心，不给对方立即回复的压力。',
          reason: '无需消费的贴心关怀，契合 Jamie 喜欢轻柔问候的偏好。',
          timing: '11月19日 周四 · 午间',
          defaultMessage: '希望你今天过得轻松自在。不用急着回复，只是想给你加加油！',
        },
        'care-alex-evening-walk': {
          title: '约一场晚间散步',
          description: '邀请 Alex 晚饭后在附近慢走 20 分钟。',
          reason: '符合 Alex 喜欢轻松晚间散步的偏好。',
          timing: '今晚 · 18:30',
          defaultMessage: '晚饭后要不要一起出去慢走 20 分钟，吹吹晚风放松一下？',
        },
        'care-alex-fruit-tea': {
          title: '泡一壶温热果茶',
          description: '泡一壶温暖的水果茶，一起舒缓身心。',
          reason: '符合 Alex 明确记录的偏好：喜欢水果茶。',
          timing: '今晚 · 20:30',
          defaultMessage: '晚上准备泡一壶温热果茶，给你留了一杯哦。',
        },
        'care-alex-supportive-note': {
          title: '发一句暖心鼓励',
          description: '发一条简短的感谢与支持消息。',
          reason: '无需消费的轻量关怀，符合 Alex 喜欢简短鼓励信息的偏好。',
          timing: '今日任意时间',
          defaultMessage: '这周看你一直很稳健也很贴心，有你在真好！',
        },
        'care-jamie-order-milk-tea': {
          title: '点一杯热奶茶送给对方',
          description: '通过模拟配送为 Jamie 点一杯温热烤奶，轻松提神又暖心。',
          reason: '契合 Jamie 喜欢热奶茶的偏好，适合精力回落的周四午后。',
          timing: '11月19日 周四 · 15:30',
          defaultMessage: '给你点了一杯热奶茶，下午忙完记得慢慢喝暖暖身！',
        },
        'care-alex-order-dessert': {
          title: '订一份轻甜晚间小点心',
          description: '为 Alex 点一份清爽的手作小点心，晚饭后轻松享用。',
          reason: '可选的暖心外送心意，为平稳的一天增添小小甜意。',
          timing: '今晚 · 19:30',
          defaultMessage: '给你订了一份不腻口的小点心，今晚一起慢慢尝吧。',
        },
      },
      aiEngine: {
        panelTitle: 'Gemini 个性化关怀引擎',
        panelSubtitle: '严格基于已授权的偏好与数据规律，生成贴合当下的关怀建议。',
        generateBtn: '生成新建议',
        regenerateBtn: '生成新建议',
        generatingLabel: '正在结合授权信息生成贴心建议...',
        initialPromptTitle: '准备就绪：生成个性化关怀方案',
        initialPromptBody:
          '点击下方按钮，系统将综合已授权的精力趋势、已保存偏好以及接收方显式反馈，生成无需消费的日常关怀灵感。',
        initialGenerateCta: '生成新建议',
        sourceGeminiBadge: 'Gemini AI 生成',
        sourceFallbackBadge: '本地备用推荐引擎',
        fallbackNoticePrefix: '当前使用本地备用方案：',
        fallbackReasons: {
          missing_api_key: '当前环境尚未配置服务端 Gemini 密钥，已切换为确定性本地建议。',
          api_error: 'Gemini 服务暂时不可用，已切换为确定性本地建议。',
          network_error: '暂时无法连接后端 AI 接口，已切换为确定性本地建议。',
          timeout: 'AI 生成请求超时，已切换为确定性本地建议。',
          invalid_response: 'AI 返回格式未通过结构校验，已切换为确定性本地建议。',
        },
        evidenceTitle: '本次参考的授权依据',
        limitationsTitle: '谨慎解读与局限说明',
        whyLabel: '原因：',
        whatLabel: '具体行动：',
        whenLabel: '建议时机：',
        personalizationLabel: '个性化依据：',
        confidenceLabel: '可信度：',
        categories: {
          'Emotional Support': '情感支持',
          'Practical Help': '实际分担',
          'Rest & Recovery': '休整恢复',
          'Small Surprise': '小小惊喜',
          'Quality Time': '陪伴时光',
        },
        confidenceLevels: {
          Moderate: '中等',
          Low: '较低',
          'Preference-Based': '基于偏好',
        },
        notRelevantBtn: '不相关',
        moreLikeThisBtn: '多来点这类',
        notRelevantToast: '已记录——已隐藏「{title}」并调低同类权重。',
        moreLikeThisToast: '已记录——后续将优先推荐更多「{category}」类建议。',
        feedbackNote: '推荐仅依据接收方在收到关怀后提交的显式反馈学习，不会重新训练底层模型。',
        feedbackWeightedBadge: '已结合反馈 ({count})',
        likedBadge: '偏好风格',
        emptyAfterFilterTitle: '当前建议已全部隐藏',
        emptyAfterFilterBody: '点击「生成新建议」，获取新一轮贴心方案。',
        dismissBtn: '暂不显示',
        dismissToast: '已从当前列表隐藏「{title}」。',
        recipientLearningNote: '{name} 的接收偏好学习阶段：{stage}。',
        maturityLabels: {
          Initial: '初期 (<3 次反馈)',
          Developing: '发展中 (3–5 次反馈)',
          Established: '较稳定 (6+ 次反馈)',
        },
        requiresMoneyTag: '可能涉及花费',
        communicationStyles: {
          'Short Text': '简短消息',
          'Voice Message': '语音留言',
          'Practical Action': '实际行动',
          'Shared Activity': '共同活动',
          Surprise: '小惊喜',
        },
        effortLevels: {
          Low: '轻量',
          Medium: '中等投入',
          High: '较高投入',
        },
      },
      tabSuggestions: '关怀建议',
      tabDatePlanning: '约会计划',
      skipBtn: '跳过',
      skippedToast: '已跳过「{title}」——仅作发送方列表筛选，不会改变 {name} 的偏好学习。',
      senderVsReceiverNote: '发送方操作（发送、收藏、跳过）绝不会修改接收方学习到的个人偏好。',
      datePlanning: {
        headerTitle: '伴侣约会灵感与安排',
        headerSubtitle: '结合双方授权精力摘要与避开偏好，推荐张弛有度的约会提案。',
        simulatedScheduleNotice: '演示用模拟空闲时段——当前未连接外部 Google 或 Apple 日历。',
        normalModeNotice: '个人原型模式——基于你的偏好与模拟时段提供约会灵感，暂未接入伴侣实时日程。',
        partnerEnergyBannerTemplate: '{partner} 已授权精力：{score} / 100 · 优先推荐低压力轻约会',
        partnerHighEnergyBannerTemplate:
          '{partner} 已授权精力：{score} / 100 · 提供丰富选择，亦包含温馨居家时光',
        partnerPrivateEnergyBanner: '伴侣精力保持私密——为您均衡展示居家放松与户外约会建议。',
        allCategories: '全部',
        categories: {
          'Outdoor Activities': '户外活动',
          'Movie Nights': '电影之夜',
          'Restaurant Dates': '餐厅约会',
          'Weekend Trips': '周末短途出行',
          'Shared Hobbies': '共同兴趣',
          'Relaxing Time at Home': '居家放松时光',
        },
        energyFitLabels: {
          low_pressure: '轻松低负担',
          balanced: '节奏均衡',
          active: '活力外出',
        },
        budgetLabels: {
          free_or_low: '免费 / 低花费',
          moderate: '适中预算',
        },
        likeBtn: '喜欢',
        likedBtn: '已喜欢',
        skipBtn: '略过',
        skippedBtn: '已略过',
        invitePartnerBtn: '邀请伴侣',
        invitedBadge: '已发出邀请',
        incomingInviteTitle: '来自 {partner} 的约会邀请',
        acceptInviteBtn: '接受邀请',
        declineInviteBtn: '暂不安排',
        markAgreedBtn: '确认达成约会',
        statusLabels: {
          none: '灵感',
          invited: '已邀请',
          accepted: '已接受',
          declined: '已婉拒',
          agreed: '已约好',
        },
        plans: {
          homeTeaSession: {
            title: '居家热茶与黑胶音乐时光',
            desc: '在家泡一壶热茶、听舒缓音乐，零奔波也能温柔相伴。',
          },
          cozyMovieNight: {
            title: '窝在沙发看场老电影',
            desc: '选一部轻松治愈的电影，享受毫无社交压力的安静夜晚。',
          },
          harborEveningWalk: {
            title: '傍晚海滨慢步吹风',
            desc: '选一段安静的滨水步道，以舒缓步调漫步 45 分钟。',
          },
          sharedSlowCooking: {
            title: '周末慢手料理与共同手作',
            desc: '一起做一顿简单早餐或并肩完成喜欢的小爱好。',
          },
          quietNeighborhoodDinner: {
            title: '社区安静小馆简餐约会',
            desc: '避开嘈杂商圈，找一家氛围温和的小店吃顿舒适晚餐。',
          },
          unhurriedHalfDayEscape: {
            title: '植物园半日轻松自然行',
            desc: '在双方精力都平稳充沛的周末，来一趟不赶行程的自然漫游。',
          },
        },
      },
      membershipLock: {
        aiUsageFreeBadge: '免费版：本月已生成 {used} / {limit} 次 AI 建议',
        aiUsagePremiumBadge: '伴侣尊享版 · 无限次个性化 AI 关怀生成',
        aiLimitReachedBadge: '本月免费额度已用完（{limit} / {limit}）',
        aiLimitReachedTitle: '继续使用预设建议，或升级解锁无限次 AI 关怀',
        aiLimitReachedDesc:
          '您本月 {limit} 次免费 AI 个性化关怀生成已用完。免费版仍可无限使用预设暖心建议，或升级伴侣尊享版解锁无限次 Gemini 生成。',
        aiLimitBenefits: [
          '双方共享无限次 Gemini 个性化 AI 关怀生成',
          '更深入的反馈加权与沟通方式匹配',
          '免费版预设无需消费建议永久可用',
        ],
        basicActivityTitle: '基础伴侣活动建议（免费版）',
        basicActivitySubtitle:
          '免费版保留基础低压力日常灵感；升级伴侣尊享版可解锁基于双方精力匹配的个性化约会计划。',
        datePlanLockedBadge: '伴侣尊享版 · 个性化约会计划',
        datePlanLockedTitle: '解锁伴侣精力智能匹配与双机约会邀请',
        datePlanLockedDesc:
          '依据伴侣授权精力水平、避开标签与每周充能心愿，智能排序全部 6 大约会类别，并支持双机发送邀请与「已约好」状态同步。',
        datePlanLockedBenefits: [
          '覆盖 6 大类约会的精力与充能偏好智能排序',
          '双机同步伴侣约会邀请、接受与达成确认',
          '自动遵守对方避开标签与隐私设置',
        ],
        upgradeCta: '升级伴侣尊享版',
        backToSuggestions: '返回关怀建议',
        backToPresets: '查看预设关怀建议',
      },
    },
    notifications: {
      title: '通知中心',
      subtitle: '伴侣之间互相发送与接收的关怀消息。',
      receivedTab: '已收到',
      sentTab: '已发送',
      newCountSuffix: '条新消息',
      emptyReceivedTitle: '暂未收到关怀消息',
      emptyReceivedBody: '当您的伴侣在另一部手机发送关怀建议时，消息会立即显示在这里。',
      emptySentTitle: '暂未发送关怀消息',
      emptySentBody: '前往 AI 关怀页面，为伴侣送上一份贴心的提醒或问候。',
      exploreAiCare: '前往 AI 关怀',
      relatedSuggestion: '关联建议：',
      markAsReceived: '标记为已收到',
      markAsCompleted: '标记为已完成',
      statuses: {
        Sent: '已发送',
        Received: '已收到',
        Completed: '已完成',
      },
      todayPrefix: '今天',
      yesterdayPrefix: '昨天',
      statusUpdateLabel: '每日状态更新',
      statusUpdateConfirmedBody: '{sender} 确认了今日状态：{status}。',
      statusUpdateUpdatedBody: '{sender} 更新了今日状态：{status}。',
      statusUpdatePrivateBody: '{sender} 确认了今日签到（状态详情依隐私设置保持隐藏）。',
      viewOnHomeBtn: '在首页查看',
      respondWithCareBtn: '用关怀回应',
      feedbackPrompt: '这份关怀合你心意吗？',
      feedbackHelpful: '有帮助',
      feedbackMoreLikeThis: '多来点这类',
      feedbackNotRelevant: '不相关',
      feedbackRecordedNote: '已私密记录偏好，用于优化你后续收到的关怀建议。',
      feedbackSelectedBadge: '已评价：{type}',
      tabNotifications: '通知列表',
      tabCareMoments: '我们的关怀瞬间',
      feedbackNotHelpful: '没有帮助',
      feedbackNotSuitable: '不适合我',
      quietHoursActiveBanner: '免打扰时段生效中（{start}–{end}）——普通提醒将安静暂存。',
      suppressedQuietLabel: '免打扰时段已静默暂存',
      suppressedFrequencyLabel: '已按提醒频率设置静音',
      neutralPreviewStatusBody: '你的伴侣更新了今日状态。',
      neutralPreviewCareTitle: '一条关怀消息',
      neutralPreviewCareBody: '来自伴侣的新消息（中性隐私预览模式）。',
      careMomentsTitle: '我们的关怀瞬间',
      careMomentsSubtitle: '仅自动收录已标记「已完成」的温柔关怀回忆。',
      careMomentsEmptyTitle: '暂无已完成的关怀瞬间',
      careMomentsEmptyBody: '当收到的关怀留言被标记为「已完成」时，将自动珍藏于此。',
      careMomentAddNotePlaceholder: '写一句简短的回忆备注...',
      careMomentSaveNoteBtn: '保存备注',
      careMomentSharedBadge: '双人可见',
      careMomentPrivateBadge: '仅自己可见',
      careMomentToggleShare: '在伴侣回忆中共享',
      membershipLock: {
        recentWindowBadge: '免费版：展示最近 7 天关怀记录',
        fullHistoryBadge: '伴侣尊享版 · 完整关怀历史记录',
        lockedArchiveBadge: '伴侣尊享版 · 完整关怀档案',
        lockedArchiveTitle: '另有 {count} 条较早的已完成关怀瞬间已安全保存',
        lockedArchiveDesc:
          '免费版可查看近 7 天内的关怀瞬间；升级伴侣尊享版即可共同浏览完整多周历史回忆档案。',
        lockedArchiveBenefits: [
          '完整多周伴侣关怀回忆时间线无限浏览',
          '随时重温双方备注与已完成的美好瞬间',
          '每条记录仍可独立控制双方共享可见性',
        ],
        upgradeCta: '升级伴侣尊享版',
        backToNotifications: '返回通知列表',
      },
    },
    surpriseCare: {
      sendAsSurpriseBtn: '以惊喜形式送出',
      preparedSectionTitle: '已准备的惊喜关怀',
      preparedSectionSubtitle:
        '管理为 {partner} 准备的惊喜关怀。尚未揭晓的惊喜支持修改或取消。',
      normalPreparedSubtitle: '你发出的惊喜关怀记录，未揭晓的预约可随时修改或取消。',
      normalUnpairedHint: '请先在「个人」页面完成伴侣本地配对，再向伴侣发送惊喜关怀。',
      normalLocalSentHint: '伴侣端揭晓与接收方反馈需双机配对；已发送记录保存在本地。',
      editSurpriseBtn: '修改',
      cancelSurpriseBtn: '取消',
      demoUnlockNowBtn: '演示：立即设为可揭晓',
      demoUnlockedToast: '已为 {partner} 解锁惊喜，现在可以在对方手机上打开了。',
      createdSentToast: '已立即将惊喜关怀发送给 {partner}。',
      createdScheduledToast: '已为 {partner} 预约惊喜关怀（已发送中性神秘预告）。',
      updatedToast: '已更新预约的惊喜关怀。',
      cancelledToast: '已取消尚未揭晓的惊喜关怀。',
      categories: {
        personal_touch: {
          label: '贴心心意',
          examples: '鼓励留言 · 手写风卡片 · 语音概念',
          desc: '一句鼓励话语、手写风电子卡片或发自内心的感谢。',
        },
        thoughtful_gesture: {
          label: '温柔行动',
          examples: '热饮点心 · 舒缓夜晚 · 提醒休息',
          desc: '准备一杯喜欢的饮品或小零食、营造舒适夜晚等日常贴心行动。',
        },
        shared_moments: {
          label: '共处时光',
          examples: '线上观影 · 一起听歌 · 约会计划',
          desc: '轻松无压力的双人陪伴活动，或关联一份伴侣约会邀请。',
        },
      },
      noteStyles: {
        standard: '温暖卡片',
        handwritten_note: '手写风便签',
        voice_placeholder: '语音心意（模拟）',
      },
      voicePlaceholderBadge: '模拟语音心意概念 — 当前原型暂不支持真实音频录制与播放',
      handwrittenBadge: '手写风电子便签',
      modal: {
        createTitle: '以惊喜形式送出',
        editTitle: '修改预约的惊喜关怀',
        stepLabel: '第 {current} / {total} 步',
        step1Title: '1. 选择并编辑关怀',
        step2Title: '2. 选择送达方式',
        step3Title: '3. 预览并确认',
        sourceIdeaLabel: '源于 AI 关怀灵感',
        whyFitsLabel: '贴合原因',
        suggestedTimingLabel: '建议时机',
        categoryLabel: '惊喜关怀类别',
        noteStyleLabel: '呈现形式',
        titleInputLabel: '惊喜标题',
        actionInputLabel: '具体关怀行动',
        messageInputLabel: '写给 {partner} 的话',
        linkDatePlanLabel: '关联伴侣约会计划（可选）',
        noDatePlanOption: '暂不关联具体约会',
        datePlanHiddenNote:
          '若选择「先保密，稍后惊喜揭晓」，该约会邀请将在揭晓前对伴侣保持隐藏。',
        nonCommercialNotice: '所有类别均包含非商业、零花费的日常温暖表达，无需花钱也能表达关怀。',
        tellNowTitle: '方式 A：现在告诉对方',
        tellNowDesc: '立即将这份关怀分享给你的伴侣。',
        keepSurpriseTitle: '方式 B：先保密，稍后惊喜揭晓',
        keepSurpriseDesc: '暂时隐藏具体内容，在特别的时刻再为伴侣揭晓。',
        revealTimeLabel: '选择揭晓时间',
        revealPresets: {
          this_evening: '今晚（19:30）',
          tomorrow_morning: '明早（09:00）',
          next_pattern_window: '下周四低谷前窗口（16:00）',
          demo_quick: '演示快速揭晓（+5秒）',
          custom: '自定义时间',
        },
        customRevealInputLabel: '自定义揭晓日期与时间',
        neutralPreviewTitle: '中性预告通知预览（伴侣端可见）',
        neutralPreviewHeading: '惊喜关怀',
        neutralPreviewBody: '有人为你准备了一份小小的惊喜。',
        simulatedScheduleNote:
          '原型阶段为本地前端模拟定时揭晓，在应用处于活动状态时检查并开放（不含远程系统推送服务）。',
        visibilityLabel: '关怀瞬间可见性',
        visibilityShared: '完成后在伴侣回忆共享',
        visibilityPrivate: '仅保留为私密记录',
        summaryCategory: '关怀类别',
        summaryTitle: '惊喜标题',
        summaryAction: '具体行动',
        summaryMessage: '附言内容',
        summaryDelivery: '送达方式',
        summaryRevealAt: '揭晓时间',
        summaryImmediate: '立即送达',
        summaryVisibility: '回忆可见性',
        summaryLinkedDate: '关联约会',
        backBtn: '上一步',
        nextBtn: '下一步',
        confirmSendNowBtn: '立即发送惊喜关怀',
        confirmScheduleBtn: '确认预约惊喜关怀',
        confirmEditBtn: '保存修改',
      },
      statuses: {
        Draft: '草稿',
        Scheduled: '已预约保密',
        Sent: '已送达',
        Revealed: '已揭晓',
        Completed: '已完成',
        Cancelled: '已取消',
      },
      recipient: {
        tellNowCardTitle: '来自 {sender} 的一份小关怀 ❤️',
        maskedCardTitle: '惊喜关怀',
        maskedCardBody: '有人为你准备了一份小小的惊喜。',
        maskedWaitingHint: '预计于 {time} 揭晓，具体内容当前为你温柔保密。',
        maskedReadyHint: '揭晓时刻已到！准备好时点击下方打开惊喜。',
        openSurpriseBtn: '打开我的惊喜',
        openedBanner: '刚刚打开 · 惊喜已揭晓',
        revealScheduledLabel: '预约揭晓时间',
        linkedDateTitle: '关联的约会邀请',
        markCompletedBtn: '标记为已完成',
        completedBadge: '已珍藏至「我们的关怀瞬间」',
        momentsSurpriseBadge: '惊喜关怀',
        feedbackPrompt: '这份惊喜让你感觉如何？',
        feedbackMadeMyDay: '❤️ 超开心的一天',
        feedbackHelpful: '😊 很贴心有帮助',
        feedbackNotMyThing: '不太合我心意',
        senderStatusWaiting: '保密至 {time}',
        senderStatusSent: '已送达 {partner}',
        senderStatusRevealed: '{partner} 已打开惊喜',
        senderStatusCompleted: '已共同完成',
        senderStatusCancelled: '已取消',
        senderOnlyReadonlyHint: '仅接收方评价会用于后续推荐偏好学习。',
      },
    },
    deliveryCare: {
      purchaseBadge: '可下单心意好物',
      orderNowBtn: '立即下单',
      remindLaterBtn: '稍后提醒我',
      notNowBtn: '暂不考虑',
      notNowToast: '已暂时跳过「{title}」——不会改变 {name} 的学习偏好。',
      reminder: {
        sheetTitle: '设置稍后提醒',
        sheetSubtitle: '先把「{title}」收好，等到合适的时间再提醒你。',
        presetInOneHour: '1 小时后',
        presetLaterToday: '今天晚些时候（18:00）',
        presetTomorrow: '明天上午（09:30）',
        presetCustom: '自定义日期和时间',
        customDateTimeLabel: '选择提醒时间',
        confirmBtn: '保存提醒',
        scheduledToast: '已设置于 {time} 提醒。应用保持打开或重新访问时会自动展示。',
        clientOnlyNote: '提醒仅在应用处于活动或重新打开状态时本地触发（不含系统后台推送）。',
        dueSectionTitle: '到期的关怀提醒',
        dueSectionSubtitle: '之前延后的心意好物现在可以安排啦。',
        dueBadge: '已到期',
        rescheduleBtn: '重新定时',
        dismissBtn: '忽略',
        actNowBtn: '立即下单',
        presets: {
          in_1_hour: '1 小时后',
          later_today: '今天晚些时候',
          tomorrow: '明天',
          custom: '自定义时间',
        },
      },
      platform: {
        simulatedBanner: '模拟外部配送平台',
        simulatedDisclaimer: '演示版购物结算界面——不涉及真实商家、资金支付或实际骑手配送。',
        merchantLabel: '严选暖心好物工坊（模拟）',
        itemSectionTitle: '已选心意商品',
        variantLabel: '规格 / 口味选择',
        quantityLabel: '数量',
        recipientLabel: '收件人',
        addressLabel: '配送地址（演示 / 本地）',
        addressPlaceholder: '请输入模拟收件地址或位置备注',
        addressRequiredHint: '请先填写配送地址，再提交模拟订单。',
        useDemoAddressBtn: '填入演示地址',
        giftNoteLabel: '附赠心意留言',
        giftNotePlaceholder: '写一句想给伴侣的话...',
        platformNoteLabel: '配送备注（可选）',
        platformNotePlaceholder: '例如：轻放前台或门边置物架',
        priceSummaryTitle: '模拟费用明细',
        subtotalLabel: '商品小计',
        deliveryFeeLabel: '模拟配送费',
        totalLabel: '模拟合计',
        privacyNotice: '健康数据、睡眠细节与 AI 分析依据绝不会同步给外部配送平台。',
        confirmOrderBtn: '确认模拟下单',
        cancelExitBtn: '返回 DualCharge',
        confirmedBadge: '模拟订单已确认',
        confirmedTitle: '已在模拟平台成功下单',
        confirmedSubtitle: '你的模拟配送订单已生成。请返回 DualCharge 选择何时告诉伴侣。',
        orderNumberLabel: '订单编号',
        etaLabel: '预计送达',
        returnToAppBtn: '返回 DualCharge',
      },
      revealChoice: {
        title: '想以哪种方式告诉伴侣？',
        subtitle: '可选择立即发送完整订单动态，或在送达前保持神秘惊喜。',
        tellNowTitle: '现在告诉 Ta',
        tellNowDesc: '立即发送包含商品名称、缩略图、留言、预计送达时间与实时进度的通知。',
        keepSurpriseTitle: '先保密作为惊喜',
        keepSurpriseDesc: '现在仅显示温和的神秘提示。商品、照片与物流细节在送达前保持严格隐藏。',
        maskedPreviewTitle: '保密期间伴侣端显示预览：',
        maskedPreviewBody: '有人为你准备了一份小小惊喜。❤️',
        confirmBtn: '确认通知方式',
      },
      tracking: {
        sectionTitle: '模拟订单与惊喜配送追踪',
        sectionSubtitle: '查看模拟配送进度，并可一键演练各个物流节点。',
        demoSimControlsTitle: '演示物流节点模拟器',
        etaPrefix: '预计送达：',
        revealModeTellNow: '已立即告知伴侣',
        revealModeSurprise: '送达前保持神秘惊喜',
        cancelOrderBtn: '取消订单',
        cancelledToast: '模拟订单 #{orderNumber} 已取消。',
        stageUpdatedToast: '订单 #{orderNumber} 已推进至：{stage}。',
        deliveredSurpriseToast: '订单 #{orderNumber} 已送达——已自动为 {partner} 揭晓惊喜！',
        noAutoCompleteHint: '送达后需在通知中手动确认，才会记入「我们的关怀瞬间」。',
        stages: {
          'Order Confirmed': '订单已确认',
          Preparing: '商家制作中',
          'Picked Up': '骑手已取餐',
          'Out for Delivery': '正在配送中',
          Delivered: '已送达',
          Cancelled: '已取消',
        },
        simulateButtons: {
          preparing: '模拟：制作中',
          pickedUp: '模拟：已取货',
          outForDelivery: '模拟：配送中',
          delivered: '模拟：已送达',
        },
      },
      recipient: {
        maskedTitle: '一份小惊喜正在路上',
        maskedBody: '有人为你准备了一份小小惊喜。❤️',
        maskedProgressHint: '好物细节与照片将在送达后为你揭晓。',
        revealedTitle: '一份暖心好物已送达',
        deliveredSurpriseBanner: '你的惊喜好物已经送达啦！',
        orderDetailsLabel: '模拟外送心意',
        deliveryProgressLabel: '配送进度',
        feedbackPrompt: '这份心意感觉如何？',
        feedbackLovedIt: '超喜欢',
        feedbackThankYou: '谢谢你',
        feedbackNotPreference: '不太合我偏好',
        feedbackSavedNote: '已记录接收方反馈。',
        markCompletedBtn: '标记为已完成',
        completedMomentToast: '已记录到「我们的关怀瞬间」！',
        senderReadonlyNote: '等待 {partner} 收到后给出反馈与完成确认。',
      },
    },
    profile: {
      roles: {
        alex: '伴侣 A · 演示账号',
        jamie: '伴侣 B · 演示账号',
      },
      simulatedDemoProfile: '模拟演示资料',
      languageSectionTitle: '语言设置',
      languageSectionDesc: '切换后两部手机将同步更新，并自动保存于本地。',
      languages: {
        en: 'English',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
      },
      coupleSettingsTitle: '伴侣关系设置',
      partnerName: '伴侣姓名',
      demoPairingCode: '演示配对码',
      connectionStatus: '连接状态',
      connectedStatusValue: '已连接 · 共享演示伴侣',
      dataSharingTitle: '数据共享与隐私控制',
      dataSharingDesc: '您可以自主决定允许 {partner} 查看哪些健康摘要，更改会立即生效。',
      energySummaryTitle: '精力摘要',
      energySummaryDesc: '共享每日预估精力指数',
      sleepSummaryTitle: '睡眠摘要',
      sleepSummaryDesc: '共享睡眠时长与睡眠质量评分',
      activitySummaryTitle: '活动摘要',
      activitySummaryDesc: '共享每日活动分钟数',
      cycleTitle: '生理周期信息',
      cycleDesc: '可选功能 · 预留给未来版本（默认不启用）',
      sharingFeedbackOn: '已向 {partner} 开启「{label}」共享。',
      sharingFeedbackOff: '已向 {partner} 隐藏「{label}」。',
      carePreferencesTitle: '个人关怀偏好',
      carePreferencesDesc: '这些偏好标签将帮助 AI 关怀提供更贴合心意的建议。',
      newPreferencePlaceholder: '添加新的关怀偏好...',
      addButton: '添加',
      removeTagAria: '移除 {tag}',
      presetTags: {
        alex_short_messages: '简短鼓励消息',
        alex_evening_walks: '轻松晚间散步',
        alex_fruit_tea: '水果茶',
        alex_no_surprise_visits: '避免突然造访',
        jamie_quiet_time: '安静独处或陪伴时间',
        jamie_light_dinner: '清淡晚餐',
        jamie_warm_milk_tea: '热奶茶',
        jamie_gentle_checkins: '轻柔问候',
        jamie_no_crowds: '忙碌后避免拥挤活动',
      },
      membershipTitle: '会员方案',
      demoPricingProposal: '演示定价方案',
      freePlanTitle: '免费版',
      freePrice: 'HK$0',
      perMonth: '/ 月',
      freeBenefits: ['基础精力摘要', '基础规律洞察', '有限的关怀建议'],
      premiumPlanTitle: '伴侣尊享版',
      premiumPrice: 'HK$28–38',
      perCoupleMonth: '/ 对 / 月',
      premiumBenefits: [
        '更深入的历史规律分析',
        '更详细的未来趋势预估',
        '高度个性化的关怀建议',
        '历史关怀偏好洞察记录',
      ],
      pricingProposalNote: '港币参考定价 — 仅作产品演示方案展示',
      explorePremium: '了解尊享会员',
      premiumModalTitle: '伴侣尊享版说明',
      premiumModalBody:
        '伴侣共享同一份订阅方案，建议定价为每对伴侣每月 HK$28–38。Alex 与 Jamie 双方均可解锁 60 天深度规律分析、7 天趋势预估与偏好驱动的专属关怀建议。',
      premiumModalDisclaimer: '此为会员信息模拟弹窗 — 本原型不会发起任何真实支付或扣费。',
      premiumConfirmButton: '确认体验演示方案',
      premiumConfirmedBanner: '已记录演示体验意向！正式版本中伴侣双方仅需一份共同订阅。',
      closePreview: '关闭',
      savedLibraryTitle: '已收藏的关怀建议',
      savedLibraryDesc: '你的个人关怀灵感库（共 {count} 条）。收藏操作不会影响偏好学习权重。',
      savedEmptyText: '暂无收藏建议。前往 AI 关怀收藏喜欢的灵感，随时在此回看。',
      goToCareBtn: '前往 AI 关怀',
      viewDetailsBtn: '查看详情',
      hideDetailsBtn: '收起详情',
      removeSavedBtn: '移除',
      savedOnLabel: '收藏于',
      sourceLabels: {
        gemini: 'Gemini AI',
        fallback: '备用推荐引擎',
        preset: '精选日常关怀',
      },
      learnedProfileTitle: 'DualCharge 正在学习的偏好',
      learnedProfileDesc: '仅依据你在收到关怀后提交的显式反馈整理，不依据发送方操作或进行心理猜测。',
      learningMaturityLabel: '学习阶段',
      maturityDescriptions: {
        Initial: '初期（少于 3 次评价）——仍在温和探索你的日常偏好。',
        Developing: '发展中（3–5 次评价）——已从你的反馈中形成初步偏好倾向。',
        Established: '较稳定（6 次及以上评价）——多次显式反馈沉淀出更清晰的偏好方向。',
      },
      feedbackCountsLabel: '共 {total} 次评价（{positive} 次正向 · {negative} 次负向）',
      preferredCategoriesLabel: '偏好关怀类别',
      preferredStylesLabel: '偏好沟通方式',
      noLearnedDataYet: '暂未提交过接收关怀后的显式偏好反馈。',
      clearLearnedBtn: '清空已学习偏好',
      clearLearnedDone: '已清空学习到的偏好权重。',
      connectedHealthTitle: '已连接的健康数据',
      connectedHealthDesc: '本设备上的模拟健康数据连接状态。',
      platformLabel: '数据平台',
      connectionLabel: '连接状态',
      permissionLabel: '授权范围',
      lastSyncLabel: '最近同步',
      statusConnected: '已连接',
      statusDisconnected: '未连接',
      permissionGranted: '已授权（睡眠、心率、HRV、活动）',
      permissionNone: '未绑定健康平台',
      syncNowBtn: '立即同步',
      syncedToast: '已刷新模拟健康同步（{time}）。',
      simulatedHealthNotice: '此为演示用模拟 Apple Health / Health Connect 数据集。',
      normalHealthEmptyNote: '个人原型模式暂未连接真实健康接口，每日状态通过手动签到记录。',
      heartRateTitle: '静息心率',
      heartRateDesc: '向 {partner} 共享每日静息心率趋势',
      hrvTitle: '心率变异性 (HRV)',
      hrvDesc: '共享个人 HRV 趋势（绝不跨伴侣比较基线）',
      cycleTrackingOptInTitle: '开启生理周期记录（可选）',
      cycleTrackingOptInDesc: '默认关闭的个人追踪开关；需先开启此项才可选择共享周期摘要。',
      cycleShareTitle: '共享生理周期阶段摘要',
      cycleShareDesc: '需单独明确授权，仅在开启生理周期记录后可用。',
      notifPrefsTitle: '智能通知与免打扰',
      notifPrefsDesc: '设置免打扰时段、提醒频率与隐私中性锁屏预览。',
      quietHoursToggle: '免打扰时段',
      quietHoursDesc: '在休息时段暂停普通提醒音与未读角标',
      quietStartLabel: '开始时间',
      quietEndLabel: '结束时间',
      allowImportantQuietLabel: '免打扰期间允许重要更新',
      allowImportantQuietDesc: '每日状态确认与约会邀请仍可送达提醒',
      frequencyLabel: '提醒频率',
      frequencyOptions: {
        low: '低频',
        standard: '标准',
        important_only: '仅重要提醒',
      },
      shareStatusNotifsLabel: '发送每日状态更新通知',
      shareStatusNotifsDesc: '确认今日状态签到后向伴侣发送状态更新提醒',
      sensitivePreviewLabel: '敏感信息通知预览',
      sensitivePreviewOptions: {
        full: '显示已授权详情',
        neutral: '中性预览（隐藏具体内容）',
      },
      reuseCareBtn: '直接发送',
      reusedCareToast: '已将「{title}」发送给 {partner}。',
      oneCouplePlanBadge: '一份伴侣订阅，两人共同解锁',
      billingMonthlyLabel: '按月方案',
      billingYearlyLabel: '按年方案',
      monthlyPrice: 'HK$38',
      monthlyUnit: '/ 对 / 月',
      yearlyPrice: 'HK$288',
      yearlyUnit: '/ 对 / 年',
      yearlySavingsNote: '较月付省约 37% · 提案阶段参考定价假设',
      premiumActiveBadge: '伴侣尊享版已激活',
      premiumActiveBothNote: 'Alex 与 Jamie 双方已共同解锁（生效于 {date} · 模拟开通）。',
      upgradeCtaBtn: '立即升级伴侣尊享版',
      managePlanNote: '此为演示模拟开通流程——点击顶部「重置演示」可恢复免费版，不涉及真实扣款。',
      normalPremiumUnavailableNote: '个人原型模式暂未开放真实会员购买流程。',
      widgetPreviewTitle: '伴侣桌面小组件预览',
      widgetPreviewBadge: '桌面小组件预览 — 将随原生 App 上线',
      widgetPreviewDesc: '提前预览 iOS 与 Android 桌面小组件样式；敏感生理指标默认隐藏。',
      widgetStyles: {
        shared_energy: '共享精力状态',
        care_reminder: '温柔关怀提醒',
        daily_goal: '每日温和目标',
        date_countdown: '约会倒计时',
      },
      widgetMockCopy: {
        sharedEnergySub: '今日精力轻简状态',
        careReminderTitle: '午后热饮小提醒',
        careReminderSub: '建议 16:00 温柔送上',
        dailyGoalTitle: '晚间舒缓放松',
        dailyGoalSub: '轻步走 18 分钟 · 共处静谧时光',
        dateCountdownTitle: '周五电影之夜',
        dateCountdownSub: '周五 · 20:00 · 双方已约好',
        sensitiveHiddenNote: '敏感健康数据（心率、HRV、睡眠、周期）默认在桌面小组件中隐藏。',
      },
      membershipUpgrade: {
        subTabMain: '个人资料与设置',
        subTabMembership: '尊享会员方案',
        backToProfile: '返回个人资料',
        openMembershipPageBtn: '查看会员对比与升级',
        currentStatusLabel: '当前方案',
        freeStatusTitle: '免费版',
        freeStatusDesc:
          '包含核心每日签到、基础精力洞察、每月 5 次 AI 关怀生成、近 7 天关怀历史及完整隐私控制开关。',
        premiumStatusTitle: '伴侣尊享版已激活',
        premiumStatusDesc: '一份伴侣订阅，两人共同解锁——双方手机均已同步升级。',
        purchasedByTemplate: '由 {name} 于 {date} 开通（{plan}）',
        welcomeBanner: '欢迎加入伴侣尊享版！你们的共享陪伴体验已同步升级。',
        illustrativePricingLabel:
          '演示提案参考定价（非真实商业订阅收费，不会收集任何银行卡或支付信息）。',
        comparisonTitle: '免费版 vs 伴侣尊享版功能对比',
        comparisonSubtitle:
          '基础签到、隐私控制与核心关怀体验永久免费；尊享版带来更深度的双人洞察与定制体验。',
        colFeature: '功能与体验',
        colFree: '免费版',
        colPremium: '伴侣尊享版',
        accessBadges: {
          free_included: '免费版已包含',
          premium_enhanced: '尊享版全面增强',
          premium_exclusive: '尊享版专属解锁',
        },
        matrixRows: {
          pairing: { label: '伴侣配对与双机关联', free: '已包含', premium: '已包含' },
          daily_checkin: { label: '每日精力签到与概览', free: '已包含', premium: '已包含' },
          privacy_controls: { label: '隐私与数据共享开关', free: '完整控制', premium: '完整控制' },
          weekly_recharge: { label: '每周伴侣充能小问卷', free: '已包含', premium: '已包含' },
          energy_trends: {
            label: '历史趋势与未来预估',
            free: '30 天趋势 + 基础 7 天',
            premium: '60 天完整历史 + 规律依据',
          },
          ai_care: {
            label: '个性化 AI 关怀建议',
            free: '每月 5 次 + 预设不限',
            premium: '无限次 AI 个性化生成',
          },
          feedback_learning: {
            label: '反馈偏好学习',
            free: '基础学习阶段摘要',
            premium: '完整类别与风格偏好详析',
          },
          care_history: {
            label: '关怀瞬间历史记录',
            free: '近 7 天记录',
            premium: '完整多周回忆档案',
          },
          date_planning: {
            label: '伴侣活动与约会计划',
            free: '基础日常活动建议',
            premium: '精力匹配排序 + 双机邀请',
          },
          multidimensional_insights: {
            label: '睡眠分期、HRV 与静息心率',
            free: '锁定预览',
            premium: '完整解锁（遵循隐私开关）',
          },
          notifications_custom: {
            label: '免打扰时段与中性隐私预览',
            free: '状态通知与标准频率',
            premium: '自定义免打扰、低频与中性遮罩',
          },
          couple_widgets: {
            label: '伴侣桌面小组件预览',
            free: '锁定预览',
            premium: '全部 4 种交互样式',
          },
        },
        selectPlanBtn: '选择并升级尊享版',
        selectedPlanBtn: '确认升级信息（{price}）',
        reviewModalTitle: '确认伴侣尊享版升级',
        reviewPlanLabel: '所选方案',
        reviewBillingLabel: '计费周期',
        reviewPriceLabel: '参考提案价格',
        reviewSharedLabel: '共享权益',
        reviewSharedValue: '一份伴侣订阅同步覆盖 {a} 与 {b}',
        reviewNoPaymentNote:
          '模拟演示升级流程——不会采集银行卡、支付账户或产生任何真实扣款。',
        confirmPurchaseBtn: '确认开通演示订阅',
        unpairedGuardTitle: '需先完成伴侣账号关联',
        unpairedGuardBody:
          '伴侣尊享版为双人共享方案，需在关联伴侣账号后方可共同升级使用。',
        unpairedGuardLinkBtn: '前往伴侣连接设置',
        normalModePrototypeNote:
          '个人原型模式已禁用真实商业付费；如需体验完整的双人共享升级流程，请切换至双机演示模式。',
        widgetLockedBadge: '伴侣尊享版 · 桌面小组件预览',
        widgetLockedTitle: '提前体验 4 种伴侣桌面小组件样式',
        widgetLockedDesc:
          '交互预览即将随原生 iOS / Android App 上线的桌面小组件，敏感生理指标默认隐藏。',
        widgetLockedBenefits: [
          '支持共享精力、关怀提醒、每日目标与约会倒计时 4 种样式',
          '桌面小组件预览 — 将随原生 App 上线',
        ],
        notifAdvancedLockedBadge: '伴侣尊享版 · 高级通知定制',
        notifAdvancedLockedTitle: '夜间免打扰排期、低频汇总与中性锁屏预览',
        notifAdvancedLockedDesc:
          '每日状态通知共享与标准提醒在免费版保持可用；升级尊享版可自由设置免打扰时段、重要覆盖规则与中性隐私预览。',
        learnedAdvancedLockedNote:
          '免费版展示当前学习阶段与反馈总次数；升级伴侣尊享版可查看系统总结的详细偏好类别与沟通风格。',
        upgradeCta: '升级伴侣尊享版',
      },
    },
    activityTemplates: {
      sentCare: '{actor} 向 {target} 发送了「{suggestion}」。',
      savedCare: '{actor} 收藏了「{suggestion}」。',
      completedCare: '{actor} 将「{suggestion}」标记为已完成。',
      confirmedStatus: '{actor} 确认了今日状态（{status}）。',
      weeklyRecharge: '{actor} 分享了每周伴侣充能小问卷结果。',
      dateInvite: '{actor} 向 {target} 发出了「{plan}」约会邀请。',
      dateAgreed: '{actor} 与 {target} 确认了「{plan}」约会安排。',
      surpriseScheduled: '{actor} 为 {target} 准备了一份惊喜关怀。',
      surpriseSent: '{actor} 向 {target} 送出了一份惊喜关怀。',
      surpriseRevealed: '{actor} 打开了来自 {target} 的惊喜关怀。',
      surpriseCompleted: '{actor} 完成了一次惊喜关怀瞬间。',
      orderPlacedRevealed: '{actor} 为 {target} 点了一份「{suggestion}」。',
      orderSecretPrepared: '{actor} 悄悄准备了一份贴心惊喜。❤️',
      orderProgress: '送给 {target} 的关怀配送进度更新为：{stage}。',
      orderDelivered: '送给 {target} 的贴心好物已送达！',
      seedSupportive: 'Alex 向 Jamie 发送了一条暖心问候。',
      seedSavedEvening: 'Jamie 收藏了一条轻松晚间建议。',
    },
    calendar: {
      weekdaysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      weekdaysFull: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      monthsFull: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    welcome: {
      headline: '关怀，从读懂彼此开始。',
      subtitle: '了解伴侣的精力波动规律，发现更贴心、更有分寸的关怀方式。',
      startJourney: '开启 DualCharge 之旅',
      exploreDemo: '体验伴侣双机演示',
      demoFootnote: '全新 Day 1 个人冷启动 · 与 60 天 Alex & Jamie 双机演示严格隔离',
      returnToWelcome: '欢迎页',
      enterDemoMode: '双机演示',
      exitDemoMode: '退出演示',
      personalModeBadge: '个人视图',
      resumePersonalApp: '以 {name} 的身份继续',
      loadingPresentationDemo: '正在加载 60 天伴侣双机演示数据...',
    },
    onboarding: {
      stepCounter: '第 {current} / {total} 步',
      back: '上一步',
      continue: '继续',
      skipForNow: '暂不设置，跳过',
      completeSetup: '开始建立我的精力基线',
      localSetupTag: 'Day 1 个人初始设置',
      step1: {
        title: '先认识一下你吧。',
        subtitle: '创建本地个人档案。本原型不收集手机号、密码或真实医疗健康记录。',
        nicknameLabel: '你的称呼 / 昵称',
        nicknamePlaceholder: '请输入你的称呼或昵称',
        nicknameRequiredError: '请输入称呼或昵称后再继续。',
        avatarLabel: '个人头像（可选）',
        avatarOptions: {
          'coral-glow': '暖珊瑚',
          'lavender-mist': '柔薰衣草',
          'sage-calm': '鼠尾草',
          'warm-amber': '暖琥珀',
          'photo-a': '肖像 A',
          'photo-b': '肖像 B',
        },
        languageLabel: '界面语言偏好',
      },
      step2: {
        title: '与伴侣建立连接',
        subtitle: '生成邀请码、输入伴侣邀请码，或稍后再邀请伴侣。',
        optionCreate: '生成邀请码',
        optionJoin: '输入邀请码',
        optionLater: '稍后邀请',
        createDesc: '将下方本地模拟邀请码分享给伴侣，或点击按钮在本机模拟配对完成。',
        inviteCodeLabel: '本地邀请码',
        copyCode: '复制邀请码',
        copiedCode: '已复制',
        partnerJoinedButton: '模拟伴侣已加入',
        partnerJoinedConfirmed: '已完成本地配对（原型模拟）',
        joinDesc: '输入 4 位数字邀请码（如 DC-4829）以在本机模拟与伴侣配对。',
        joinCodeLabel: '伴侣邀请码',
        joinCodePlaceholder: '请输入 DC-4829',
        verifyCodeButton: '确认配对',
        invalidCodeError: '请输入有效的邀请码（格式 DC-XXXX，例如 DC-4829）。',
        pairingSuccessBanner: '已通过邀请码 {code} 完成本地原型配对。',
        laterTitle: '暂不配对，先开启个人体验',
        laterDesc: '你可以先从 Day 1 开始建立自己的精力基线，随时前往「我的」页面邀请伴侣。',
        laterConfirmedBanner: '已选择「稍后邀请伴侣」，之后可随时在「我的」中连接。',
        pairingRequiredError: '请完成模拟配对、输入伴侣邀请码，或选择「稍后邀请」后再继续。',
        localSimulationNote: '仅限本机原型模拟，未连接真实远程跨设备伴侣同步。',
      },
      step3: {
        title: '你的数据，由你做主。',
        subtitle: '选择你愿意向伴侣分享的个人状态摘要。',
        offByDefaultNote: '所有分享开关默认处于关闭状态，仅在你主动开启后才会共享。',
        privacyFootnote: '你可以随时在「我的」页面调整这些权限。',
        cycleFutureBadge: '可选未来功能 · 本原型暂未启用',
      },
      step4: {
        title: '你喜欢被怎样温柔对待？',
        subtitle: '选择最让你感到舒适的关怀方式，也可直接跳过此步。',
        preferredCareTitle: '喜欢的关怀方式',
        avoidTitle: '希望避免的安排',
        communicationTitle: '偏好的沟通语气',
        preferredCareOptions: {
          warm_drinks: '热饮',
          gentle_messages: '轻柔问候',
          quiet_time: '安静陪伴/独处',
          light_meals: '清淡餐食',
          relaxing_walks: '轻松散步',
          small_surprises: '小惊喜',
        },
        avoidOptions: {
          crowded_places: '拥挤场所',
          surprise_visits: '突然造访',
          frequent_messages: '频繁发消息',
          last_minute_plans: '临时变动计划',
        },
        communicationOptions: {
          gentle_supportive: '温柔且体贴支持',
          short_direct: '简短而直接',
          playful_cheerful: '轻松俏皮愉快',
        },
      },
      step5: {
        title: '开始建立你的精力基线',
        subtitle: '你的个人基线从今天正式开始。DualCharge 将根据你主动分享的日常信息逐步学习。',
        startBaselineTitle: 'Day 1 · 全新个人基线',
        startBaselineBody: '你的历史记录将从 0 开始，每次每日签到都会累积为你的专属基线与第 7 天初步洞察。',
        day1Badge: '从第 1 天开始',
        zeroHistoryBadge: '0 条历史记录',
        firstInsightBadge: '记录满 7 天后解锁首次初步洞察',
        futureIntegrationsNote: '未来版本将可选支持 Apple Health / Health Connect 等平台接入。',
        noHealthClaimNote: '不会向你的个人账号导入任何穿戴设备数据或演示样本记录。',
        completeBaselineCta: '开始建立我的精力基线',
      },
    },
    normalMode: {
      greetingTemplate: '早安，{name}',
      partnerDisplayName: '伴侣',
      personalRoleLabel: '第 {day} 天 · 个人账号',
      dayBadgeTemplate: '第 {day} 天',
      baselineBuildingBadge: '基线建立中',
      earlyBaselineBadge: '已生成初步洞察',
      baselineStartingTitle: '你的精力基线正在起步',
      baselineStartingBody:
        'DualCharge 正在开始学习你的日常精力节奏。坚持完成每日状态签到，即可逐步建立你的个人基线。',
      firstInsightTimingNote: '累计完成 7 天每日签到后，将为你生成首次初步洞察。',
      recordedDaysProgress: '已记录 {count} / {target} 天',
      checkInSavesBaselineNote: '已保存至个人记录（已记录 {count} / 7 天，满 7 天解锁初步洞察）。',
      noEnergyIndexYet: '基线建立中',
      avgSelfReportedLabel: '平均主观精力 ({score} / 5)',
      notEnteredYet: '暂未记录',
      invitePartnerTitle: '邀请你的伴侣',
      invitePartnerBody: '正在等待伴侣连接。你可随时在「我的」页面完成本地配对并开启共享。',
      invitePartnerCta: '邀请伴侣',
      waitingForPartnerTitle: '已连接（本地模拟）',
      waitingForPartnerCheckInBody: '正在等待伴侣完成首次每日签到。',
      pairedStatusValue: '已配对（本地模拟 · {code}）',
      unpairedStatusValue: '等待伴侣连接',
      pairLaterActionHint: '可随时在「我的」中使用模拟邀请码完成配对。',
      simulatePartnerJoinNow: '模拟伴侣完成配对 ({code})',
      noCareActivityYet: '暂未产生个人关怀记录。',
      insightPreviewBuilding: '你的个人精力基线正在建立中。完成 7 天每日签到即可解锁首次初步洞察。',
      insightPreviewEarly: '初步洞察 — 基于你真实记录的 {count} 天，平均主观精力评分为 {avg} / 5。',
      insightsBuildingTitle: '你的个人精力基线正在建立中。',
      insightsBuildingBody: '完成 7 天每日签到，即可获得基于你自身数据的首次初步洞察。',
      observedSoFarTitle: '目前已记录数据 ({count} / 7 天)',
      observedSoFarEmpty: '暂无每日签到记录。前往首页完成今日首次签到，即可开启第 1 天记录。',
      selfReportedScaleNote: '个人主观精力评分（1–5 分制）',
      earlyInsightBadge: '初步洞察',
      earlyInsightTitle: '初步洞察 — 基于你的前 7 天记录',
      earlyInsightSubtitle: '完全基于你亲手记录的 {count} 天个人签到数据生成。',
      avgScoreLabel: '平均主观精力',
      scoreRangeLabel: '记录区间',
      dayTransitionsLabel: '相邻日波动次数',
      mostCommonFeelingLabel: '最常见状态',
      variationNotes: {
        steady: '在你记录的这几天中，整体精力状态保持相对平稳。',
        fluctuating: '在你记录的这几天中，日间精力呈现出一定的起伏变化。',
        low_reserve: '在已记录的日期中，有较多天倾向于精力偏低或需要多休息。',
      },
      weeklyPatternTitle: '周内规律识别',
      notEnoughWeekdayRepeats: '目前重复观察次数不足，尚无法识别稳定的每周规律。',
      weeklyPatternRequirementNote:
        '至少需要在 4 个不同自然周中观察到同一星期几的有效记录（当前单一星期几最多仅观察到 {weeks} 周）。',
      preliminaryWeeklyPatternBadge: '初步周规律提示',
      preliminaryWeeklyPatternBody:
        '基于跨 {weeks} 周的真实记录初步观察：{weekday} 平均主观精力的均值为 {mean} / 5。',
      futureEstimatesInactiveTitle: '未来趋势预估暂未开启',
      futureEstimatesInactiveBody: '需积累足够多周的真实个人历史数据后，系统才会提供基于历史规律的未来参考预估。',
      careColdStartTitle: '你的个性化关怀洞察才刚刚起步。',
      careColdStartBody: '随着我们逐步了解你的日常作息与精力节奏，将能够提供更贴合的关怀建议。',
      careSourcePreferenceBadge: '基于你主动选择的偏好',
      careSourceEarlyBaselineBadge: '结合偏好与初期签到记录',
      carePartnerNotPairedNote: '暂未配对伴侣 — 你仍可收藏喜欢的建议，或先在「我的」中配对后再记录发送关怀。',
      careLocalSentNote: '已记录在你的本地「通知中心」中（本机原型模拟）。',
      careSuggestions: {
        'norm-care-warm-drinks': {
          title: '准备一杯热饮',
          description: '递上一杯温和的热茶、热可可或温开水。',
          reason: '根据你在引导中主动选择的「热饮」偏好推荐。',
          timing: '今日方便时随时',
          defaultMessage: '今天辛苦啦，待会儿想喝杯热饮慢慢放松一下吗？',
        },
        'norm-care-gentle-messages': {
          title: '发送轻柔问候',
          description: '发一句简短温暖、没有回复压力的关心。',
          reason: '符合你选择的「轻柔问候」偏好。',
          timing: '午间或傍晚',
          defaultMessage: '不用急着回复，只是想跟你说声今天也要照顾好自己，愿你一切顺心。',
        },
        'norm-care-quiet-time': {
          title: '留出安静相处时间',
          description: '在家预留 30 分钟不被打扰、轻松安静的休息时光。',
          reason: '根据你选择的「安静陪伴/独处」偏好推荐。',
          timing: '今晚休息时段',
          defaultMessage: '今晚我们不安排额外琐事，一起安安静静放松休息吧。',
        },
        'norm-care-light-meals': {
          title: '安排一顿清淡简餐',
          description: '准备一顿轻松易消化的晚餐，减轻晚间身心负担。',
          reason: '根据你选择的「清淡餐食」偏好推荐。',
          timing: '晚餐时段',
          defaultMessage: '今晚我们吃顿清淡省心的晚餐吧，让身体也好好歇一歇。',
        },
        'norm-care-relaxing-walks': {
          title: '约一场轻松散步',
          description: '在安静的街区一起慢走 15–20 分钟，呼吸新鲜空气。',
          reason: '符合你选择的「轻松散步」偏好。',
          timing: '傍晚或晚饭后',
          defaultMessage: '晚饭后要不要一起出去慢慢散步二十分钟，吹吹风放松一下？',
        },
        'norm-care-small-surprises': {
          title: '留一张暖心小纸条',
          description: '准备一句简短的感谢留言或一个日常小惊喜。',
          reason: '符合你选择的「小惊喜」偏好。',
          timing: '今日任意时刻',
          defaultMessage: '给你留了一个小小鼓励，谢谢你一直以来的温柔陪伴！',
        },
      },
      careContextWindowBuilding: 'Day 1+ · 仅提供基于偏好的日常建议',
      careContextWindowEarly: '初期基线阶段 · 非未来趋势预测',
      notificationsOutgoingOnlyNote: '个人模式中发送的关怀留言仅保存在本机当前档案中。',
      modeAndDemoTitle: '演示模式与个人数据管理',
      modeAndDemoDesc: '可随时进入独立的 60 天 Alex & Jamie 双机演示，不会影响你的个人 Day 1+ 记录。',
      enterPresentationDemo: '进入双机演示模式',
      returnToWelcomeBtn: '返回欢迎页',
      resetOnboardingBtn: '重置个人数据',
      resetOnboardingTitle: '确认清除个人档案并重置引导？',
      resetOnboardingBody:
        '此操作将清除你的个人昵称、所有每日签到记录、本地配对、隐私设置与偏好，并返回欢迎页。双机演示模式数据不受影响。',
      confirmResetOnboarding: '确认重置',
    },
  },

  'zh-TW': {
    meta: {
      presentationSubtitle: 'AI 伴侶關懷夥伴 · 雙手機互動展示原型',
      partnerALabel: '伴侶 A',
      partnerBLabel: '伴侶 B',
      activePhone: '目前手機',
      resetDemo: '重設展示',
      resetConfirmTitle: '確認重設展示狀態？',
      resetConfirmBody:
        '此操作將清除新發送的關懷訊息、重設通知狀態、清空已收藏建議，並恢復預設的每日簽到與隱私分享設定。',
      resetConfirmNote: '您目前選擇的語言偏好將會保留。',
      cancel: '取消',
      confirmReset: '確認重設',
      simulatedDemoData: '模擬展示數據',
      todayDateLabel: '2026年11月13日 週五',
    },
    nav: {
      home: '首頁',
      insights: '洞察',
      care: '關懷',
      profile: '我的',
      notificationsAria: '通知中心',
    },
    greetings: {
      alex: '早安，Alex',
      jamie: '早安，Jamie',
    },
    energyStates: {
      steady: '平穩充沛',
      moderate: '中等平穩',
      low: '偏低需休息',
    },
    home: {
      connectedWith: '已與 {partner} 溫柔連結',
      myEnergy: '我的精力',
      partnerSharedEnergy: '{partner} 的分享精力',
      estimatedEnergyIndex: '預估精力指數',
      personalSpaceTag: '個人私密',
      sharedSpaceTag: '伴侶分享',
      sharingPaused: '已暫停分享',
      sharingPausedNote: '{partner} 已在個人設定中關閉精力摘要分享。',
      todaysSummary: '今日摘要',
      personalView: '個人檢視',
      sleepDuration: '睡眠時長',
      sleepQuality: '睡眠品質',
      activity: '活動時長',
      selfReported: '主觀狀態',
      pendingCheckIn: '待簽到',
      hoursUnit: '小時',
      minutesUnit: '分鐘',
      partnerSharedContext: '{partner} 的分享資訊',
      privacyControlled: '隱私受控',
      partnerEnergyHiddenNotice:
        '{partner} 已暫停分享精力摘要。僅顯示對方明確授權的摘要資訊。',
      partnerDefaultPrivacyNotice:
        '預設僅顯示分享精力摘要。睡眠與活動等詳細資料僅保留於 {partner} 的手機，除非對方主動開啟分享。',
      sleepLabel: '睡眠',
      activityLabel: '活動',
      dailyCheckIn: '每日狀態簽到',
      howAreYouFeeling: '今天感覺如何？',
      checkInOptions: {
        good: { label: '狀態不錯', hint: '精力平穩' },
        tired: { label: '有點疲憊', hint: '放慢步調' },
        rest: { label: '需要休息', hint: '今日偏低' },
      },
      checkInConfirmed: '今日主觀狀態已更新為「{status}」（{time}）。',
      checkInPreservedNote: '已保留 {count} 筆歷史紀錄（手動簽到，非穿戴裝置數據）。',
      aiInsightPreview: 'AI 洞察預覽',
      insightPreviewPartnerDip: '{partner} 在{weekday}呈現出重複性的精力偏低規律。',
      insightPreviewSelfDip: '您在{weekday}呈現出重複性的精力偏低規律。',
      insightPreviewPartnerSteady: '{partner} 在已紀錄的工作日內精力保持平穩。',
      insightPreviewSelfSteady: '您在已紀錄的工作日內精力水平保持平穩。',
      viewInsights: '查看洞察',
      recentCareActivity: '近期關懷動態',
      openCare: '前往關懷',
      draftStatusBadge: '草稿（尚未確認）',
      confirmedStatusBadge: '已確認',
      updatedStatusBadge: '已更新',
      confirmTodayStatusBtn: '確認今日狀態',
      updateConfirmedStatusBtn: '更新已確認狀態',
      draftNotSharedHint: '已選定草稿——點擊確認後才會正式儲存並更新。',
      localOnlyStatusNote: '已於本機確認紀錄（本原型不包含遠端跨裝置即時同步）。',
      partnerStatusUpdatedBanner: '{partner} 的今日狀態已更新',
      latestConfirmedStatusLabel: '最新已確認狀態',
      predictedBaselineLabel: '歷史趨勢參考',
      respondWithCareBtn: '用關懷回應',
      partnerStatusPrivateNotice: '{partner} 已確認今日簽到，但具體狀態依隱私設定保持隱藏。',
      rhrShortLabel: '靜息心率',
      hrvShortLabel: 'HRV',
      cyclePhaseLabel: '週期階段',
      stepsShortLabel: '步數',
      weeklyRechargeCardTitle: '每週伴侶充能小問卷',
      weeklyRechargeBadgeDone: '已完成',
      weeklyRechargeBadgeSkipped: '已略過',
      weeklyRechargeBadgeNew: '本週待填',
      weeklyRechargePromptDesc:
        '記錄本週最讓你感到被支持的關懷方式以及下週期待——可自主選擇私密保存或分享給伴侶。',
      weeklyRechargeOpenBtn: '填寫本週問卷',
      weeklyRechargeEditBtn: '修改回答',
      weeklyRechargeSkipBtn: '本週略過',
      weeklyRechargeModalTitle: '每週伴侶充能小問卷',
      weeklyRechargeQ1: '這週哪種關懷最讓你感到被支持？',
      weeklyRechargeQ1Options: {
        emotional_support: '情感安慰與溫柔話語',
        practical_help: '分擔日常實際事務',
        rest_recovery: '安靜休息與緩衝空間',
        quality_time: '不被打擾的共同相處時光',
      },
      weeklyRechargeQ2: '下週你希望多一些什麼？',
      weeklyRechargeQ2Options: {
        more_quiet_time: '更多安靜放鬆的夜晚',
        more_light_help: '更多輕量實際分擔',
        more_gentle_checkins: '更多無壓力的輕柔問候',
        more_shared_outings: '更多輕鬆的共同外出',
      },
      weeklyRechargeCommentLabel: '補充感想（選填，未分享時僅本機可見）',
      weeklyRechargeCommentPlaceholder: '寫下這週的一點溫柔感受...',
      weeklyRechargeShareLabel: '分享給伴侶',
      weeklyRechargeShareDesc: '開啟後，伴侶可在關懷洞察中看到你的本週回答；關閉則嚴格保留私密。',
      weeklyRechargeSaveBtn: '儲存本週回饋',
      weeklyRechargePrivateTag: '私密（未分享）',
      weeklyRechargeSharedTag: '已分享給伴侶',
      weeklyRechargePartnerTitle: '{partner} 的每週充能分享',
      weeklyRechargePartnerNote: '由 {partner} 主動分享，作為下週貼心關懷的溫柔參考。',
      weeklyRechargeNormalNote: '已儲存於本機。在真實跨裝置同步串接前，伴侶分享卡片保持隱藏。',
    },
    insights: {
      title: 'AI 洞察',
      subtitle: '讀懂日常規律，提前溫柔關照。',
      myPatternTab: '我的規律 ({name})',
      partnerSharedTab: '{name} (已分享)',
      sharedInsightsPausedTitle: '分享洞察已暫停',
      sharedInsightsPausedBody: '{name} 已在個人隱私設定中暫停分享精力摘要。',
      historicalTrendTitle: '歷史精力趨勢',
      last60Days: '近 60 天',
      dateRangeTapHintTemplate: '{range} · 點擊任意日期查看詳情',
      weekdayDipTagTemplate: '{weekday}低谷',
      restReminderAnnotationTemplate: '{weekday}可以多一點休息',
      historicalBadge: '已紀錄',
      forecastBadge: '預估',
      indexLabel: '指數',
      sleepShortLabel: '睡眠',
      sleepPrivateLabel: '未分享',
      legendDailyEnergy: '每日精力指數',
      legendObservedWeekdayTemplate: '觀察到的{weekday} ({count}次)',
      patternDetectionPrefix: '規律識別 · {name}',
      noPatternTitle: '未偵測到顯著的週間重複性精力偏低規律。',
      noPatternNoteTemplate: '根據 {count} 天模擬歷史紀錄，您在工作日內的精力水平保持平穩。',
      overallAvgLabelTemplate: '{count} 天整體平均精力',
      recent7DayAvgLabel: '近 7 天平均精力',
      belowBaselineLabel: '低於個人均值的紀錄數',
      belowBaselineValueTemplate: '{count} ({pct}%)',
      weekdayPatternTitleTemplate: '偵測到{weekday}重複性精力下降規律',
      weekdayPatternNoteTemplate:
        '依據 {count} 天模擬歷史紀錄計算（跨 {weeks} 週，{pct}% 的{weekday}低於均值 ≥8 分）。',
      overallAvgEnergy: '整體平均精力',
      weekdayAvgEnergyTemplate: '{weekday}平均精力',
      weekdayObservationsTemplate: '{weekday}觀察次數',
      prevDayAvgSleep: '前一日平均睡眠',
      future7DayTitle: '未來 7 天趨勢預估',
      estimatedIndexColon: '預估精力指數：',
      confidenceColon: '信心程度：',
      confidenceLevels: {
        Moderate: '中等',
        Low: '較低',
        'Insufficient Data': '資料不足',
      },
      insufficientDataTitle: '歷史資料不足，暫無預估',
      insufficientDataBody: '目前缺少足夠的歷史紀錄，尚無法為該日生成有參考意義的規律預估。',
      insufficientDataShort: '資料不足',
      forecastFooterLabel: '基於規律的預估 — 展示數據',
      whyIdentifiedTitle: '系統為何識別出這項規律？',
      observedHistoricalTitle: '已觀察到的歷史數據',
      estimatedFutureTitle: '未來預估參考值',
      evidenceSteadyObserved: [
        '{count} 天模擬精力紀錄顯示您的指數穩定在 {min} 至 {max} 之間（均值 {mean}，近 7 天均值 {recent7}）。',
        '所有紀錄的前一晚平均睡眠時長為 {sleep} 小時，共有 {belowCount} 天（{belowPct}%）低於個人均值。',
      ],
      evidenceSteadyObservedNoSleep: [
        '{count} 天模擬精力紀錄顯示您的指數穩定在 {min} 至 {max} 之間（均值 {mean}，近 7 天均值 {recent7}）。',
        '共有 {belowCount} 天（{belowPct}%）低於個人均值。睡眠摘要未開啟分享前，具體睡眠數據保持隱藏。',
      ],
      evidenceSteadyEstimated: [
        '依據各工作日歷史均值（75%）與近 7 天均值（{recent7}，25%），未來 7 天預計維持在 {minForecast}–{maxForecast} 區間。',
        '預估僅反映近期規律穩定性，並非絕對確定的結果。',
      ],
      evidencePatternObserved: [
        '在連續 {count} 個{weekday}（跨 {weeks} 週）的紀錄中，精力平均值為 {weekdayMean}，低於 {totalDays} 天整體均值 {overallMean}（{belowPct}% 的紀錄低於均值 ≥8 分）。',
        '這些{weekday}對應的前一晚平均睡眠為 {prevSleep} 小時，比其他工作日夜晚少約 {sleepDiff} 小時。',
      ],
      evidencePatternSleepPrivate: '在個人設定開啟「睡眠摘要」分享前，{name} 的睡眠詳情保持私密。',
      evidencePatternSleepUnavailable: '缺少足夠的有效前一晚睡眠紀錄，暫無法比較{weekday}前的睡眠時長。',
      evidencePatternEstimated: [
        '結合 75% 歷史{weekday}均值（{weekdayMean}）與 25% 近 7 天均值（{recent7}），預計 {date} 精力指數為 {score} / 100（{confidence}信心程度）。',
        '此預估僅作為合理安排輕鬆行程的參考，並非確定結果或醫療判斷。',
      ],
      evidenceInsufficientEstimated: ['{weekday}的歷史資料不足，暫無法生成可靠的規律預估。'],
      viewCareSuggestions: '查看關懷建議',
      sectionTodayOverview: '今日多維概覽',
      sectionSleepPatterns: '睡眠節律與階段',
      sectionHrvTrends: '心率變異性 (HRV) 趨勢',
      sectionRhrTrends: '靜息心率趨勢',
      sectionActivityPatterns: '活動與步數規律',
      personalBaselineLabel: '個人基線均值',
      latestReadingLabel: '最新讀數',
      deviationLabel: '較個人基線',
      sleepStagesTitle: '睡眠階段分佈',
      sleepStagesAvgNote: '60 天均值 · 最近一晚',
      stageDeep: '深睡',
      stageRem: '快速動眼',
      stageLight: '淺睡',
      stageAwake: '清醒',
      hrvMetricNoteTemplate: '指標：{metric} · 僅對比個人歷史基線（絕不跨伴侶橫向比較）',
      rhrUnit: '次/分',
      hrvUnit: 'ms',
      stepsLabel: '今日步數',
      steps7dAvgLabel: '近 7 天日均步數',
      intensityLabel: '活動強度',
      intensityLevels: {
        Low: '輕度',
        Moderate: '中等',
        Vigorous: '較高',
      },
      weeklyActivityTitle: '週內各日活動分佈',
      missingDaysNoteTemplate: '已紀錄 {valid} / {total} 天 · 缺失日期留空處理',
      metricUnavailable: '暫無數據',
      metricPrivateTemplate: '{name} 已將該指標設為私密。',
      metricEnableHint: '在「我的」頁面開啟分享後即可共同查看。',
      cycleOptInNoteTemplate: '選用已紀錄週期階段：{phase}（第 {day} 天）· 模擬推算週期',
      nonDiagnosticBanner: '僅作健康節律趨勢參考——不構成醫療診斷或情緒判斷。',
      freeTierInsightsBanner: '免費版：基礎摘要預覽 · 升級伴侶尊享版解鎖完整多維趨勢詳情。',
      premiumTierInsightsBanner: '伴侶尊享版已啟用 · 雙方均已解鎖完整多維歷史趨勢',
      last30DaysFree: '最近 30 天（免費版）',
      membershipLock: {
        freeTrendBanner:
          '免費版支援查看最近 30 天精力趨勢；升級伴侶尊享版可解鎖完整 60 天歷史與規律詳析。',
        unlock60DayBtn: '解鎖 60 天趨勢',
        advancedBadge: '伴侶尊享版 · 多維深度洞察',
        advancedTitle: '睡眠分期、HRV、靜息心率與規律依據詳情',
        advancedDesc:
          '查看多維恢復指標、個人 HRV/靜息心率基線對比、週內活動分佈以及更完整的統計規律依據（始終嚴格遵循隱私分享開關）。',
        advancedBenefits: [
          '60 天完整精力歷史趨勢與週規律對比',
          '睡眠結構分期分佈（深睡 / REM / 淺睡 / 清醒）',
          'HRV（嚴格區分 SDNN/RMSSD）與靜息心率個人基線偏離',
          '更詳盡的歷史觀測與未來預測統計學依據',
        ],
        teaserPrivacyNote: '所有進階健康指標依然嚴格受個人隱私與資料分享開關控制。',
        upgradeCta: '升級伴侶尊享版',
        returnHomeBtn: '返回首頁',
        basicForecastBadge: '基礎 7 天預估（免費版）',
      },
    },
    care: {
      title: 'AI 關懷',
      subtitle: '微小行動，暖心時刻。',
      defaultRecipient: '預設關懷對象',
      predictedWindowLabel: '預計需要關懷時段：',
      reasonLabel: '推薦依據：',
      patternWindowTemplate: '{date} · 下午至晚間',
      patternReasonTemplate:
        '偵測到{weekday}重複性精力偏低規律（預估 {score} / 100），通常出現在前一晚睡眠偏少（平均 {prevSleep} 小時）之後。',
      patternReasonNoSleepTemplate:
        '依據歷史精力紀錄偵測到{weekday}重複性精力偏低規律（預估 {score} / 100；睡眠詳情保持私密）。',
      steadyWindowLabel: '今晚 · 18:30 – 21:00',
      steadyReasonTemplate:
        '近期精力狀態平穩（整體均值 {overallMean}，近 7 天 {recent7}），輕鬆的晚間互動有助於共同放鬆與情感連結。',
      sharingPausedWindow: '精力摘要已暫停分享',
      sharingPausedReasonTemplate:
        '{name} 已暫停分享精力摘要。以下建議依據對方已儲存的個人關懷偏好產生。',
      personalizedSuggestionsTitle: '個人化關懷建議',
      forRecipient: '為 {name} 準備',
      whyThisFits: '契合原因：',
      suggestedTiming: '建議時間：',
      nonPurchaseTag: '無需消費關懷',
      homeGestureTag: '日常暖心舉動',
      editMessage: '編輯留言',
      hideMessageEditor: '收起編輯',
      customMessageLabel: '傳送給 {name} 的關懷留言',
      sendCare: '發送關懷',
      saveSuggestion: '收藏建議',
      saved: '已收藏',
      viewNotifications: '查看已發送',
      sentToastTitle: '已向 {name} 發送關懷',
      savedToastText: '已將「{title}」加入收藏清單。',
      alreadySavedText: '「{title}」已在您的收藏清單中。',
      respondingToStatusTitle: '正在回應 {name} 的最新已確認狀態',
      respondingToStatusClear: '清除上下文',
      suggestions: {
        'care-jamie-warm-drink': {
          title: '準備一杯熱飲',
          description: '為 Jamie 準備一杯熱奶茶。',
          reason: '符合 Jamie 明確記錄的偏好：喜歡熱奶茶。',
          timing: '11月19日 週四 · 16:00',
          defaultMessage: '想到你週四會比較忙碌，忙完後想喝杯熱奶茶放鬆一下嗎？',
        },
        'care-jamie-quiet-evening': {
          title: '安排安靜的夜晚',
          description: '提議在家享用清淡晚餐或安靜共度晚間時光。',
          reason: '符合 Jamie 偏好安靜活動與忙碌後清淡晚餐的習慣。',
          timing: '11月19日 週四 · 19:00',
          defaultMessage: '週四晚上我們輕鬆一點吧，在家吃頓清淡晚餐，不安排任何奔波。',
        },
        'care-jamie-gentle-checkin': {
          title: '發送輕柔問候',
          description: '傳一句簡短溫暖的關心，不給對方立即回覆的壓力。',
          reason: '無需消費的貼心關懷，契合 Jamie 喜歡輕柔問候的偏好。',
          timing: '11月19日 週四 · 午間',
          defaultMessage: '希望你今天過得輕鬆自在。不用急著回覆，只是想給你加加油！',
        },
        'care-alex-evening-walk': {
          title: '約一場晚間散步',
          description: '邀請 Alex 晚飯後在附近慢走 20 分鐘。',
          reason: '符合 Alex 喜歡輕鬆晚間散步的偏好。',
          timing: '今晚 · 18:30',
          defaultMessage: '晚飯後要不要一起出去慢走 20 分鐘，吹吹晚風放鬆一下？',
        },
        'care-alex-fruit-tea': {
          title: '泡一壺溫熱果茶',
          description: '泡一壺溫暖的水果茶，一起舒緩身心。',
          reason: '符合 Alex 明確記錄的偏好：喜歡水果茶。',
          timing: '今晚 · 20:30',
          defaultMessage: '晚上準備泡一壺溫熱果茶，給你留了一杯喔。',
        },
        'care-alex-supportive-note': {
          title: '發一句暖心鼓勵',
          description: '傳一則簡短的感謝與支持訊息。',
          reason: '無需消費的輕量關懷，符合 Alex 喜歡簡短鼓勵訊息的偏好。',
          timing: '今日任意時間',
          defaultMessage: '這週看你一直很穩健也很貼心，有你在真好！',
        },
        'care-jamie-order-milk-tea': {
          title: '點一杯熱奶茶送給對方',
          description: '透過模擬配送為 Jamie 點一杯溫熱烤奶，輕鬆提神又暖心。',
          reason: '契合 Jamie 喜歡熱奶茶的偏好，適合精力回落的週四午後。',
          timing: '11月19日 週四 · 15:30',
          defaultMessage: '替你點了一杯熱奶茶，下午忙完記得慢慢喝暖暖身！',
        },
        'care-alex-order-dessert': {
          title: '訂一份輕甜晚間小點心',
          description: '為 Alex 點一份清爽的手作小點心，晚飯後輕鬆享用。',
          reason: '可選的暖心外送心意，為平穩的一天增添小小甜意。',
          timing: '今晚 · 19:30',
          defaultMessage: '替你訂了一份不膩口的小點心，今晚一起慢慢品嚐吧。',
        },
      },
      aiEngine: {
        panelTitle: 'Gemini 個人化關懷引擎',
        panelSubtitle: '嚴格依據已授權的偏好與數據規律，產生貼合當下的關懷建議。',
        generateBtn: '產生新建議',
        regenerateBtn: '產生新建議',
        generatingLabel: '正在結合授權資訊產生貼心建議...',
        initialPromptTitle: '準備就緒：產生個人化關懷方案',
        initialPromptBody:
          '點擊下方按鈕，系統將綜合已授權的精力趨勢、已儲存偏好以及接收方顯式回饋，產生無需消費的日常關懷靈感。',
        initialGenerateCta: '產生新建議',
        sourceGeminiBadge: 'Gemini AI 產生',
        sourceFallbackBadge: '本機備援推薦引擎',
        fallbackNoticePrefix: '目前使用本機備援方案：',
        fallbackReasons: {
          missing_api_key: '目前環境尚未設定後端 Gemini 金鑰，已切換為確定性本機建議。',
          api_error: 'Gemini 服務暫時無法使用，已切換為確定性本機建議。',
          network_error: '暫時無法連線後端 AI 介面，已切換為確定性本機建議。',
          timeout: 'AI 產生請求逾時，已切換為確定性本機建議。',
          invalid_response: 'AI 回傳格式未通過結構驗證，已切換為確定性本機建議。',
        },
        evidenceTitle: '本次參考的授權依據',
        limitationsTitle: '謹慎解讀與限制說明',
        whyLabel: '原因：',
        whatLabel: '具體行動：',
        whenLabel: '建議時機：',
        personalizationLabel: '個人化依據：',
        confidenceLabel: '信心程度：',
        categories: {
          'Emotional Support': '情感支持',
          'Practical Help': '實際分擔',
          'Rest & Recovery': '休整恢復',
          'Small Surprise': '小小驚喜',
          'Quality Time': '陪伴時光',
        },
        confidenceLevels: {
          Moderate: '中等',
          Low: '較低',
          'Preference-Based': '基於偏好',
        },
        notRelevantBtn: '不相關',
        moreLikeThisBtn: '多來點這類',
        notRelevantToast: '已記錄——已隱藏「{title}」並調降同類權重。',
        moreLikeThisToast: '已記錄——後續將優先推薦更多「{category}」類建議。',
        feedbackNote: '推薦僅依據接收方在收到關懷後提交的顯式回饋學習，不會重新訓練底層模型。',
        feedbackWeightedBadge: '已結合回饋 ({count})',
        likedBadge: '偏好風格',
        emptyAfterFilterTitle: '目前建議已全數隱藏',
        emptyAfterFilterBody: '點擊「產生新建議」，取得新一輪貼心方案。',
        dismissBtn: '暫不顯示',
        dismissToast: '已從目前清單隱藏「{title}」。',
        recipientLearningNote: '{name} 的接收偏好學習階段：{stage}。',
        maturityLabels: {
          Initial: '初期 (<3 次回饋)',
          Developing: '發展中 (3–5 次回饋)',
          Established: '較穩定 (6+ 次回饋)',
        },
        requiresMoneyTag: '可能涉及花費',
        communicationStyles: {
          'Short Text': '簡短訊息',
          'Voice Message': '語音留言',
          'Practical Action': '實際行動',
          'Shared Activity': '共同活動',
          Surprise: '小驚喜',
        },
        effortLevels: {
          Low: '輕量',
          Medium: '中等投入',
          High: '較高投入',
        },
      },
      tabSuggestions: '關懷建議',
      tabDatePlanning: '約會計畫',
      skipBtn: '略過',
      skippedToast: '已略過「{title}」——僅作發送方清單篩選，不會改變 {name} 的偏好學習。',
      senderVsReceiverNote: '發送方操作（發送、收藏、略過）絕不會修改接收方學習到的個人偏好。',
      datePlanning: {
        headerTitle: '伴侶約會靈感與安排',
        headerSubtitle: '結合雙方授權精力摘要與避開偏好，推薦張弛有度的約會提案。',
        simulatedScheduleNotice: '展示用模擬空閒時段——目前未連接外部 Google 或 Apple 行事曆。',
        normalModeNotice: '個人原型模式——依據你的偏好與模擬時段提供約會靈感，暫未串接伴侶即時行程。',
        partnerEnergyBannerTemplate: '{partner} 已授權精力：{score} / 100 · 優先推薦低壓力輕約會',
        partnerHighEnergyBannerTemplate:
          '{partner} 已授權精力：{score} / 100 · 提供多元選擇，亦包含溫馨居家時光',
        partnerPrivateEnergyBanner: '伴侶精力保持私密——為您均衡展示居家放鬆與戶外約會建議。',
        allCategories: '全部',
        categories: {
          'Outdoor Activities': '戶外活動',
          'Movie Nights': '電影之夜',
          'Restaurant Dates': '餐廳約會',
          'Weekend Trips': '週末短途出遊',
          'Shared Hobbies': '共同興趣',
          'Relaxing Time at Home': '居家放鬆時光',
        },
        energyFitLabels: {
          low_pressure: '輕鬆低負擔',
          balanced: '節奏均衡',
          active: '活力外出',
        },
        budgetLabels: {
          free_or_low: '免費 / 低花費',
          moderate: '適中預算',
        },
        likeBtn: '喜歡',
        likedBtn: '已喜歡',
        skipBtn: '略過',
        skippedBtn: '已略過',
        invitePartnerBtn: '邀請伴侶',
        invitedBadge: '已發出邀請',
        incomingInviteTitle: '來自 {partner} 的約會邀請',
        acceptInviteBtn: '接受邀請',
        declineInviteBtn: '暫不安排',
        markAgreedBtn: '確認達成約會',
        statusLabels: {
          none: '靈感',
          invited: '已邀請',
          accepted: '已接受',
          declined: '已婉拒',
          agreed: '已約好',
        },
        plans: {
          homeTeaSession: {
            title: '居家熱茶與黑膠音樂時光',
            desc: '在家泡一壺熱茶、聽舒緩音樂，零奔波也能溫柔相伴。',
          },
          cozyMovieNight: {
            title: '窩在沙發看場老電影',
            desc: '選一部輕鬆療癒的電影，享受毫無社交壓力的安靜夜晚。',
          },
          harborEveningWalk: {
            title: '傍晚海濱慢步吹風',
            desc: '選一段安靜的濱水步道，以舒緩步調漫步 45 分鐘。',
          },
          sharedSlowCooking: {
            title: '週末慢手料理與共同手作',
            desc: '一起做一頓簡單早餐或並肩完成喜歡的小愛好。',
          },
          quietNeighborhoodDinner: {
            title: '社區安靜小館簡餐約會',
            desc: '避開嘈雜商圈，找一家氛圍溫和的小店吃頓舒適晚餐。',
          },
          unhurriedHalfDayEscape: {
            title: '植物園半日輕鬆自然行',
            desc: '在雙方精力都平穩充沛的週末，來一趟不趕行程的自然漫遊。',
          },
        },
      },
      membershipLock: {
        aiUsageFreeBadge: '免費版：本月已產生 {used} / {limit} 次 AI 建議',
        aiUsagePremiumBadge: '伴侶尊享版 · 無限次個人化 AI 關懷產生',
        aiLimitReachedBadge: '本月免費額度已用完（{limit} / {limit}）',
        aiLimitReachedTitle: '繼續使用預設建議，或升級解鎖無限次 AI 關懷',
        aiLimitReachedDesc:
          '您本月 {limit} 次免費 AI 個人化關懷產生已用完。免費版仍可無限使用預設暖心建議，或升級伴侶尊享版解鎖無限次 Gemini 產生。',
        aiLimitBenefits: [
          '雙方共享無限次 Gemini 個人化 AI 關懷產生',
          '更深入的回饋加權與溝通方式匹配',
          '免費版預設無需消費建議永久可用',
        ],
        basicActivityTitle: '基礎伴侶活動建議（免費版）',
        basicActivitySubtitle:
          '免費版保留基礎低壓力日常靈感；升級伴侶尊享版可解鎖依據雙方精力匹配的個人化約會計畫。',
        datePlanLockedBadge: '伴侶尊享版 · 個人化約會計畫',
        datePlanLockedTitle: '解鎖伴侶精力智慧匹配與雙機約會邀請',
        datePlanLockedDesc:
          '依據伴侶授權精力水準、避開標籤與每週充能心願，智慧排序全部 6 大約會類別，並支援雙機發送邀請與「已約好」狀態同步。',
        datePlanLockedBenefits: [
          '涵蓋 6 大類約會的精力與充能偏好智慧排序',
          '雙機同步伴侶約會邀請、接受與達成確認',
          '自動遵守對方避開標籤與隱私設定',
        ],
        upgradeCta: '升級伴侶尊享版',
        backToSuggestions: '返回關懷建議',
        backToPresets: '瀏覽預設關懷建議',
      },
    },
    notifications: {
      title: '通知中心',
      subtitle: '伴侶之間互相發送與接收的關懷訊息。',
      receivedTab: '已收到',
      sentTab: '已發送',
      newCountSuffix: '則新訊息',
      emptyReceivedTitle: '暫未收到關懷訊息',
      emptyReceivedBody: '當您的伴侶在另一支手機發送關懷建議時，訊息會立即顯示在這裡。',
      emptySentTitle: '暫未發送關懷訊息',
      emptySentBody: '前往 AI 關懷頁面，為伴侶送上一份貼心的提醒或問候。',
      exploreAiCare: '前往 AI 關懷',
      relatedSuggestion: '關聯建議：',
      markAsReceived: '標記為已收到',
      markAsCompleted: '標記為已完成',
      statuses: {
        Sent: '已發送',
        Received: '已收到',
        Completed: '已完成',
      },
      todayPrefix: '今天',
      yesterdayPrefix: '昨天',
      statusUpdateLabel: '每日狀態更新',
      statusUpdateConfirmedBody: '{sender} 確認了今日狀態：{status}。',
      statusUpdateUpdatedBody: '{sender} 更新了今日狀態：{status}。',
      statusUpdatePrivateBody: '{sender} 確認了今日簽到（狀態詳情依隱私設定保持隱藏）。',
      viewOnHomeBtn: '在首頁查看',
      respondWithCareBtn: '用關懷回應',
      feedbackPrompt: '這份關懷合你心意嗎？',
      feedbackHelpful: '有幫助',
      feedbackMoreLikeThis: '多來點這類',
      feedbackNotRelevant: '不相關',
      feedbackRecordedNote: '已私密紀錄偏好，用於優化你後續收到的關懷建議。',
      feedbackSelectedBadge: '已評價：{type}',
      tabNotifications: '通知列表',
      tabCareMoments: '我們的關懷瞬間',
      feedbackNotHelpful: '沒有幫助',
      feedbackNotSuitable: '不適合我',
      quietHoursActiveBanner: '勿擾時段生效中（{start}–{end}）——普通提醒將安靜暫存。',
      suppressedQuietLabel: '勿擾時段已靜默暫存',
      suppressedFrequencyLabel: '已依提醒頻率設定靜音',
      neutralPreviewStatusBody: '你的伴侶更新了今日狀態。',
      neutralPreviewCareTitle: '一則關懷訊息',
      neutralPreviewCareBody: '來自伴侶的新訊息（中性隱私預覽模式）。',
      careMomentsTitle: '我們的關懷瞬間',
      careMomentsSubtitle: '僅自動收錄已標記「已完成」的溫柔關懷回憶。',
      careMomentsEmptyTitle: '暫無已完成的關懷瞬間',
      careMomentsEmptyBody: '當收到的關懷留言被標記為「已完成」時，將自動珍藏於此。',
      careMomentAddNotePlaceholder: '寫一句簡短的回憶備註...',
      careMomentSaveNoteBtn: '儲存備註',
      careMomentSharedBadge: '雙人可見',
      careMomentPrivateBadge: '僅自己可見',
      careMomentToggleShare: '在伴侶回憶中共享',
      membershipLock: {
        recentWindowBadge: '免費版：展示最近 7 天關懷紀錄',
        fullHistoryBadge: '伴侶尊享版 · 完整關懷歷史紀錄',
        lockedArchiveBadge: '伴侶尊享版 · 完整關懷檔案',
        lockedArchiveTitle: '另有 {count} 則較早的已完成關懷瞬間已安全保存',
        lockedArchiveDesc:
          '免費版可查看近 7 天內的關懷瞬間；升級伴侶尊享版即可共同瀏覽完整多週歷史回憶檔案。',
        lockedArchiveBenefits: [
          '完整多週伴侶關懷回憶時間線無限瀏覽',
          '隨時重溫雙方備註與已完成的美好瞬間',
          '每則紀錄仍可獨立控制雙方共享可見性',
        ],
        upgradeCta: '升級伴侶尊享版',
        backToNotifications: '返回通知列表',
      },
    },
    surpriseCare: {
      sendAsSurpriseBtn: '以驚喜形式送出',
      preparedSectionTitle: '已準備的驚喜關懷',
      preparedSectionSubtitle:
        '管理為 {partner} 準備的驚喜關懷。尚未揭曉的驚喜支援修改或取消。',
      normalPreparedSubtitle: '你發出的驚喜關懷紀錄，未揭曉的預約可隨時修改或取消。',
      normalUnpairedHint: '請先在「個人」頁面完成伴侶本地配對，再向伴侶發送驚喜關懷。',
      normalLocalSentHint: '伴侶端揭曉與接收方回饋需雙機配對；已發送紀錄保存在本地。',
      editSurpriseBtn: '修改',
      cancelSurpriseBtn: '取消',
      demoUnlockNowBtn: '展示：立即設為可揭曉',
      demoUnlockedToast: '已為 {partner} 解鎖驚喜，現在可以在對方手機上打開了。',
      createdSentToast: '已立即將驚喜關懷發送給 {partner}。',
      createdScheduledToast: '已為 {partner} 預約驚喜關懷（已發送中性神祕預告）。',
      updatedToast: '已更新預約的驚喜關懷。',
      cancelledToast: '已取消尚未揭曉的驚喜關懷。',
      categories: {
        personal_touch: {
          label: '貼心心意',
          examples: '鼓勵留言 · 手寫風卡片 · 語音概念',
          desc: '一句鼓勵話語、手寫風電子卡片或發自內心的感謝。',
        },
        thoughtful_gesture: {
          label: '溫柔行動',
          examples: '熱飲點心 · 舒緩夜晚 · 提醒休息',
          desc: '準備一杯喜歡的飲品或小零食、營造舒適夜晚等日常貼心行動。',
        },
        shared_moments: {
          label: '共處時光',
          examples: '線上觀影 · 一起聽歌 · 約會計畫',
          desc: '輕鬆無壓力的雙人陪伴活動，或關聯一份伴侶約會邀請。',
        },
      },
      noteStyles: {
        standard: '溫暖卡片',
        handwritten_note: '手寫風便籤',
        voice_placeholder: '語音心意（模擬）',
      },
      voicePlaceholderBadge: '模擬語音心意概念 — 目前原型暫不支援真實音訊錄製與播放',
      handwrittenBadge: '手寫風電子便籤',
      modal: {
        createTitle: '以驚喜形式送出',
        editTitle: '修改預約的驚喜關懷',
        stepLabel: '第 {current} / {total} 步',
        step1Title: '1. 選擇並編輯關懷',
        step2Title: '2. 選擇送達方式',
        step3Title: '3. 預覽並確認',
        sourceIdeaLabel: '源於 AI 關懷靈感',
        whyFitsLabel: '貼合原因',
        suggestedTimingLabel: '建議時機',
        categoryLabel: '驚喜關懷類別',
        noteStyleLabel: '呈現形式',
        titleInputLabel: '驚喜標題',
        actionInputLabel: '具體關懷行動',
        messageInputLabel: '寫給 {partner} 的話',
        linkDatePlanLabel: '關聯伴侶約會計畫（可選）',
        noDatePlanOption: '暫不關聯具體約會',
        datePlanHiddenNote:
          '若選擇「先保密，稍後驚喜揭曉」，該約會邀請將在揭曉前對伴侶保持隱藏。',
        nonCommercialNotice: '所有類別均包含非商業、零花費的日常溫暖表達，無需花錢也能表達關懷。',
        tellNowTitle: '方式 A：現在告訴對方',
        tellNowDesc: '立即將這份關懷分享給你的伴侶。',
        keepSurpriseTitle: '方式 B：先保密，稍後驚喜揭曉',
        keepSurpriseDesc: '暫時隱藏具體內容，在特別的時刻再為伴侶揭曉。',
        revealTimeLabel: '選擇揭曉時間',
        revealPresets: {
          this_evening: '今晚（19:30）',
          tomorrow_morning: '明早（09:00）',
          next_pattern_window: '下週四低谷前窗口（16:00）',
          demo_quick: '展示快速揭曉（+5秒）',
          custom: '自訂時間',
        },
        customRevealInputLabel: '自訂揭曉日期與時間',
        neutralPreviewTitle: '中性預告通知預覽（伴侶端可見）',
        neutralPreviewHeading: '驚喜關懷',
        neutralPreviewBody: '有人為你準備了一份小小的驚喜。',
        simulatedScheduleNote:
          '原型階段為本地前端模擬定時揭曉，在應用程式處於活動狀態時檢查並開放（不含遠端系統推播服務）。',
        visibilityLabel: '關懷瞬間可見性',
        visibilityShared: '完成後在伴侶回憶共享',
        visibilityPrivate: '僅保留為私密紀錄',
        summaryCategory: '關懷類別',
        summaryTitle: '驚喜標題',
        summaryAction: '具體行動',
        summaryMessage: '附言內容',
        summaryDelivery: '送達方式',
        summaryRevealAt: '揭曉時間',
        summaryImmediate: '立即送達',
        summaryVisibility: '回憶可見性',
        summaryLinkedDate: '關聯約會',
        backBtn: '上一步',
        nextBtn: '下一步',
        confirmSendNowBtn: '立即發送驚喜關懷',
        confirmScheduleBtn: '確認預約驚喜關懷',
        confirmEditBtn: '儲存修改',
      },
      statuses: {
        Draft: '草稿',
        Scheduled: '已預約保密',
        Sent: '已送達',
        Revealed: '已揭曉',
        Completed: '已完成',
        Cancelled: '已取消',
      },
      recipient: {
        tellNowCardTitle: '來自 {sender} 的一份小關懷 ❤️',
        maskedCardTitle: '驚喜關懷',
        maskedCardBody: '有人為你準備了一份小小的驚喜。',
        maskedWaitingHint: '預計於 {time} 揭曉，具體內容目前為你溫柔保密。',
        maskedReadyHint: '揭曉時刻已到！準備好時點擊下方打開驚喜。',
        openSurpriseBtn: '打開我的驚喜',
        openedBanner: '剛剛打開 · 驚喜已揭曉',
        revealScheduledLabel: '預約揭曉時間',
        linkedDateTitle: '關聯的約會邀請',
        markCompletedBtn: '標記為已完成',
        completedBadge: '已珍藏至「我們的關懷瞬間」',
        momentsSurpriseBadge: '驚喜關懷',
        feedbackPrompt: '這份驚喜讓你感覺如何？',
        feedbackMadeMyDay: '❤️ 超開心的一天',
        feedbackHelpful: '😊 很貼心有幫助',
        feedbackNotMyThing: '不太合我心意',
        senderStatusWaiting: '保密至 {time}',
        senderStatusSent: '已送達 {partner}',
        senderStatusRevealed: '{partner} 已打開驚喜',
        senderStatusCompleted: '已共同完成',
        senderStatusCancelled: '已取消',
        senderOnlyReadonlyHint: '僅接收方回饋會用於後續推薦偏好學習。',
      },
    },
    deliveryCare: {
      purchaseBadge: '可下單心意好物',
      orderNowBtn: '立即下單',
      remindLaterBtn: '稍後提醒我',
      notNowBtn: '暫不考慮',
      notNowToast: '已暫時略過「{title}」——不會改變 {name} 的學習偏好。',
      reminder: {
        sheetTitle: '設定稍後提醒',
        sheetSubtitle: '先把「{title}」收好，等到合適的時間再提醒你。',
        presetInOneHour: '1 小時後',
        presetLaterToday: '今天晚些時候（18:00）',
        presetTomorrow: '明天上午（09:30）',
        presetCustom: '自訂日期與時間',
        customDateTimeLabel: '選擇提醒時間',
        confirmBtn: '儲存提醒',
        scheduledToast: '已設定於 {time} 提醒。應用程式開啟或重新造訪時會自動顯示。',
        clientOnlyNote: '提醒僅在應用程式處於使用中或重新開啟時於本機觸發（不含系統背景推播）。',
        dueSectionTitle: '到期的關懷提醒',
        dueSectionSubtitle: '先前延後的心意好物現在可以安排囉。',
        dueBadge: '已到期',
        rescheduleBtn: '重新定時',
        dismissBtn: '忽略',
        actNowBtn: '立即下單',
        presets: {
          in_1_hour: '1 小時後',
          later_today: '今天晚些時候',
          tomorrow: '明天',
          custom: '自訂時間',
        },
      },
      platform: {
        simulatedBanner: '模擬外部配送平台',
        simulatedDisclaimer: '展示版購物結帳介面——不涉及真實商家、金流付款或實際外送員配送。',
        merchantLabel: '嚴選暖心好物工坊（模擬）',
        itemSectionTitle: '已選心意商品',
        variantLabel: '規格 / 口味選擇',
        quantityLabel: '數量',
        recipientLabel: '收件人',
        addressLabel: '配送地址（展示 / 本機）',
        addressPlaceholder: '請輸入模擬收件地址或位置備註',
        addressRequiredHint: '請先填寫配送地址，再送出模擬訂單。',
        useDemoAddressBtn: '填入展示地址',
        giftNoteLabel: '附贈心意留言',
        giftNotePlaceholder: '寫一句想對伴侶說的話...',
        platformNoteLabel: '配送備註（選填）',
        platformNotePlaceholder: '例如：輕放櫃檯或門邊置物架',
        priceSummaryTitle: '模擬費用明細',
        subtotalLabel: '商品小計',
        deliveryFeeLabel: '模擬配送費',
        totalLabel: '模擬合計',
        privacyNotice: '健康數據、睡眠細節與 AI 分析依據絕不會同步至外部配送平台。',
        confirmOrderBtn: '確認模擬下單',
        cancelExitBtn: '返回 DualCharge',
        confirmedBadge: '模擬訂單已確認',
        confirmedTitle: '已在模擬平台成功下單',
        confirmedSubtitle: '你的模擬配送訂單已建立。請返回 DualCharge 選擇何時告訴伴侶。',
        orderNumberLabel: '訂單編號',
        etaLabel: '預計送達',
        returnToAppBtn: '返回 DualCharge',
      },
      revealChoice: {
        title: '想以哪種方式告訴伴侶？',
        subtitle: '可選擇立即發送完整訂單動態，或在送達前保持神秘驚喜。',
        tellNowTitle: '現在告訴 Ta',
        tellNowDesc: '立即發送包含商品名稱、縮圖、留言、預計送達時間與即時進度的通知。',
        keepSurpriseTitle: '先保密作為驚喜',
        keepSurpriseDesc: '現在僅顯示溫和的神秘提示。商品、照片與物流細節在送達前保持嚴格隱藏。',
        maskedPreviewTitle: '保密期間伴侶端顯示預覽：',
        maskedPreviewBody: '有人為你準備了一份小小驚喜。❤️',
        confirmBtn: '確認通知方式',
      },
      tracking: {
        sectionTitle: '模擬訂單與驚喜配送追蹤',
        sectionSubtitle: '查看模擬配送進度，並可一鍵演練各個物流節點。',
        demoSimControlsTitle: '展示物流節點模擬器',
        etaPrefix: '預計送達：',
        revealModeTellNow: '已立即告知伴侶',
        revealModeSurprise: '送達前保持神秘驚喜',
        cancelOrderBtn: '取消訂單',
        cancelledToast: '模擬訂單 #{orderNumber} 已取消。',
        stageUpdatedToast: '訂單 #{orderNumber} 已推進至：{stage}。',
        deliveredSurpriseToast: '訂單 #{orderNumber} 已送達——已自動為 {partner} 揭曉驚喜！',
        noAutoCompleteHint: '送達後需在通知中手動確認，才會記入「我們的關懷瞬間」。',
        stages: {
          'Order Confirmed': '訂單已確認',
          Preparing: '商家製作中',
          'Picked Up': '外送員已取餐',
          'Out for Delivery': '正在配送中',
          Delivered: '已送達',
          Cancelled: '已取消',
        },
        simulateButtons: {
          preparing: '模擬：製作中',
          pickedUp: '模擬：已取貨',
          outForDelivery: '模擬：配送中',
          delivered: '模擬：已送達',
        },
      },
      recipient: {
        maskedTitle: '一份小驚喜正在路上',
        maskedBody: '有人為你準備了一份小小驚喜。❤️',
        maskedProgressHint: '好物細節與照片將在送達後為你揭曉。',
        revealedTitle: '一份暖心好物已送達',
        deliveredSurpriseBanner: '你的驚喜好物已經送達囉！',
        orderDetailsLabel: '模擬外送心意',
        deliveryProgressLabel: '配送進度',
        feedbackPrompt: '這份心意感覺如何？',
        feedbackLovedIt: '超喜歡',
        feedbackThankYou: '謝謝你',
        feedbackNotPreference: '不太合我偏好',
        feedbackSavedNote: '已紀錄接收方回饋。',
        markCompletedBtn: '標記為已完成',
        completedMomentToast: '已紀錄到「我們的關懷瞬間」！',
        senderReadonlyNote: '等待 {partner} 收到後給予回饋與完成確認。',
      },
    },
    profile: {
      roles: {
        alex: '伴侶 A · 展示帳號',
        jamie: '伴侶 B · 展示帳號',
      },
      simulatedDemoProfile: '模擬展示資料',
      languageSectionTitle: '語言設定',
      languageSectionDesc: '切換後兩支手機將同步更新，並自動儲存於本機。',
      languages: {
        en: 'English',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
      },
      coupleSettingsTitle: '伴侶關係設定',
      partnerName: '伴侶姓名',
      demoPairingCode: '展示配對碼',
      connectionStatus: '連線狀態',
      connectedStatusValue: '已連線 · 共享展示伴侶',
      dataSharingTitle: '資料分享與隱私控制',
      dataSharingDesc: '您可以自主決定允許 {partner} 查看哪些健康摘要，變更會立即生效。',
      energySummaryTitle: '精力摘要',
      energySummaryDesc: '分享每日預估精力指數',
      sleepSummaryTitle: '睡眠摘要',
      sleepSummaryDesc: '分享睡眠時長與睡眠品質評分',
      activitySummaryTitle: '活動摘要',
      activitySummaryDesc: '分享每日活動分鐘數',
      cycleTitle: '生理週期資訊',
      cycleDesc: '選用功能 · 預留給未來版本（預設不啟用）',
      sharingFeedbackOn: '已向 {partner} 開啟「{label}」分享。',
      sharingFeedbackOff: '已向 {partner} 隱藏「{label}」。',
      carePreferencesTitle: '個人關懷偏好',
      carePreferencesDesc: '這些偏好標籤將協助 AI 關懷提供更貼近心意的建議。',
      newPreferencePlaceholder: '新增關懷偏好...',
      addButton: '新增',
      removeTagAria: '移除 {tag}',
      presetTags: {
        alex_short_messages: '簡短鼓勵訊息',
        alex_evening_walks: '輕鬆晚間散步',
        alex_fruit_tea: '水果茶',
        alex_no_surprise_visits: '避免突然造訪',
        jamie_quiet_time: '安靜獨處或陪伴時間',
        jamie_light_dinner: '清淡晚餐',
        jamie_warm_milk_tea: '熱奶茶',
        jamie_gentle_checkins: '輕柔問候',
        jamie_no_crowds: '忙碌後避免擁擠活動',
      },
      membershipTitle: '會員方案',
      demoPricingProposal: '展示定價方案',
      freePlanTitle: '免費版',
      freePrice: 'HK$0',
      perMonth: '/ 月',
      freeBenefits: ['基礎精力摘要', '基礎規律洞察', '有限的關懷建議'],
      premiumPlanTitle: '伴侶尊享版',
      premiumPrice: 'HK$28–38',
      perCoupleMonth: '/ 對 / 月',
      premiumBenefits: [
        '更深入的歷史規律分析',
        '更詳細的未來趨勢預估',
        '高度個人化的關懷建議',
        '歷史關懷偏好洞察紀錄',
      ],
      pricingProposalNote: '港幣參考定價 — 僅作產品展示方案呈現',
      explorePremium: '了解尊享會員',
      premiumModalTitle: '伴侶尊享版說明',
      premiumModalBody:
        '伴侶共享同一份訂閱方案，建議定價為每對伴侶每月 HK$28–38。Alex 與 Jamie 雙方皆可解鎖 60 天深度規律分析、7 天趨勢預估與偏好驅動的專屬關懷建議。',
      premiumModalDisclaimer: '此為會員資訊模擬彈窗 — 本原型不會發起任何真實付款或扣款。',
      premiumConfirmButton: '確認體驗展示方案',
      premiumConfirmedBanner: '已記錄展示體驗意向！正式版本中伴侶雙方僅需一份共同訂閱。',
      closePreview: '關閉',
      savedLibraryTitle: '已收藏的關懷建議',
      savedLibraryDesc: '你的個人關懷靈感庫（共 {count} 則）。收藏操作不會影響偏好學習權重。',
      savedEmptyText: '暫無收藏建議。前往 AI 關懷收藏喜歡的靈感，隨時在此回看。',
      goToCareBtn: '前往 AI 關懷',
      viewDetailsBtn: '查看詳情',
      hideDetailsBtn: '收起詳情',
      removeSavedBtn: '移除',
      savedOnLabel: '收藏於',
      sourceLabels: {
        gemini: 'Gemini AI',
        fallback: '備援推薦引擎',
        preset: '精選日常關懷',
      },
      learnedProfileTitle: 'DualCharge 正在學習的偏好',
      learnedProfileDesc: '僅依據你在收到關懷後提交的顯式回饋整理，不依據發送方操作或進行心理猜測。',
      learningMaturityLabel: '學習階段',
      maturityDescriptions: {
        Initial: '初期（少於 3 次評價）——仍在溫和探索你的日常偏好。',
        Developing: '發展中（3–5 次評價）——已從你的回饋中形成初步偏好傾向。',
        Established: '較穩定（6 次及以上評價）——多次顯式回饋沉澱出更清晰的偏好方向。',
      },
      feedbackCountsLabel: '共 {total} 次評價（{positive} 次正向 · {negative} 次負向）',
      preferredCategoriesLabel: '偏好關懷類別',
      preferredStylesLabel: '偏好溝通方式',
      noLearnedDataYet: '暫未提交過接收關懷後的顯式偏好回饋。',
      clearLearnedBtn: '清空已學習偏好',
      clearLearnedDone: '已清空學習到的偏好權重。',
      connectedHealthTitle: '已連結的健康數據',
      connectedHealthDesc: '本裝置上的模擬健康數據連線狀態。',
      platformLabel: '數據平台',
      connectionLabel: '連線狀態',
      permissionLabel: '授權範圍',
      lastSyncLabel: '最近同步',
      statusConnected: '已連線',
      statusDisconnected: '未連線',
      permissionGranted: '已授權（睡眠、心率、HRV、活動）',
      permissionNone: '未綁定健康平台',
      syncNowBtn: '立即同步',
      syncedToast: '已刷新模擬健康同步（{time}）。',
      simulatedHealthNotice: '此為展示用模擬 Apple Health / Health Connect 數據集。',
      normalHealthEmptyNote: '個人原型模式暫未串接真實健康介面，每日狀態透過手動簽到紀錄。',
      heartRateTitle: '靜息心率',
      heartRateDesc: '向 {partner} 分享每日靜息心率趨勢',
      hrvTitle: '心率變異性 (HRV)',
      hrvDesc: '分享個人 HRV 趨勢（絕不跨伴侶比較基線）',
      cycleTrackingOptInTitle: '開啟生理週期紀錄（選用）',
      cycleTrackingOptInDesc: '預設關閉的個人追蹤開關；需先開啟此項才可選擇分享週期摘要。',
      cycleShareTitle: '分享生理週期階段摘要',
      cycleShareDesc: '需單獨明確授權，僅在開啟生理週期紀錄後可用。',
      notifPrefsTitle: '智慧通知與勿擾設定',
      notifPrefsDesc: '設定勿擾時段、提醒頻率與隱私中性鎖屏預覽。',
      quietHoursToggle: '勿擾時段',
      quietHoursDesc: '在休息時段暫停普通提醒音與未讀角標',
      quietStartLabel: '開始時間',
      quietEndLabel: '結束時間',
      allowImportantQuietLabel: '勿擾期間允許重要更新',
      allowImportantQuietDesc: '每日狀態確認與約會邀請仍可送達提醒',
      frequencyLabel: '提醒頻率',
      frequencyOptions: {
        low: '低頻',
        standard: '標準',
        important_only: '僅重要提醒',
      },
      shareStatusNotifsLabel: '傳送每日狀態更新通知',
      shareStatusNotifsDesc: '確認今日狀態簽到後向伴侶發送狀態更新提醒',
      sensitivePreviewLabel: '敏感資訊通知預覽',
      sensitivePreviewOptions: {
        full: '顯示已授權詳情',
        neutral: '中性預覽（隱藏具體內容）',
      },
      reuseCareBtn: '直接發送',
      reusedCareToast: '已將「{title}」發送給 {partner}。',
      oneCouplePlanBadge: '一份伴侶訂閱，兩人共同解鎖',
      billingMonthlyLabel: '按月方案',
      billingYearlyLabel: '按年方案',
      monthlyPrice: 'HK$38',
      monthlyUnit: '/ 對 / 月',
      yearlyPrice: 'HK$288',
      yearlyUnit: '/ 對 / 年',
      yearlySavingsNote: '較月付省約 37% · 提案階段參考定價假設',
      premiumActiveBadge: '伴侶尊享版已啟用',
      premiumActiveBothNote: 'Alex 與 Jamie 雙方已共同解鎖（生效於 {date} · 模擬開通）。',
      upgradeCtaBtn: '立即升級伴侶尊享版',
      managePlanNote: '此為展示模擬開通流程——點擊頂部「重設展示」可恢復免費版，不涉及真實扣款。',
      normalPremiumUnavailableNote: '個人原型模式暫未開放真實會員購買流程。',
      widgetPreviewTitle: '伴侶桌面小工具預覽',
      widgetPreviewBadge: '桌面小工具預覽 — 將隨原生 App 上線',
      widgetPreviewDesc: '提前預覽 iOS 與 Android 桌面小工具樣式；敏感生理指標預設隱藏。',
      widgetStyles: {
        shared_energy: '共享精力狀態',
        care_reminder: '溫柔關懷提醒',
        daily_goal: '每日溫和目標',
        date_countdown: '約會倒數計時',
      },
      widgetMockCopy: {
        sharedEnergySub: '今日精力輕簡狀態',
        careReminderTitle: '午後熱飲小提醒',
        careReminderSub: '建議 16:00 溫柔送上',
        dailyGoalTitle: '晚間舒緩放鬆',
        dailyGoalSub: '輕步走 18 分鐘 · 共處靜謐時光',
        dateCountdownTitle: '週五電影之夜',
        dateCountdownSub: '週五 · 20:00 · 雙方已約好',
        sensitiveHiddenNote: '敏感健康數據（心率、HRV、睡眠、週期）預設在桌面小工具中隱藏。',
      },
      membershipUpgrade: {
        subTabMain: '個人檔案與設定',
        subTabMembership: '尊享會員方案',
        backToProfile: '返回個人檔案',
        openMembershipPageBtn: '查看會員對比與升級',
        currentStatusLabel: '目前方案',
        freeStatusTitle: '免費版',
        freeStatusDesc:
          '包含核心每日簽到、基礎精力洞察、每月 5 次 AI 關懷產生、近 7 天關懷歷史及完整隱私控制開關。',
        premiumStatusTitle: '伴侶尊享版已啟用',
        premiumStatusDesc: '一份伴侶訂閱，兩人共同解鎖——雙方手機均已同步升級。',
        purchasedByTemplate: '由 {name} 於 {date} 開通（{plan}）',
        welcomeBanner: '歡迎加入伴侶尊享版！你們的共享陪伴體驗已同步升級。',
        illustrativePricingLabel:
          '展示提案參考定價（非真實商業訂閱收費，不會收集任何銀行卡或支付資訊）。',
        comparisonTitle: '免費版 vs 伴侶尊享版功能對比',
        comparisonSubtitle:
          '基礎簽到、隱私控制與核心關懷體驗永久免費；尊享版帶來更深度的雙人洞察與客製化體驗。',
        colFeature: '功能與體驗',
        colFree: '免費版',
        colPremium: '伴侶尊享版',
        accessBadges: {
          free_included: '免費版已包含',
          premium_enhanced: '尊享版全面增強',
          premium_exclusive: '尊享版專屬解鎖',
        },
        matrixRows: {
          pairing: { label: '伴侶配對與雙機關聯', free: '已包含', premium: '已包含' },
          daily_checkin: { label: '每日精力簽到與概覽', free: '已包含', premium: '已包含' },
          privacy_controls: { label: '隱私與資料分享開關', free: '完整控制', premium: '完整控制' },
          weekly_recharge: { label: '每週伴侶充能小問卷', free: '已包含', premium: '已包含' },
          energy_trends: {
            label: '歷史趨勢與未來預估',
            free: '30 天趨勢 + 基礎 7 天',
            premium: '60 天完整歷史 + 規律依據',
          },
          ai_care: {
            label: '個人化 AI 關懷建議',
            free: '每月 5 次 + 預設不限',
            premium: '無限次 AI 個人化產生',
          },
          feedback_learning: {
            label: '回饋偏好學習',
            free: '基礎學習階段摘要',
            premium: '完整類別與風格偏好詳析',
          },
          care_history: {
            label: '關懷瞬間歷史紀錄',
            free: '近 7 天紀錄',
            premium: '完整多週回憶檔案',
          },
          date_planning: {
            label: '伴侶活動與約會計畫',
            free: '基礎日常活動建議',
            premium: '精力匹配排序 + 雙機邀請',
          },
          multidimensional_insights: {
            label: '睡眠分期、HRV 與靜息心率',
            free: '鎖定預覽',
            premium: '完整解鎖（遵循隱私開關）',
          },
          notifications_custom: {
            label: '勿擾時段與中性隱私預覽',
            free: '狀態通知與標準頻率',
            premium: '自訂勿擾、低頻與中性遮罩',
          },
          couple_widgets: {
            label: '伴侶桌面小工具預覽',
            free: '鎖定預覽',
            premium: '全部 4 種互動樣式',
          },
        },
        selectPlanBtn: '選擇並升級尊享版',
        selectedPlanBtn: '確認升級資訊（{price}）',
        reviewModalTitle: '確認伴侶尊享版升級',
        reviewPlanLabel: '所選方案',
        reviewBillingLabel: '計費週期',
        reviewPriceLabel: '參考提案價格',
        reviewSharedLabel: '共享權益',
        reviewSharedValue: '一份伴侶訂閱同步涵蓋 {a} 與 {b}',
        reviewNoPaymentNote:
          '模擬展示升級流程——不會採集銀行卡、支付帳戶或產生任何真實扣款。',
        confirmPurchaseBtn: '確認開通展示訂閱',
        unpairedGuardTitle: '需先完成伴侶帳號關聯',
        unpairedGuardBody:
          '伴侶尊享版為雙人共享方案，需在關聯伴侶帳號後方可共同升級使用。',
        unpairedGuardLinkBtn: '前往伴侶連線設定',
        normalModePrototypeNote:
          '個人原型模式已停用真實商業付費；如需體驗完整的雙人共享升級流程，請切換至雙機展示模式。',
        widgetLockedBadge: '伴侶尊享版 · 桌面小工具預覽',
        widgetLockedTitle: '提前體驗 4 種伴侶桌面小工具樣式',
        widgetLockedDesc:
          '互動預覽即將隨原生 iOS / Android App 上線的桌面小工具，敏感生理指標預設隱藏。',
        widgetLockedBenefits: [
          '支援共享精力、關懷提醒、每日目標與約會倒數計時 4 種樣式',
          '桌面小工具預覽 — 將隨原生 App 上線',
        ],
        notifAdvancedLockedBadge: '伴侶尊享版 · 進階通知客製',
        notifAdvancedLockedTitle: '夜間勿擾排程、低頻彙整與中性鎖屏預覽',
        notifAdvancedLockedDesc:
          '每日狀態通知分享與標準提醒在免費版保持可用；升級尊享版可自由設定勿擾時段、重要覆蓋規則與中性隱私預覽。',
        learnedAdvancedLockedNote:
          '免費版展示目前學習階段與回饋總次數；升級伴侶尊享版可查看系統整理的詳細偏好類別與溝通風格。',
        upgradeCta: '升級伴侶尊享版',
      },
    },
    activityTemplates: {
      sentCare: '{actor} 向 {target} 發送了「{suggestion}」。',
      savedCare: '{actor} 收藏了「{suggestion}」。',
      completedCare: '{actor} 將「{suggestion}」標記為已完成。',
      confirmedStatus: '{actor} 確認了今日狀態（{status}）。',
      weeklyRecharge: '{actor} 分享了每週伴侶充能小問卷結果。',
      dateInvite: '{actor} 向 {target} 發出了「{plan}」約會邀請。',
      dateAgreed: '{actor} 與 {target} 確認了「{plan}」約會安排。',
      surpriseScheduled: '{actor} 為 {target} 準備了一份驚喜關懷。',
      surpriseSent: '{actor} 向 {target} 送出了一份驚喜關懷。',
      surpriseRevealed: '{actor} 打開了來自 {target} 的驚喜關懷。',
      surpriseCompleted: '{actor} 完成了一次驚喜關懷瞬間。',
      orderPlacedRevealed: '{actor} 為 {target} 點了一份「{suggestion}」。',
      orderSecretPrepared: '{actor} 悄悄準備了一份貼心驚喜。❤️',
      orderProgress: '送給 {target} 的關懷配送進度更新為：{stage}。',
      orderDelivered: '送給 {target} 的貼心好物已送達！',
      seedSupportive: 'Alex 向 Jamie 發送了一則暖心問候。',
      seedSavedEvening: 'Jamie 收藏了一則輕鬆晚間建議。',
    },
    calendar: {
      weekdaysShort: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
      weekdaysFull: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      monthsFull: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    welcome: {
      headline: '關懷，從讀懂彼此開始。',
      subtitle: '了解伴侶的精力波動規律，發現更貼心、更有分寸的關懷方式。',
      startJourney: '開啟 DualCharge 之旅',
      exploreDemo: '體驗伴侶雙機展示',
      demoFootnote: '全新 Day 1 個人冷啟動 · 與 60 天 Alex & Jamie 雙機展示嚴格隔離',
      returnToWelcome: '歡迎頁',
      enterDemoMode: '雙機展示',
      exitDemoMode: '結束展示',
      personalModeBadge: '個人檢視',
      resumePersonalApp: '以 {name} 的身份繼續',
      loadingPresentationDemo: '正在載入 60 天伴侶雙機展示數據...',
    },
    onboarding: {
      stepCounter: '第 {current} / {total} 步',
      back: '上一步',
      continue: '繼續',
      skipForNow: '暫不設定，略過',
      completeSetup: '開始建立我的精力基線',
      localSetupTag: 'Day 1 個人初始設定',
      step1: {
        title: '先認識一下你吧。',
        subtitle: '建立本機個人檔案。本原型不收集手機號碼、密碼或真實醫療健康紀錄。',
        nicknameLabel: '你的稱呼 / 暱稱',
        nicknamePlaceholder: '請輸入你的稱呼或暱稱',
        nicknameRequiredError: '請輸入稱呼或暱稱後再繼續。',
        avatarLabel: '個人頭像（選填）',
        avatarOptions: {
          'coral-glow': '暖珊瑚',
          'lavender-mist': '柔薰衣草',
          'sage-calm': '鼠尾草',
          'warm-amber': '暖琥珀',
          'photo-a': '肖像 A',
          'photo-b': '肖像 B',
        },
        languageLabel: '介面語言偏好',
      },
      step2: {
        title: '與伴侶建立連結',
        subtitle: '建立邀請碼、輸入伴侶邀請碼，或稍後再邀請伴侶。',
        optionCreate: '建立邀請碼',
        optionJoin: '輸入邀請碼',
        optionLater: '稍後邀請',
        createDesc: '將下方本機模擬邀請碼分享給伴侶，或點擊按鈕在本機模擬配對完成。',
        inviteCodeLabel: '本機邀請碼',
        copyCode: '複製邀請碼',
        copiedCode: '已複製',
        partnerJoinedButton: '模擬伴侶已加入',
        partnerJoinedConfirmed: '已完成本機配對（原型模擬）',
        joinDesc: '輸入 4 位數字邀請碼（如 DC-4829）以在本機模擬與伴侶配對。',
        joinCodeLabel: '伴侶邀請碼',
        joinCodePlaceholder: '請輸入 DC-4829',
        verifyCodeButton: '確認配對',
        invalidCodeError: '請輸入有效的邀請碼（格式 DC-XXXX，例如 DC-4829）。',
        pairingSuccessBanner: '已透過邀請碼 {code} 完成本機原型配對。',
        laterTitle: '暫不配對，先開啟個人體驗',
        laterDesc: '你可以先從 Day 1 開始建立自己的精力基線，隨時前往「我的」頁面邀請伴侶。',
        laterConfirmedBanner: '已選擇「稍後邀請伴侶」，之後可隨時在「我的」中連結。',
        pairingRequiredError: '請完成模擬配對、輸入伴侶邀請碼，或選擇「稍後邀請」後再繼續。',
        localSimulationNote: '僅限本機原型模擬，未連接真實遠端跨裝置伴侶同步。',
      },
      step3: {
        title: '你的數據，由你做主。',
        subtitle: '選擇你願意向伴侶分享的個人狀態摘要。',
        offByDefaultNote: '所有分享開關預設為關閉狀態，僅在你主動開啟後才會共享。',
        privacyFootnote: '你可以隨時在「我的」頁面調整這些權限。',
        cycleFutureBadge: '選用未來功能 · 本原型暫未啟用',
      },
      step4: {
        title: '你喜歡被怎樣溫柔對待？',
        subtitle: '選擇最讓你感到舒適的關懷方式，亦可直接略過此步。',
        preferredCareTitle: '喜歡的關懷方式',
        avoidTitle: '希望避免的安排',
        communicationTitle: '偏好的溝通語氣',
        preferredCareOptions: {
          warm_drinks: '熱飲',
          gentle_messages: '輕柔問候',
          quiet_time: '安靜陪伴/獨處',
          light_meals: '清淡餐食',
          relaxing_walks: '輕鬆散步',
          small_surprises: '小驚喜',
        },
        avoidOptions: {
          crowded_places: '擁擠場所',
          surprise_visits: '突然造訪',
          frequent_messages: '頻繁傳訊息',
          last_minute_plans: '臨時變動計畫',
        },
        communicationOptions: {
          gentle_supportive: '溫柔且體貼支持',
          short_direct: '簡短而直接',
          playful_cheerful: '輕鬆俏皮愉快',
        },
      },
      step5: {
        title: '開始建立你的精力基線',
        subtitle: '你的個人基線從今天正式開始。DualCharge 將依據你主動分享的日常資訊逐步學習。',
        startBaselineTitle: 'Day 1 · 全新個人基線',
        startBaselineBody: '你的歷史紀錄將從 0 開始，每次每日簽到都會累積為你的專屬基線與第 7 天初步洞察。',
        day1Badge: '從第 1 天開始',
        zeroHistoryBadge: '0 筆歷史紀錄',
        firstInsightBadge: '紀錄滿 7 天後解鎖首次初步洞察',
        futureIntegrationsNote: '未來版本將選用支援 Apple Health / Health Connect 等平台串接。',
        noHealthClaimNote: '不會向你的個人帳號匯入任何穿戴裝置數據或展示樣本紀錄。',
        completeBaselineCta: '開始建立我的精力基線',
      },
    },
    normalMode: {
      greetingTemplate: '早安，{name}',
      partnerDisplayName: '伴侶',
      personalRoleLabel: '第 {day} 天 · 個人帳號',
      dayBadgeTemplate: '第 {day} 天',
      baselineBuildingBadge: '基線建立中',
      earlyBaselineBadge: '已產生初步洞察',
      baselineStartingTitle: '你的精力基線正在起步',
      baselineStartingBody:
        'DualCharge 正在開始學習你的日常精力節奏。堅持完成每日狀態簽到，即可逐步建立你的個人基線。',
      firstInsightTimingNote: '累計完成 7 天每日簽到後，將為你產生首次初步洞察。',
      recordedDaysProgress: '已紀錄 {count} / {target} 天',
      checkInSavesBaselineNote: '已儲存至個人紀錄（已紀錄 {count} / 7 天，滿 7 天解鎖初步洞察）。',
      noEnergyIndexYet: '基線建立中',
      avgSelfReportedLabel: '平均主觀精力 ({score} / 5)',
      notEnteredYet: '暫未紀錄',
      invitePartnerTitle: '邀請你的伴侶',
      invitePartnerBody: '正在等待伴侶連結。你可隨時在「我的」頁面完成本機配對並開啟分享。',
      invitePartnerCta: '邀請伴侶',
      waitingForPartnerTitle: '已連結（本機模擬）',
      waitingForPartnerCheckInBody: '正在等待伴侶完成首次每日簽到。',
      pairedStatusValue: '已配對（本機模擬 · {code}）',
      unpairedStatusValue: '等待伴侶連結',
      pairLaterActionHint: '可隨時在「我的」中使用模擬邀請碼完成配對。',
      simulatePartnerJoinNow: '模擬伴侶完成配對 ({code})',
      noCareActivityYet: '暫未產生個人關懷紀錄。',
      insightPreviewBuilding: '你的個人精力基線正在建立中。完成 7 天每日簽到即可解鎖首次初步洞察。',
      insightPreviewEarly: '初步洞察 — 依據你真實紀錄的 {count} 天，平均主觀精力評分為 {avg} / 5。',
      insightsBuildingTitle: '你的個人精力基線正在建立中。',
      insightsBuildingBody: '完成 7 天每日簽到，即可獲得依據你自身數據的首次初步洞察。',
      observedSoFarTitle: '目前已紀錄數據 ({count} / 7 天)',
      observedSoFarEmpty: '暫無每日簽到紀錄。前往首頁完成今日首次簽到，即可開啟第 1 天紀錄。',
      selfReportedScaleNote: '個人主觀精力評分（1–5 分制）',
      earlyInsightBadge: '初步洞察',
      earlyInsightTitle: '初步洞察 — 依據你的前 7 天紀錄',
      earlyInsightSubtitle: '完全依據你親手紀錄的 {count} 天個人簽到數據產生。',
      avgScoreLabel: '平均主觀精力',
      scoreRangeLabel: '紀錄區間',
      dayTransitionsLabel: '相鄰日波動次數',
      mostCommonFeelingLabel: '最常見狀態',
      variationNotes: {
        steady: '在你紀錄的這幾天中，整體精力狀態保持相對平穩。',
        fluctuating: '在你紀錄的這幾天中，日間精力呈現出一定的起伏變化。',
        low_reserve: '在已紀錄的日期中，有較多天傾向於精力偏低或需要多休息。',
      },
      weeklyPatternTitle: '週內規律識別',
      notEnoughWeekdayRepeats: '目前重複觀察次數不足，尚無法識別穩定的每週規律。',
      weeklyPatternRequirementNote:
        '至少需要在 4 個不同自然週中觀察到同一星期幾的有效紀錄（目前單一星期幾最多僅觀察到 {weeks} 週）。',
      preliminaryWeeklyPatternBadge: '初步週規律提示',
      preliminaryWeeklyPatternBody:
        '依據跨 {weeks} 週的真實紀錄初步觀察：{weekday} 平均主觀精力的均值為 {mean} / 5。',
      futureEstimatesInactiveTitle: '未來趨勢預估暫未開啟',
      futureEstimatesInactiveBody: '需累積足夠多週的真實個人歷史數據後，系統才會提供基於歷史規律的未來參考預估。',
      careColdStartTitle: '你的個人化關懷洞察才剛剛起步。',
      careColdStartBody: '隨著我們逐步了解你的日常作息與精力節奏，將能夠提供更貼合的關懷建議。',
      careSourcePreferenceBadge: '依據你主動選擇的偏好',
      careSourceEarlyBaselineBadge: '結合偏好與初期簽到紀錄',
      carePartnerNotPairedNote: '暫未配對伴侶 — 你仍可收藏喜歡的建議，或先在「我的」中配對後再紀錄發送關懷。',
      careLocalSentNote: '已紀錄在你的本機「通知中心」中（本機原型模擬）。',
      careSuggestions: {
        'norm-care-warm-drinks': {
          title: '準備一杯熱飲',
          description: '遞上一杯溫和的熱茶、熱可可或溫開水。',
          reason: '依據你在引導中主動選擇的「熱飲」偏好推薦。',
          timing: '今日方便時隨時',
          defaultMessage: '今天辛苦啦，待會兒想喝杯熱飲慢慢放鬆一下嗎？',
        },
        'norm-care-gentle-messages': {
          title: '發送輕柔問候',
          description: '傳一句簡短溫暖、沒有回覆壓力的關心。',
          reason: '符合你選擇的「輕柔問候」偏好。',
          timing: '午間或傍晚',
          defaultMessage: '不用急著回覆，只是想跟你說聲今天也要照顧好自己，願你一切順心。',
        },
        'norm-care-quiet-time': {
          title: '留出安靜相處時間',
          description: '在家預留 30 分鐘不被打擾、輕鬆安靜的休息時光。',
          reason: '依據你選擇的「安靜陪伴/獨處」偏好推薦。',
          timing: '今晚休息時段',
          defaultMessage: '今晚我們不安排額外瑣事，一起安安靜靜放鬆休息吧。',
        },
        'norm-care-light-meals': {
          title: '安排一頓清淡簡餐',
          description: '準備一頓輕鬆易消化的晚餐，減輕晚間身心負擔。',
          reason: '依據你選擇的「清淡餐食」偏好推薦。',
          timing: '晚餐時段',
          defaultMessage: '今晚我們吃頓清淡省心的晚餐吧，讓身體也好好歇一歇。',
        },
        'norm-care-relaxing-walks': {
          title: '約一場輕鬆散步',
          description: '在安靜的街區一起慢走 15–20 分鐘，呼吸新鮮空氣。',
          reason: '符合你選擇的「輕鬆散步」偏好。',
          timing: '傍晚或晚飯後',
          defaultMessage: '晚飯後要不要一起出去慢慢散步二十分鐘，吹吹風放鬆一下？',
        },
        'norm-care-small-surprises': {
          title: '留一張暖心小紙條',
          description: '準備一句簡短的感謝留言或一個日常小驚喜。',
          reason: '符合你選擇的「小驚喜」偏好。',
          timing: '今日任意時刻',
          defaultMessage: '給你留了一個小小鼓勵，謝謝你一直以來的溫柔陪伴！',
        },
      },
      careContextWindowBuilding: 'Day 1+ · 僅提供基於偏好的日常建議',
      careContextWindowEarly: '初期基線階段 · 非未來趨勢預測',
      notificationsOutgoingOnlyNote: '個人模式中發送的關懷留言僅儲存在本機目前檔案中。',
      modeAndDemoTitle: '展示模式與個人數據管理',
      modeAndDemoDesc: '可隨時進入獨立的 60 天 Alex & Jamie 雙機展示，不會影響你的個人 Day 1+ 紀錄。',
      enterPresentationDemo: '進入雙機展示模式',
      returnToWelcomeBtn: '返回歡迎頁',
      resetOnboardingBtn: '重設個人數據',
      resetOnboardingTitle: '確認清除個人檔案並重設引導？',
      resetOnboardingBody:
        '此操作將清除你的個人暱稱、所有每日簽到紀錄、本機配對、隱私設定與偏好，並返回歡迎頁。雙機展示模式數據不受影響。',
      confirmResetOnboarding: '確認重設',
    },
  },
};

export function formatTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)),
    template
  );
}
