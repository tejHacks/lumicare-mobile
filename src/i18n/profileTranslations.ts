export const profileTranslations = {
  en: { prompt: "First, what should we call you?", firstName: "First name", lastName: "Last name", intro: "A little introduction helps personalise your LumiCare experience. Your name is saved on this device." },
  fr: { prompt: "Comment pouvons-nous vous appeler ?", firstName: "Prénom", lastName: "Nom", intro: "Ces informations personnalisent votre expérience LumiCare. Votre nom est enregistré sur cet appareil." },
  yo: { prompt: "Kí la ó pè ọ́?", firstName: "Orúkọ àkọ́kọ́", lastName: "Orúkọ ìdílé", intro: "Àlàyé díẹ̀ yìí yóò mú kí ìrírí LumiCare rẹ dára. A ó fipamọ́ orúkọ rẹ sí ẹ̀rọ yìí." },
  ig: { prompt: "Gịnị ka anyị ga-akpọ gị?", firstName: "Aha mbụ", lastName: "Aha ezinụlọ", intro: "Ozi a ga-eme ka ahụmịhe LumiCare gị dịrị gị mma. Aha gị ga-adị na ngwaọrụ a." },
  ha: { prompt: "Me ya ya kamata mu kira ka?", firstName: "Sunan farko", lastName: "Sunan ƙarshe", intro: "Wannan bayanin zai taimaka wajen tsara amfani da LumiCare. Za a adana sunanka a wannan na'urar." },
  tw: { prompt: "Yɛnfrɛ wo sɛn?", firstName: "Din a edi kan", lastName: "Abusua din", intro: "Nsɛm kakra yi bɛma LumiCare ayɛ wo dea. Yɛde wo din besie mfiri yi so." },
  sw: { prompt: "Tukuitaje?", firstName: "Jina la kwanza", lastName: "Jina la mwisho", intro: "Taarifa hii hubinafsisha matumizi yako ya LumiCare. Jina lako litahifadhiwa kwenye kifaa hiki." },
  zu: { prompt: "Sikubize ngokuthini?", firstName: "Igama lokuqala", lastName: "Isibongo", intro: "Lolu lwazi lwenza i-LumiCare ihambisane nawe. Igama lakho lizogcinwa kule divayisi." },
  xh: { prompt: "Sikubize ngantoni?", firstName: "Igama lokuqala", lastName: "Ifani", intro: "Olu lwazi lwenza amava akho eLumiCare abe ngawakho. Igama lakho ligcinwa kwesi sixhobo." },
  af: { prompt: "Wat moet ons jou noem?", firstName: "Voornaam", lastName: "Van", intro: "Hierdie inligting verpersoonlik jou LumiCare-ervaring. Jou naam word op hierdie toestel gestoor." },
  am: { prompt: "ምን ብለን እንጥራዎ?", firstName: "የመጀመሪያ ስም", lastName: "የአባት ስም", intro: "ይህ መረጃ የLumiCare ተሞክሮዎን ያበጃጃል። ስምዎ በዚህ መሣሪያ ላይ ይቀመጣል።" },
  so: { prompt: "Maxaan kuugu yeernaa?", firstName: "Magaca koowaad", lastName: "Magaca qoyska", intro: "Xogtan yar waxay kuu gaar yeelaysaa isticmaalka LumiCare. Magacaaga waxaa lagu kaydinayaa qalabkan." },
  rw: { prompt: "Tukwite nde?", firstName: "Izina ryawe", lastName: "Izina ry’umuryango", intro: "Aya makuru afasha kunoza imikoreshereze ya LumiCare. Izina ryawe ribikwa kuri iki gikoresho." },
  lg: { prompt: "Tukuyite ani?", firstName: "Erinnya erisooka", lastName: "Erinnya ly’ekika", intro: "Amawulire gano gafudde LumiCare okuba eyiyo. Erinnya lyo lijja kuterekebwa ku kyuma kino." },
  sn: { prompt: "Tingakudaidzei ani?", firstName: "Zita rekutanga", lastName: "Zita remhuri", intro: "Mashoko aya anobatsira kugadzirisa mashandisirwo eLumiCare. Zita rako richachengetwa pamudziyo uyu." },
  ny: { prompt: "Tikutchuleni ndani?", firstName: "Dzina loyamba", lastName: "Dzina la banja", intro: "Zimenezi zimathandiza kuti LumiCare ikhale yogwirizana ndi inu. Dzina lanu lisungidwa pa chipangizochi." },
  wo: { prompt: "Nan lañu lañu la wax?", firstName: "Tur wu njëkk", lastName: "Tur wu njaboot", intro: "Xibaar yii dañuy boole sa LumiCare ak yaw. Tur wi dina des ci aparey bii." },
  ln: { prompt: "Tobenga yo nani?", firstName: "Kombo ya liboso", lastName: "Kombo ya libota", intro: "Makambo oyo ekosalisa LumiCare ebongisama mpo na yo. Kombo na yo ekobombama na masini oyo." },
  ff: { prompt: "No feɗɗirɗen maa?", firstName: "Innde arande", lastName: "Innde galle", intro: "Ɗee humpito ina wallita Lumicare ngam waɗde ɗum no haaniri maa. Innde maa ina danndaama e kaɓirgol ngal." },
  ar: { prompt: "بماذا نناديك؟", firstName: "الاسم الأول", lastName: "اسم العائلة", intro: "تساعدنا هذه المعلومات على تخصيص تجربة LumiCare لك. سيُحفظ اسمك على هذا الجهاز." },
} as const;

export type ProfileTranslationKey = keyof typeof profileTranslations.en;
export function translateProfile(language: string, key: ProfileTranslationKey) {
  const locale = profileTranslations[language as keyof typeof profileTranslations] ?? profileTranslations.en;
  return locale[key] ?? profileTranslations.en[key];
}
