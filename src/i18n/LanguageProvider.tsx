import React, {
    createContext,
    useCallback,
    useContext,
    useMemo
} from "react";

import { useAppStore } from "../stores/appStore";
import { ProfileTranslationKey, translateProfile } from "./profileTranslations";
import { screenTranslations } from "./screenTranslations";
import { translate, TranslationKey, translations } from "./translations";
import { uploadTranslations } from "./uploadTranslations";

type LanguageContextValue = {
    languageCode: string;
    ready: boolean;
    setLanguage: (code: string) => Promise<void>;
    t: (key: TranslationKey) => string;
    profileText: (key: ProfileTranslationKey) => string;
    screenText: (
        key: keyof typeof screenTranslations.en,
        values?: Record<string, string | number>,
    ) => string;
    uploadText: () => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: React.PropsWithChildren) {
    const storedLanguage = useAppStore((state) => state.languageCode);
    const hydrated = useAppStore((state) => state.hydrated);
    const updateLanguage = useAppStore((state) => state.setLanguageCode);
    const languageCode = storedLanguage in translations ? storedLanguage : "en";
    const ready = hydrated;

    const setLanguage = useCallback(async (code: string) => {
        if (!(code in translations)) return;
        updateLanguage(code);
    }, [updateLanguage]);

    const value = useMemo<LanguageContextValue>(
        () => ({
            languageCode,
            ready,
            setLanguage,
            t: (key) => translate(languageCode, key),
            profileText: (key) => translateProfile(languageCode, key),
            screenText: (key, values) => {
                const locale = screenTranslations[languageCode as keyof typeof screenTranslations] ?? screenTranslations.en;
                let value: string = locale[key] ?? screenTranslations.en[key];
                for (const [name, replacement] of Object.entries(values ?? {})) {
                    value = value.replaceAll(`{${name}}`, String(replacement));
                }
                return value;
            },
            uploadText: () => uploadTranslations[languageCode as keyof typeof uploadTranslations] ?? uploadTranslations.en,
        }),
        [languageCode, ready, setLanguage],
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used inside LanguageProvider");
    }
    return context;
}
