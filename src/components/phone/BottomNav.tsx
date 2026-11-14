import React from 'react';
import { Bell, HeartHandshake, Home, LineChart } from 'lucide-react';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { isDatePlanHiddenAsSurprise } from '@/src/services/surpriseCareService';
import { AppPage, PartnerId } from '@/src/types/dualcharge';

interface BottomNavProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

export function BottomNav({ partnerId, scope = 'demo' }: BottomNavProps) {
  const {
    activePages,
    setActivePage,
    setInsightsSubView,
    setCareSubView,
    setNotificationsSubView,
    normalActivePage,
    setNormalActivePage,
    setNormalInsightsSubView,
    setNormalCareSubView,
    setNormalNotificationsSubView,
    unreadCountForPartner,
    datePlanInteractions,
    surpriseCareRecords,
    normalInteractions,
    t,
  } = useDualCharge();
  const isNormal = scope === 'normal';
  const current = isNormal ? normalActivePage : activePages[partnerId];

  const notifBadgeCount = (() => {
    if (isNormal) {
      const dueReminders = (normalInteractions.careReminders ?? []).filter(
        (r) => r.status === 'scheduled'
      ).length;
      return dueReminders;
    }
    const unreadAlerts = unreadCountForPartner(partnerId);
    const pendingInvites = Object.values(datePlanInteractions).filter(
      (item) =>
        !isDatePlanHiddenAsSurprise(item.planId, surpriseCareRecords, partnerId) &&
        item.status === 'invited' &&
        item.invitee === partnerId
    ).length;
    return unreadAlerts + pendingInvites;
  })();

  const handleSelect = (page: AppPage) => {
    if (isNormal) {
      if (page === 'insights') {
        setNormalInsightsSubView('overview');
      } else if (page === 'notifications') {
        setNormalNotificationsSubView('overview');
      } else if (page === 'care' && current === 'care') {
        setNormalCareSubView('now');
      }
      setNormalActivePage(page);
    } else {
      if (page === 'insights') {
        setInsightsSubView(partnerId, 'overview');
      } else if (page === 'notifications') {
        setNotificationsSubView(partnerId, 'overview');
      } else if (page === 'care' && current === 'care') {
        setCareSubView(partnerId, 'now');
      }
      setActivePage(partnerId, page);
    }
  };

  const navItems: {
    id: Exclude<AppPage, 'profile'>;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badgeCount?: number;
  }[] = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'insights', label: t.nav.insights, icon: LineChart },
    { id: 'care', label: t.nav.care, icon: HeartHandshake },
    {
      id: 'notifications',
      label: t.nav.notificationsAria,
      icon: Bell,
      badgeCount: notifBadgeCount,
    },
  ];

  return (
    <nav
      aria-label={`${isNormal ? 'normal' : partnerId} navigation`}
      className="shrink-0 bg-white/85 backdrop-blur-[10px] border-t border-[#292832]/[0.05] px-2 pt-1.5 pb-2 z-20"
    >
      <div className="grid grid-cols-4 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[46px] rounded-2xl transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E88C7D] ${
                isActive
                  ? 'text-[#D46B5B] bg-[#F5E8E7]/80'
                  : 'text-[#85838D] hover:text-[#292832] hover:bg-[#292832]/[0.03]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.2 : 1.75} />
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span
                    aria-label={`${item.badgeCount} unread`}
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E88C7D] text-white text-[9px] font-bold tabular-nums flex items-center justify-center shadow-xs"
                  >
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
