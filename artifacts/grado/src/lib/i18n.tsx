import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "fr" | "en" | "ar" | "ber";

export const LANGS: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "ar", label: "العربية",  flag: "🇸🇦", rtl: true },
  { code: "ber", label: "ⵜⴰⵎⴰⵣⵉⵖⵜ", flag: "ⴰ" },
];

export const translations = {
  fr: {
    /* nav */
    navPricing: "Tarifs",
    navLogin: "Connexion",
    navStart: "Commencer",
    navSignup: "Inscription",
    /* hero */
    badge: "Créateur d'apps · Images IA · Vidéos IA",
    heroLine1: "Construis. Imagine.",
    heroLine2: "Crée.",
    heroDesc: "Décris ce que tu veux — Grado génère des applications, des images et des vidéos en direct dans le chat. L'IA créative tout-en-un.",
    ctaCreate: "Créer mon compte",
    ctaPricing: "Voir les tarifs",
    /* features */
    featuresTitle: "Tout ce dont tu as besoin",
    featuresSub: "Un seul outil pour créer apps, images et vidéos.",
    f1Title: "Apps & Sites web",
    f1Desc: "Décris ton idée, Grado génère l'application complète en quelques secondes avec preview live.",
    f2Title: "Images IA",
    f2Desc: "Photos, illustrations, visuels sur mesure — génère des images haute qualité directement dans le chat.",
    f3Title: "Vidéos IA",
    f3Desc: "Crée des vidéos cinématiques à partir d'un simple texte. Prêtes à partager.",
    /* testimonials */
    testimonialsTitle: "Ce qu'ils en disent",
    t1: "J'ai lancé mon site e-commerce en 10 minutes. Incroyable.",
    t2: "Je génère mes visuels et vidéos pour mes projets sans aucune compétence technique.",
    t3: "Grado me fait gagner des heures chaque semaine sur les projets clients.",
    /* cta section */
    ctaTitle: "Prêt à créer ?",
    ctaSub: "Inscris-toi et commence à créer en quelques secondes.",
    ctaBtn: "Créer mon compte",
    /* footer */
    footerRights: "© 2026 Grado · Tous droits réservés",
    /* login */
    loginTitle: "Connexion",
    loginSub: "Accède à ton espace Grado",
    email: "Email",
    password: "Mot de passe",
    loginBtn: "Se connecter",
    noAccount: "Pas encore de compte ?",
    toRegister: "S'inscrire",
    back: "Retour",
    /* register */
    registerTitle: "Créer un compte",
    registerSub: "Rejoins des milliers de créateurs",
    perk1: "Accès immédiat",
    perk2: "Apps, images & vidéos",
    perk3: "Interface française",
    fullName: "Prénom / Nom",
    registerBtn: "Créer mon compte",
    terms: "En t'inscrivant, tu acceptes les conditions d'utilisation.",
    hasAccount: "Déjà un compte ?",
    toLogin: "Se connecter",
    /* chat */
    chatWelcome: "Qu'est-ce qu'on crée aujourd'hui ?",
    chatSub: "Décris ton idée — Grado la construit, la visualise ou la filme en direct.",
    chip1: "🖼️ Une illustration futuriste",
    chip2: "🎬 Vidéo coucher de soleil",
    chip3: "💻 App todo moderne",
    newChat: "Nouveau chat",
    noConv: "Aucun chat. Commence !",
    settings: "Paramètres",
    admin: "Admin — Clients",
    /* toolbar */
    toolFast: "Rapide",
    toolSmart: "Intelligent",
    toolMultiAgents: "Multi-Agents",
    toolReflection: "Réflexion",
    toolShare: "Partager",
    toolMore: "Plus d'options",
    inputPlaceholder: "Décris ce que tu veux créer...",
    groupCreation: "Création",
    groupKnowledge: "Connaissance",
  },
  en: {
    navPricing: "Pricing",
    navLogin: "Sign in",
    navStart: "Get started",
    navSignup: "Sign up",
    badge: "Apps · AI Images · AI Videos",
    heroLine1: "Build. Imagine.",
    heroLine2: "Create.",
    heroDesc: "Describe what you want — Grado generates apps, images, and videos live in the chat. The all-in-one creative AI.",
    ctaCreate: "Create my account",
    ctaPricing: "See pricing",
    featuresTitle: "Everything you need",
    featuresSub: "One tool to create apps, images, and videos.",
    f1Title: "Apps & Websites",
    f1Desc: "Describe your idea, Grado generates the full app in seconds with a live preview.",
    f2Title: "AI Images",
    f2Desc: "Photos, illustrations, custom visuals — generate high-quality images directly in the chat.",
    f3Title: "AI Videos",
    f3Desc: "Create cinematic videos from simple text. Ready to share.",
    testimonialsTitle: "What they say",
    t1: "I launched my e-commerce site in 10 minutes. Incredible.",
    t2: "I generate visuals and videos for my projects without any technical skills.",
    t3: "Grado saves me hours every week on client projects.",
    ctaTitle: "Ready to create?",
    ctaSub: "Sign up and start creating in seconds.",
    ctaBtn: "Create my account",
    footerRights: "© 2026 Grado · All rights reserved",
    loginTitle: "Sign in",
    loginSub: "Access your Grado space",
    email: "Email",
    password: "Password",
    loginBtn: "Sign in",
    noAccount: "Don't have an account?",
    toRegister: "Sign up",
    back: "Back",
    registerTitle: "Create account",
    registerSub: "Join thousands of creators",
    perk1: "Instant access",
    perk2: "Apps, images & videos",
    perk3: "French-first interface",
    fullName: "First / Last name",
    registerBtn: "Create my account",
    terms: "By signing up, you accept the terms of service.",
    hasAccount: "Already have an account?",
    toLogin: "Sign in",
    chatWelcome: "What are we creating today?",
    chatSub: "Describe your idea — Grado builds it, visualizes it, or films it live.",
    chip1: "🖼️ A futuristic illustration",
    chip2: "🎬 Sunset video",
    chip3: "💻 Modern todo app",
    newChat: "New chat",
    noConv: "No chats yet. Start one!",
    settings: "Settings",
    admin: "Admin — Clients",
    toolFast: "Fast",
    toolSmart: "Smart",
    toolMultiAgents: "Multi-Agents",
    toolReflection: "Reflection",
    toolShare: "Share",
    toolMore: "More options",
    inputPlaceholder: "Describe what you want to create...",
    groupCreation: "Creation",
    groupKnowledge: "Knowledge",
  },
  ar: {
    navPricing: "الأسعار",
    navLogin: "تسجيل الدخول",
    navStart: "ابدأ الآن",
    navSignup: "إنشاء حساب",
    badge: "تطبيقات · صور ذكاء اصطناعي · فيديوهات ذكاء اصطناعي",
    heroLine1: "ابنِ. تخيَّل.",
    heroLine2: "أَبدِع.",
    heroDesc: "صِف ما تريد — Grado يُنشئ تطبيقات وصوراً وفيديوهات مباشرة في المحادثة. الذكاء الاصطناعي الإبداعي الشامل.",
    ctaCreate: "إنشاء حسابي",
    ctaPricing: "عرض الأسعار",
    featuresTitle: "كل ما تحتاجه",
    featuresSub: "أداة واحدة لإنشاء التطبيقات والصور والفيديوهات.",
    f1Title: "تطبيقات ومواقع ويب",
    f1Desc: "صِف فكرتك، Grado يُنشئ التطبيق الكامل في ثوانٍ مع معاينة مباشرة.",
    f2Title: "صور بالذكاء الاصطناعي",
    f2Desc: "صور، رسوم توضيحية، مرئيات — أنشئ صوراً عالية الجودة مباشرة في المحادثة.",
    f3Title: "فيديوهات بالذكاء الاصطناعي",
    f3Desc: "أنشئ فيديوهات سينمائية من نص بسيط. جاهزة للمشاركة.",
    testimonialsTitle: "ماذا يقولون",
    t1: "أطلقت موقع التجارة الإلكترونية في 10 دقائق. مذهل.",
    t2: "أُنشئ مرئيات وفيديوهات لمشاريعي دون أي مهارة تقنية.",
    t3: "Grado يوفّر لي ساعات كل أسبوع في مشاريع العملاء.",
    ctaTitle: "مستعد للإبداع؟",
    ctaSub: "سجّل وابدأ الإبداع في ثوانٍ.",
    ctaBtn: "إنشاء حسابي",
    footerRights: "© 2026 Grado · جميع الحقوق محفوظة",
    loginTitle: "تسجيل الدخول",
    loginSub: "ادخل إلى مساحة Grado",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loginBtn: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    toRegister: "إنشاء حساب",
    back: "رجوع",
    registerTitle: "إنشاء حساب",
    registerSub: "انضم لآلاف المبدعين",
    perk1: "وصول فوري",
    perk2: "تطبيقات وصور وفيديو",
    perk3: "واجهة بالعربية",
    fullName: "الاسم الأول / الأخير",
    registerBtn: "إنشاء حسابي",
    terms: "بالتسجيل، توافق على شروط الاستخدام.",
    hasAccount: "لديك حساب بالفعل؟",
    toLogin: "تسجيل الدخول",
    chatWelcome: "ماذا نُنشئ اليوم؟",
    chatSub: "صِف فكرتك — Grado يبنيها أو يُصوّرها أو يُحوّلها لفيديو مباشرة.",
    chip1: "🖼️ رسم توضيحي مستقبلي",
    chip2: "🎬 فيديو غروب الشمس",
    chip3: "💻 تطبيق مهام عصري",
    newChat: "محادثة جديدة",
    noConv: "لا محادثات. ابدأ الآن!",
    settings: "الإعدادات",
    admin: "الإدارة — العملاء",
    toolFast: "سريع",
    toolSmart: "ذكي",
    toolMultiAgents: "متعدد العوامل",
    toolReflection: "تأمل",
    toolShare: "مشاركة",
    toolMore: "خيارات أخرى",
    inputPlaceholder: "صِف ما تريد إنشاءه...",
    groupCreation: "إبداع",
    groupKnowledge: "معرفة",
  },
  ber: {
    navPricing: "Lexyal",
    navLogin: "Kcem",
    navStart: "Bdu s yiman·ik",
    navSignup: "Snulfu amiḍan",
    badge: "Isnasen · Tugniwin s IA · Yividyuten s IA",
    heroLine1: "Bnu. Xeyyel.",
    heroLine2: "Snulfu.",
    heroDesc: "Mmeslay ɣef wid tebɣiḍ — Grado yesnulfu isnasen, tugniwin d yividyuten deg usiwel. IA tasnulfut kra-nn-s.",
    ctaCreate: "Snulfu amiḍan·iw",
    ctaPricing: "Wali lexyal",
    featuresTitle: "Yal ma tesriḍ",
    featuresSub: "Yiwen n uẓawan ara tsenfared isnasen, tugniwin d yividyuten.",
    f1Title: "Isnasen d Ismal web",
    f1Desc: "Mmeslay ɣef tɣawsiwin·ik, Grado yesnulfu asnektar amezwer deg yimiren.",
    f2Title: "Tugniwin s IA",
    f2Desc: "Tiwlafin, timsirniwin, isentelmen — snulfu tugniwin n taẓult deg usiwel.",
    f3Title: "Yividyuten s IA",
    f3Desc: "Snulfu yividyuten n sinima seg yiwen n uḍris. Ujed ara tssiwleḍ.",
    testimonialsTitle: "Ayen i d-qqalen",
    t1: "Fɣeɣ-d aɣerbaz-iw n tizeɣt deg 10 n dqiqen. Iɛejba-yi!",
    t2: "Tugniwin d yividyuten i asen-d-issaramen deg imisragen·iw.",
    t3: "Grado yemmesnalef-iyi isragen n wakud yal ddukkwat.",
    ctaTitle: "Ujed ara tsenfared?",
    ctaSub: "Addu s yiman·ik. 48h n assay. Ulac tkarḍ n umiḍan.",
    ctaBtn: "Snulfu amiḍan·iw",
    footerRights: "© 2026 Grado · Yal izerfan iḥeṭṭan",
    loginTitle: "Kcem",
    loginSub: "Ddu ɣer teɣzit·ik n Grado",
    email: "Imayl",
    password: "Awaṭ n tmedlest",
    loginBtn: "Kcem",
    noAccount: "Ulac amiḍan·ik?",
    toRegister: "Snulfu amiḍan",
    back: "Uɣal",
    registerTitle: "Snulfu amiḍan",
    registerSub: "Seddu ɣer yal yinulfan",
    perk1: "Tuddsa tamenzut",
    perk2: "Isnasen, tugniwin & yividyuten",
    perk3: "Amawal s tmaziɣt",
    fullName: "Ism / Lqab",
    registerBtn: "Snulfu amiḍan·iw",
    terms: "Seg usmekti, tettuɣaleḍ i yilugan n useqdec.",
    hasAccount: "Teɣreḍ dayen amiḍan?",
    toLogin: "Kcem",
    chatWelcome: "Acu ara nsnulfu ass-a?",
    chatSub: "Mmeslay ɣef tɣawsiwin·ik — Grado yebnu, yessuffeɣ neɣ yessigi.",
    chip1: "🖼️ Tugna n lmustaqbal",
    chip2: "🎬 Ividyu n tafat n wass",
    chip3: "💻 Asnektar n lemhemmat",
    newChat: "Asiwel amaynut",
    noConv: "Ulac asiwel. Bdu!",
    settings: "Iɣewwaren",
    admin: "Anedbal — Imsefrak",
    toolFast: "Usrid",
    toolSmart: "Izen",
    toolMultiAgents: "Aẓawan n Imseslayen",
    toolReflection: "Amaḍal",
    toolShare: "Bḍu",
    toolMore: "Ugar",
    inputPlaceholder: "Mmeslay ɣef wid tebɣiḍ...",
    groupCreation: "Asnulfu",
    groupKnowledge: "Tussna",
  },
} as const;

export type Translations = typeof translations.fr;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  rtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("grado_lang") as Lang | null;
    return stored && translations[stored] ? stored : "fr";
  });

  const rtl = lang === "ar";

  const setLang = (l: Lang) => {
    localStorage.setItem("grado_lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang, rtl]);

  const t = translations[lang] as Translations;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, rtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
