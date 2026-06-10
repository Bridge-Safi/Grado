import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "fr" | "en" | "ar" | "ber";

export const LANGS: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "ar", label: "العربية",  flag: "🇩🇿", rtl: true },
  { code: "ber", label: "ⵜⴰⵎⴰⵣⵉⵖⵜ", flag: "ⴰ" },
];

export const translations = {
  fr: {
    /* nav */
    navPricing: "Tarifs",
    navLogin: "Connexion",
    navStart: "Commencer gratuitement",
    navSignup: "Inscription",
    /* hero */
    badge: "Essai gratuit 48h · Aucune carte requise",
    heroLine1: "Construis. Compose.",
    heroLine2: "Crée.",
    heroDesc: "Décris ce que tu veux — Grado génère des applications, de la musique et des vidéos en direct dans le chat. L'IA créative tout-en-un.",
    ctaCreate: "Créer mon compte",
    ctaPricing: "Voir les tarifs",
    /* features */
    featuresTitle: "Tout ce dont tu as besoin",
    featuresSub: "Un seul outil pour créer apps, musiques et vidéos.",
    f1Title: "Apps & Sites web",
    f1Desc: "Décris ton idée, Grado génère l'application complète en quelques secondes avec preview live.",
    f2Title: "Musique IA",
    f2Desc: "Beats, mélodies, ambiances — génère des morceaux audio directement dans le chat.",
    f3Title: "Vidéos IA",
    f3Desc: "Crée des vidéos cinématiques à partir d'un simple texte. Prêtes à partager.",
    /* testimonials */
    testimonialsTitle: "Ce qu'ils en disent",
    t1: "J'ai lancé mon site e-commerce en 10 minutes. Incroyable.",
    t2: "Je génère mes musiques pour mes vidéos sans aucune connaissance musicale.",
    t3: "Grado me fait gagner des heures chaque semaine sur les projets clients.",
    /* cta section */
    ctaTitle: "Prêt à créer ?",
    ctaSub: "Inscris-toi gratuitement. 48h d'essai. Aucune carte bancaire.",
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
    perk1: "Essai gratuit 48h",
    perk2: "Aucune carte bancaire",
    perk3: "Accès immédiat",
    fullName: "Prénom / Nom",
    registerBtn: "Créer mon compte gratuit",
    terms: "En t'inscrivant, tu acceptes les conditions d'utilisation.",
    hasAccount: "Déjà un compte ?",
    toLogin: "Se connecter",
    /* chat */
    chatWelcome: "Qu'est-ce qu'on crée aujourd'hui ?",
    chatSub: "Décris ton idée — Grado la construit, la compose ou la filme en direct.",
    chip1: "🎵 Un beat lo-fi",
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
    navStart: "Start for free",
    navSignup: "Sign up",
    badge: "Free 48h trial · No card required",
    heroLine1: "Build. Compose.",
    heroLine2: "Create.",
    heroDesc: "Describe what you want — Grado generates apps, music, and videos live in the chat. The all-in-one creative AI.",
    ctaCreate: "Create my account",
    ctaPricing: "See pricing",
    featuresTitle: "Everything you need",
    featuresSub: "One tool to create apps, music, and videos.",
    f1Title: "Apps & Websites",
    f1Desc: "Describe your idea, Grado generates the full app in seconds with a live preview.",
    f2Title: "AI Music",
    f2Desc: "Beats, melodies, ambiences — generate audio tracks directly in the chat.",
    f3Title: "AI Videos",
    f3Desc: "Create cinematic videos from simple text. Ready to share.",
    testimonialsTitle: "What they say",
    t1: "I launched my e-commerce site in 10 minutes. Incredible.",
    t2: "I generate music for my videos without any musical knowledge.",
    t3: "Grado saves me hours every week on client projects.",
    ctaTitle: "Ready to create?",
    ctaSub: "Sign up for free. 48h trial. No credit card.",
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
    perk1: "Free 48h trial",
    perk2: "No credit card",
    perk3: "Instant access",
    fullName: "First / Last name",
    registerBtn: "Create my free account",
    terms: "By signing up, you accept the terms of service.",
    hasAccount: "Already have an account?",
    toLogin: "Sign in",
    chatWelcome: "What are we creating today?",
    chatSub: "Describe your idea — Grado builds it, composes it, or films it live.",
    chip1: "🎵 Lo-fi beat",
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
    navStart: "ابدأ مجاناً",
    navSignup: "إنشاء حساب",
    badge: "تجربة مجانية 48 ساعة · لا حاجة لبطاقة",
    heroLine1: "ابنِ. أَلِّف.",
    heroLine2: "أَبدِع.",
    heroDesc: "صِف ما تريد — Grado يُنشئ تطبيقات وموسيقى وفيديوهات مباشرة في المحادثة. الذكاء الاصطناعي الإبداعي الشامل.",
    ctaCreate: "إنشاء حسابي",
    ctaPricing: "عرض الأسعار",
    featuresTitle: "كل ما تحتاجه",
    featuresSub: "أداة واحدة لإنشاء التطبيقات والموسيقى والفيديوهات.",
    f1Title: "تطبيقات ومواقع ويب",
    f1Desc: "صِف فكرتك، Grado يُنشئ التطبيق الكامل في ثوانٍ مع معاينة مباشرة.",
    f2Title: "موسيقى بالذكاء الاصطناعي",
    f2Desc: "إيقاعات ونغمات وأجواء — أنشئ مقاطع صوتية مباشرة في المحادثة.",
    f3Title: "فيديوهات بالذكاء الاصطناعي",
    f3Desc: "أنشئ فيديوهات سينمائية من نص بسيط. جاهزة للمشاركة.",
    testimonialsTitle: "ماذا يقولون",
    t1: "أطلقت موقع التجارة الإلكترونية في 10 دقائق. مذهل.",
    t2: "أُنشئ موسيقى لمقاطع الفيديو دون أي معرفة موسيقية.",
    t3: "Grado يوفّر لي ساعات كل أسبوع في مشاريع العملاء.",
    ctaTitle: "مستعد للإبداع؟",
    ctaSub: "سجّل مجاناً. 48 ساعة تجربة. لا بطاقة مصرفية.",
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
    perk1: "تجربة مجانية 48 ساعة",
    perk2: "لا بطاقة مصرفية",
    perk3: "وصول فوري",
    fullName: "الاسم الأول / الأخير",
    registerBtn: "إنشاء حسابي المجاني",
    terms: "بالتسجيل، توافق على شروط الاستخدام.",
    hasAccount: "لديك حساب بالفعل؟",
    toLogin: "تسجيل الدخول",
    chatWelcome: "ماذا نُنشئ اليوم؟",
    chatSub: "صِف فكرتك — Grado يبنيها أو يُلحّنها أو يُصوّرها مباشرة.",
    chip1: "🎵 إيقاع لو-فاي",
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
    badge: "Assay amahil 48h · Ulac tkarḍ",
    heroLine1: "Bnu. Semmseɣ.",
    heroLine2: "Snulfu.",
    heroDesc: "Mmeslay ɣef wid tebɣiḍ — Grado yesnulfu isnasen, aẓawan d yividyuten deg usiwel. IA tasnulfut kra-nn-s.",
    ctaCreate: "Snulfu amiḍan·iw",
    ctaPricing: "Wali lexyal",
    featuresTitle: "Yal ma tesriḍ",
    featuresSub: "Yiwen n uẓawan ara tsenfared isnasen, aẓawan d yividyuten.",
    f1Title: "Isnasen d Ismal web",
    f1Desc: "Mmeslay ɣef tɣawsiwin·ik, Grado yesnulfu asnektar amezwer deg yimiren.",
    f2Title: "Aẓawan s IA",
    f2Desc: "Iyunasen, tmusniwin — snulfu iẓurigen n uẓawan deg usiwel.",
    f3Title: "Yividyuten s IA",
    f3Desc: "Snulfu yividyuten n sinima seg yiwen n uḍris. Ujed ara tssiwleḍ.",
    testimonialsTitle: "Ayen i d-qqalen",
    t1: "Fɣeɣ-d aɣerbaz-iw n tizeɣt deg 10 n dqiqen. Iɛejba-yi!",
    t2: "Aẓawan d Grado i asen-d-issaramen deg yividyuten·iw.",
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
    perk1: "Assay amahil 48h",
    perk2: "Ulac tkarḍ n umiḍan",
    perk3: "Tuddsa tamenzut",
    fullName: "Ism / Lqab",
    registerBtn: "Snulfu amiḍan·iw s yiman·iw",
    terms: "Seg usmekti, tettuɣaleḍ i yilugan n useqdec.",
    hasAccount: "Teɣreḍ dayen amiḍan?",
    toLogin: "Kcem",
    chatWelcome: "Acu ara nsnulfu ass-a?",
    chatSub: "Mmeslay ɣef tɣawsiwin·ik — Grado yebnu, yesammer neɣ yessigi.",
    chip1: "🎵 Aẓawan lo-fi",
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
