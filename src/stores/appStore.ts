import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getAppSetting, removeAppSetting, setAppSetting } from "../db/database";

export type CaregiverProfile = { firstName: string; lastName: string };
export type ActiveBaby = { name: string; dateOfBirth: string };
export type ReferralContact = { name: string; phone: string; facility: string };
export type CareReminder = {
  id: string;
  title: string;
  notes: string;
  date: string;
  notificationId?: string;
};

type AppState = {
  hydrated: boolean;
  languageCode: string;
  caregiverProfile: CaregiverProfile | null;
  offlineTipSeen: boolean;
  activeBaby: ActiveBaby | null;
  referralContact: ReferralContact;
  reminders: CareReminder[];
  setLanguageCode: (languageCode: string) => void;
  setCaregiverProfile: (profile: CaregiverProfile) => void;
  setOfflineTipSeen: (seen: boolean) => void;
  setActiveBaby: (baby: ActiveBaby | null) => void;
  setReferralContact: (contact: ReferralContact) => void;
  setReminders: (reminders: CareReminder[]) => void;
  setHydrated: (hydrated: boolean) => void;
};

const storage = {
  getItem: (name: string) => getAppSetting(name),
  setItem: (name: string, value: string) => setAppSetting(name, value),
  removeItem: (name: string) => removeAppSetting(name),
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      languageCode: "en",
      caregiverProfile: null,
      offlineTipSeen: false,
      activeBaby: null,
      referralContact: { name: "", phone: "", facility: "" },
      reminders: [],
      setLanguageCode: (languageCode) => set({ languageCode }),
      setCaregiverProfile: (caregiverProfile) => set({ caregiverProfile }),
      setOfflineTipSeen: (offlineTipSeen) => set({ offlineTipSeen }),
      setActiveBaby: (activeBaby) => set({ activeBaby }),
      setReferralContact: (referralContact) => set({ referralContact }),
      setReminders: (reminders) => set({ reminders }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "lumicare-app-state",
      storage: createJSONStorage(() => storage),
      partialize: ({ languageCode, caregiverProfile, offlineTipSeen, activeBaby, referralContact, reminders }) => ({
        languageCode,
        caregiverProfile,
        offlineTipSeen,
        activeBaby,
        referralContact,
        reminders,
      }) as AppState,
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);