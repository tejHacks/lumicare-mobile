import { render } from "@testing-library/react-native";

import WelcomeScreen from "../src/app/(onboarding)/welcome";
import ProfileScreen from "../src/app/(setup)/profile";
import GuideScreen from "../src/app/home/guide";
import HomeScreen from "../src/app/home/index";
import RecordsScreen from "../src/app/home/records";
import ReferralsScreen from "../src/app/home/referrals";
import RemindersScreen from "../src/app/home/reminders";
import ScanScreen from "../src/app/home/scan";
import SettingsScreen from "../src/app/home/setting";
import IndexScreen from "../src/app/index";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    return {
        SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
        SafeAreaProvider: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});
jest.mock("expo-router", () => ({
    Redirect: () => null,
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    useFocusEffect: jest.fn(),
}));
jest.mock("../src/i18n/LanguageProvider", () => ({
    useLanguage: () => ({
        languageCode: "en",
        ready: true,
        setLanguage: jest.fn(),
        t: (key: string) => key,
        profileText: (key: string) => key,
        screenText: (key: string) => key,
        uploadText: () => "Upload image",
    }),
}));
jest.mock("../src/stores/appStore", () => {
    const state = {
        hydrated: true,
        languageCode: "en",
        caregiverProfile: { firstName: "Amina", lastName: "Caregiver" },
        offlineTipSeen: true,
        activeBaby: { name: "Baby", dateOfBirth: "2026-10-01" },
        referralContact: { name: "", phone: "", facility: "" },
        reminders: [],
        setLanguageCode: jest.fn(),
        setCaregiverProfile: jest.fn(),
        setOfflineTipSeen: jest.fn(),
        setActiveBaby: jest.fn(),
        setReferralContact: jest.fn(),
        setReminders: jest.fn(),
        setHydrated: jest.fn(),
    };
    return { useAppStore: (selector: (current: typeof state) => unknown) => selector(state) };
});
jest.mock("../src/components/layout/BottomNav", () => () => null);
jest.mock("../src/components/ui/AppButton", () => ({ title }: { title: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, title);
});
jest.mock("../src/components/ui/ProgressDots", () => () => null);
jest.mock("../src/db/database", () => ({
    initializeDatabase: jest.fn().mockResolvedValue({}),
    getAppSetting: jest.fn().mockResolvedValue(null),
    setAppSetting: jest.fn().mockResolvedValue(undefined),
    removeAppSetting: jest.fn().mockResolvedValue(undefined),
    countScreenings: jest.fn().mockResolvedValue(0),
    getAllScreenings: jest.fn().mockResolvedValue([]),
    getScreeningById: jest.fn().mockResolvedValue(null),
    insertScreening: jest.fn().mockResolvedValue(1),
    deleteScreening: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/db/screeningImages", () => ({
    saveScreeningImage: jest.fn().mockResolvedValue("file:///private/screening.jpg"),
    deleteScreeningImage: jest.fn(),
    getScreeningImageDataUri: jest.fn().mockResolvedValue(null),
}));
jest.mock("../src/services/pdf/screeningReport", () => ({
    exportScreeningPdf: jest.fn(),
    exportScreeningsPdf: jest.fn(),
    exportReferralPdf: jest.fn(),
}));
jest.mock("expo-camera", () => ({ CameraView: () => null, useCameraPermissions: () => [null, jest.fn()] }));
jest.mock("expo-image-manipulator", () => ({
    ImageManipulator: { manipulate: () => ({ resize: jest.fn(), renderAsync: jest.fn(), release: jest.fn() }) },
    SaveFormat: { JPEG: "jpeg" },
}));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({
    Directory: class { },
    File: class { },
    Paths: { document: {}, cache: {} },
}));
jest.mock("expo-print", () => ({ printAsync: jest.fn(), printToFileAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn().mockResolvedValue(true), shareAsync: jest.fn() }));

const routedScreens = [
    ["onboarding welcome", WelcomeScreen],
    ["caregiver profile", ProfileScreen],
    ["initial redirect", IndexScreen],
    ["home", HomeScreen],
    ["education guide", GuideScreen],
    ["screening records", RecordsScreen],
    ["referrals", ReferralsScreen],
    ["reminders", RemindersScreen],
    ["screening scan", ScanScreen],
    ["settings", SettingsScreen],
] as const;

describe("routed screen smoke tests", () => {
    test.each(routedScreens)("renders the %s screen", async (_name, Screen) => {
        const screen = await render(<Screen />);
        expect(screen).toBeDefined();
    }, 20000);
});