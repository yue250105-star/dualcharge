import type {
  AiCareCategory,
  AiCareCommunicationStyle,
  AiCareConfidence,
  AiCareEffortLevel,
  AiCareFallbackReason,
  AiCareGenerationResult,
  AiCareRecommendation,
  AiCareRequestContext,
  RecentSuggestionRecord,
} from '../types/aiCare.ts';
import type { CheckInOption, LanguageCode } from '../types/dualcharge.ts';
import {
  diversifyRecommendations,
  isRecommendationInCooldown,
} from './recommendationDiversity.ts';
import {
  normalizeRecommendationMetadata,
  normalizeTimingBucket,
} from './recommendationMetadata.ts';

interface LocalizedCandidate {
  id: string;
  category: AiCareCategory;
  actionType: string;
  communicationStyle: AiCareCommunicationStyle;
  effortLevel: AiCareEffortLevel;
  requiresSpendingMoney: boolean;
  tags: string[];
  preferenceKeywords: string[];
  avoidKeywords: string[];
  copy: Record<
    LanguageCode,
    {
      title: string;
      action: string;
      timingPattern: string;
      timingGeneral: string;
      whyPattern: string;
      whySteady: string;
      whyInsufficient: string;
      personalizationWithPref: string;
      personalizationGeneral: string;
      defaultMessage: string;
    }
  >;
}

const WEEKDAYS_BY_LANG: Record<LanguageCode, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  'zh-TW': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

const CHECKIN_LABEL_BY_LANG: Record<LanguageCode, Record<CheckInOption, string>> = {
  en: { good: 'Feeling Good', tired: 'A Bit Tired', rest: 'Need Rest' },
  'zh-CN': { good: '状态不错', tired: '有点疲惫', rest: '需要休息' },
  'zh-TW': { good: '狀態不錯', tired: '有點疲憊', rest: '需要休息' },
};

const CANDIDATE_LIBRARY: LocalizedCandidate[] = [
  {
    id: 'fb-gentle-encouragement-note',
    category: 'Emotional Support',
    actionType: 'supportive_message',
    communicationStyle: 'Short Text',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['gentle', 'short_text', 'no_pressure'],
    preferenceKeywords: ['message', 'check-in', 'gentle', 'short', '问候', '鼓励', '訊息', '問候', '鼓勵'],
    avoidKeywords: ['frequent messages', '频繁发消息', '頻繁傳訊息'],
    copy: {
      en: {
        title: 'Send a Low-Pressure Check-In Note',
        action:
          'Send one brief, supportive message letting {name} know there is zero need to reply right away.',
        timingPattern: 'Next {weekday} · Late Morning or Mid-Afternoon',
        timingGeneral: 'Midday or Early Afternoon',
        whyPattern:
          '{name} has shown lower average energy on {weekday}s ({weekdayMean} vs {overallMean} overall), so a brief encouraging touchpoint may feel supportive without adding social load.',
        whySteady:
          'Even with steady overall energy ({overallMean}), a short supportive check-in reinforces warmth during busy hours.',
        whyInsufficient:
          'Not enough historical days have been recorded yet to detect an individual pattern, so this offers gentle non-intrusive encouragement.',
        personalizationWithPref:
          'Aligned with explicitly selected communication and preference cues ({pref}).',
        personalizationGeneral:
          'A non-commercial, zero-pressure gesture suited for thoughtful couple check-ins.',
        defaultMessage:
          'Thinking of you today — no need to reply quickly, just sending calm support your way.',
      },
      'zh-CN': {
        title: '发一句不催促回复的轻柔问候',
        action: '给 {name} 发一条简短温暖的消息，明确告诉对方不用急着回复，按自己的节奏来。',
        timingPattern: '下一个{weekday} · 上午晚些时候或午后',
        timingGeneral: '午间或下午茶时段',
        whyPattern:
          '{name} 在{weekday}的精力均值相对偏低（{weekdayMean}，整体均值 {overallMean}），一句没有回复压力的问候可能更贴合当天的节奏。',
        whySteady:
          '在整体精力较为平稳（均值 {overallMean}）的情况下，简短的暖心问候也能在忙碌间隙带来轻松支持。',
        whyInsufficient:
          '目前记录天数尚不足以识别个人规律，因此先提供一条温和且无负担的日常关心。',
        personalizationWithPref: '贴合已记录的偏好与沟通风格（{pref}）。',
        personalizationGeneral: '无需花费、不打扰对方专注节奏的轻量级关心方式。',
        defaultMessage: '今天忙的时候慢慢来，不用急着回我消息，只想给你道一声稳稳的支持。',
      },
      'zh-TW': {
        title: '傳一則不催促回覆的輕柔問候',
        action: '傳給 {name} 一則簡短溫暖的訊息，清楚表達不需要立刻回覆，照自己的步調就好。',
        timingPattern: '下一個{weekday} · 上午稍晚或午後',
        timingGeneral: '午間或下午時段',
        whyPattern:
          '{name} 在{weekday}的精力均值相對偏低（{weekdayMean}，整體均值 {overallMean}），一則沒有回覆壓力的問候或許能帶來溫柔支持。',
        whySteady:
          '在整體精力較為平穩（均值 {overallMean}）的情況下，簡短的暖心問候也能在忙碌時段增添安心感。',
        whyInsufficient:
          '目前紀錄天數尚不足以識別個人規律，因此先提供一項溫和且無負擔的日常關懷。',
        personalizationWithPref: '貼合已紀錄的偏好與溝通風格（{pref}）。',
        personalizationGeneral: '無需花費、不打擾對方專注步調的輕量關懷方式。',
        defaultMessage: '今天忙碌時慢慢來就好，不用急著回我訊息，只是想傳一份安穩的支持給你。',
      },
    },
  },
  {
    id: 'fb-voice-encouragement-clip',
    category: 'Emotional Support',
    actionType: 'voice_check_in',
    communicationStyle: 'Voice Message',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['voice', 'warmth', 'low_effort'],
    preferenceKeywords: ['gentle', 'message', 'supportive', '鼓励', '温柔', '問候', '鼓勵'],
    avoidKeywords: ['frequent messages', '频繁发消息', '頻繁傳訊息'],
    copy: {
      en: {
        title: 'Share a 20-Second Calm Voice Note',
        action:
          'Record a brief 20-second voice note wishing {name} a calm afternoon, mentioning one small thing you appreciate about them.',
        timingPattern: 'Next {weekday} · Mid-Afternoon',
        timingGeneral: 'Late Afternoon Wind-Down',
        whyPattern:
          'A short voice note around {weekday} afternoon offers warm connection without requiring {name} to read or type back right away.',
        whySteady:
          'Alongside {name}’s steady baseline ({overallMean}), hearing a warm familiar voice adds relaxed encouragement.',
        whyInsufficient:
          'While historical patterns are still developing, a brief optional voice message feels personal and easy to receive.',
        personalizationWithPref: 'Tuned for {name}’s preferences ({pref}) with zero screen fatigue.',
        personalizationGeneral: 'A brief non-commercial voice gesture that fits busy schedules.',
        defaultMessage:
          'Sent you a quick voice note for whenever you have a spare moment — cheering for you gently today.',
      },
      'zh-CN': {
        title: '录一条 20 秒的轻松语音小鼓励',
        action: '给 {name} 录一段 20 秒的温和语音，祝对方下午顺利，并提一件你很欣赏的小事。',
        timingPattern: '下一个{weekday} · 午后时段',
        timingGeneral: '傍晚下班前',
        whyPattern: '在精力相对较低的{weekday}午后发一条短语音，既温暖又不用让 {name} 费神打字回复。',
        whySteady: '在平稳的日常基线（均值 {overallMean}）下，听见熟悉温和的声音能增添放松感。',
        whyInsufficient: '在基线数据仍在积累时，短语音是一种自然又不打扰的贴心表达。',
        personalizationWithPref: '呼应「{pref}」偏好，无需盯着屏幕回复。',
        personalizationGeneral: '无需消费的轻量关怀，随时可听、轻松无负担。',
        defaultMessage: '给你录了一小段语音，忙完再听就好，今天也要按舒服的节奏慢慢来。',
      },
      'zh-TW': {
        title: '錄一則 20 秒的輕鬆語音小鼓勵',
        action: '給 {name} 錄一段 20 秒的溫和語音，祝對方午後順利，並分享一件你很欣賞的小事。',
        timingPattern: '下一個{weekday} · 午後時段',
        timingGeneral: '傍晚下班前',
        whyPattern: '在精力相對較低的{weekday}午後傳一則短語音，既溫暖也不必讓 {name} 費神打字回覆。',
        whySteady: '在平穩的日常基線（均值 {overallMean}）下，聽見熟悉溫和的聲音能帶來放鬆感。',
        whyInsufficient: '在基線資料仍在累積時，短語音是自然且不打擾的貼心表達。',
        personalizationWithPref: '呼應「{pref}」偏好，無需盯著螢幕回覆。',
        personalizationGeneral: '無需消費的輕量關懷，隨時可聽、輕鬆無負擔。',
        defaultMessage: '錄了一小段語音給你，忙完再聽就好，今天也照自己舒服的步調慢慢來。',
      },
    },
  },
  {
    id: 'fb-quiet-home-recovery',
    category: 'Rest & Recovery',
    actionType: 'quiet_evening',
    communicationStyle: 'Shared Activity',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['quiet', 'home', 'rest'],
    preferenceKeywords: ['quiet', 'rest', 'calm', '安静', '独处', '休息', '安靜', '獨處'],
    avoidKeywords: ['crowded', '拥挤', '擁擠', 'last-minute', '临时', '臨時'],
    copy: {
      en: {
        title: 'Protect a Quiet Low-Stimulus Evening',
        action:
          'Suggest keeping the evening free of errands or social plans so {name} can unwind at home at their own pace.',
        timingPattern: 'Next {weekday} · 6:30 PM – 9:00 PM',
        timingGeneral: 'This Evening · 7:00 PM – 9:00 PM',
        whyPattern:
          'Historical observations indicate {name} may need more rest on {weekday}s (projected {forecastScore}/100), making a low-stimulus home evening helpful.',
        whySteady:
          'Maintaining calm evening recovery helps preserve {name}’s steady baseline ({overallMean}).',
        whyInsufficient:
          'With limited history so far, protecting unscheduled rest time is a safe, gentle way to support recovery.',
        personalizationWithPref:
          'Respects {name}’s stated preference for {pref} and avoids noisy settings.',
        personalizationGeneral:
          'Prioritizes calm recovery at home without requiring purchases or travel.',
        defaultMessage:
          'How about we keep tonight completely open and quiet at home with zero extra errands?',
      },
      'zh-CN': {
        title: '守护一个安静少打扰的夜晚',
        action: '主动提议今晚不安排外出或繁杂琐事，让 {name} 可以在家按自己舒服的节奏彻底放松。',
        timingPattern: '下一个{weekday} · 18:30 – 21:00',
        timingGeneral: '今晚 · 19:00 – 21:00',
        whyPattern:
          '历史观察显示 {name} 在{weekday}可能需要更多休息（预估 {forecastScore}/100），低刺激的居家夜晚更有助于休整。',
        whySteady: '保持平稳的晚间休整，有助于巩固 {name} 稳定的精力基线（均值 {overallMean}）。',
        whyInsufficient: '在历史数据尚不足以判断趋势时，预留不安排日程的休息时段是最稳妥的温柔支持。',
        personalizationWithPref: '尊重 {name} 对「{pref}」的偏好，避开嘈杂拥挤的场景。',
        personalizationGeneral: '无需消费或奔波，专注于居家松弛与恢复精力。',
        defaultMessage: '今晚我们不在外面奔波了，留出安静的居家时光好好歇一歇吧。',
      },
      'zh-TW': {
        title: '守護一個安靜少打擾的夜晚',
        action: '主動提議今晚不安排外出或繁雜瑣事，讓 {name} 可以在家依自己舒適的步調好好休息。',
        timingPattern: '下一個{weekday} · 18:30 – 21:00',
        timingGeneral: '今晚 · 19:00 – 21:00',
        whyPattern:
          '歷史觀察顯示 {name} 在{weekday}可能需要更多休息（預估 {forecastScore}/100），低刺激的居家夜晚更有助於休整。',
        whySteady: '維持平穩的晚間休整，有助於延續 {name} 穩定的精力基線（均值 {overallMean}）。',
        whyInsufficient: '在歷史數據尚不足以判斷趨勢時，預留不排滿行程的休息時段是最穩妥的溫柔支持。',
        personalizationWithPref: '尊重 {name} 對「{pref}」的偏好，避開嘈雜擁擠的場所。',
        personalizationGeneral: '無需消費或奔波，專注於居家放鬆與恢復步調。',
        defaultMessage: '今晚我們就不在外奔波了，保留一段安靜的居家時光好好休息吧。',
      },
    },
  },
  {
    id: 'fb-screen-free-wind-down',
    category: 'Rest & Recovery',
    actionType: 'quiet_evening',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['rest', 'cozy', 'lighting'],
    preferenceKeywords: ['quiet', 'rest', 'calm', '安静', '休息', '安靜'],
    avoidKeywords: ['crowded', '拥挤', '擁擠'],
    copy: {
      en: {
        title: 'Set Up a Cozy Wind-Down Corner Before Bed',
        action:
          'Dim the living-room lights, put on soft ambient music, and keep the space tidy 45 minutes before {name} plans to wind down.',
        timingPattern: 'Next {weekday} · 9:00 PM – 10:00 PM',
        timingGeneral: 'Tonight · 9:00 PM Wind-Down',
        whyPattern:
          'Creating a calmer evening environment ahead of {weekday} may help {name} transition into rest more smoothly.',
        whySteady:
          'A consistent cozy wind-down environment complements {name}’s steady routine ({overallMean}).',
        whyInsufficient:
          'Even without multi-week records, preparing a calm physical space is a gentle, non-intrusive way to help.',
        personalizationWithPref: 'Supports {name}’s comfort around {pref} without forcing conversation.',
        personalizationGeneral: 'Low-effort home environment care requiring zero purchases.',
        defaultMessage: 'Dimmed the lights and put on calm background music for whenever you are ready to unwind.',
      },
      'zh-CN': {
        title: '提前布置一个柔和的睡前放松角落',
        action: '在 {name} 准备休息前 45 分钟调暗客厅灯光、收拾好沙发空间并放点轻柔白噪音。',
        timingPattern: '下一个{weekday} · 21:00 – 22:00',
        timingGeneral: '今晚 · 21:00 睡前放松',
        whyPattern: '在{weekday}晚间营造安静柔和的环境氛围，能帮助 {name} 更顺畅地进入休息节奏。',
        whySteady: '规律的睡前舒缓氛围有助于延续 {name} 平稳的日常状态（均值 {overallMean}）。',
        whyInsufficient: '在历史数据尚少时，帮忙准备舒适的居家环境是安全又贴心的支持。',
        personalizationWithPref: '契合「{pref}」偏好，无需过多言语也能感到放松。',
        personalizationGeneral: '无需花钱的居家照料，轻巧而温柔。',
        defaultMessage: '客厅的暖灯已经帮你调好了，忙完随时过来靠着放空一会儿吧。',
      },
      'zh-TW': {
        title: '提前佈置一個柔和的睡前放鬆角落',
        action: '在 {name} 準備休息前 45 分鐘調暗客廳燈光、整理好沙發空間並放點輕柔音樂。',
        timingPattern: '下一個{weekday} · 21:00 – 22:00',
        timingGeneral: '今晚 · 21:00 睡前放鬆',
        whyPattern: '在{weekday}晚間營造安靜柔和的環境氛圍，能幫助 {name} 更順暢地進入休息節奏。',
        whySteady: '規律的睡前舒緩氛圍有助於延續 {name} 平穩的日常狀態（均值 {overallMean}）。',
        whyInsufficient: '在歷史資料尚少時，幫忙準備舒適的居家環境是安全又貼心的支持。',
        personalizationWithPref: '契合「{pref}」偏好，無需過多言語也能感到放鬆。',
        personalizationGeneral: '無需花錢的居家照料，輕巧而溫柔。',
        defaultMessage: '客廳的暖燈已經替你調好了，忙完隨時過來靠著放空一會兒吧。',
      },
    },
  },
  {
    id: 'fb-warm-drink-gesture',
    category: 'Practical Help',
    actionType: 'warm_drink',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['warm_drink', 'home', 'practical'],
    preferenceKeywords: ['warm', 'tea', 'milk tea', 'drink', '热饮', '奶茶', '果茶', '熱飲'],
    avoidKeywords: [],
    copy: {
      en: {
        title: 'Prepare a Homemade Warm Drink & Handle Setup',
        action:
          'Make a warm cup of {name}’s favorite drink at home and take care of a small evening chore so they can sit down immediately.',
        timingPattern: 'Next {weekday} · 4:30 PM – 6:30 PM',
        timingGeneral: 'Late Afternoon or After Dinner',
        whyPattern:
          'Because {name}’s {weekday} records frequently dip below baseline, taking over one small daily chore and offering warmth may ease end-of-day fatigue.',
        whySteady:
          'Sharing a small practical gesture pairs naturally with {name}’s steady routine ({overallMean}).',
        whyInsufficient:
          'Without enough multi-week history yet, a simple practical gesture guided by stated preferences is thoughtful and low-risk.',
        personalizationWithPref: 'Directly reflects {name}’s preference for {pref}.',
        personalizationGeneral:
          'Combines practical household help with a simple homemade gesture (no spending needed).',
        defaultMessage:
          'I can take care of tidying up tonight and have a warm cup waiting whenever you wrap up.',
      },
      'zh-CN': {
        title: '在家泡一杯热饮并分担一件小事',
        action: '在家帮 {name} 泡一杯喜欢的热饮，同时顺手处理掉一件晚间小家务，让对方一坐下就能放松。',
        timingPattern: '下一个{weekday} · 16:30 – 18:30',
        timingGeneral: '傍晚或晚饭后',
        whyPattern:
          '{name} 在{weekday}的历史记录经常低于个人均值，提前分担一点琐事并递上热饮，可能会有效缓解傍晚的疲惫感。',
        whySteady: '在平稳的日常节奏（均值 {overallMean}）中，顺手帮忙的小举动总能带来踏实的温暖。',
        whyInsufficient: '在基线数据尚未积累充分时，结合已知偏好提供顺手的生活照料是最实在的关心。',
        personalizationWithPref: '直接呼应了 {name} 记录的偏好：{pref}。',
        personalizationGeneral: '居家自制饮品加上实际分担家务，不依赖消费也能传递体贴。',
        defaultMessage: '今晚的小事交给我来收拾，给你泡好热饮，忙完就能直接歇一会儿。',
      },
      'zh-TW': {
        title: '在家泡一杯熱飲並分擔一件小事',
        action: '在家替 {name} 泡一杯喜歡的熱飲，同時順手處理一件晚間小家務，讓對方坐下就能好好放鬆。',
        timingPattern: '下一個{weekday} · 16:30 – 18:30',
        timingGeneral: '傍晚或晚飯後',
        whyPattern:
          '{name} 在{weekday}的歷史紀錄常低於個人均值，提前分擔一點瑣事並遞上熱飲，或許能緩和傍晚的疲憊感。',
        whySteady: '在平穩的日常節奏（均值 {overallMean}）中，順手幫忙的小舉動能帶來踏實的暖意。',
        whyInsufficient: '在基線資料尚未累積充足時，依已知偏好提供順手的生活照料是最實在的關心。',
        personalizationWithPref: '直接呼應了 {name} 紀錄的偏好：{pref}。',
        personalizationGeneral: '居家自製飲品搭配實際分擔家務，無需消費也能傳遞體貼。',
        defaultMessage: '今晚的小事交給我來整理，先幫你準備好熱飲，忙完就能直接歇一會兒。',
      },
    },
  },
  {
    id: 'fb-evening-chore-relief',
    category: 'Practical Help',
    actionType: 'chore_help',
    communicationStyle: 'Practical Action',
    effortLevel: 'Medium',
    requiresSpendingMoney: false,
    tags: ['chores', 'errands', 'practical'],
    preferenceKeywords: ['light dinner', 'quiet', 'calm', '清淡', '安静', '安靜'],
    avoidKeywords: ['last-minute', '临时', '臨時'],
    copy: {
      en: {
        title: 'Quietly Clear Tonight’s Dishes & Prep Tomorrow',
        action:
          'Take care of tonight’s dishes and pack tomorrow’s essentials in advance so {name} starts the next morning with zero rush.',
        timingPattern: 'Next {weekday} · 8:00 PM',
        timingGeneral: 'This Evening · After Dinner',
        whyPattern:
          'Removing small evening tasks on {weekday} reduces decision load when energy reserves tend to run lower.',
        whySteady:
          'Even during steady weeks ({overallMean}), quietly handling routine chores creates breathing room.',
        whyInsufficient:
          'Taking care of a practical household step is universally helpful without assuming unverified patterns.',
        personalizationWithPref: 'Supports a calmer rhythm matching {pref}.',
        personalizationGeneral: 'Hands-on practical support requiring zero spending.',
        defaultMessage: 'All dishes and prep for tomorrow are covered tonight — just rest up when you are done.',
      },
      'zh-CN': {
        title: '顺手包办今晚洗碗与明日准备',
        action: '主动收拾完今晚的碗筷并顺手备好明天出门要带的小物，让 {name} 今晚少操心、明早更从容。',
        timingPattern: '下一个{weekday} · 20:00',
        timingGeneral: '今晚饭后',
        whyPattern: '在精力相对容易下滑的{weekday}替对方减少睡前琐事，能省下不少心力。',
        whySteady: '在平稳的一周（均值 {overallMean}）中，默默分担日常琐事也能带来踏实的安心感。',
        whyInsufficient: '在数据积累初期，实际分担一件日常家务是稳妥又真诚的支持。',
        personalizationWithPref: '配合「{pref}」的节奏，让晚间保持轻松。',
        personalizationGeneral: '零花费的实际行动支持，减轻彼此晚间负担。',
        defaultMessage: '今晚的厨房和明天要带的东西我都收拾好啦，你专心休息就好。',
      },
      'zh-TW': {
        title: '順手包辦今晚洗碗與明日準備',
        action: '主動收拾完今晚的碗筷並順手備好明天出門要帶的小物，讓 {name} 今晚少操心、明早更從容。',
        timingPattern: '下一個{weekday} · 20:00',
        timingGeneral: '今晚飯後',
        whyPattern: '在精力較容易下滑的{weekday}替對方減少睡前瑣事，能省下不少心力。',
        whySteady: '在平穩的一週（均值 {overallMean}）中，默默分擔日常瑣事也能帶來踏實的安心感。',
        whyInsufficient: '在資料累積初期，實際分擔一件日常家務是穩妥又真誠的支持。',
        personalizationWithPref: '配合「{pref}」的節奏，讓晚間保持輕鬆。',
        personalizationGeneral: '零花費的實際行動支持，減輕彼此晚間負擔。',
        defaultMessage: '今晚的廚房和明天要帶的東西我都整理好囉，你專心休息就好。',
      },
    },
  },
  {
    id: 'fb-unhurried-evening-walk',
    category: 'Quality Time',
    actionType: 'evening_walk',
    communicationStyle: 'Shared Activity',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['walk', 'fresh_air', 'together'],
    preferenceKeywords: ['walk', 'evening', 'together', 'light dinner', '散步', '清淡', '陪伴'],
    avoidKeywords: ['surprise visits', '突然造访', '突然造訪', 'crowded', '拥挤', '擁擠'],
    copy: {
      en: {
        title: 'Share an Unhurried 20-Minute Walk or Light Meal',
        action:
          'Invite {name} to choose between a gentle 20-minute neighborhood walk or a simple light dinner together with phones tucked away.',
        timingPattern: 'Next {weekday} · 6:30 PM – 7:30 PM',
        timingGeneral: 'This Evening · 6:30 PM – 8:00 PM',
        whyPattern:
          'Offering a low-effort choice on {weekday} evening lets {name} pick the pace that matches how they feel after a demanding day.',
        whySteady:
          'With steady recent energy ({recent7Mean}), unhurried shared time supports natural connection without over-scheduling.',
        whyInsufficient:
          'While personal patterns are still forming, offering a calm, optional routine keeps quality time comfortable.',
        personalizationWithPref:
          'Matched to {name}’s preferences ({pref}) while letting them control the pace.',
        personalizationGeneral:
          'Simple, screen-free quality time focused on mutual comfort rather than spending money.',
        defaultMessage:
          'No pressure tonight — would you enjoy a slow 20-minute walk or keeping dinner super light at home?',
      },
      'zh-CN': {
        title: '共度 20 分钟慢节奏散步或清淡晚餐',
        action: '邀请 {name} 自由选择：一起在附近慢走 20 分钟透气，或在家吃一顿清淡省心的晚餐，暂放手机。',
        timingPattern: '下一个{weekday} · 18:30 – 19:30',
        timingGeneral: '今晚 · 18:30 – 20:00',
        whyPattern:
          '在{weekday}傍晚提供无需费神的二选一方案，能让 {name} 根据当下的恢复需要自由调节节奏。',
        whySteady:
          '近期精力保持稳定（近 7 天均值 {recent7Mean}），轻松的共同散步或清淡晚餐有助于增进陪伴感。',
        whyInsufficient:
          '在日常规律仍在学习阶段时，轻盈、可自由选择的陪伴方式最容易让人感到舒适。',
        personalizationWithPref: '贴合 {name} 记录的「{pref}」偏好，并把节奏选择权留给对方。',
        personalizationGeneral: '不花费金钱的纯粹相处时光，强调松弛感与彼此陪伴。',
        defaultMessage: '今晚看你的状态定吧，想一起出门慢走二十分钟，还是在家吃顿清淡简单的晚餐？',
      },
      'zh-TW': {
        title: '共度 20 分鐘慢節奏散步或清淡晚餐',
        action: '邀請 {name} 自由選擇：一起在附近慢走 20 分鐘透氣，或在家吃頓清淡省心的晚餐，暫時放下手機。',
        timingPattern: '下一個{weekday} · 18:30 – 19:30',
        timingGeneral: '今晚 · 18:30 – 20:00',
        whyPattern:
          '在{weekday}傍晚提供無需費神的二選一方案，能讓 {name} 依當下的休息需求自由調整步調。',
        whySteady:
          '近期精力維持平穩（近 7 天均值 {recent7Mean}），輕鬆的共同散步或清淡晚餐有助於增進連結。',
        whyInsufficient:
          '在日常規律仍在學習階段時，輕盈、可自由選擇的陪伴方式最容易讓人感到自在。',
        personalizationWithPref: '貼合 {name} 紀錄的「{pref}」偏好，並將步調選擇權交給對方。',
        personalizationGeneral: '無需花費的純粹相處時光，重視鬆弛感與彼此陪伴。',
        defaultMessage: '今晚依你的狀態決定吧，想一起慢走二十分鐘，還是在家吃頓清淡簡單的晚餐？',
      },
    },
  },
  {
    id: 'fb-handwritten-encouragement',
    category: 'Small Surprise',
    actionType: 'handwritten_note',
    communicationStyle: 'Surprise',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['note', 'surprise', 'non_commercial'],
    preferenceKeywords: ['surprise', 'note', 'tea', '小惊喜', '纸条', '紙條', '小驚喜'],
    avoidKeywords: ['surprise visits', '突然造访', '突然造訪'],
    copy: {
      en: {
        title: 'Leave a Short Handwritten Appreciation Note',
        action:
          'Leave a brief handwritten note on {name}’s desk or mug appreciating one specific thing they did this week — calm, warm, and non-disruptive.',
        timingPattern: 'Next {weekday} Morning · Before Work Starts',
        timingGeneral: 'Tomorrow Morning or Before Evening Wind-Down',
        whyPattern:
          'Starting {weekday} with a small thoughtful anchor may offer quiet encouragement ahead of a lower-energy day.',
        whySteady:
          'A tiny unexpected note adds warmth to a steady week without disrupting {name}’s schedule.',
        whyInsufficient:
          'Even without multi-week baseline data, a small non-commercial gesture communicates care gently.',
        personalizationWithPref:
          'Honors {name}’s preference for {pref} while avoiding intrusive surprises.',
        personalizationGeneral:
          'Thoughtful, zero-cost gesture that stays respectful of quiet routines.',
        defaultMessage:
          'Left a little note for you — grateful for all the quiet thoughtfulness you bring to our week.',
      },
      'zh-CN': {
        title: '留一张简短的手写暖心小纸条',
        action: '在 {name} 的水杯旁或桌面留一张短便签，感谢对方这周的一件小事，温暖又不打扰节奏。',
        timingPattern: '下一个{weekday}清晨 · 开始忙碌前',
        timingGeneral: '明早或今晚睡前',
        whyPattern: '在预计可能更需要休息的{weekday}早上看到一句真诚肯定，能温和地开启一天。',
        whySteady: '在平稳的一周里放进一张小纸条，不用打乱日程就能增添心意。',
        whyInsufficient: '在暂无长期历史趋势时，这种零花费的小小心意依然安全、温柔且真诚。',
        personalizationWithPref: '契合 {name} 对「{pref}」的偏好，同时避免突然打扰。',
        personalizationGeneral: '零成本却富有心意的日常小惊喜，尊重彼此独立空间。',
        defaultMessage: '在桌角给你留了一张小纸条，谢谢这周一直这么温柔地照顾彼此。',
      },
      'zh-TW': {
        title: '留一張簡短的手寫暖心小紙條',
        action: '在 {name} 的水杯旁或桌面留一張小便條，感謝對方這週的一件小事，溫暖又不打擾步調。',
        timingPattern: '下一個{weekday}清晨 · 開始忙碌前',
        timingGeneral: '明早或今晚睡前',
        whyPattern: '在預計可能需要多休息的{weekday}早上看見一句真誠肯定，能溫和地開啟一天。',
        whySteady: '在平穩的一週裡加入一張小紙條，不必打亂行程就能增添心意。',
        whyInsufficient: '在暫無長期歷史趨勢時，這份零花費的小小心意依然安全、溫柔且真誠。',
        personalizationWithPref: '契合 {name} 對「{pref}」的偏好，同時避免突然打擾。',
        personalizationGeneral: '無需花費卻富有心意的日常小驚喜，尊重彼此獨立空間。',
        defaultMessage: '在桌邊留了一張小紙條給你，謝謝這週一直這麼溫柔地照顧彼此。',
      },
    },
  },
  {
    id: 'fb-calm-playlist-surprise',
    category: 'Small Surprise',
    actionType: 'playlist_or_audio',
    communicationStyle: 'Surprise',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['music', 'playlist', 'surprise'],
    preferenceKeywords: ['quiet', 'calm', 'surprise', '安静', '小惊喜', '安靜', '小驚喜'],
    avoidKeywords: ['crowded', '拥挤', '擁擠', 'surprise visits', '突然造访', '突然造訪'],
    copy: {
      en: {
        title: 'Curate a 15-Minute Calm Wind-Down Playlist',
        action:
          'Put together 4–5 soothing instrumental or favorite tracks for {name} to play while commuting home or unwinding.',
        timingPattern: 'Next {weekday} · Late Afternoon',
        timingGeneral: 'Before Tonight’s Commute or Wind-Down',
        whyPattern:
          'A calm audio transition at the end of {weekday} gives {name} an effortless way to decompress.',
        whySteady:
          'Sharing a mini playlist adds a gentle surprise element to a steady week ({overallMean}).',
        whyInsufficient:
          'A tiny shared playlist is a non-commercial, low-pressure gesture while personal patterns are still building.',
        personalizationWithPref: 'Fits {name}’s preferences ({pref}) without noisy settings.',
        personalizationGeneral: 'Free, thoughtful micro-surprise easy to enjoy anywhere.',
        defaultMessage: 'Put together a short 15-minute calm playlist for your unwind time today.',
      },
      'zh-CN': {
        title: '分享一份 15 分钟的舒缓小歌单',
        action: '挑 4–5 首轻柔舒缓的音乐发给 {name}，适合下班路上或回家放空时听。',
        timingPattern: '下一个{weekday} · 傍晚时分',
        timingGeneral: '今晚通勤或休息前',
        whyPattern: '在{weekday}忙碌收尾时听一段柔和旋律，能帮 {name} 轻松切换回放松状态。',
        whySteady: '在平稳的周间节奏（均值 {overallMean}）中加入一点温柔音乐心意，轻松又暖心。',
        whyInsufficient: '在历史规律仍在积累阶段，分享一份轻歌单是安全、零负担的贴心小惊喜。',
        personalizationWithPref: '贴合「{pref}」偏好，安静且不打扰。',
        personalizationGeneral: '无需消费的小小惊喜，随时随地都能带来舒缓感。',
        defaultMessage: '给你挑了几首很轻柔的歌，回家路上或睡前可以听听看。',
      },
      'zh-TW': {
        title: '分享一份 15 分鐘的舒緩小歌單',
        action: '挑 4–5 首輕柔舒緩的音樂傳給 {name}，適合下班路上或回家放空時聆聽。',
        timingPattern: '下一個{weekday} · 傍晚時分',
        timingGeneral: '今晚通勤或休息前',
        whyPattern: '在{weekday}忙碌收尾時聽一段柔和旋律，能幫 {name} 輕鬆切換回放鬆狀態。',
        whySteady: '在平穩的週間節奏（均值 {overallMean}）中加入一點溫柔音樂心意，輕鬆又暖心。',
        whyInsufficient: '在歷史規律仍在累積階段，分享一份輕歌單是安全、零負擔的貼心小驚喜。',
        personalizationWithPref: '貼合「{pref}」偏好，安靜且不打擾。',
        personalizationGeneral: '無需消費的小小驚喜，隨時隨地都能帶來舒緩感。',
        defaultMessage: '幫你挑了幾首很輕柔的歌，回家路上或睡前可以聽聽看。',
      },
    },
  },
  {
    id: 'fb-purchase-hot-latte',
    category: 'Practical Help',
    actionType: 'purchase_coffee',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: true,
    tags: ['purchase', 'milk_tea', 'coffee', 'warm_drink'],
    preferenceKeywords: ['milk tea', 'coffee', 'tea', 'drink', 'latte', '奶茶', '咖啡', '热饮', '熱飲'],
    avoidKeywords: [],
    copy: {
      en: {
        title: 'Order a Cup of Warm Milk Tea or Oat Latte',
        action:
          'Order {name}’s favorite warm roasted milk tea or gentle oat latte for a comforting afternoon pick-me-up.',
        timingPattern: 'Next {weekday} · 3:30 PM – 4:30 PM',
        timingGeneral: 'Mid-Afternoon Break',
        whyPattern:
          'When {name}’s {weekday} records dip below baseline, having a warm drink arrive without any effort on their part offers quiet comfort.',
        whySteady:
          'On a steady week ({overallMean}), sending a favorite warm cup adds a small thoughtful lift to the afternoon.',
        whyInsufficient:
          'While baseline history is still growing, treating {name} to a favorite warm drink is a simple, warm gesture.',
        personalizationWithPref: 'Guided by {name}’s stated drink preferences ({pref}).',
        personalizationGeneral: 'An optional treat order you can send directly or save for later.',
        defaultMessage: 'Ordered a warm cup for your afternoon break — enjoy it slowly whenever it arrives!',
      },
      'zh-CN': {
        title: '点一杯热奶茶或温热燕麦拿铁',
        action: '为 {name} 点一杯喜欢的温热烤奶或低负担燕麦拿铁，让忙碌的午后多一点暖意。',
        timingPattern: '下一个{weekday} · 15:30 – 16:30',
        timingGeneral: '下午茶休息时段',
        whyPattern: '在精力相对容易回落的{weekday}午后，不用自己出门也能喝上一杯热饮会很舒心。',
        whySteady: '在平稳的周间节奏（均值 {overallMean}）里，送上一杯喜欢的饮品能带来轻巧惊喜。',
        whyInsufficient: '在历史趋势仍在积累阶段，顺着口味偏好送一杯温热饮品也是稳妥的心意。',
        personalizationWithPref: '呼应 {name} 记录的口味偏好（{pref}）。',
        personalizationGeneral: '可选的小小心意订单，支持立即下单或稍后提醒。',
        defaultMessage: '给你点了一杯热饮暖暖胃，下午忙完记得慢慢喝哦。',
      },
      'zh-TW': {
        title: '點一杯熱奶茶或溫熱燕麥拿鐵',
        action: '為 {name} 點一杯喜歡的溫熱烤奶或輕負擔燕麥拿鐵，替忙碌的午後增添一點暖意。',
        timingPattern: '下一個{weekday} · 15:30 – 16:30',
        timingGeneral: '下午茶休息時段',
        whyPattern: '在精力較容易回落的{weekday}午後，不用自己出門就能喝到一杯熱飲會很舒心。',
        whySteady: '在平穩的週間節奏（均值 {overallMean}）裡，送上一杯喜歡的飲品能帶來輕巧驚喜。',
        whyInsufficient: '在歷史趨勢仍在累積階段，順著口味偏好送一杯溫熱飲品也是穩妥的心意。',
        personalizationWithPref: '呼應 {name} 紀錄的口味偏好（{pref}）。',
        personalizationGeneral: '可選的小小心意訂單，支援立即下單或稍後提醒。',
        defaultMessage: '替你點了一杯熱飲暖暖胃，下午忙完記得慢慢享用喔。',
      },
    },
  },
  {
    id: 'fb-purchase-dessert-pastry',
    category: 'Rest & Recovery',
    actionType: 'purchase_dessert',
    communicationStyle: 'Surprise',
    effortLevel: 'Low',
    requiresSpendingMoney: true,
    tags: ['purchase', 'dessert', 'snack'],
    preferenceKeywords: ['dessert', 'snack', 'light', 'sweet', 'tea', '甜品', '点心', '蛋糕', '點心'],
    avoidKeywords: [],
    copy: {
      en: {
        title: 'Order a Light Artisanal Dessert Box',
        action:
          'Send a lightly sweetened pastry or tea-time dessert treat for {name} to enjoy during a quiet evening break.',
        timingPattern: 'Next {weekday} · 5:30 PM – 7:00 PM',
        timingGeneral: 'Late Afternoon or After Dinner',
        whyPattern:
          'A gentle snack treat ahead of {weekday} evening saves {name} from figuring out dessert after a tiring day.',
        whySteady:
          'Alongside a steady baseline ({overallMean}), a light shared pastry brings an easy, unhurried smile.',
        whyInsufficient:
          'Even before long-term trends form, a small light treat matches relaxed evening routines.',
        personalizationWithPref: 'Tailored around {name}’s preference cues ({pref}).',
        personalizationGeneral: 'A small optional delivery treat — order now, remind later, or skip anytime.',
        defaultMessage: 'Sent a little light pastry treat your way for tonight’s wind-down!',
      },
      'zh-CN': {
        title: '订一份清爽不甜腻的下午茶点心',
        action: '为 {name} 点一份轻甜可口的手作小蛋糕或茶点，适合傍晚收工后配茶放松。',
        timingPattern: '下一个{weekday} · 17:30 – 19:00',
        timingGeneral: '傍晚或晚饭后',
        whyPattern: '在容易感到疲惫的{weekday}傍晚，一份顺心的小点心能带来轻松的过渡时刻。',
        whySteady: '在平稳的日常状态（均值 {overallMean}）中，分享一份轻甜点心简单又治愈。',
        whyInsufficient: '在历史规律仍在积累时，一份轻负担茶点也是温和的关心表达。',
        personalizationWithPref: '贴合已记录偏好（{pref}）。',
        personalizationGeneral: '可选外送小心意——可立即下单、延后提醒或暂不安排。',
        defaultMessage: '给你订了一份不腻口的小甜点，今晚慢慢配茶享用吧。',
      },
      'zh-TW': {
        title: '訂一份清爽不甜膩的下午茶點心',
        action: '為 {name} 點一份輕甜可口的手作小蛋糕或茶點，適合傍晚收工後配茶放鬆。',
        timingPattern: '下一個{weekday} · 17:30 – 19:00',
        timingGeneral: '傍晚或晚飯後',
        whyPattern: '在容易感到疲憊的{weekday}傍晚，一份順心的小點心能帶來輕鬆的過渡時刻。',
        whySteady: '在平穩的日常狀態（均值 {overallMean}）中，分享一份輕甜點心簡單又療癒。',
        whyInsufficient: '在歷史規律仍在累積時，一份輕負擔茶點也是溫和的關心表達。',
        personalizationWithPref: '貼合已紀錄偏好（{pref}）。',
        personalizationGeneral: '可選外送小心意——可立即下單、稍後提醒或暫不安排。',
        defaultMessage: '幫你訂了一份不膩口的小甜點，今晚慢慢配茶享用吧。',
      },
    },
  },
  {
    id: 'fb-purchase-fresh-flowers',
    category: 'Quality Time',
    actionType: 'purchase_flowers',
    communicationStyle: 'Surprise',
    effortLevel: 'Low',
    requiresSpendingMoney: true,
    tags: ['purchase', 'flowers', 'surprise'],
    preferenceKeywords: ['flower', 'bouquet', 'calm', '鲜花', '花束', '小惊喜', '鮮花'],
    avoidKeywords: ['surprise visits', '突然造访', '突然造訪'],
    copy: {
      en: {
        title: 'Send a Small Bouquet of Fresh Flowers',
        action:
          'Send a compact desk-size bouquet of soft pastel blooms to brighten {name}’s workspace without taking up room.',
        timingPattern: 'Next {weekday} · Morning Delivery',
        timingGeneral: 'Mid-Morning or Early Afternoon',
        whyPattern:
          'Fresh flowers around {weekday} bring quiet visual calm during a demanding week.',
        whySteady:
          'A petite bouquet pairs gently with {name}’s steady week ({overallMean}).',
        whyInsufficient:
          'A calm desk bouquet is a thoughtful gesture that brightens the room without demanding attention.',
        personalizationWithPref: 'Chosen to feel calm and gentle around {pref}.',
        personalizationGeneral: 'Optional floral delivery gesture — reveal now or keep it a surprise until delivered.',
        defaultMessage: 'Picked a small soft bouquet to brighten your desk today!',
      },
      'zh-CN': {
        title: '送一束素雅的桌面小鲜花',
        action: '为 {name} 订一束配色柔和的桌面小花束，不占空间又能静静点亮一天的好心情。',
        timingPattern: '下一个{weekday} · 上午送达',
        timingGeneral: '上午或午后',
        whyPattern: '在日程紧凑的{weekday}，桌上的一束温柔鲜花能带来安静的视觉舒缓感。',
        whySteady: '在平稳的周间节奏（均值 {overallMean}）里放进一抹自然花色，温柔又有仪式感。',
        whyInsufficient: '小巧不张扬的桌面花束，能在不打扰工作的情况下悄悄增添暖意。',
        personalizationWithPref: '兼顾「{pref}」的柔和调性，不喧闹不打扰。',
        personalizationGeneral: '可选鲜花心意配送，支持收货前保密惊喜模式。',
        defaultMessage: '挑了一小束温柔颜色的鲜花放在你桌边，祝今天心情舒展。',
      },
      'zh-TW': {
        title: '送一束素雅的桌面小鮮花',
        action: '為 {name} 訂一束配色柔和的桌面小花束，不佔空間又能靜靜點亮一天的好心情。',
        timingPattern: '下一個{weekday} · 上午送達',
        timingGeneral: '上午或午後',
        whyPattern: '在行程緊湊的{weekday}，桌上的一束溫柔鮮花能帶來安靜的視覺舒緩感。',
        whySteady: '在平穩的週間節奏（均值 {overallMean}）裡放進一抹自然花色，溫柔又有儀式感。',
        whyInsufficient: '小巧不張揚的桌面花束，能在不打擾工作的情況下悄悄增添暖意。',
        personalizationWithPref: '兼顧「{pref}」的柔和調性，不喧鬧不打擾。',
        personalizationGeneral: '可選鮮花心意配送，支援送達前保密驚喜模式。',
        defaultMessage: '挑了一小束溫柔顏色的鮮花放在你桌邊，祝今天心情舒展。',
      },
    },
  },
];

function fillTemplate(str: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    str
  );
}

export function generateLocalFallbackCare(
  context: AiCareRequestContext,
  reason: AiCareFallbackReason,
  errorMessage?: string,
  variationSeed = 0
): AiCareGenerationResult {
  const lang = context.language;
  const weekdays = WEEKDAYS_BY_LANG[lang];
  const rec = context.recipient;
  const feedback = context.partner.feedback;
  const learned = context.learnedProfile;
  const recentHistory: RecentSuggestionRecord[] = (context.recentSuggestions ?? []).map((item) => ({
    id: item.fingerprint,
    title: item.title,
    category: item.category,
    actionType: item.actionType,
    communicationStyle: 'Short Text',
    fingerprint: item.fingerprint,
    generatedAtISO: '',
  }));

  const hasEnergyPattern = Boolean(
    rec.energyShared &&
      rec.weekdayPattern?.hasPattern &&
      rec.weekdayPattern.detectedWeekdayIndex !== null
  );
  const patternWeekdayIdx = rec.weekdayPattern?.detectedWeekdayIndex ?? null;
  const patternWeekdayName =
    patternWeekdayIdx !== null ? weekdays[patternWeekdayIdx] : weekdays[4];

  const highlightedForecast = hasEnergyPattern
    ? rec.upcomingForecast?.find((d) => d.weekdayIndex === patternWeekdayIdx)
    : undefined;

  const allPrefText = [...rec.carePreferences, ...rec.foodPreferences].join(' ').toLowerCase();
  const allAvoidText = rec.avoidTags.join(' ').toLowerCase();
  const notRelevantSet = new Set(feedback.notRelevantTitles.map((t) => t.toLowerCase()));
  const moreLikeThisSet = new Set(feedback.moreLikeThisTitles.map((t) => t.toLowerCase()));

  const authorizedCheckIn = rec.energyShared ? rec.dailyCheckInStatus ?? null : null;

  // Score each candidate transparently using explicit preferences (highest priority),
  // adaptive learned profile, cooldown avoidance, and authorized daily status.
  const scored = CANDIDATE_LIBRARY.map((candidate, idx) => {
    const localized = candidate.copy[lang];
    const meta = normalizeRecommendationMetadata({
      title: localized.title,
      category: candidate.category,
      action: localized.action,
      why: localized.whySteady,
      suggestedTiming: localized.timingGeneral,
      actionType: candidate.actionType,
      communicationStyle: candidate.communicationStyle,
      effortLevel: candidate.effortLevel,
      requiresSpendingMoney: candidate.requiresSpendingMoney,
      tags: candidate.tags,
    });

    let score = 10;

    // 1. Explicit Profile avoid tags (highest priority guard)
    const hitsAvoid = candidate.avoidKeywords.some((kw) => allAvoidText.includes(kw.toLowerCase()));
    if (hitsAvoid) {
      score -= 60;
    }

    // 2. Explicit Profile preferences (higher priority than inferred feedback)
    const matchedPrefs = candidate.preferenceKeywords.filter((kw) =>
      allPrefText.includes(kw.toLowerCase())
    );
    score += matchedPrefs.length * 18;

    // 3. Explicit communication style match
    if (rec.communicationStyle) {
      const styleText = rec.communicationStyle.toLowerCase();
      if (
        (styleText.includes('short') || styleText.includes('简短') || styleText.includes('簡短')) &&
        candidate.communicationStyle === 'Short Text'
      ) {
        score += 12;
      }
      if (
        (styleText.includes('gentle') || styleText.includes('温柔') || styleText.includes('溫柔')) &&
        (candidate.communicationStyle === 'Short Text' ||
          candidate.communicationStyle === 'Voice Message' ||
          candidate.communicationStyle === 'Practical Action')
      ) {
        score += 8;
      }
    }

    // 4. Legacy / quick feedback titles & categories
    if (
      notRelevantSet.has(localized.title.toLowerCase()) ||
      notRelevantSet.has(meta.fingerprint.toLowerCase())
    ) {
      score -= 110;
    }
    if (feedback.deprioritizedCategories.includes(candidate.category)) {
      score -= 20;
    }
    if (feedback.preferredCategories.includes(candidate.category)) {
      score += 18;
    }
    if (moreLikeThisSet.has(localized.title.toLowerCase())) {
      score += 14;
    }

    // 5. Adaptive Learned Profile (Stage 5.4 tiered signals)
    if (learned) {
      if (learned.negativelyRatedAttributes.fingerprints.includes(meta.fingerprint)) {
        score -= 90;
      }
      if (learned.negativelyRatedAttributes.actionTypes.includes(meta.actionType)) {
        score -= 35;
      }
      if (learned.negativelyRatedAttributes.communicationStyles.includes(meta.communicationStyle)) {
        score -= 28;
      }
      if (learned.negativelyRatedAttributes.categories.includes(candidate.category)) {
        score -= 16;
      }
      if (learned.negativelyRatedAttributes.avoidPaidSuggestions && meta.requiresSpendingMoney) {
        score -= 140;
      }

      const catRank = learned.preferredCategories.indexOf(candidate.category);
      if (catRank !== -1) {
        score += Math.max(8, 18 - catRank * 3);
      }
      const styleRank = learned.preferredCommunicationStyles.indexOf(meta.communicationStyle);
      if (styleRank !== -1) {
        score += Math.max(10, 20 - styleRank * 4);
      }
      const actionRank = learned.preferredActionTypes.indexOf(meta.actionType);
      if (actionRank !== -1) {
        score += Math.max(12, 24 - actionRank * 4);
      }
      if (learned.prefersFreeOrLowCost && !meta.requiresSpendingMoney) {
        score += 6;
      }
      const timingBucket = normalizeTimingBucket(localized.timingGeneral);
      if (learned.preferredTimings.includes(timingBucket)) {
        score += 6;
      }
    }

    // 6. Authorized daily check-in status & pattern alignment
    if (authorizedCheckIn === 'rest' || authorizedCheckIn === 'tired') {
      if (
        candidate.category === 'Rest & Recovery' ||
        candidate.category === 'Practical Help'
      ) {
        score += 14;
      }
    } else if (
      hasEnergyPattern &&
      (candidate.category === 'Rest & Recovery' || candidate.category === 'Practical Help')
    ) {
      score += 10;
    }

    // 6b. Shared Weekly Couple Recharge alignment
    if (rec.sharedWeeklyRecharge) {
      const { supportChoice, nextWeekWish } = rec.sharedWeeklyRecharge;
      if (supportChoice === 'emotional_support' && candidate.category === 'Emotional Support') {
        score += 14;
      }
      if (supportChoice === 'practical_help' && candidate.category === 'Practical Help') {
        score += 14;
      }
      if (supportChoice === 'rest_recovery' && candidate.category === 'Rest & Recovery') {
        score += 14;
      }
      if (supportChoice === 'quality_time' && candidate.category === 'Quality Time') {
        score += 14;
      }
      if (nextWeekWish === 'more_quiet_time' && candidate.category === 'Rest & Recovery') {
        score += 10;
      }
      if (nextWeekWish === 'more_light_help' && candidate.category === 'Practical Help') {
        score += 10;
      }
      if (nextWeekWish === 'more_gentle_checkins' && candidate.category === 'Emotional Support') {
        score += 10;
      }
      if (nextWeekWish === 'more_shared_outings' && candidate.category === 'Quality Time') {
        score += 10;
      }
    }

    // 7. Cooldown penalty against recently shown suggestions
    const previewRec: AiCareRecommendation = {
      id: candidate.id,
      title: localized.title,
      category: candidate.category,
      why: localized.whySteady,
      action: localized.action,
      suggestedTiming: localized.timingGeneral,
      personalizationReason: localized.personalizationGeneral,
      confidence: 'Preference-Based',
      defaultMessage: localized.defaultMessage,
      actionType: meta.actionType,
      communicationStyle: meta.communicationStyle,
      effortLevel: meta.effortLevel,
      requiresSpendingMoney: meta.requiresSpendingMoney,
      tags: meta.tags,
      fingerprint: meta.fingerprint,
    };
    if (isRecommendationInCooldown(previewRec, recentHistory)) {
      score -= 22;
    }

    // Deterministic rotation tie-breaker when user asks to regenerate
    const tieRotate = ((idx + variationSeed) % CANDIDATE_LIBRARY.length) * 0.15;

    return {
      candidate,
      localized,
      meta,
      score: score + tieRotate,
      matchedPrefs,
    };
  }).sort((a, b) => b.score - a.score);

  const prefSummary =
    rec.carePreferences.length > 0
      ? rec.carePreferences.slice(0, 2).join(', ')
      : rec.foodPreferences.slice(0, 2).join(', ');

  const overallMean =
    rec.personalBaseline?.overallMean ?? rec.personalBaseline?.avgSelfReported1To5 ?? '—';
  const recent7Mean =
    rec.personalBaseline?.recent7DayMean ?? rec.personalBaseline?.avgSelfReported1To5 ?? '—';
  const weekdayMean = rec.weekdayPattern?.weekdayMean ?? overallMean;
  const forecastScore = highlightedForecast?.estimatedEnergy ?? weekdayMean;

  const confidence: AiCareConfidence =
    !rec.energyShared || rec.insufficientHistoricalData
      ? 'Preference-Based'
      : hasEnergyPattern
        ? 'Moderate'
        : rec.recordedDaysCount >= 7
          ? 'Low'
          : 'Preference-Based';

  const checkInLabel = authorizedCheckIn ? CHECKIN_LABEL_BY_LANG[lang][authorizedCheckIn] : null;
  const buildNowEvidenceForRec = (matchedPrefs: string[]): { summary: string; details: string[] } => {
    const details: string[] = [];
    if (!rec.energyShared) {
      if (lang === 'en') {
        details.push(
          `${rec.name}'s Energy Summary sharing is currently off; only stated care preferences are used.`
        );
      } else if (lang === 'zh-CN') {
        details.push(`${rec.name} 暂未开启精力摘要共享，仅依据已授权偏好提供建议。`);
      } else {
        details.push(`${rec.name} 暫未開啟精力摘要分享，僅依已授權偏好提供建議。`);
      }
    } else {
      if (checkInLabel) {
        if (lang === 'en') {
          details.push(`Today's confirmed check-in: "${checkInLabel}".`);
        } else if (lang === 'zh-CN') {
          details.push(`今日已确认状态签到：「${checkInLabel}」。`);
        } else {
          details.push(`今日已確認狀態簽到：「${checkInLabel}」。`);
        }
      }
      if (typeof rec.currentEnergyIndex === 'number') {
        if (lang === 'en') {
          details.push(
            `Latest Energy Index: ${rec.currentEnergyIndex}/100 (recent 7-day average ${recent7Mean}).`
          );
        } else if (lang === 'zh-CN') {
          details.push(`最近一次精力指数：${rec.currentEnergyIndex}/100（近 7 天均值 ${recent7Mean}）。`);
        } else {
          details.push(`最近一次精力指數：${rec.currentEnergyIndex}/100（近 7 天均值 ${recent7Mean}）。`);
        }
      }
      if (rec.sleepShared && rec.sleepSummary?.latestSleepHours != null) {
        if (lang === 'en') {
          details.push(
            `Authorized latest sleep: ${rec.sleepSummary.latestSleepHours}h (60-day average ${rec.sleepSummary.overallAvgSleepHours ?? '—'}h).`
          );
        } else if (lang === 'zh-CN') {
          details.push(`已授权最近睡眠时长：${rec.sleepSummary.latestSleepHours} 小时。`);
        } else {
          details.push(`已授權最近睡眠時長：${rec.sleepSummary.latestSleepHours} 小時。`);
        }
      }
      if (rec.heartRateShared && rec.rhrSummary?.latestBpm != null && rec.rhrSummary.personalBaselineBpm != null) {
        const dev = rec.rhrSummary.deviationBpm ?? 0;
        const sign = dev > 0 ? `+${dev}` : `${dev}`;
        if (lang === 'en') {
          details.push(
            `Resting heart rate vs personal baseline: ${rec.rhrSummary.latestBpm} bpm (${sign} bpm vs ${rec.rhrSummary.personalBaselineBpm} bpm).`
          );
        } else if (lang === 'zh-CN') {
          details.push(
            `静息心率个人基线参考：${rec.rhrSummary.latestBpm} bpm（${sign} bpm，基线 ${rec.rhrSummary.personalBaselineBpm} bpm）。`
          );
        } else {
          details.push(
            `靜息心率個人基準參考：${rec.rhrSummary.latestBpm} bpm（${sign} bpm，基準 ${rec.rhrSummary.personalBaselineBpm} bpm）。`
          );
        }
      }
      if (rec.hrvShared && rec.hrvSummary?.latestMs != null && rec.hrvSummary.personalBaselineMs != null) {
        const dev = rec.hrvSummary.deviationMs ?? 0;
        const sign = dev > 0 ? `+${dev}` : `${dev}`;
        if (lang === 'en') {
          details.push(
            `HRV (${rec.hrvSummary.metricType}) vs personal baseline: ${rec.hrvSummary.latestMs} ms (${sign} ms).`
          );
        } else if (lang === 'zh-CN') {
          details.push(`HRV（${rec.hrvSummary.metricType}）个人基线变化：${sign} ms。`);
        } else {
          details.push(`HRV（${rec.hrvSummary.metricType}）個人基準變化：${sign} ms。`);
        }
      }
      if (rec.insufficientHistoricalData) {
        if (lang === 'en') {
          details.push(
            `Observed ${rec.recordedDaysCount} record(s) so far; leaning primarily on stated care preferences.`
          );
        } else if (lang === 'zh-CN') {
          details.push(`目前已记录 ${rec.recordedDaysCount} 天个人状态，目前主要依据双方偏好生成。`);
        } else {
          details.push(`目前已紀錄 ${rec.recordedDaysCount} 天個人狀態，目前主要依雙方偏好產生。`);
        }
      }
    }
    if (matchedPrefs.length > 0 || prefSummary) {
      const prefShown = matchedPrefs.length > 0 ? matchedPrefs.slice(0, 2).join(', ') : prefSummary;
      if (lang === 'en') {
        details.push(`Preference match: ${prefShown}.`);
      } else if (lang === 'zh-CN') {
        details.push(`偏好匹配：${prefShown}。`);
      } else {
        details.push(`偏好匹配：${prefShown}。`);
      }
    }

    const summary =
      details[0] ??
      (lang === 'en'
        ? 'Grounded in currently shared preferences and routine comfort.'
        : lang === 'zh-CN'
          ? '依据当前已授权偏好与日常舒适节奏整理。'
          : '依據目前己授權偏好與日常舒適步調整理。');

    return { summary, details };
  };

  const builtPool: AiCareRecommendation[] = scored.map(({ candidate, localized, meta, matchedPrefs }) => {
    const vars = {
      name: rec.name,
      weekday: patternWeekdayName,
      overallMean,
      recent7Mean,
      weekdayMean,
      forecastScore,
      pref: prefSummary || candidate.category,
    };

    const whyTemplate =
      !rec.energyShared || rec.insufficientHistoricalData
        ? localized.whyInsufficient
        : hasEnergyPattern
          ? localized.whyPattern
          : localized.whySteady;

    // Be honest about learning maturity when Initial (< 3 feedback events)
    let personalizationText = prefSummary
      ? fillTemplate(localized.personalizationWithPref, vars)
      : localized.personalizationGeneral;

    if (learned && learned.totalFeedbackCount > 0) {
      if (learned.learningMaturity === 'Initial') {
        personalizationText +=
          lang === 'en'
            ? ` (Early feedback note: ${learned.totalFeedbackCount} rating recorded so far — keeping suggestions gentle and exploratory.)`
            : lang === 'zh-CN'
              ? `（初期反馈参考：目前仅有 ${learned.totalFeedbackCount} 条评价，继续保持温和尝试。）`
              : `（初期回饋參考：目前僅有 ${learned.totalFeedbackCount} 則評價，維持溫和探索。）`;
      } else if (learned.preferredActionTypes.includes(meta.actionType)) {
        personalizationText +=
          lang === 'en'
            ? ` (${learned.learningMaturity} feedback profile favors this action style.)`
            : lang === 'zh-CN'
              ? `（${learned.learningMaturity === 'Established' ? '稳定' : '发展中'}偏好记录显示对方较喜欢此类方式。）`
              : `（${learned.learningMaturity === 'Established' ? '穩定' : '發展中'}偏好紀錄顯示對方較喜歡此類方式。）`;
      }
    }

    const nowEvidence = buildNowEvidenceForRec(matchedPrefs);

    return {
      id: `${candidate.id}-${variationSeed}`,
      title: localized.title,
      category: candidate.category,
      timeHorizon: 'now',
      why: fillTemplate(whyTemplate, vars),
      action: fillTemplate(localized.action, vars),
      suggestedTiming: fillTemplate(
        hasEnergyPattern ? localized.timingPattern : localized.timingGeneral,
        vars
      ),
      personalizationReason: personalizationText,
      evidenceSummary: nowEvidence.summary,
      evidenceDetails: nowEvidence.details,
      confidence,
      defaultMessage: localized.defaultMessage,
      actionType: meta.actionType,
      communicationStyle: meta.communicationStyle,
      effortLevel: meta.effortLevel,
      requiresSpendingMoney: meta.requiresSpendingMoney,
      tags: meta.tags,
      fingerprint: meta.fingerprint,
    };
  });

  // Ensure batch category diversity & cooldown respect
  const recommendations = diversifyRecommendations(builtPool, recentHistory, 3);

  // Build Stage 5.8 Plan Ahead recommendations strictly when authorized multi-week history & forecast allow
  const canGeneratePlanAhead = Boolean(
    rec.energyShared &&
      !rec.insufficientHistoricalData &&
      rec.canShowFutureForecast !== false &&
      Array.isArray(rec.upcomingForecast) &&
      rec.upcomingForecast.length > 0
  );

  const planAheadRecommendations: AiCareRecommendation[] = [];
  let planAheadSummary: string | undefined;

  if (canGeneratePlanAhead && rec.upcomingForecast) {
    const validDays = rec.upcomingForecast.filter(
      (d) => typeof d.estimatedEnergy === 'number' && d.confidence !== 'Insufficient Data'
    );
    if (validDays.length > 0) {
      const avoidPaid = Boolean(learned?.negativelyRatedAttributes.avoidPaidSuggestions);
      const lowestDay =
        highlightedForecast && highlightedForecast.estimatedEnergy !== null
          ? highlightedForecast
          : [...validDays].sort(
              (a, b) => (a.estimatedEnergy ?? 100) - (b.estimatedEnergy ?? 100)
            )[0];
      const bestDay =
        [...validDays]
          .filter((d) => d.dateISO !== lowestDay.dateISO)
          .sort((a, b) => (b.estimatedEnergy ?? 0) - (a.estimatedEnergy ?? 0))[0] ?? validDays[0];

      const lowestWeekdayName = weekdays[lowestDay.weekdayIndex];
      const prepWeekdayIdx = (lowestDay.weekdayIndex + 6) % 7;
      const prepWeekdayName = weekdays[prepWeekdayIdx];
      const bestWeekdayName = weekdays[bestDay.weekdayIndex];

      const lowestConfidence: AiCareConfidence =
        lowestDay.confidence === 'Moderate' ? 'Moderate' : 'Low';
      const bestConfidence: AiCareConfidence =
        bestDay.confidence === 'Moderate' ? 'Moderate' : 'Low';

      const sharedSleepNote =
        rec.sleepShared && rec.sleepSummary?.patternPrevNightAvgSleepHours != null
          ? lang === 'en'
            ? `Prior-night sleep before ${lowestWeekdayName}s averaged ${rec.sleepSummary.patternPrevNightAvgSleepHours}h in shared records (observed correlation only).`
            : lang === 'zh-CN'
              ? `已授权睡眠摘要显示 ${lowestWeekdayName} 前一晚平均为 ${rec.sleepSummary.patternPrevNightAvgSleepHours} 小时（仅作日常规律参考）。`
              : `已授權睡眠摘要顯示 ${lowestWeekdayName} 前一晚平均為 ${rec.sleepSummary.patternPrevNightAvgSleepHours} 小時（僅作日常規律參考）。`
          : null;

      // 1. Recurring Dip / Lower-Energy Window Advance Buffer (Non-purchase)
      const prepEvidenceDetails: string[] = [];
      if (hasEnergyPattern && rec.weekdayPattern) {
        if (lang === 'en') {
          prepEvidenceDetails.push(
            `Observed pattern: ${rec.weekdayPattern.observationCount} ${lowestWeekdayName}s across ${rec.weekdayPattern.qualifyingWeeks} weeks averaged ${weekdayMean} vs ${overallMean} overall.`
          );
          prepEvidenceDetails.push(
            `Pattern-based estimate for ${lowestDay.dateISO} (${lowestWeekdayName}): ${lowestDay.estimatedEnergy}/100 (${lowestConfidence} confidence).`
          );
        } else if (lang === 'zh-CN') {
          prepEvidenceDetails.push(
            `历史规律：跨 ${rec.weekdayPattern.qualifyingWeeks} 周的 ${rec.weekdayPattern.observationCount} 个${lowestWeekdayName}均值为 ${weekdayMean}（整体均值 ${overallMean}）。`
          );
          prepEvidenceDetails.push(
            `${lowestDay.dateISO}（${lowestWeekdayName}）预估指数：${lowestDay.estimatedEnergy}/100（${lowestConfidence === 'Moderate' ? '中等' : '较低'}置信度 · 基于规律估算）。`
          );
        } else {
          prepEvidenceDetails.push(
            `歷史規律：跨 ${rec.weekdayPattern.qualifyingWeeks} 週的 ${rec.weekdayPattern.observationCount} 個${lowestWeekdayName}均值為 ${weekdayMean}（整體均值 ${overallMean}）。`
          );
          prepEvidenceDetails.push(
            `${lowestDay.dateISO}（${lowestWeekdayName}）預估指數：${lowestDay.estimatedEnergy}/100（${lowestConfidence === 'Moderate' ? '中等' : '較低'}信心度 · 依規律推算）。`
          );
        }
      } else {
        if (lang === 'en') {
          prepEvidenceDetails.push(
            `Observed ${rec.recordedDaysCount}-day baseline: ${overallMean} overall mean, ${recent7Mean} recent 7-day mean.`
          );
          prepEvidenceDetails.push(
            `Upcoming lower-range estimate (${lowestDay.dateISO} ${lowestWeekdayName}): ${lowestDay.estimatedEnergy}/100 (${lowestConfidence} confidence estimate).`
          );
        } else if (lang === 'zh-CN') {
          prepEvidenceDetails.push(
            `历史 ${rec.recordedDaysCount} 天记录：整体均值 ${overallMean}，近 7 天均值 ${recent7Mean}。`
          );
          prepEvidenceDetails.push(
            `${lowestDay.dateISO}（${lowestWeekdayName}）预估为 ${lowestDay.estimatedEnergy}/100（规律推算仅供参考）。`
          );
        } else {
          prepEvidenceDetails.push(
            `歷史 ${rec.recordedDaysCount} 天紀錄：整體均值 ${overallMean}，近 7 天均值 ${recent7Mean}。`
          );
          prepEvidenceDetails.push(
            `${lowestDay.dateISO}（${lowestWeekdayName}）預估為 ${lowestDay.estimatedEnergy}/100（規律推算僅供參考）。`
          );
        }
      }
      if (sharedSleepNote) prepEvidenceDetails.push(sharedSleepNote);

      const prepTitle =
        lang === 'en'
          ? hasEnergyPattern
            ? `Ease ${lowestWeekdayName} Ahead with a ${prepWeekdayName} Evening Reset`
            : `Keep ${lowestWeekdayName} Evening Light & Unscheduled`
          : lang === 'zh-CN'
            ? hasEnergyPattern
              ? `提前在${prepWeekdayName}傍晚减负，平稳迎接${lowestWeekdayName}`
              : `提前为${lowestWeekdayName}预留轻松少事务的夜晚`
            : hasEnergyPattern
              ? `提前在${prepWeekdayName}傍晚減負，平穩迎接${lowestWeekdayName}`
              : `提前為${lowestWeekdayName}預留輕鬆少事務的夜晚`;

      const prepAction =
        lang === 'en'
          ? `Prep a low-effort meal or clear routine chores on ${prepWeekdayName} night so ${rec.name} can protect calm evening rest on ${lowestWeekdayName}.`
          : lang === 'zh-CN'
            ? `提前在${prepWeekdayName}晚上分担次日琐事或备好清淡餐食，让 ${rec.name} 在${lowestWeekdayName}下班后能轻松歇息。`
            : `提前在${prepWeekdayName}晚上分擔隔日瑣事或備好清淡餐點，讓 ${rec.name} 在${lowestWeekdayName}下班後能輕鬆歇息。`;

      const prepMeta = normalizeRecommendationMetadata({
        title: prepTitle,
        category: 'Rest & Recovery',
        action: prepAction,
        why: prepEvidenceDetails[0],
        suggestedTiming: `${lowestWeekdayName} · ${lowestDay.dateISO}`,
        actionType: 'quiet_evening',
        communicationStyle: 'Practical Action',
        effortLevel: 'Low',
        requiresSpendingMoney: false,
      });

      planAheadRecommendations.push({
        id: `ahead-prep-${lowestDay.dateISO}-${variationSeed}`,
        title: prepTitle,
        category: 'Rest & Recovery',
        timeHorizon: 'ahead',
        why:
          lang === 'en'
            ? hasEnergyPattern
              ? `Multi-week observations show lower average energy on ${lowestWeekdayName}s; early light prep helps keep the evening unhurried.`
              : `Pattern-based estimates indicate ${lowestWeekdayName} may be a slightly quieter window where light advance prep helps.`
            : lang === 'zh-CN'
              ? hasEnergyPattern
                ? `多周历史显示 ${lowestWeekdayName} 平均精力相对偏低，提前少做安排能让当晚更舒缓。`
                : `基于规律推算，${lowestWeekdayName}可能略偏需要恢复，提前保留余地会更自在。`
              : hasEnergyPattern
                ? `多週歷史顯示 ${lowestWeekdayName} 平均精力相對偏低，提前少排行程能讓當晚更舒緩。`
                : `依規律推算，${lowestWeekdayName}可能略偏需要恢復，提前保留餘裕會更自在。`,
        action: prepAction,
        suggestedTiming:
          lang === 'en'
            ? `Ahead of ${lowestWeekdayName} (${lowestDay.dateISO})`
            : `${lowestWeekdayName}前后（${lowestDay.dateISO}）`,
        personalizationReason: prefSummary
          ? lang === 'en'
            ? `Respects ${rec.name}'s preferences (${prefSummary}) with zero spending needed.`
            : lang === 'zh-CN'
              ? `结合「${prefSummary}」偏好与规律节点提前布置。`
              : `結合「${prefSummary}」偏好與規律節點提前安排。`
          : prepEvidenceDetails[0],
        evidenceSummary: prepEvidenceDetails[0],
        evidenceDetails: prepEvidenceDetails,
        targetWeekdayIndex: lowestDay.weekdayIndex,
        targetDateISO: lowestDay.dateISO,
        confidence: lowestConfidence,
        defaultMessage:
          lang === 'en'
            ? `Thinking ahead for ${lowestWeekdayName} — happy to keep dinner super light and handle evening cleanup so you can rest.`
            : lang === 'zh-CN'
              ? `提前帮你想好了，这周${lowestWeekdayName}晚上我们简简单单吃顿清淡的，家务交给我，你安心休息。`
              : `提前替你想好了，這週${lowestWeekdayName}晚上我們簡簡單單吃頓清淡的，家務交給我，你安心休息。`,
        actionType: prepMeta.actionType,
        communicationStyle: prepMeta.communicationStyle,
        effortLevel: prepMeta.effortLevel,
        requiresSpendingMoney: false,
        tags: ['plan_ahead', 'quiet', 'prep'],
        fingerprint: prepMeta.fingerprint,
      });

      // 2. Higher-Energy Day Quality Time / Date Planning Opportunity (Non-purchase)
      const avoidCrowds = allAvoidText.includes('crowd') || allAvoidText.includes('拥挤') || allAvoidText.includes('擁擠');
      const suggestedDatePlanId = avoidCrowds ? 'date-cozy-movie' : 'date-evening-walk';
      const dateTitle =
        lang === 'en'
          ? avoidCrowds
            ? `Plan a Relaxed ${bestWeekdayName} Cozy Film & Tea Night`
            : `Plan an Unhurried ${bestWeekdayName} Golden-Hour Walk`
          : lang === 'zh-CN'
            ? avoidCrowds
              ? `预约${bestWeekdayName}的居家老电影与热茶时光`
              : `预约${bestWeekdayName}傍晚的轻松户外散步`
            : avoidCrowds
              ? `預約${bestWeekdayName}的居家老電影與熱茶時光`
              : `預約${bestWeekdayName}傍晚的輕鬆戶外散步`;

      const dateAction =
        lang === 'en'
          ? avoidCrowds
            ? `Invite ${rec.name} to a low-pressure home movie & warm drink evening around ${bestWeekdayName} (${bestDay.dateISO}) when energy is estimated steadier.`
            : `Propose a relaxed 30–45 minute neighborhood or waterfront walk around ${bestWeekdayName} (${bestDay.dateISO}) when estimated energy looks higher.`
          : lang === 'zh-CN'
            ? avoidCrowds
              ? `在预估精力更舒展的${bestWeekdayName}（${bestDay.dateISO}）前先约一场安静不累的居家电影之夜。`
              : `在预估精力较充沛的${bestWeekdayName}（${bestDay.dateISO}）附近，轻轻约一场 30 分钟傍晚散步。`
            : avoidCrowds
              ? `在預估精力較舒展的${bestWeekdayName}（${bestDay.dateISO}）前先約一場安靜不累的居家電影之夜。`
              : `在預估精力較充沛的${bestWeekdayName}（${bestDay.dateISO}）附近，輕輕約一場 30 分鐘傍晚散步。`;

      const dateEvidenceDetails: string[] =
        lang === 'en'
          ? [
              `Upcoming ${bestWeekdayName} (${bestDay.dateISO}) estimated energy: ${bestDay.estimatedEnergy}/100 (${bestConfidence} confidence pattern estimate).`,
              `Filtered against ${rec.name}'s avoid preferences${rec.avoidTags.length > 0 ? ` (${rec.avoidTags.join(', ')})` : ''}.`,
            ]
          : lang === 'zh-CN'
            ? [
                `${bestDay.dateISO}（${bestWeekdayName}）规律推算精力：${bestDay.estimatedEnergy}/100（估算值，供约会挑日参考）。`,
                `已自动避开不喜欢的场景偏好。`,
              ]
            : [
                `${bestDay.dateISO}（${bestWeekdayName}）規律推算精力：${bestDay.estimatedEnergy}/100（推算值，供約會挑日參考）。`,
                `已自動避開不喜歡的場景偏好。`,
              ];

      const dateMeta = normalizeRecommendationMetadata({
        title: dateTitle,
        category: 'Quality Time',
        action: dateAction,
        why: dateEvidenceDetails[0],
        suggestedTiming: `${bestWeekdayName} · ${bestDay.dateISO}`,
        actionType: 'evening_walk',
        communicationStyle: 'Shared Activity',
        effortLevel: 'Low',
        requiresSpendingMoney: false,
      });

      planAheadRecommendations.push({
        id: `ahead-date-${bestDay.dateISO}-${variationSeed}`,
        title: dateTitle,
        category: 'Quality Time',
        timeHorizon: 'ahead',
        why:
          lang === 'en'
            ? `${bestWeekdayName} is estimated as one of the steadier days ahead (${bestDay.estimatedEnergy}/100), making it a natural time for shared quality time.`
            : lang === 'zh-CN'
              ? `${bestWeekdayName}在未来 7 天推算中相对平稳舒展（约 ${bestDay.estimatedEnergy}/100），适合轻松预约双方都喜欢的相处时刻。`
              : `${bestWeekdayName}在未來 7 天推算中相對平穩舒展（約 ${bestDay.estimatedEnergy}/100），適合輕鬆預約雙方都喜歡的相處時刻。`,
        action: dateAction,
        suggestedTiming: `${bestWeekdayName} · ${bestDay.dateISO}`,
        personalizationReason: dateEvidenceDetails[1],
        evidenceSummary: dateEvidenceDetails[0],
        evidenceDetails: dateEvidenceDetails,
        targetWeekdayIndex: bestDay.weekdayIndex,
        targetDateISO: bestDay.dateISO,
        suggestedDatePlanId,
        confidence: bestConfidence,
        defaultMessage:
          lang === 'en'
            ? `Would love to keep ${bestWeekdayName} open for an easy, unhurried evening together if you feel up for it.`
            : lang === 'zh-CN'
              ? `这周${bestWeekdayName}如果你状态不错，要不要一起留出一段时间轻松散步或窝着看部电影？`
              : `這週${bestWeekdayName}如果你狀態不錯，要不要一起留出一段時間輕鬆散步或窩著看部電影？`,
        actionType: dateMeta.actionType,
        communicationStyle: dateMeta.communicationStyle,
        effortLevel: dateMeta.effortLevel,
        requiresSpendingMoney: false,
        tags: ['plan_ahead', 'date_planning', 'quality_time'],
        fingerprint: dateMeta.fingerprint,
      });

      // 3. Timed Advance Gesture or Optional Pre-Scheduled Treat (strictly respecting avoidPaidSuggestions)
      const wantsWarmDrinkTreat =
        !avoidPaid &&
        (allPrefText.includes('milk tea') ||
          allPrefText.includes('coffee') ||
          allPrefText.includes('tea') ||
          allPrefText.includes('奶茶') ||
          allPrefText.includes('咖啡'));

      const gestureIsPaid = wantsWarmDrinkTreat;
      const gestureTitle = gestureIsPaid
        ? lang === 'en'
          ? `Schedule a ${lowestWeekdayName} Afternoon Warm Milk Tea Surprise`
          : lang === 'zh-CN'
            ? `预约${lowestWeekdayName}午后的热奶茶小惊喜`
            : `預約${lowestWeekdayName}午後的熱奶茶小驚喜`
        : lang === 'en'
          ? `Prepare a ${lowestWeekdayName} Morning Appreciation Note`
          : lang === 'zh-CN'
            ? `为${lowestWeekdayName}清晨准备一张提前写好的鼓劲便签`
            : `為${lowestWeekdayName}清晨準備一張提前寫好的打氣便條`;

      const gestureAction = gestureIsPaid
        ? lang === 'en'
          ? `Set a reminder or plan a warm milk tea delivery for ${lowestWeekdayName} afternoon (${lowestDay.dateISO}) as a gentle pick-me-up.`
          : lang === 'zh-CN'
            ? `在${lowestWeekdayName}（${lowestDay.dateISO}）下午为 ${rec.name} 提前设定提醒或点一杯温和热奶茶。`
            : `在${lowestWeekdayName}（${lowestDay.dateISO}）下午為 ${rec.name} 提前設定提醒或點一杯溫和熱奶茶。`
        : lang === 'en'
          ? `Write a brief encouraging note the night before to tuck beside ${rec.name}'s mug on ${lowestWeekdayName} morning.`
          : lang === 'zh-CN'
            ? `前一晚写好一句温暖肯定，放在 ${rec.name} ${lowestWeekdayName}清晨一定会用到的水杯旁。`
            : `前一晚寫好一句溫暖肯定，放在 ${rec.name} ${lowestWeekdayName}清晨一定會用到的水杯旁。`;

      const gestureEvidenceDetails = [
        prepEvidenceDetails[0],
        gestureIsPaid
          ? lang === 'en'
            ? `Matched stated drink preference while keeping ordering entirely manual (never auto-ordered).`
            : lang === 'zh-CN'
              ? `匹配已记录饮品偏好；所有下单与提醒均需你手动确认。`
              : `匹配已紀錄飲品偏好；所有下單與提醒均需你手動確認。`
          : lang === 'en'
            ? `Zero-cost surprise option honoring feedback & low-pressure communication style.`
            : lang === 'zh-CN'
              ? `零花费小惊喜方案，尊重对方偏好与零压力沟通风格。`
              : `無需花費小驚喜方案，尊重對方偏好與零壓力溝通風格。`,
      ];

      const gestureMeta = normalizeRecommendationMetadata({
        title: gestureTitle,
        category: 'Small Surprise',
        action: gestureAction,
        why: gestureEvidenceDetails[0],
        suggestedTiming: `${lowestWeekdayName} · ${lowestDay.dateISO}`,
        actionType: gestureIsPaid ? 'purchase_coffee' : 'handwritten_note',
        communicationStyle: 'Surprise',
        effortLevel: 'Low',
        requiresSpendingMoney: gestureIsPaid,
      });

      planAheadRecommendations.push({
        id: `ahead-gesture-${lowestDay.dateISO}-${variationSeed}`,
        title: gestureTitle,
        category: 'Small Surprise',
        timeHorizon: 'ahead',
        why:
          lang === 'en'
            ? `Planning a timed small gesture ahead of ${lowestWeekdayName} adds warmth right when historical averages tend to dip.`
            : lang === 'zh-CN'
              ? `提前卡在历史偏累的${lowestWeekdayName}节点送出贴心小意，比事后补救更有陪伴感。`
              : `提前卡在歷史偏累的${lowestWeekdayName}節點送出貼心小意，比事後補救更有陪伴感。`,
        action: gestureAction,
        suggestedTiming: `${lowestWeekdayName} · ${lowestDay.dateISO}`,
        personalizationReason: gestureEvidenceDetails[1],
        evidenceSummary: gestureEvidenceDetails[0],
        evidenceDetails: gestureEvidenceDetails,
        targetWeekdayIndex: lowestDay.weekdayIndex,
        targetDateISO: lowestDay.dateISO,
        confidence: lowestConfidence,
        defaultMessage: gestureIsPaid
          ? lang === 'en'
            ? `Scheduled a warm tea surprise for your ${lowestWeekdayName} afternoon break!`
            : lang === 'zh-CN'
              ? `想好在${lowestWeekdayName}下午给你留一杯热奶茶，辛苦的时候暖暖手。`
              : `想好在${lowestWeekdayName}下午替你留一杯熱奶茶，辛苦的時候暖暖手。`
          : lang === 'en'
            ? `Left a quiet note for your ${lowestWeekdayName} morning — no rush today, just cheering you on.`
            : lang === 'zh-CN'
              ? `给你留了一张${lowestWeekdayName}早上用的鼓励小纸条，今天按自己舒服的节奏来。`
              : `替你留了一張${lowestWeekdayName}早上用的鼓勵小紙條，今天依自己舒服的步調來。`,
        actionType: gestureMeta.actionType,
        communicationStyle: gestureMeta.communicationStyle,
        effortLevel: gestureMeta.effortLevel,
        requiresSpendingMoney: gestureIsPaid,
        tags: gestureIsPaid ? ['plan_ahead', 'purchase', 'warm_drink'] : ['plan_ahead', 'note', 'surprise'],
        fingerprint: gestureMeta.fingerprint,
      });

      planAheadSummary =
        lang === 'en'
          ? hasEnergyPattern
            ? `Based on ${rec.recordedDaysCount} observed days, ${lowestWeekdayName}s trend lower (${weekdayMean} vs ${overallMean} overall), while ${bestWeekdayName} looks steadier (${bestDay.estimatedEnergy}/100 estimate).`
            : `Based on ${rec.recordedDaysCount} observed days, upcoming estimates range toward ${bestDay.estimatedEnergy}/100 around ${bestWeekdayName} (estimates only).`
          : lang === 'zh-CN'
            ? hasEnergyPattern
              ? `基于 ${rec.recordedDaysCount} 天观测，${lowestWeekdayName}历史均值略低（${weekdayMean} 对比 ${overallMean}），而${bestWeekdayName}预估更平稳（约 ${bestDay.estimatedEnergy}/100，仅供参考）。`
              : `基于 ${rec.recordedDaysCount} 天观测，未来几天以${bestWeekdayName}较为平稳舒展（约 ${bestDay.estimatedEnergy}/100 推算）。`
            : hasEnergyPattern
              ? `依據 ${rec.recordedDaysCount} 天觀測，${lowestWeekdayName}歷史均值略低（${weekdayMean} 對比 ${overallMean}），而${bestWeekdayName}預估更平穩（約 ${bestDay.estimatedEnergy}/100，僅供參考）。`
              : `依據 ${rec.recordedDaysCount} 天觀測，未來幾天以${bestWeekdayName}較為平穩舒展（約 ${bestDay.estimatedEnergy}/100 推算）。`;
    }
  }

  // Build transparent, privacy-safe evidence array
  const evidence: string[] = [];
  if (!rec.energyShared || rec.insufficientHistoricalData) {
    if (lang === 'en') {
      evidence.push(
        rec.energyShared
          ? `${rec.recordedDaysCount} personal record(s) available so far — not enough multi-week history to identify a recurring pattern yet.`
          : `${rec.name}'s Energy Summary sharing is currently off, so suggestions rely solely on authorized preferences.`
      );
    } else if (lang === 'zh-CN') {
      evidence.push(
        rec.energyShared
          ? `目前已记录 ${rec.recordedDaysCount} 天数据，尚不足以识别稳定的跨周个人规律。`
          : `${rec.name} 暂未开启精力摘要共享，因此建议仅依据已授权的关怀偏好生成。`
      );
    } else {
      evidence.push(
        rec.energyShared
          ? `目前已紀錄 ${rec.recordedDaysCount} 天資料，尚不足以識別穩定的跨週個人規律。`
          : `${rec.name} 暫未開啟精力摘要分享，因此建議僅依據已授權的關懷偏好產生。`
      );
    }
  } else if (hasEnergyPattern) {
    if (lang === 'en') {
      evidence.push(
        `Observed historical energy: ${rec.weekdayPattern?.observationCount} ${patternWeekdayName}s across ${rec.weekdayPattern?.qualifyingWeeks} weeks averaged ${weekdayMean} vs. an overall ${rec.recordedDaysCount}-day mean of ${overallMean}.`
      );
      if (highlightedForecast?.estimatedEnergy !== null && highlightedForecast?.estimatedEnergy !== undefined) {
        evidence.push(
          `Estimated upcoming ${patternWeekdayName} (${highlightedForecast.dateISO}): ${highlightedForecast.estimatedEnergy} / 100 (${highlightedForecast.confidence} confidence) — an estimate, not a guaranteed outcome.`
        );
      }
      if (rec.sleepShared && rec.sleepSummary?.patternPrevNightAvgSleepHours != null) {
        evidence.push(
          `Authorized sleep summary: prior-night sleep before ${patternWeekdayName}s averaged ${rec.sleepSummary.patternPrevNightAvgSleepHours}h.`
        );
      }
    } else if (lang === 'zh-CN') {
      evidence.push(
        `历史观测：跨 ${rec.weekdayPattern?.qualifyingWeeks} 周的 ${rec.weekdayPattern?.observationCount} 个${patternWeekdayName}精力均值为 ${weekdayMean}，低于 ${rec.recordedDaysCount} 天整体均值 ${overallMean}。`
      );
      if (highlightedForecast?.estimatedEnergy !== null && highlightedForecast?.estimatedEnergy !== undefined) {
        evidence.push(
          `未来预估（${highlightedForecast.dateISO} ${patternWeekdayName}）：预计精力指数 ${highlightedForecast.estimatedEnergy} / 100（仅供参考，非确定结果）。`
        );
      }
      if (rec.sleepShared && rec.sleepSummary?.patternPrevNightAvgSleepHours != null) {
        evidence.push(
          `已授权睡眠摘要：${patternWeekdayName}前一晚平均睡眠为 ${rec.sleepSummary.patternPrevNightAvgSleepHours} 小时。`
        );
      }
    } else {
      evidence.push(
        `歷史觀測：跨 ${rec.weekdayPattern?.qualifyingWeeks} 週的 ${rec.weekdayPattern?.observationCount} 個${patternWeekdayName}精力均值為 ${weekdayMean}，低於 ${rec.recordedDaysCount} 天整體均值 ${overallMean}。`
      );
      if (highlightedForecast?.estimatedEnergy !== null && highlightedForecast?.estimatedEnergy !== undefined) {
        evidence.push(
          `未來預估（${highlightedForecast.dateISO} ${patternWeekdayName}）：預計精力指數 ${highlightedForecast.estimatedEnergy} / 100（僅供參考，非確定結果）。`
        );
      }
      if (rec.sleepShared && rec.sleepSummary?.patternPrevNightAvgSleepHours != null) {
        evidence.push(
          `已授權睡眠摘要：${patternWeekdayName}前一晚平均睡眠為 ${rec.sleepSummary.patternPrevNightAvgSleepHours} 小時。`
        );
      }
    }
  } else {
    if (lang === 'en') {
      evidence.push(
        `Observed ${rec.recordedDaysCount} days of authorized records: overall mean ${overallMean}, recent 7-day mean ${recent7Mean}, with no significant low-energy weekday dip.`
      );
    } else if (lang === 'zh-CN') {
      evidence.push(
        `已观测 ${rec.recordedDaysCount} 天授权记录：整体均值 ${overallMean}，近 7 天均值 ${recent7Mean}，未出现显著的周中精力下降规律。`
      );
    } else {
      evidence.push(
        `已觀測 ${rec.recordedDaysCount} 天授權紀錄：整體均值 ${overallMean}，近 7 天均值 ${recent7Mean}，未出現顯著的週間精力下降規律。`
      );
    }
  }

  // Only cite daily check-in status when energy sharing is permitted
  if (authorizedCheckIn) {
    const label = CHECKIN_LABEL_BY_LANG[lang][authorizedCheckIn];
    const timeSuffix = rec.statusConfirmedAtTime ? ` (${rec.statusConfirmedAtTime})` : '';
    if (lang === 'en') {
      evidence.push(`Authorized today's check-in status: "${label}"${timeSuffix}.`);
    } else if (lang === 'zh-CN') {
      evidence.push(`今日已授权状态签到：「${label}」${timeSuffix}。`);
    } else {
      evidence.push(`今日已授權狀態簽到：「${label}」${timeSuffix}。`);
    }
  }

  // Permitted biometric recovery baselines (only when explicitly shared; never mix SDNN/RMSSD)
  if (
    rec.heartRateShared &&
    rec.rhrSummary?.personalBaselineBpm != null &&
    rec.rhrSummary?.latestBpm != null
  ) {
    const dev = rec.rhrSummary.deviationBpm ?? 0;
    const sign = dev > 0 ? `+${dev}` : `${dev}`;
    if (lang === 'en') {
      evidence.push(
        `Authorized resting heart rate baseline comparison: ${rec.rhrSummary.latestBpm} bpm (${sign} bpm vs ${rec.name}'s ${rec.rhrSummary.personalBaselineBpm} bpm personal baseline).`
      );
    } else if (lang === 'zh-CN') {
      evidence.push(
        `已授权的静息心率个人基线参考：${rec.rhrSummary.latestBpm} bpm（较个人基线 ${rec.rhrSummary.personalBaselineBpm} bpm 变化 ${sign} bpm）。`
      );
    } else {
      evidence.push(
        `已授權的靜息心率個人基準參考：${rec.rhrSummary.latestBpm} bpm（較個人基準 ${rec.rhrSummary.personalBaselineBpm} bpm 變化 ${sign} bpm）。`
      );
    }
  }

  if (
    rec.hrvShared &&
    rec.hrvSummary?.personalBaselineMs != null &&
    rec.hrvSummary?.latestMs != null
  ) {
    const dev = rec.hrvSummary.deviationMs ?? 0;
    const sign = dev > 0 ? `+${dev}` : `${dev}`;
    if (lang === 'en') {
      evidence.push(
        `Authorized HRV (${rec.hrvSummary.metricType}) baseline comparison: ${rec.hrvSummary.latestMs} ms (${sign} ms vs ${rec.name}'s ${rec.hrvSummary.personalBaselineMs} ms baseline).`
      );
    } else if (lang === 'zh-CN') {
      evidence.push(
        `已授权的 HRV（${rec.hrvSummary.metricType}）参考：${rec.hrvSummary.latestMs} ms（较个人基线 ${rec.hrvSummary.personalBaselineMs} ms 变化 ${sign} ms）。`
      );
    } else {
      evidence.push(
        `已授權的 HRV（${rec.hrvSummary.metricType}）參考：${rec.hrvSummary.latestMs} ms（較個人基準 ${rec.hrvSummary.personalBaselineMs} ms 變化 ${sign} ms）。`
      );
    }
  }

  if (rec.sharedWeeklyRecharge) {
    if (lang === 'en') {
      evidence.push(
        `Shared Weekly Couple Recharge cue: valued ${rec.sharedWeeklyRecharge.supportChoice.replace(/_/g, ' ')} and welcomes ${rec.sharedWeeklyRecharge.nextWeekWish.replace(/_/g, ' ')}.`
      );
    } else if (lang === 'zh-CN') {
      evidence.push(`本周双人充能问卷已共享偏好：已纳入贴心的下周期待。`);
    } else {
      evidence.push(`本週雙人充能問卷已分享偏好：已納入下週的貼心期待。`);
    }
  }

  if (prefSummary) {
    if (lang === 'en') {
      evidence.push(`Preferences matched: ${prefSummary}.`);
    } else if (lang === 'zh-CN') {
      evidence.push(`匹配偏好：${prefSummary}。`);
    } else {
      evidence.push(`符合偏好：${prefSummary}。`);
    }
  }

  const summary =
    lang === 'en'
      ? !rec.energyShared || rec.insufficientHistoricalData
        ? `Gentle preference-guided care ideas for ${rec.name} (local fallback engine).`
        : hasEnergyPattern
          ? `${rec.name} may appreciate extra ease around ${patternWeekdayName} (local fallback engine).`
          : `Thoughtful routine support tailored to ${rec.name}'s steady baseline (local fallback engine).`
      : lang === 'zh-CN'
        ? !rec.energyShared || rec.insufficientHistoricalData
          ? `基于已选偏好为 ${rec.name} 生成的温和关怀建议（本地备用推荐引擎）。`
          : hasEnergyPattern
            ? `${rec.name} 在${patternWeekdayName}前后或许更需要轻松的陪伴与支持（本地备用推荐引擎）。`
            : `结合 ${rec.name} 平稳精力基线整理的日常关怀建议（本地备用推荐引擎）。`
        : !rec.energyShared || rec.insufficientHistoricalData
          ? `依已選偏好為 ${rec.name} 產生的溫和關懷建議（本機備援推薦引擎）。`
          : hasEnergyPattern
            ? `${rec.name} 在${patternWeekdayName}前後或許更需要輕鬆的陪伴與支持（本機備援推薦引擎）。`
            : `結合 ${rec.name} 平穩精力基線整理的日常關懷建議（本機備援推薦引擎）。`;

  const limitations =
    lang === 'en'
      ? 'Generated by the deterministic local fallback system because live Gemini responses were unavailable. Suggestions reflect authorized preferences and energy indicators only — not emotional diagnoses or guaranteed forecasts.'
      : lang === 'zh-CN'
        ? '当前由确定性本地备用系统生成（实时 Gemini 接口暂不可用）。建议仅参考已授权的偏好与精力指标，不代表情绪判断、健康诊断或确定预测。'
        : '目前由確定性本機備援系統產生（即時 Gemini 介面暫時無法連線）。建議僅參考已授權的偏好與精力指標，不代表情緒判斷、健康診斷或確定預測。';

  return {
    source: 'fallback',
    fallbackReason: reason,
    errorMessage,
    generatedAtISO: new Date().toISOString(),
    data: {
      summary,
      recipientName: rec.name,
      evidence,
      recommendations,
      ...(planAheadSummary ? { planAheadSummary } : {}),
      planAheadRecommendations,
      limitations,
    },
  };
}
