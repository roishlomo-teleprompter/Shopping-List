import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { EN_PRODUCT_ALIASES } from "./data/product-aliases-en";
import * as EN_PRODUCTS_MODULE from "./data/products-en";
import * as HE_PRODUCTS_MODULE from "./data/products-he";
import * as RU_PRODUCTS_MODULE from "./data/products-ru";
import * as AR_PRODUCTS_MODULE from "./data/products-ar";
import { Browser } from "@capacitor/browser";
import {
  Share2,
  Star,
  Trash2,
  ShoppingCart,
  Plus,
  Minus,
  MessageCircle,
  CheckCircle2,
  ListChecks,
  Check,
  AlertCircle,
  LogOut,
  LogIn,
  Loader2,
  Mic,
  MicOff,
  Calendar,
  MoreVertical,
  Languages,
  Shield,
  FileText,
  Pencil,
} from "lucide-react";

// Local icon: list + plus (works even if lucide doesn't include ListPlus)
const ListPlusIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span className={"relative inline-block " + (className || "")}>
      <ListChecks className="w-5 h-5" />
      <span className="absolute -right-1 -top-1">
        <Plus className="w-3.5 h-3.5" />
      </span>
    </span>
  )
}

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  increment,
  where,
  writeBatch,
} from "firebase/firestore";

import { Capacitor, registerPlugin } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { App as CapacitorApp } from "@capacitor/app";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { auth, db, googleProvider } from "./firebase.ts";
import confetti from "canvas-confetti";
import appLogo from "./logo-header-transparent.png";
import { ShoppingItem, ShoppingList, Tab } from "./types.ts";

function HeaderUsersPreview({
  users,
  isOwner,
  ownerUid,
  currentUid,
  onRemoveUser,
  t,
}: {
  users: {
    id: string;
    uid?: string;
    label: string;
    bg: string;
    text?: string;
    displayName?: string;
    photoURL?: string;
    isMore?: boolean;
    hiddenUsers?: { uid: string; displayName: string }[];
  }[];
  isOwner: boolean;
  ownerUid?: string;
  currentUid?: string;
  onRemoveUser: (uid: string) => void;
  t: (key: string) => string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);

  const tooltipAnimationStyle = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!rootRef.current || !target) return;
      if (!rootRef.current.contains(target)) {
        setOpenId(null);
        if (autoCloseTimerRef.current != null) {
          window.clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = null;
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      if (autoCloseTimerRef.current != null) {
        window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={rootRef} className="flex items-center">
      <style>{tooltipAnimationStyle}</style>

      {users.map((u, idx) => (
        <div key={u.id} className={`relative ${idx > 0 ? "-mr-1" : ""}`}>
          <div
            onClick={(e) => {
              e.stopPropagation();

              setOpenId((prev) => {
                const nextId = prev === u.id ? null : u.id;

                if (autoCloseTimerRef.current != null) {
                  window.clearTimeout(autoCloseTimerRef.current);
                  autoCloseTimerRef.current = null;
                }

                if (nextId) {
                  autoCloseTimerRef.current = window.setTimeout(() => {
                    setOpenId(null);
                    autoCloseTimerRef.current = null;
                  }, 2200);
                }

                return nextId;
              });
            }}
            className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-black shadow-sm overflow-hidden cursor-pointer transition-all duration-200 ease-out ${
              openId === u.id
                ? "scale-110 z-20 shadow-lg ring-2 ring-indigo-200"
                : "scale-100"
            } ${u.bg} ${u.text || "text-white"}`}
          >
            {u.photoURL ? (
  <img
    src={u.photoURL}
    alt={u.displayName || u.label}
    referrerPolicy="no-referrer"
    className="absolute inset-0 w-full h-full object-cover rounded-full"
  />
) : (
  u.label
)}
          </div>

          {openId === u.id ? (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
              <div className="rounded-xl bg-slate-900/95 text-white text-xs font-bold px-3 py-2 shadow-lg backdrop-blur-sm animate-[fadeIn_.18s_ease-out] whitespace-nowrap">
                {u.isMore && Array.isArray(u.hiddenUsers) ? (
  <div className="flex flex-col gap-1.5">
    {u.hiddenUsers.map((hu, i) => (
      <div
        key={hu.uid || i}
        className="flex items-center justify-between gap-3"
      >
        <span>{hu.displayName}</span>

        {isOwner &&
        hu.uid &&
        hu.uid !== ownerUid &&
        hu.uid !== currentUid ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveUser(hu.uid);
            }}
            className="text-rose-300 hover:text-rose-200"
          >
            {t("נתק משתמש")}
          </button>
        ) : null}
      </div>
    ))}
  </div>
) : (
                  <div className="flex items-center justify-between gap-3">
                    <span>{u.displayName}</span>

                    {isOwner &&
                    u.uid &&
                    u.uid !== ownerUid &&
                    u.uid !== currentUid ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveUser(u.uid!);
                        }}
                        className="text-rose-300 hover:text-rose-200"
                      >
                      {t("נתק משתמש")}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type CalendarPluginType = {
  openCalendar: (options?: { title?: string; description?: string }) => Promise<void>;
};

const CalendarPlugin = registerPlugin<CalendarPluginType>("CalendarPlugin");

/**
 * Force Firebase auth persistence to LOCAL (so you won't need to login every time).
 * Runs once on module load.
 */
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // ignore
  }
})();

// ---------------------------
// Helpers
// ---------------------------
function pickProductTerms(moduleObj: Record<string, unknown>): string[] {
  const values = Object.values(moduleObj || {});
  for (const value of values) {
    if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
      return value as string[];
    }
  }
  return [];
}

const EN_PRODUCT_TERMS = pickProductTerms(EN_PRODUCTS_MODULE as Record<string, unknown>);
const HE_PRODUCT_TERMS = pickProductTerms(HE_PRODUCTS_MODULE as Record<string, unknown>);
const RU_PRODUCT_TERMS = pickProductTerms(RU_PRODUCTS_MODULE as Record<string, unknown>);
const AR_PRODUCT_TERMS = pickProductTerms(AR_PRODUCTS_MODULE as Record<string, unknown>);

function getProductTermsByLang(lang: AppLang): string[] {
  switch (lang) {
    case "he":
      return HE_PRODUCT_TERMS;
    case "ru":
      return RU_PRODUCT_TERMS;
    case "ar":
      return AR_PRODUCT_TERMS;
    case "en":
    default:
      return EN_PRODUCT_TERMS;
  }
}

function levenshtein(a: string, b: string): number {
  const s = String(a || "");
  const t = String(b || "");
  const m = s.length;
  const n = t.length;

  if (!m) return n;
  if (!n) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function normalizeCatalogTerm(s: string) {
  return normalizeItemName(String(s || "").replace(/[,\.\-_/]+/g, " ").trim());
}

// ===== Alphabetical sort helpers =====
const collatorByLang: Record<AppLang, Intl.Collator> = {
  he: new Intl.Collator("he", { sensitivity: "base", numeric: true }),
  en: new Intl.Collator("en", { sensitivity: "base", numeric: true }),
  ru: new Intl.Collator("ru", { sensitivity: "base", numeric: true }),
  ar: new Intl.Collator("ar", { sensitivity: "base", numeric: true }),
};

function compareNamesByLang(a: string, b: string, lang: AppLang) {
  const collator = collatorByLang[lang] || collatorByLang.en;
  return collator.compare(String(a || "").trim(), String(b || "").trim());
}

function getVoiceCandidateTerms(
  lang: AppLang,
  extraTerms: string[] = []
): string[] {
  const catalogTerms = getProductTermsByLang(lang);

  const merged = [
    ...extraTerms,
    ...catalogTerms,
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];

  for (const term of merged) {
    const key = normalizeCatalogTerm(term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }

  return out;
}

function correctVoiceItemName(
  name: string,
  lang: AppLang,
  extraTerms: string[] = []
): string {
  const raw = String(name || "").trim();
  if (!raw) return raw;

  const normalized = normalizeCatalogTerm(raw);
  if (!normalized) return raw;

  const terms = getVoiceCandidateTerms(lang, extraTerms);
  if (!terms.length) return raw;

  const rawWordCount = normalized.split(" ").filter(Boolean).length;

  // אם המשתמש אמר ביטוי של כמה מילים - לא לקצר אותו למונח קצר מהקטלוג.
  // רק אם יש התאמה מדויקת מלאה - נחזיר את מונח הקטלוג.
  if (rawWordCount >= 2) {
    const exactTerm = terms.find(
      (term) => normalizeCatalogTerm(term) === normalized
    );
    return exactTerm || raw;
  }

  let bestTerm = raw;
  let bestDistance = Infinity;
  let bestRatio = Infinity;
  let foundStrongMatch = false;

  for (const term of terms) {
    const candidate = normalizeCatalogTerm(term);
    if (!candidate) continue;

    if (candidate === normalized) return term;

    const candidateWordCount = candidate.split(" ").filter(Boolean).length;
    const candidateIncludesRaw = candidate.includes(normalized);
    const rawIncludesCandidate = normalized.includes(candidate);

    const isUnsafeShortening =
      rawIncludesCandidate &&
      rawWordCount > candidateWordCount &&
      normalized !== candidate;

    const safeIncludesMatch =
      candidateIncludesRaw || (rawIncludesCandidate && !isUnsafeShortening);

    const dist = levenshtein(normalized, candidate);
    const maxLen = Math.max(normalized.length, candidate.length);
    const ratio = maxLen ? dist / maxLen : 1;

    if (safeIncludesMatch) {
      const diff = Math.abs(candidate.length - normalized.length);

      if (
        diff < bestDistance ||
        (diff === bestDistance && ratio < bestRatio)
      ) {
        bestDistance = diff;
        bestRatio = ratio;
        bestTerm = term;
      }

      if (normalized.length >= 3) {
        foundStrongMatch = true;
      }

      continue;
    }

    if (
      ratio <= 0.18 ||
      (normalized.length >= 8 && ratio <= 0.22)
    ) {
      if (
        dist < bestDistance ||
        (dist === bestDistance && ratio < bestRatio)
      ) {
        bestDistance = dist;
        bestRatio = ratio;
        bestTerm = term;
        foundStrongMatch = true;
      }
    }
  }

  return foundStrongMatch ? bestTerm : raw;
}


function getPublicAppBaseUrl() {
  const envUrl = String((import.meta as any)?.env?.VITE_PUBLIC_APP_URL || "").trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "https://myeasylist.app";
}

function buildLegalUrl(kind: "privacy" | "terms") {
  return `${getPublicAppBaseUrl()}/legal/${kind}.html`;
}

async function openExternalUrl(url: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    window.location.href = url;
  }
}

function isLocalDevHost() {
  try {
    const host = String(window.location.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch (e) {
    return false;
  }
}

function isNativeOrLocalAppRuntime() {
  try {
    return Capacitor.isNativePlatform() || isLocalDevHost();
  } catch (e) {
    return isLocalDevHost();
  }
}

function buildInviteLink(listId: string, token: string) {
  const base = getPublicAppBaseUrl();
  return `${base}/?openInvite=1&listId=${encodeURIComponent(listId)}&token=${encodeURIComponent(token)}`;
}

function buildInviteDeepLink(listId: string, token: string) {
  return `myeasylist://invite?listId=${encodeURIComponent(listId)}&token=${encodeURIComponent(token)}`;
}

function buildInviteHashFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    const listId = url.searchParams.get("listId");
    const token = url.searchParams.get("token");

    if (!listId || !token) return null;

    // תמיכה גם ב-web וגם ב-deep link
    const isWebInvite = url.searchParams.get("openInvite") === "1";
    const isAppInvite = url.protocol === "myeasylist:";

    if (!isWebInvite && !isAppInvite) return null;

    return `#/invite?listId=${encodeURIComponent(listId)}&token=${encodeURIComponent(token)}`;
  } catch (e) {
    return null;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    window.prompt("העתק את הקישור:", text);
    return false;
  }
}

function isGoogleSignInUserCancelError(e: any) {
  const msg = String(e?.message || e || "").toLowerCase();
  const code = String(e?.code || "").toLowerCase();

  return (
    msg.includes("user cancelled the selector") ||
    msg.includes("user canceled the selector") ||
    msg.includes("cancelled") ||
    msg.includes("canceled") ||
    msg.includes("popup closed by user") ||
    code.includes("cancel") ||
    code.includes("canceled") ||
    code.includes("cancelled")
  );
}

async function signInSmart() {
  const platform = (() => {
    try {
      return String(Capacitor.getPlatform?.() || "web").toLowerCase();
    } catch (e) {
      return "web";
    }
  })();

  const isNative =
    platform === "android" ||
    platform === "ios" ||
    platform === "native" ||
    Capacitor.isNativePlatform();

  if (isNative) {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error("Google native sign-in returned without idToken");
    }
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
    return true;
  } catch (e: any) {
    if (isGoogleSignInUserCancelError(e)) {
      return false;
    }

    console.error("Native Google sign-in failed", e);
    throw new Error(e?.message || "Native Google sign-in failed");
  }
}

  // Browser only: popup. No redirect fallback, to avoid redirect-state issues in APK/WebView.
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      // ignore
    }
    await signInWithPopup(auth, googleProvider);
    return true;
  } catch (e: any) {
    const c = e?.code as string | undefined;
   if (
  c === "auth/popup-blocked" ||
  c === "auth/cancelled-popup-request" ||
  c === "auth/popup-closed-by-user"
) {
  return false;
}
    throw e;
  }
}

async function waitForFirebaseUser(timeoutMs = 4000): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let done = false;

    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve(auth.currentUser ?? null);
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || done) return;
      done = true;
      window.clearTimeout(timer);
      unsub();
      resolve(u);
    });
  });
}

async function signOutSmart() {
  if (Capacitor.isNativePlatform()) {
    try {
      await FirebaseAuthentication.signOut();
    } catch (e) {
      // ignore native sign out errors and continue with web sign out
    }
  }
  await signOut(auth);
}

function openWhatsApp(text: string) {
  const message = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${message}`, "_blank");
}


const LegalFooter: React.FC<{ lang: AppLang; className?: string }> = ({ lang, className = "" }) => {
  return (
    <div className={"flex items-center justify-center gap-3 text-xs font-bold text-slate-500 " + className}>
      <button
        type="button"
        onClick={() => openExternalUrl(buildLegalUrl("privacy"))}
        className="text-indigo-600 hover:text-indigo-700"
      >
        {translate(lang, "Privacy Policy")}
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => openExternalUrl(buildLegalUrl("terms"))}
        className="text-indigo-600 hover:text-indigo-700"
      >
        {translate(lang, "Terms & Conditions")}
      </button>
    </div>
  );
};

// ---------------------------
// Invite Page
// ---------------------------
const InvitePage: React.FC = () => {
const lang = (() => {
  try {
    const saved = localStorage.getItem(APP_LANG_STORAGE_KEY) as AppLang | null;
    if (saved === "he" || saved === "en" || saved === "ru" || saved === "ar") return saved;
    return detectDeviceLang();
  } catch {
    return detectDeviceLang();
  }
})();

  const t = (k: string) => translate(lang, k);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const listId = searchParams.get("listId");
  const token = searchParams.get("token");

  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const handleLogin = async () => {
  setError(null);
  try {
    await signInSmart();
  } catch (e: any) {
    setError(e?.message || "שגיאת התחברות");
  }
};

const handleJoin = async () => {
  if (!listId || !token) {
    setError("קישור ההזמנה חסר נתונים");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    let currentUser = user;

    if (!currentUser) {
      await signInSmart();
      currentUser = await waitForFirebaseUser();
    }

    if (!currentUser) {
      throw new Error("שגיאת התחברות");
    }

    await runTransaction(db, async (transaction) => {
      const listDocRef = doc(db, "lists", listId);
      const listSnap = await transaction.get(listDocRef);

      if (!listSnap.exists()) throw new Error("הרשימה לא קיימת");

      const data = listSnap.data() as ShoppingList;
      const invite = (data as any).pendingInvites?.[token];

      if (!invite) throw new Error("הזמנה לא בתוקף");
      if (invite.expiresAt < Date.now()) throw new Error("פג תוקף ההזמנה");

      transaction.update(listDocRef, {
        sharedWith: arrayUnion(currentUser.uid),
        [`pendingInvites.${token}`]: deleteField(),
      });
    });

    localStorage.setItem("activeListId", listId);
    navigate("/");
  } catch (e: any) {
    setError(e?.message || "שגיאה לא ידועה");
  } finally {
    setLoading(false);
  }
};

      if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl" style={{ fontFamily: 'Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif' }}>

      <style>{`
        html, body, #root {
          font-family: Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif !important;
        }
        *, *::before, *::after,
        input, button, select, textarea, option, label {
          font-family: Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif !important;
        }
        input::placeholder, textarea::placeholder {
          font-family: Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif !important;
        }
      `}</style>
<Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
        <div className="flex justify-center">
          <img
            src={appLogo}
            alt="My Easy List"
            className="w-24 h-24 object-contain drop-shadow-sm"
          />
           </div>
        <h1 className="text-2xl font-black text-slate-800">{t("הוזמנת לרשימה")}</h1>

        {!listId || !token ? <p className="text-rose-500 font-bold">{t("קישור ההזמנה לא תקין")}</p> : null}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t("הצטרף עם גוגל")}
        </button>

        <LegalFooter lang={lang} className="pt-1" />
      </div>
    </div>
  );
};


const InstallLandingPage: React.FC<{ inviteMode?: boolean; forcedLang?: AppLang }> = ({
  inviteMode = false,
  forcedLang,
}) => {
  const lang: AppLang = forcedLang || (() => {
    try {
      const saved = localStorage.getItem(APP_LANG_STORAGE_KEY) as AppLang | null;
      if (saved === "he" || saved === "en" || saved === "ru" || saved === "ar") return saved;
      return detectDeviceLang();
    } catch {
      return detectDeviceLang();
    }
  })();

  const isAndroid = (() => {
    try {
      return /android/i.test(navigator.userAgent || "");
    } catch {
      return false;
    }
  })();

  const isIOS = (() => {
    try {
      return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    } catch (e) {
      return false;
    }
  })();

  const installTitle = inviteMode
    ? translate(lang, "התקן את האפליקציה כדי לפתוח את הרשימה")
    : translate(lang, "התקן את My Easy List");

  const installSubtitle = inviteMode
    ? translate(lang, "רשימות משותפות נפתחות רק באפליקציה")
    : translate(lang, "My Easy List זמין דרך האפליקציה");

  const primaryStoreLabel = isAndroid
    ? translate(lang, "גוגל פליי - בקרוב")
    : isIOS
      ? translate(lang, "אפ סטור - בקרוב")
      : translate(lang, "גוגל פליי - בקרוב");

  const secondaryStoreLabel = isAndroid
    ? translate(lang, "אפ סטור - בקרוב")
    : isIOS
      ? translate(lang, "גוגל פליי - בקרוב")
      : translate(lang, "אפ סטור - בקרוב");

  const storeButtonClass =
    "w-full rounded-2xl px-4 py-4 font-black border border-slate-200 bg-white text-slate-400 cursor-not-allowed";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="ltr">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <img
            src={appLogo}
            alt="My Easy List"
            className="w-24 h-24 object-contain drop-shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800">My Easy List</h1>
          <p className="text-lg font-bold text-slate-700">{installTitle}</p>
          <p className="text-sm font-bold text-slate-400">{installSubtitle}</p>
        </div>

        <div className="space-y-3">
          <button type="button" disabled className={storeButtonClass}>
            {primaryStoreLabel}
          </button>
          <button type="button" disabled className={storeButtonClass}>
            {secondaryStoreLabel}
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 text-sm font-bold text-slate-500 leading-6">
          {inviteMode
            ? translate(lang, "אחרי התקנת האפליקציה פתח שוב את הקישור")
            : translate(lang, "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות")}
        </div>

        <div className="pt-2 text-center text-xs font-bold text-slate-400">
          <button
            type="button"
            onClick={() => openExternalUrl(buildLegalUrl("privacy"))}
            className="underline hover:text-slate-600"
          >
            {translate(lang, "Privacy Policy")}
          </button>
          <span className="mx-2">|</span>
          <button
            type="button"
            onClick={() => openExternalUrl(buildLegalUrl("terms"))}
            className="underline hover:text-slate-600"
          >
            {translate(lang, "Terms & Conditions")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------
// Main List
// ---------------------------
type FavoriteDoc = {
  id: string; // itemId
  name: string;
  createdAt: number;
  updatedAt?: number;
  category?: CategoryKey;
};

type VoiceMode = "hold_to_talk";

const HEB_NUMBER_WORDS: Record<string, number> = {
  אחד: 1,
  אחת: 1,
  שני: 2,
  שניים: 2,
  שתיים: 2,
  שתים: 2,
  שתי: 2,
  שלוש: 3,
  שלושה: 3,
  ארבע: 4,
  ארבעה: 4,
  חמש: 5,
  חמישה: 5,
  שש: 6,
  שישה: 6,
  שבע: 7,
  שבעה: 7,
  שמונה: 8,
  תשע: 9,
  תשעה: 9,
  עשר: 10,
  עשרה: 10,
};

const EN_NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const RU_NUMBER_WORDS: Record<string, number> = {
  один: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
};

const AR_NUMBER_WORDS: Record<string, number> = {
  واحد: 1,
  واحدة: 1,
  اثنين: 2,
  اثنان: 2,
  اتنين: 2,
  اتنان: 2,
  اثنتين: 2,
  اثنتان: 2,
  ثلاثة: 3,
  ثلاثه: 3,
  ثلاث: 3,
  أربعة: 4,
  اربعة: 4,
  أربع: 4,
  اربعه: 4,
  خمسة: 5,
  خمسه: 5,
  خمس: 5,
  ستة: 6,
  سته: 6,
  ست: 6,
  سبعة: 7,
  سبعه: 7,
  سبع: 7,
  ثمانية: 8,
  ثمانيه: 8,
  ثماني: 8,
  تسعة: 9,
  تسعه: 9,
  تسع: 9,
  عشرة: 10,
  عشره: 10,
  عشر: 10,
};

const AMBIGUOUS_BOUNDARY_NUMBER_WORDS: Record<string, number> = {
  for: 4,
  to: 2,
  too: 2,
};


const ALL_NUMBER_WORDS: Record<string, number> = {
  ...HEB_NUMBER_WORDS,
  ...EN_NUMBER_WORDS,
  ...RU_NUMBER_WORDS,
  ...AR_NUMBER_WORDS,
};

const ALL_NUMBER_WORD_KEYS = Array.from(
  new Set([...Object.keys(ALL_NUMBER_WORDS), ...Object.keys(AMBIGUOUS_BOUNDARY_NUMBER_WORDS)])
).sort((a, b) => b.length - a.length);

const NUMBER_WORDS_REGEX = new RegExp(
  `\b(${ALL_NUMBER_WORD_KEYS.join("|")})\b\s*,\s*`,
  "gi"
);

const normalize = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/[״"']/g, "")
    .replace(/\s+/g, " ");

const stripWrappingBrackets = (s: string = "") =>
  s
    .replace(/^\s*[\(\[\{]\s*/, "")
    .replace(/\s*[\)\]\}]\s*$/, "")
    .trim();


function applyEnglishAlias(name: string): string {
  const raw = String(name || "").trim();
  if (!raw) return raw;

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");

  if (!/[a-z]/i.test(normalized)) {
    return raw;
  }

  return EN_PRODUCT_ALIASES[normalized] || normalized;
}

const collapseExactRepeatedPhrase = (raw: string = "") => {
  const value = String(raw || "").trim().replace(/\s+/g, " ");
  if (!value) return value;

  const tokens = value.split(" ").filter(Boolean);
  if (tokens.length >= 2 && tokens.length % 2 === 0) {
    const half = tokens.length / 2;
    const first = tokens.slice(0, half).join(" ");
    const second = tokens.slice(half).join(" ");
    if (first === second) return first;
  }

  return value;
};

const shouldIgnoreStandaloneVoiceItem = (raw: string = "") => {
  const value = normalize(String(raw || ""));
  if (!value) return true;

  const parts = value.split(" ").filter(Boolean);
  if (parts.length !== 1) return false;

  const token = parts[0];
  if (!token) return true;

  if (isQtyToken(token) || isBoundaryQtyToken(token)) return true;

  if (EN_LINKING.has(token) || ["clear", "delete", "reset", "remove", "list", "the"].includes(token)) {
    return true;
  }

  return false;
};

const cleanVoicePreviewText = (s: string = "") => {
  const cleaned = collapseExactRepeatedPhrase(stripWrappingBrackets(s))
    .replace(/[()\[\]{}]/g, "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");

  const deduped = words.filter((w, i, arr) => {
    if (i === 0) return true;

    const prev = arr[i - 1];

    // remove repeated word: avocado avocado
    if (w === prev) return false;

    // remove patterns like: clear clear list
    if (i >= 2 && w === arr[i - 2]) return false;

    return true;
  });

  return deduped.join(" ");
};

const cleanVoiceReviewText = (s: string = "") =>
  stripWrappingBrackets(s)
    .replace(/[()\[\]{}]/g, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

const normalizeVoiceText = (s: string) => {
  const t = (s || "").trim();
  return t
    .replace(/[.?!]/g, " ")
    .replace(/，/g, ",")
    .replace(/\bפסיקים\b/g, ",")
    .replace(/\bפסיק\b/g, ",")
    .replace(/\s+(בבקשה|פליז|תודה)\s*/g, " ")
    // Fix: commas between numeric quantity and item should not split items (e.g., "2, apples")
    .replace(/(\b\d+\b)\s*,\s*(?=[^\d\s])/g, "$1 ")
    // Remove commas between quantity token and item name in all supported languages.
    .replace(/\b(\d+)\s*,\s*/g, "$1 ")
    .replace(NUMBER_WORDS_REGEX, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
};

function isQtyToken(tok: string) {
  if (!tok) return false;
  if (/^\d+$/.test(tok)) return true;
  return ALL_NUMBER_WORDS[tok] != null;
}

function qtyFromToken(tok: string): number | null {
  if (!tok) return null;
  if (/^\d+$/.test(tok)) return Number(tok);
  const n = ALL_NUMBER_WORDS[tok];
  return n != null ? n : null;
}

function isBoundaryQtyToken(tok: string) {
  if (!tok) return false;
  if (isQtyToken(tok)) return true;
  return AMBIGUOUS_BOUNDARY_NUMBER_WORDS[tok] != null;
}

function qtyFromBoundaryToken(tok: string): number | null {
  if (!tok) return null;
  const direct = qtyFromToken(tok);
  if (direct != null) return direct;
  const n = AMBIGUOUS_BOUNDARY_NUMBER_WORDS[tok];
  return n != null ? n : null;
}

const MULTIWORD_PREFIXES = new Set<string>([
  "רסק",
  "שמן",
  "גבינה",
  "גבינת",
  "אבקת",
  "מיץ",
  "מי",
  "רוטב",
  "קמח",
  "סוכר",
  "מלח",
  "פלפל",
  "מרק",
  "פירורי",
  "חמאת",
  "בשר",
  "עוף",
  "דג",
  "דגים",
  "קפה",
  "תה",
  "שוקולד",
  "מעדן",
  "יוגורט",
]);

function shouldKeepAsMultiwordByPrefix(first: string) {
  return MULTIWORD_PREFIXES.has(first);
}

const COMPOUND_PHRASES = new Set<string>([
  // ירקות ופירות
  "מלפפון חמוץ",
  "תפוח אדמה",
  "בצל ירוק",
  "שום כתוש",
  "גזר גמדי",
  "עגבניות שרי",
  "פלפל חריף",
  "פלפל ירוק",
  "חסה קרחון",
  "פטריות שמפיניון",

  // מוצרי בסיס ומזווה
  "רסק עגבניות",
  "שמן זית",
  "שמן קנולה",
  "קמח לבן",
  "קמח מלא",
  "סוכר חום",
  "אבקת אפייה",
  "סודה לשתייה",
  "פירורי לחם",

  // מוצרי חלב וביצים
  "גבינה צהובה",
  "גבינה לבנה",
  "גבינת שמנת",
  "גבינה בולגרית",
  "שמנת מתוקה",
  "ביצים קשות",

  // בשר ודגים
  "חזה עוף",
  "בשר טחון",
  "דג סלמון",
  "נקניקיות עוף",

  // קפואים ומוכנים
  "ציפס קפוא",
  "צ'יפס קפוא",
  "צ׳יפס קפוא",
  "פיצה קפואה",
  "ירקות קפואים",
]);

const ADJECTIVES = new Set<string>([
  // צבעים (יחיד/רבים, זכר/נקבה)
  "צהוב","צהובה","צהובים","צהובות",
  "אדום","אדומה","אדומים","אדומות",
  "ירוק","ירוקה","ירוקים","ירוקות",
  "כחול","כחולה","כחולים","כחולות",
  "שחור","שחורה","שחורים","שחורות",
  "לבן","לבנה","לבנים","לבנות",
  "אפור","אפורה","אפורים","אפורות",
  "ורוד","ורודה","ורודים","ורודות",
  "סגול","סגולה","סגולים","סגולות",
  "חום","חומה","חומים","חומות",

  // תיאורים נפוצים
  "חריף","חריפה","חריפים","חריפות",
  "חמוץ","חמוצה","חמוצים","חמוצות",
  "מתוק","מתוקה","מתוקים","מתוקות",
  "גדול","גדולה","גדולים","גדולות",
  "קטן","קטנה","קטנים","קטנות",
  "טרי","טרייה","טריים","טריות",
  "קפוא","קפואה","קפואים","קפואות",
]);

const NOUN_COMPOUND_TAILS = new Set<string>([
  "שיניים",
  "ידיים",
  "פנים",
  "רצפה",
  "חלון",
  "כביסה",
  "כלים",
  "טואלט",
  "סופג",
  "זבל",
  "ניקוי",
  "רחצה",
  "גילוח",
]);

function mergeCompounds(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  const stripHe = (t: string) => (t && t.startsWith("ה") && t.length > 1 ? t.slice(1) : t);

  while (i < tokens.length) {
    const a = tokens[i];
    const b = i + 1 < tokens.length ? tokens[i + 1] : "";

    // never merge quantity tokens
    if (a && b && !isQtyToken(a) && !isQtyToken(b)) {
      const pair = `${a} ${b}`;
      const bNorm = stripHe(b);
      const pairNorm = `${a} ${bNorm}`;

      // 1) explicit phrase list (also allow adjective with leading ה')
      if (COMPOUND_PHRASES.has(pair) || COMPOUND_PHRASES.has(pairNorm)) {
        out.push(COMPOUND_PHRASES.has(pair) ? pair : pairNorm);
        i += 2;
        continue;
      }

      // 2) noun + adjective (מלפפון חמוץ, נעליים צהובות, בצל ירוק וכו')
      if (ADJECTIVES.has(b) || ADJECTIVES.has(bNorm)) {
        out.push(ADJECTIVES.has(b) ? pair : pairNorm);
        i += 2;
        continue;
      }

      // 3) noun + noun (consumer tail nouns) - e.g. מברשת שיניים, נייר טואלט
      if (NOUN_COMPOUND_TAILS.has(b) || NOUN_COMPOUND_TAILS.has(bNorm)) {
        out.push(NOUN_COMPOUND_TAILS.has(b) ? pair : pairNorm);
        i += 2;
        continue;
      }
    }

    out.push(a);
    i += 1;
  }

  return out;
}

function isClearListCommand(raw: string, lang?: AppLang) {
  const s0 = (raw || "").trim().toLowerCase();
  // Normalize punctuation so phrases like "רק, רשימה" are treated correctly.
  const s = s0.replace(/[\n,]+/g, " ").replace(/\s+/g, " ").trim();

  const byLang = (l: AppLang) => {
   if (l === "he") {
  return (
    /(מחק|מרחק|נקה|אפס|רק).{0,12}(רשימה|הרשימה|את הרשימה)/.test(s) ||
    /(מחק|מרחק|נקה|אפס).{0,12}(הכל|את הכל)/.test(s) ||
    /^רשימה$/.test(s)
  );
}
    if (l === "en") {
      return (
        /\b(clear|delete|reset)\b.{0,16}\b(list|the list|my list)\b/.test(s) ||
        /\b(remove)\b.{0,16}\b(all|everything)\b/.test(s)
      );
    }
    if (l === "ru") {
      return (
        /\b(очисти|очистить|удали|удалить|сбрось|сбросить)\b.{0,16}\b(список|весь список)\b/.test(s)
      );
    }
    return (
      /\b(امسح|احذف|افرغ)\b.{0,16}\b(القائمة|قائمة)\b/.test(s) ||
      /\b(امسح|احذف)\b.{0,16}\b(الكل|كلها)\b/.test(s)
    );
  };

  if (lang) return byLang(lang);

  return byLang("he") || byLang("en") || byLang("ru") || byLang("ar");
}

function formatDraftForReview(
  raw: string,
  lang: AppLang,
  extraTerms: string[] = []
): string {
const s = collapseExactRepeatedPhrase((raw || "").trim());
  if (!s) return raw;

  // If this is a clear-list command, keep it exactly as spoken (do not add commas).
  if (isClearListCommand(s)) return s;

  // If user already has punctuation/new lines, keep it as-is (manual edit mode).
  if (s.includes(",") || s.includes("\n")) return raw;

const items = parseItemsFromText(s, lang, extraTerms);

// Remove duplicate items by name (preview only)
const seen = new Set<string>();
const parts: string[] = [];

for (const it of items) {
  const name = String(it?.name || "").trim().toLowerCase();
  if (!name || seen.has(name)) continue;
  seen.add(name);
   parts.push(it.qty && it.qty > 1 ? `${it.qty} ${it.name}` : it.name);
   }

return parts.join(", ");
}

/**
 * Token-scan parser that handles:
 * - "ביצים חלב עגבניה" -> 3 items
 * - qty prefix: "שתי בננות"
 * - qty suffix: "בננות שתיים"
 * - long sequences, without requiring commas
 *
 * Important rule:
 * - If qty token appears and there is a NEXT word, treat it as prefix for the NEXT item (default),
 *   not suffix for previous item. Suffix is only when qty is LAST token.
 */
  function parseSegmentTokensToItems(
  segRaw: string,
  lang: AppLang,
  extraTerms: string[] = []
): Array<{ name: string; qty: number }> {  const seg = normalize(segRaw);
  if (!seg) return [];

  

  let tokens = seg.split(" ").filter(Boolean);
  tokens = mergeCompounds(tokens);
  if (tokens.length === 0) return [];

  const out: Array<{ name: string; qty: number }> = [];

  let pendingQty = 1;
  let nameParts: string[] = [];

  const flush = (qtyOverride?: number) => {
    let name = nameParts.join(" ").trim();
    if (name) {
      name = applyEnglishAlias(name);
      name = correctVoiceItemName(name, lang, extraTerms);
      if (name && !shouldIgnoreStandaloneVoiceItem(name)) {
        const q = Math.max(1, Number(qtyOverride ?? pendingQty ?? 1));
        out.push({ name, qty: q });
      }
    }
    pendingQty = 1;
    nameParts = [];
  };

  const nextToken = (i: number) => (i + 1 < tokens.length ? tokens[i + 1] : "");

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    const nxt = nextToken(i);
    const directQty = qtyFromToken(tok);
    const boundaryOnlyQty = directQty == null && (nameParts.length === 0 || !nxt)
      ? qtyFromBoundaryToken(tok)
      : null;

    if (directQty != null || boundaryOnlyQty != null) {
      const q = Math.max(1, Number(directQty ?? boundaryOnlyQty ?? 1));

      // Prefix qty (start of item)
      if (nameParts.length === 0) {
        pendingQty = q;
        continue;
      }

      // Suffix qty only if it's the last token (ex: "בננות שתיים")
      if (!nxt) {
        flush(q);
        continue;
      }

      // Otherwise treat qty as prefix for NEXT item:
      // finish current item with its pendingQty, then set pendingQty for next
      flush();
      pendingQty = q;
      continue;
    }

    // normal word
    nameParts.push(tok);
    const nextTok = nextToken(i);

    // keep at least 2 words for known prefixes (רסק עגבניות, שמן זית וכו')
    if (nameParts.length === 1 && shouldKeepAsMultiwordByPrefix(nameParts[0])) {
      continue;
    }

    // keep phrases with connectors
    if (tok === "של" || tok === "עם") continue;
    if (nxt === "של" || nxt === "עם") continue;

    // if next is qty, wait (suffix qty) or prefix qty handling will flush
    if (isQtyToken(tok)) {
  const nxt = nextToken(i);

  // support compound English numbers like:
  // "twenty five", "thirty two"
  if (
    EN_NUMBER_WORDS[tok] != null &&
    EN_NUMBER_WORDS[nxt] != null &&
    EN_NUMBER_WORDS[tok] >= 20 &&
    EN_NUMBER_WORDS[nxt] < 10
  ) {
    const q = EN_NUMBER_WORDS[tok] + EN_NUMBER_WORDS[nxt];

    if (nameParts.length === 0) {
      pendingQty = q;
      i += 1;
      continue;
    }

    if (!nextToken(i + 1)) {
      flush(q);
      i += 1;
      continue;
    }

    flush();
    pendingQty = q;
    i += 1;
    continue;
  }

  const q = Math.max(1, qtyFromToken(tok) || 1);

  // Prefix qty (start of item)
  if (nameParts.length === 0) {
    pendingQty = q;
    continue;
  }

  // Suffix qty only if it's the last token
  if (!nxt) {
    flush(q);
    continue;
  }

  // Otherwise treat qty as prefix for NEXT item
  flush();
  pendingQty = q;
  continue;
}

    // otherwise flush after each word/phrase - this splits "ביצים חלב עגבניה"
    flush();
  }

  if (nameParts.length > 0) flush();

  return out
    .map((x) => ({ name: x.name.replace(/\s+/g, " ").trim(), qty: Math.max(1, Number(x.qty || 1)) }))
    .filter((x) => x.name.length > 0)
    .filter((x) => !shouldIgnoreStandaloneVoiceItem(x.name));
}

/**
 * Parse a phrase into multiple items.
 * Supports commas / וגם / ואז / אחר כך, and also no commas.
 */
function parseSingleItemFromSegment(
  segment: string,
  lang: AppLang,
  extraTerms: string[] = []
): ItemParse | null {
  const raw = collapseExactRepeatedPhrase((segment || "").trim());
  if (!raw) return null;
  if (isClearListCommand(raw)) return null;

  let tokens = mergeCompounds(raw.split(/\s+/).filter(Boolean));
  if (!tokens.length) return null;
  if (tokens.length === 1 && isBoundaryQtyToken(tokens[0])) return null;

  let qty = 1;

  if (tokens.length >= 2 && isBoundaryQtyToken(tokens[0])) {
    qty = qtyFromBoundaryToken(tokens[0]);
    tokens = tokens.slice(1);
  }

  if (tokens.length >= 2 && isBoundaryQtyToken(tokens[tokens.length - 1])) {
    const tailQty = qtyFromBoundaryToken(tokens[tokens.length - 1]);
    if (qty === 1) qty = tailQty;
    tokens = tokens.slice(0, -1);
  }

  let name = tokens.join(" ").trim();
  if (!name) return null;

  name = applyEnglishAlias(name);
  name = correctVoiceItemName(name, lang, extraTerms);

  if (!name) return null;
  if (shouldIgnoreStandaloneVoiceItem(name)) return null;

  return { name, qty };
}

function isHebrewLikeToken(t: string) {
  return /[\u0590-\u05FF]/.test(t);
}
function isArabicLikeToken(t: string) {
  return /[\u0600-\u06FF]/.test(t);
}

const EN_LINKING = new Set([
  "to","for","with","in","on","at","from","into","onto","of","about","by"
]);
const RU_LINKING = new Set([
  "в","во","на","к","ко","для","из","от","у","по","за","с","со","о","об","про"
]);
const AR_LINKING = new Set([
  "ل","إلى","الى","من","على","في","مع","عن","ب","بال"
]);

function isLinkingToken(t: string) {
  const x = (t || "").trim().toLowerCase();
  if (!x) return false;

  // Hebrew: standalone "ל" or attached prefix "ל..." (like "לאמא")
  if (x === "ל") return true;
  if (x.startsWith("ל") && x.length > 1 && isHebrewLikeToken(x)) return true;

  // Arabic: standalone preps, or attached prefix "ل..."
  if (AR_LINKING.has(x)) return true;
  if (x.startsWith("ل") && x.length > 1 && isArabicLikeToken(x)) return true;

  if (EN_LINKING.has(x)) return true;
  if (RU_LINKING.has(x)) return true;

  return false;
}

function linkingNeedsNextWord(t: string) {
  const x = (t || "").trim().toLowerCase();
  if (!x) return false;
  // standalone linking tokens that usually require an object next
  if (x === "ל") return true;
  if (EN_LINKING.has(x)) return true;
  if (RU_LINKING.has(x)) return true;
  if (AR_LINKING.has(x)) return true;
  return false;
}

/**
 * Build segments from voice-style text without commas/newlines.
 * Rule: keep linking words (and Hebrew/Arabic "ל..." attached forms) WITH their neighbor, so
 * "מתנה לאמא" stays one segment, and "bring to mom" stays one segment.
 */
function segmentVoiceTextKeepingLinking(rawNorm: string): string[] {
  const tokens = (rawNorm || "").split(/\s+/).map(t => t.trim()).filter(Boolean);
  if (!tokens.length) return [];

  const segments: string[] = [];
  let cur: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!cur.length) {
      cur.push(t);
      continue;
    }

    const lower = t.toLowerCase();

    // If it's a linking token, attach to current segment (and sometimes also attach the next word)
    if (isLinkingToken(lower)) {
      cur.push(t);

      if (linkingNeedsNextWord(lower) && i + 1 < tokens.length) {
        // attach next token as well, so it won't be split by commas in review
        cur.push(tokens[i + 1]);
        i += 1;
      }
      continue;
    }

    // Otherwise, start a new segment
    segments.push(cur.join(" "));
    cur = [t];
  }

  if (cur.length) segments.push(cur.join(" "));
  return segments;
}

function parseItemsFromText(
  raw: string,
  lang: AppLang,
  extraTerms: string[] = []
): ItemParse[] {
    const collapsedRaw = collapseExactRepeatedPhrase(raw || "");
  if (isClearListCommand(collapsedRaw)) return [];

  const s0 = normalizeVoiceText(collapsedRaw);
  if (!s0) return [];

  // Speech-to-text often injects commas between words ("שתי, עגבניות", "נייר, טואלט").
  // For voice parsing we treat commas as spaces and rely on the token parser + compound merge.
  const s = s0
    .replace(/[，،]/g, ",")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const segments = s
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  const out: ItemParse[] = [];
  for (const seg of segments) {
  const parsed = parseSegmentTokensToItems(seg, lang, extraTerms);
  for (const p of parsed) out.push(p);
  }
  return out;
}

function collapseParsedItemsForExecution(items: ItemParse[]): ItemParse[] {
  const byName = new Map<string, ItemParse>();

  for (const item of items) {
    const name = stripWrappingBrackets(String(item?.name || "")).trim();
    if (!name) continue;

    const key = normalize(name);
    if (!key) continue;

    const qty = Math.max(1, Number(item?.qty || 1));
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, { name, qty });
      continue;
    }

    // Keep the higher quantity, don't sum.
    // This avoids turning duplicated speech into double quantity.
    byName.set(key, {
      name: existing.name || name,
      qty: Math.max(existing.qty || 1, qty),
    });
  }

  return Array.from(byName.values());
}

const REMOVE_WORDS_BY_LANG: Record<string, string[]> = {
  en: ["and"],
  ru: ["и"],
  he: ["ו"],
  ar: ["و"],
};

function removeStopWords(text: string, lang: string) {
  const words = REMOVE_WORDS_BY_LANG[lang] || [];
  let out = text;

  for (const w of words) {
    const regex = new RegExp(`\\b${w}\\b`, "gi");
    out = out.replace(regex, " ");
  }

  return out.replace(/\s+/g, " ").trim();
}


function parseItemsForExecution(
  raw: string,
  lang: AppLang,
  extraTerms: string[] = []
): ItemParse[] {
  const collapsedRaw = collapseExactRepeatedPhrase(raw || "");
  if (isClearListCommand(collapsedRaw)) return [];

  const source = normalizeVoiceText(collapsedRaw);
  if (!source) return [];

  if (/,/.test(source)) {
    const segments = source
      .replace(/[，،]/g, ",")
      .split(/,+/)
      .map((x) => x.trim())
      .filter(Boolean);

    const out: ItemParse[] = [];
    for (const seg of segments) {
      const parsed = parseSingleItemFromSegment(seg, lang, extraTerms);
      if (parsed) out.push(parsed);
    }
    return out;
  }

  const single = parseSingleItemFromSegment(source, lang, extraTerms);
  return single ? [single] : [];
}

// ---------------------------
// Autocomplete (Hebrew grocery suggestions)
// ---------------------------
const COMMON_GROCERY_HE: string[] = [
  "עגבניה","מלפפון","בצל","שום","גזר","תפוח אדמה","בטטה","פלפל","חסה","כרוב","כרובית","ברוקולי","פטריות","אבוקדו","לימון","תפוז","תפוח","בננה","ענבים","אבטיח","מלון",
  "לחם","פיתות","חלה","טורטיה","בגט","לחמניות",
  "חלב","יוגורט","קוטג'","גבינה צהובה","גבינה לבנה","שמנת מתוקה","חמאה","ביצים",
  "אורז","פסטה","קמח","סוכר","מלח","פלפל שחור","שמן זית","שמן","חומץ","רסק עגבניות","טונה",
  "קפה","תה","דבש","שוקולד","עוגיות",
  "נייר טואלט","מגבונים","נייר סופג","סבון כלים","נוזל רצפות","אבקת כביסה","מרכך כביסה","שקיות אשפה","שמפו","סבון","משחת שיניים",
];

type ItemHistoryEntry = { name: string; count: number; lastUsed: number };
type SuggestSource = "favorite" | "items" | "history" | "static";
type SuggestCandidate = { name: string; key: string; sources: Set<SuggestSource>; history?: ItemHistoryEntry };

type SuggestView = { name: string; key: string; canHide: boolean; isInList: boolean; itemId?: string; currentQty?: number };

function normalizeItemName(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[״“”]/g, '"')
    .replace(/[׳’]/g, "'")
    .toLowerCase();
}

function getUserDisplayName(user?: FirebaseUser | null) {
  return (
    String(user?.displayName || "").trim() ||
    String(user?.email || "").trim() ||
    ""
  );
}

function getUserInitial(user?: FirebaseUser | null) {
  const name = getUserDisplayName(user);
  return name ? name.charAt(0).toUpperCase() : "";
}

function buildParticipantProfile(user?: FirebaseUser | null) {
  return {
    uid: String(user?.uid || "").trim(),
    displayName: String(user?.displayName || user?.email || "").trim(),
    photoURL: String(user?.photoURL || "").trim(),
    email: String(user?.email || "").trim(),
    updatedAt: Date.now(),
  };
}

function buildCreatorLabel(
  lang: AppLang,
  mode: "added" | "purchased",
  name?: string
) {
  const safeName =
    String(name || "").trim() || translate(lang, "משתמש לא ידוע");

  return mode === "added"
    ? `${translate(lang, "נוסף על ידי")} ${safeName}`
    : `${translate(lang, "סומן כנקנה על ידי")} ${safeName}`;
}

const HISTORY_STORAGE_KEY = "shopping_list_item_history_v1";

const HIDDEN_SUGGESTIONS_STORAGE_KEY = "shopping_list_hidden_suggestions_v1";

// Soft-hide behavior:
// - Hiding a suggestion removes it from the list for a limited time (TTL).
// - If the user adds the item again, it becomes visible again immediately.
const HIDDEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type HiddenSuggestionsMap = Record<string, number>; // key -> expiresAt (epoch ms)

function loadHiddenSuggestionsMap(): HiddenSuggestionsMap {
  try {
    const raw = localStorage.getItem(HIDDEN_SUGGESTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: HiddenSuggestionsMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k !== "string") continue;
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch (e) {
    return {};
  }
}

function saveHiddenSuggestionsMap(map: HiddenSuggestionsMap) {
  try {
    localStorage.setItem(HIDDEN_SUGGESTIONS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // ignore
  }
}

// Returns active hidden keys (and cleans up expired ones)
function loadHiddenSuggestions(): string[] {
  const map = loadHiddenSuggestionsMap();
  const now = Date.now();
  const active: string[] = [];
  let changed = false;

  for (const [k, expiresAt] of Object.entries(map)) {
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
      delete map[k];
      changed = true;
      continue;
    }
    if (expiresAt > now) active.push(k);
    else {
      delete map[k];
      changed = true;
    }
  }

  if (changed) saveHiddenSuggestionsMap(map);
  return active;
}

function hideSuggestionKey(key: string) {
  const map = loadHiddenSuggestionsMap();
  map[key] = Date.now() + HIDDEN_TTL_MS;
  saveHiddenSuggestionsMap(map);
}

function unhideSuggestionKey(key: string) {
  try {
    const map = loadHiddenSuggestionsMap();
    if (map[key]) {
      delete map[key];
      saveHiddenSuggestionsMap(map);
    }
  } catch (e) {
    // ignore
  }
}

function loadItemHistory(): Record<string, ItemHistoryEntry> {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ItemHistoryEntry>;
  } catch (e) {
    return {};
  }
}

function saveItemHistory(map: Record<string, ItemHistoryEntry>) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // ignore
  }
}

function getUserVoiceExtraTerms(opts: {
  history: Record<string, ItemHistoryEntry>;
  favorites: FavoriteDoc[];
  items: ShoppingItem[];
}): string[] {
  const out: string[] = [];

  for (const entry of Object.values(opts.history || {})) {
    const name = String(entry?.name || "").trim();
    if (name) out.push(name);
  }

  for (const fav of opts.favorites || []) {
    const name = String(fav?.name || "").trim();
    if (name) out.push(name);
  }

  for (const item of opts.items || []) {
    const name = String(item?.name || "").trim();
    if (name) out.push(name);
  }

  return out;
}

function getAutocompleteSuggestions(opts: {
  query: string;
  favorites: string[];
  items: ShoppingItem[];
  history: Record<string, ItemHistoryEntry>;
  hiddenKeys: Set<string>;
  lang: AppLang;
  limit?: number;
}) {
  const qRaw = opts.query;
  const q = normalizeItemName(qRaw);
  const limit = opts.limit ?? 8;
  if (!q) return [] as string[];

  const map = new Map<string, SuggestCandidate>();
  const staticTerms = getProductTermsByLang(opts.lang);

  const add = (name: string, source: SuggestSource) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = normalizeItemName(trimmed);
    if (!key) return;
    if (opts.hiddenKeys.has(key)) return;
    const existing = map.get(key);
    if (existing) {
      existing.sources.add(source);
      return;
    }
    map.set(key, { name: trimmed, key, sources: new Set([source]) });
  };

  // Prefer user-owned casing/spacing by adding user sources first
  for (const n of opts.favorites) add(n, "favorite");
  for (const it of opts.items) add(it.name, "items");
  for (const [key, h] of Object.entries(opts.history)) {
    add(h?.name || key, "history");
    const c = map.get(key);
    if (c) c.history = h;
  }
  for (const n of staticTerms) add(n, "static");

  const candidates = Array.from(map.values());

  const inListByKey = new Map<string, { id: string; quantity: number }>();
  for (const it of opts.items) {
    const k = normalizeItemName(it.name);
    if (!k) continue;
    // keep first occurrence
    if (!inListByKey.has(k)) inListByKey.set(k, { id: it.id, quantity: it.quantity });
  }

  const score = (c: SuggestCandidate) => {
  const nameKey = c.key;
  const starts = nameKey.startsWith(q);
  if (!starts) return -Infinity;

    let s = starts ? 120 : 70;

    if (c.sources.has("favorite")) s += 45;
    if (c.sources.has("history")) s += 35;
    if (c.sources.has("items")) s += 20;
    if (c.sources.has("static")) s += 10;

    if (c.history) {
      const cnt = Math.max(0, c.history.count || 0);
      const last = Math.max(0, c.history.lastUsed || 0);
      s += Math.min(30, Math.log2(cnt + 1) * 8);
      const daysAgo = (Date.now() - last) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0, 20 - daysAgo);
      s += Math.min(20, recency);
    }

    return s;
  };

  return candidates    .map((c) => ({ c, s: score(c) }))
    .filter((x) => Number.isFinite(x.s))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => {
      const inList = inListByKey.get(x.c.key);
      return {
        name: x.c.name,
        key: x.c.key,
        canHide: x.c.sources.has("history") && !x.c.sources.has("favorite"),
        isInList: Boolean(inList),
        itemId: inList?.id,
        currentQty: inList?.quantity,
      };
    });
}

const APP_LANG_STORAGE_KEY = "shoppingListLang";
const APP_VERSION = "1.1.3";

type CategoryKey =
  | "vegetables_fruits"
  | "dairy_eggs"
  | "meat_fish"
  | "bakery_bread"
  | "other";

const CATEGORY_ORDER: CategoryKey[] = [
  "vegetables_fruits",
  "dairy_eggs",
  "meat_fish",
  "bakery_bread",
  "other",
];

const categoryLabelByLang: Record<AppLang, Record<CategoryKey, string>> = {
  he: {
    vegetables_fruits: "ירקות ופירות",
    dairy_eggs: "חלב וביצים",
    meat_fish: "בשר ודגים",
    bakery_bread: "מאפיה ולחם",
    other: "אחר",
  },
  en: {
    vegetables_fruits: "Vegetables & Fruits",
    dairy_eggs: "Dairy & Eggs",
    meat_fish: "Meat & Fish",
    bakery_bread: "Bakery & Bread",
    other: "Other",
  },
  ru: {
    vegetables_fruits: "Овощи и фрукты",
    dairy_eggs: "Молочные продукты и яйца",
    meat_fish: "Мясо и рыба",
    bakery_bread: "Выпечка и хлеб",
    other: "Другое",
  },
  ar: {
    vegetables_fruits: "خضروات وفواكه",
    dairy_eggs: "ألبان وبيض",
    meat_fish: "لحوم وأسماك",
    bakery_bread: "مخبوزات وخبز",
    other: "أخرى",
  },
};

const categoryKeywords: Record<CategoryKey, string[]> = {
  vegetables_fruits: [
    "עגבניה","עגבניות","מלפפון","מלפפונים","בצל","בצלים","שום","גזר","תפוח","תפוחים","בננה","בננות","אבוקדו","פלפל","פלפלים","חסה","לימון","תפוז",
    "tomato","tomatoes","cucumber","cucumbers","onion","onions","garlic","carrot","carrots","apple","apples","banana","bananas","avocado","pepper","peppers","lettuce","lemon","orange",
    "помидор","помидоры","огурец","огурцы","лук","чеснок","морковь","яблоко","яблоки","банан","бананы","авокадо","перец","салат","лимон","апельсин",
    "طماطم","خيار","بصل","ثوم","جزر","تفاح","موز","أفوكادو","افوكادو","فلفل","خس","ليمون","برتقال"
  ],
  dairy_eggs: [
    "חלב","גבינה","גבינות","יוגורט","יוגורטים","ביצה","ביצים","קוטג","קוטג'","שמנת","חמאה",
    "milk","cheese","cheeses","yogurt","yoghurt","egg","eggs","cottage","cream","butter",
    "молоко","сыр","йогурт","яйцо","яйца","творог","сливки","масло",
    "حليب","جبنة","جبن","لبن","بيض","قشطة","زبدة"
  ],
  meat_fish: [
    "עוף","חזה עוף","בשר","בשר טחון","דג","דגים","סלמון","טונה","נקניקיות",
    "chicken","meat","ground beef","beef","fish","salmon","tuna","sausages",
    "курица","мясо","фарш","рыба","лосось","тунец","сосиски",
    "دجاج","لحم","لحم مفروم","سمك","سلمون","تونة","نقانق"
  ],
  bakery_bread: [
    "לחם","לחמים","פיתה","פיתות","חלה","חלות","בגט","לחמניה","לחמניות","טוסט","טורטיה",
    "bread","breads","pita","pitas","challah","baguette","roll","rolls","bun","buns","toast","tortilla",
    "хлеб","пита","батон","багет","булка","булочки","тост","тортилья",
    "خبز","بيتا","باغيت","لفافة","لفافات","توست","تورتيلا"
  ],
  other: [],
};

const detectCategory = (rawName: string): CategoryKey => {
  const name = String(rawName || "").trim().toLowerCase();
  if (!name) return "other";

  for (const category of CATEGORY_ORDER) {
    if (category === "other") continue;
    const keywords = categoryKeywords[category];
    if (keywords.some((k) => name.includes(k.toLowerCase()))) {
      return category;
    }
  }

  return "other";
};

const normalizeCategoryPreferenceKey = (rawName: string) =>
  normalizeItemName(stripWrappingBrackets(String(rawName || "")));

type UserCategoryMap = Partial<Record<string, string>>;

const resolveItemCategory = (
  item: ShoppingItem,
  userCategoryMap: UserCategoryMap,
  userCustomCategories: string[] = []
): string => {
  const explicit = String((item as any)?.category || "").trim();

  // built-in categories are always valid
  if (explicit && CATEGORY_ORDER.includes(explicit as CategoryKey)) {
    return explicit;
  }

  // custom category is valid only if the current user has it
  if (explicit && userCustomCategories.includes(explicit)) {
    return explicit;
  }

  // fallback to exact-name personal mapping for this user
  const prefKey = normalizeCategoryPreferenceKey(item.name);
  const preferred = prefKey ? userCategoryMap[prefKey] : undefined;

  if (preferred) {
    const preferredTrimmed = String(preferred).trim();

    if (CATEGORY_ORDER.includes(preferredTrimmed as CategoryKey)) {
      return preferredTrimmed;
    }

    if (userCustomCategories.includes(preferredTrimmed)) {
      return preferredTrimmed;
    }
  }

  return "other";
};

const getQtyStepForItem = (
  item: ShoppingItem,
  userCategoryMap: UserCategoryMap,
  userCustomCategories: string[] = []
): number => {
  const category = resolveItemCategory(item, userCategoryMap, userCustomCategories);
  return category === "meat_fish" ? 0.5 : 1;
};

const formatItemQuantity = (qty: number): string => {
  const rounded = Math.round(qty * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};


const detectDeviceLang = (): AppLang => {
  try {
    const navLang = (navigator.language || "").toLowerCase();
    if (navLang.startsWith("he") || navLang.startsWith("iw")) return "he";
    if (navLang.startsWith("ru")) return "ru";
    if (navLang.startsWith("ar")) return "ar";
    return "en";
  } catch {
    return "he";
  }
};

const SPEECH_LANG_BY_APP_LANG: Record<AppLang, string> = {
  he: "he-IL",
  en: "en-US",
  ru: "ru-RU",
  ar: "ar-SA",
};

const I18N: Record<AppLang, Record<string, string>> = {
  he: {
    "__toast_no_internet__": "אין חיבור לאינטרנט",
    "__toast_online_back__": "חיבור לרשת חזר",

    "מחובר": "מחובר",
    "לא מחובר": "לא מחובר",
    "הרשימה ריקה": "הרשימה ריקה",
    "הרשימה שלך עדיין ריקה": "הרשימה שלך עדיין ריקה",
    "בוא נתחיל להוסיף מוצרים לקניות 🛒": "בוא נתחיל להוסיף מוצרים לקניות 🛒",
    "תזכורת לקניות": "תזכורת לקניות",
    "התחבר עם גוגל": "התחבר עם גוגל",
    "כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.": "כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.",
    "הרשימה שלי: חכמה": "My Easy List",
    "התנתק מרשימת קניות משותפת": "התנתק מרשימת קניות משותפת",
    "וואטסאפ": "וואטסאפ",
    "הזמנה לא בתוקף": "הזמנה לא בתוקף",
    "שפה": "שפה",
    "Privacy Policy": "מדיניות פרטיות",
    "Terms & Conditions": "תנאים והגבלות",
    "יציאה": "התנתק",
    "התנתקת מהרשימה": "התנתקת מהרשימה",
    "נקה רשימה": "נקה רשימה",
    "מועדפים": "מועדפים",
    "פריטים שחוזרים לסל": "פריטים שחוזרים לסל",
    "אין מועדפים עדיין": "אין מועדפים עדיין",
    "הוזמנת לרשימה": "הוזמנת לרשימה",
    "קישור ההזמנה לא תקין": "קישור ההזמנה לא תקין",
    "התחבר עם גוגל להצטרפות": "התחבר עם גוגל להצטרפות",
    "הצטרף עם גוגל": "הצטרף עם גוגל",
    "התקן את האפליקציה כדי לפתוח את הרשימה": "התקן את האפליקציה כדי לפתוח את הרשימה",
    "התקן את My Easy List": "התקן את My Easy List",
    "רשימות משותפות נפתחות רק באפליקציה": "רשימות משותפות נפתחות רק באפליקציה",
    "My Easy List זמין דרך האפליקציה": "My Easy List זמין דרך האפליקציה",
    "גוגל פליי - בקרוב": "גוגל פליי - בקרוב",
    "אפ סטור - בקרוב": "אפ סטור - בקרוב",
    "אחרי התקנת האפליקציה פתח שוב את הקישור": "אחרי התקנת האפליקציה פתח שוב את הקישור",
    "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות": "התקן את האפליקציה כדי ליצור, לשתף ולנהל רשימות קניות",
    "פקודות קוליות: לחץ על המיקרופון להתחלה, לחץ שוב להפסיק": "פקודות קוליות: לחץ על המיקרופון להתחלה, לחץ שוב להפסיק",
    "מקשיב עכשיו - דבר ושחרר כדי לבצע": "מקשיב עכשיו - דבר ושחרר כדי לבצע",
    "שמענו:": "שמענו:",
    "דוגמאות:": "דוגמאות:",
    "דבר עכשיו - שחרר כדי לבצע": "דבר עכשיו - שחרר כדי לבצע",
    "צריך להתחבר לפני פקודות קוליות": "צריך להתחבר לפני פקודות קוליות",
    "הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.": "הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.",
      "מה להוסיף לרשימה?": "מה להוסיף לרשימה?",
      "רשימה": "רשימה",
    "נקנו": "נקנו",
      "יומן": "יומן",
      "שיתוף": "שיתוף",
      "הזמן חברים לרשימה": "הזמן חברים לרשימה",
      "קישור לרשימה": "קישור לרשימה",
      "קישור הצטרפות להרשימה שלי:": "קישור הצטרפות להרשימה שלי:",
      "לנקות את כל הרשימה?": "לנקות את כל הרשימה?",
      "הפעולה תמחק את כל הפריטים מהרשימה.": "הפעולה תמחק את כל הפריטים מהרשימה.",
      "ביטול": "ביטול",
      "מחק הכל": "מחק הכל",
      "מקליט": "מקליט",
      "לחץ לסיום": "לחץ לסיום",
      "לחץ כדי לדבר": "לחץ כדי לדבר",
      "מעבד": "מעבד…",
      "בדיקה לפני שליחה": "בדיקה לפני שליחה",
      "אפשר לערוך או לבטל": "אפשר לערוך או לבטל",
      "מה אמרת?": "מה אמרת?",
      "בוצע. ניתן לבטל למשך 3 שניות": "בוצע. ניתן לבטל למשך 3 שניות",
      "צור תזכורת ביומן": "צור תזכורת ביומן",
      "העבר לקטגוריה": "העבר לקטגוריה",
      "שמור": "שמור",
      "נסגר": "סגור",
      "הקטגוריה עודכנה": "הקטגוריה עודכנה",
      "הפריט כבר קיים ברשימה": "הפריט כבר קיים ברשימה",
      "כבר ברשימה - הגדלתי כמות ל-": "כבר ברשימה - הגדלתי כמות ל-",
      "ברשימה": "ברשימה",
      "➕ הוסף קטגוריה": "➕ הוסף קטגוריה",
      "שם קטגוריה": "שם קטגוריה",
      "ערוך קטגוריה": "ערוך קטגוריה",
      "מחק קטגוריה": "מחק קטגוריה",
      "הקטגוריה נמחקה": "הקטגוריה נמחקה",
      "שם קטגוריה כבר קיים": "שם קטגוריה כבר קיים",
      "מחק": "מחק",
      "האם למחוק את הקטגוריה": 'האם למחוק את הקטגוריה {name}',
      "קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר": "קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר",
      "נוסף על ידי": "נוסף על ידי",
      "סומן כנקנה על ידי": "סומן כנקנה על ידי",
      "משתמש לא ידוע": "משתמש לא ידוע",
      "את/ה": "את/ה",
      "האם לנתק משתמש מהרשימה?": "האם לנתק משתמש מהרשימה?",
      "נתק משתמש": "נתק משתמש",
      "הוסרת מהרשימה": "הוסרת מהרשימה",
      "דבר חופשי והוסף פריטים לרשימה": "דבר חופשי והוסף פריטים לרשימה",
      "דוגמאות לפקודות קוליות": "דוגמאות לפקודות קוליות",
      "דבר חופשי ולחץ שוב לסיום": "דבר חופשי ולחץ שוב לסיום",
      "אל תציג שוב": "אל תציג שוב",
      "התחל": "התחל",
      "מחק רשימה": "מחק רשימה",
      "סיימת לקנות?": "סיימת לקנות?",
      "כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?": "כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?",
},
  en: {
    "__toast_no_internet__": "No internet connection",
    "__toast_online_back__": "Back online",

    "מחובר": "Online",
    "לא מחובר": "Offline",
    "הרשימה ריקה": "The list is empty",
    "הרשימה שלך עדיין ריקה": "Your list is still empty",
    "בוא נתחיל להוסיף מוצרים לקניות 🛒": "Let's start adding products for shopping 🛒",
    "תזכורת לקניות": "Shopping Reminder",
    "התחבר עם גוגל": "Sign in with Google",
    "התנתקת מהרשימה": "You left the list",
    "כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.": "To use the list and invite friends, please sign in with Google.",
    "הרשימה שלי: חכמה": "My Easy List",
    "התנתק מרשימת קניות משותפת": "Leave shared list",
    "וואטסאפ": "WhatsApp",
    "שפה": "Language",
    "Privacy Policy": "Privacy Policy",
    "Terms & Conditions": "Terms & Conditions",
    "יציאה": "Log out",
    "נקה רשימה": "Clear list",
    "מועדפים": "Favorites",
    "פריטים שחוזרים לסל": "Items that return to the cart",
    "אין מועדפים עדיין": "No favorites yet",
    "פקודות קוליות: לחץ על המיקרופון להתחלה, לחץ שוב להפסיק": "Voice commands: Tap the microphone to start, tap again to stop",
    "מקשיב עכשיו - דבר ושחרר כדי לבצע": "Listening now - speak and release to run",
    "שמענו:": "Heard:",
    "דוגמאות:": "Examples:",
    "דבר עכשיו - שחרר כדי לבצע": "Speak now - release to run",
    "צריך להתחבר לפני פקודות קוליות": "Please sign in before voice commands",
    "הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.": "Your browser does not support speech recognition. Try Chrome or Edge.",
    "מה להוסיף לרשימה?": "What to add to the list?",
    "רשימה": "List",
    "נקנו": "Bought",
    "יומן": "Calendar",
    "שיתוף": "Share",
    "הזמן חברים לרשימה": "Invite others",
    "קישור לרשימה": "List link",
    "קישור הצטרפות להרשימה שלי:": "Join link to my list",
    "הזמנה לא בתוקף": "Invite link is invalid",
    "הוזמנת לרשימה": "You were invited to a list",
    "קישור ההזמנה לא תקין": "Invite link is invalid",
    "התחבר עם גוגל להצטרפות": "Sign in with Google to join",
    "הצטרף עם גוגל": "Join with Google",
    "התקן את האפליקציה כדי לפתוח את הרשימה": "Install the app to open this list",
    "התקן את My Easy List": "Install My Easy List",
    "רשימות משותפות נפתחות רק באפליקציה": "Shared lists open only inside the app",
    "My Easy List זמין דרך האפליקציה": "My Easy List is available through the mobile app",
    "גוגל פליי - בקרוב": "Google Play - Coming soon",
    "אפ סטור - בקרוב": "App Store - Coming soon",
    "אחרי התקנת האפליקציה פתח שוב את הקישור": "After installing the app, open the invite link again",
    "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות": "Install the app to create, share, and manage your shopping lists",
    "לנקות את כל הרשימה?": "Clear the entire list?",
    "הפעולה תמחק את כל הפריטים מהרשימה.": "This will delete all items from the list.",
    "ביטול": "Cancel",
    "מחק הכל": "Delete all",
    "הרשימה נמחקה": "List cleared",
    "לא מצאתי פריט למחיקה": "Could not find an item to delete",
    "לא מצאתי פריט לסימון": "Could not find an item to mark",
    "לא מצאתי פריט להגדלה": "Could not find an item to increase",
    "לא מצאתי פריט להקטנה": "Could not find an item to decrease",
    "עוצר בגלל משפט ארוך מדי - מבצע...": "Stopping due to a very long phrase - running...",
    "המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)": "Microphone is unavailable (another app may be using it)",
    "לא הצלחתי להתחיל האזנה": "Could not start listening",
    "לא נקלט קול - נסה שוב": "No audio captured - try again",
    "מבצע...": "Running...",
    "אפשר להתנתק רק מרשימה משותפת שאינך הבעלים שלה": "You can disconnect only from a shared list you do not own",
    "שגיאה": "Error",
    "מקליט": "Recording",
    "לחץ לסיום": "Tap to stop",
    "לחץ כדי לדבר": "Tap to speak",
    "מעבד": "Processing…",
    "בדיקה לפני שליחה": "Review before sending",
    "אפשר לערוך או לבטל": "You can edit or cancel",
    "מה אמרת?": "What did you say?",
    "שלח": "Send",
    "בוצע. ניתן לבטל למשך 3 שניות": "Done. You can undo for 3 seconds",
    "בטל": "Undo",
    "בוטל": "Undone",
    "בוצע": "Done",
    "צור תזכורת ביומן": "Create calendar reminder",
    "העבר לקטגוריה": "Move to category",
    "שמור": "Save",
    "נסגר": "Close",
    "הפריט כבר קיים ברשימה": "Item already exists in the list",
    "כבר ברשימה - הגדלתי כמות ל-": "Already in the list - increased quantity to ",
    "ברשימה": "In list",
    "➕ הוסף קטגוריה": "➕ Add Category",
    "שם קטגוריה": "Category name",
    "ערוך קטגוריה": "Edit category",
    "מחק קטגוריה": "Delete category",
    "הקטגוריה נמחקה": "Category deleted",
    "שם קטגוריה כבר קיים": "Category name already exists",
    "מחק": "Delete",
    "האם למחוק את הקטגוריה": 'Delete this category {name}',
    "קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר": "This category will be removed and all its items will move to Other",
    "נוסף על ידי": "Added by",
    "סומן כנקנה על ידי": "Marked as bought by",
    "משתמש לא ידוע": "Unknown user",
    "את/ה": "You",
    "האם לנתק משתמש מהרשימה?": "Disconnect user from the list?",
    "נתק משתמש": "Remove user",
    "הוסרת מהרשימה": "You were removed from the list",
    "דבר חופשי והוסף פריטים לרשימה": "Talk freely and add items to your list",
    "דוגמאות לפקודות קוליות": "Voice command examples",
    "דבר חופשי ולחץ שוב לסיום": "Speak freely and tap again to stop",
    "אל תציג שוב": "Don't show again",
    "התחל": "Start",
    "מחק רשימה": "Clear list",
    "סיימת לקנות?": "Done shopping?",
    "כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?": "All items are marked. Do you want to clear the list and start fresh?",
},
ru: {
    "__toast_no_internet__": "Нет подключения к интернету",
    "__toast_online_back__": "Снова онлайн",

    "מחובר": "Онлайн",
    "לא מחובר": "Офлайн",
    "הרשימה ריקה": "Список пуст",
    "הרשימה שלך עדיין ריקה": "Ваш список пока пуст",
    "בוא נתחיל להוסיף מוצרים לקניות 🛒": "Давайте начнём добавлять товары к покупкам 🛒",
    "תזכורת לקניות": "Напоминание о покупках",
    "התחבר עם גוגל": "Войти через Google",
    "התנתקת מהרשימה": "Вы вышли из списка",
    "כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.": "Чтобы пользоваться списком и приглашать друзей, войдите через Google.",
    "הרשימה שלי: חכמה": "My Easy List",
    "התנתק מרשימת קניות משותפת": "Выйти из общего списка",
    "וואטסאפ": "WhatsApp",
    "שפה": "Язык",
    "Privacy Policy": "Политика конфиденциальности",
    "Terms & Conditions": "Условия использования",
    "יציאה": "Выйти",
    "נקה רשימה": "Очистить список",
    "מועדפים": "Избранное",
    "פריטים שחוזרים לסל": "Товары возвращаются в корзину",
    "אין מועדפים עדיין": "Пока нет избранного",
    "פקודות קוליות: לחץ על המיקרופון להתחלה, לחץ שוב להפסיק": "Нажмите на микрофон для начала, нажмите снова для остановки",
    "מקשיב עכשיו - דבר ושחרר כדי לבצע": "Слушаю - говорите и отпустите чтобы выполнить",
    "שמענו:": "Распознано:",
    "דוגמאות:": "Примеры:",
    "הוזמנת לרשימה": "Вы приглашены в список",
    "קישור ההזמנה לא תקין": "Ссылка приглашения недействительна",
    "התחבר עם גוגל להצטרפות": "Войти через Google",
    "הצטרף עם גוגל": "Присоединиться через Google",
    "התקן את האפליקציה כדי לפתוח את הרשימה": "Установите приложение чтобы открыть список",
    "התקן את My Easy List": "Установите My Easy List",
    "רשימות משותפות נפתחות רק באפליקציה": "Общие списки открываются только в приложении",
    "My Easy List זמין דרך האפליקציה": "My Easy List доступен через приложение",
    "גוגל פליי - בקרוב": "Google Play - скоро",
    "אפ סטור - בקרוב": "App Store - скоро",
    "אחרי התקנת האפליקציה פתח שוב את הקישור": "После установки приложения откройте ссылку снова",
    "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות": "Установите приложение чтобы создавать, делиться и управлять списками покупок",
    "דבר עכשיו - שחרר כדי לבצע": "Говорите - отпустите чтобы выполнить",
    "צריך להתחבר לפני פקודות קוליות": "Войдите в аккаунт для голосовых команд",
    "הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.": "Ваш браузер не поддерживает распознавание речи. Попробуйте Chrome или Edge.",
    "מה להוסיף לרשימה?": "Что добавить в список?",
    "רשימה": "Список",
    "נקנו": "Куплено",
    "יומן": "Календарь",
    "שיתוף": "Поделиться",
    "הזמן חברים לרשימה": "Пригласить других",
    "קישור לרשימה": "Ссылка на список",
    "קישור הצטרפות להרשימה שלי:": "Ссылка для присоединения к моему списку",
    "לנקות את כל הרשימה?": "Очистить весь список?",
    "הפעולה תמחק את כל הפריטים מהרשימה.": "Это удалит все элементы из списка.",
    "ביטול": "Отмена",
    "מחק הכל": "Удалить всё",
    "הרשימה נמחקה": "Список очищен",
    "לא מצאתי פריט למחיקה": "Не нашёл элемент для удаления",
    "לא מצאתי פריט לסימון": "Не нашёл элемент для отметки",
    "לא מצאתי פריט להגדלה": "Не нашёл элемент для увеличения",
    "לא מצאתי פריט להקטנה": "Не нашёл элемент для уменьшения",
    "עוצר בגלל משפט ארוך מדי - מבצע...": "Останавливаю из-за слишком длинной фразы - выполняю...",
    "המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)": "Микрофон недоступен (возможно, его использует другое приложение)",
    "לא הצלחתי להתחיל האזנה": "Не удалось начать прослушивание",
    "לא נקלט קול - נסה שוב": "Звук не распознан - попробуйте ещё раз",
    "הזמנה לא בתוקף": "Ссылка приглашения недействительна",
    "מבצע...": "Выполняю...",
    "אפשר להתנתק רק מרשימה משותפת שאינך הבעלים שלה": "Можно отключиться только от общего списка, владельцем которого вы не являетесь",
    "שגיאה": "Ошибка",
    "מקליט": "Запись",
    "לחץ לסיום": "Нажмите, чтобы остановить",
    "לחץ כדי לדבר": "Нажмите, чтобы говорить",
    "מעבד": "Обработка…",
    "בדיקה לפני שליחה": "Проверка перед отправкой",
    "אפשר לערוך או לבטל": "Можно отредактировать или отменить",
    "מה אמרת?": "Что вы сказали?",
    "שלח": "Отправить",
    "בוצע. ניתן לבטל למשך 3 שניות": "Готово. Можно отменить в течение 3 секунд",
    "בטל": "Отменить",
    "בוטל": "Отменено",
    "בוצע": "Готово",
    "צור תזכורת ביומן": "Создать напоминание в календаре",
    "העבר לקטגוריה": "Переместить в категорию",
    "שמור": "Сохранить",
    "נסגר": "Закрыть",
    "הקטגוריה עודכנה": "Категория обновлена",
    "הפריט כבר קיים ברשימה": "Товар уже есть в списке",
    "כבר ברשימה - הגדלתי כמות ל-": "Уже в списке - количество увеличено до ",
    "ברשימה": "В списке",
    "➕ הוסף קטגוריה": "➕ Добавить категорию",
    "שם קטגוריה": "Название категории",
    "ערוך קטגוריה": "Изменить категорию",
    "מחק קטגוריה": "Удалить категорию",
    "הקטגוריה נמחקה": "Категория удалена",
    "שם קטגוריה כבר קיים": "Название категории уже существует",
    "מחק": "Удалить",
    "האם למחוק את הקטגוריה": 'Удалить категорию {name}',
    "קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר": "Эта категория будет удалена, а все её товары будут перемещены в категорию Другое",
    "נוסף על ידי": "Добавил",
    "סומן כנקנה על ידי": "Отметил как купленное",
    "משתמש לא ידוע": "Неизвестный пользователь",
    "את/ה": "Вы",
    "האם לנתק משתמש מהרשימה?": "Отключить пользователя от списка?",
    "נתק משתמש": "Удалить пользователя",
    "הוסרת מהרשימה": "Вы были удалены из списка",
    "דבר חופשי והוסף פריטים לרשימה": "Говорите свободно и добавляйте товары в список",
    "דוגמאות לפקודות קוליות": "Примеры голосовых команд",
    "דבר חופשי ולחץ שוב לסיום": "Говорите свободно и нажмите снова, чтобы остановить",
    "אל תציג שוב": "Больше не показывать",
    "התחל": "Начать",
    "מחק רשימה": "Очистить список",
    "סיימת לקנות?": "Закончили покупки?",
    "כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?": "Все товары отмечены. Хотите очистить список и начать заново?",
},
  ar: {
    "__toast_no_internet__": "لا يوجد اتصال بالإنترنت",
    "__toast_online_back__": "تم الاتصال بالإنترنت من جديد",
    "מחובר": "متصل",
    "לא מחובר": "غير متصل",
    "הרשימה ריקה": "القائمة فارغة",
    "הרשימה שלך עדיין ריקה": "قائمتك ما زالت فارغة",
    "בוא נתחיל להוסיף מוצרים לקניות 🛒": "لنبدأ بإضافة منتجات للتسوق 🛒",
    "תזכורת לקניות": "تذكير بالتسوق",
    "התחבר עם גוגל": "تسجيل الدخول عبر Google",
    "התנתקת מהרשימה": "غادرت القائمة",
    "כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.": "لاستخدام القائمة ودعوة الأصدقاء، يرجى تسجيل الدخول عبر Google.",
    "הרשימה שלי: חכמה": "My Easy List",
    "התנתק מרשימת קניות משותפת": "مغادرة القائمة المشتركة",
    "וואטסאפ": "واتساب",
    "שפה": "اللغة",
    "Privacy Policy": "سياسة الخصوصية",
    "Terms & Conditions": "الشروط والأحكام",
    "יציאה": "تسجيل الخروج",
    "נקה רשימה": "مسح القائمة",
    "מועדפים": "المفضلة",
    "פריטים שחוזרים לסל": "عناصر تعود إلى السلة",
    "אין מועדפים עדיין": "لا توجد مفضلة بعد",
    "פקודות קוליות: לחץ על המיקרופון להתחלה, לחץ שוב להפסיק": "اضغط على الميكروفون للبدء، اضغط مرة أخرى للإيقاف",
    "מקשיב עכשיו - דבר ושחרר כדי לבצע": "يستمع الآن - تحدث واترك للتنفيذ",
    "שמענו:": "سُمِع:",
    "דוגמאות:": "أمثلة:",
    "דבר עכשיו - שחרר כדי לבצע": "تحدث الآن - اترك للتنفيذ",
    "צריך להתחבר לפני פקודות קוליות": "يرجى تسجيل الدخول قبل الأوامر الصوتية",
    "הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.": "متصفحك لا يدعم التعرف على الكلام. جرّب Chrome أو Edge.",
    "מה להוסיף לרשימה?": "ماذا تريد أن تضيف إلى القائمة؟",
    "רשימה": "القائمة",
    "נקנו": "تم الشراء",
    "יומן": "التقويم",
    "שיתוף": "مشاركة",
    "הזמן חברים לרשימה": "مدعوة الآخرين",
    "קישור לרשימה": "رابط القائمة",
    "קישור הצטרפות להרשימה שלי:": "رابط الانضمام إلى قائمتي",
    "הוזמנת לרשימה": "تمت دعوتك إلى القائمة",
    "קישור ההזמנה לא תקין": "رابط الدعوة غير صالح",
    "התחבר עם גוגל להצטרפות": "تسجيل الدخول عبر Google",
    "הצטרף עם גוגל": "الانضمام باستخدام Google",
    "התקן את האפליקציה כדי לפתוח את הרשימה": "قم بتثبيت التطبيق لفتح هذه القائمة",
    "התקן את My Easy List": "قم بتثبيت My Easy List",
    "רשימות משותפות נפתחות רק באפליקציה": "القوائم المشتركة تفتح فقط داخل التطبيق",
    "My Easy List זמין דרך האפליקציה": "My Easy List متاح عبر التطبيق",
    "גוגל פליי - בקרוב": "Google Play - قريباً",
    "אפ סטור - בקרוב": "App Store - قريباً",
    "אחרי התקנת האפליקציה פתח שוב את הקישור": "بعد تثبيت التطبيق افتح الرابط مرة أخرى",
    "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות": "قم بتثبيت التطبيق لإنشاء ومشاركة وإدارة قوائم التسوق",
    "הזמנה לא בתוקף": "رابط الدعوة غير صالح",
    "לנקות את כל הרשימה?": "مسح القائمة بالكامل؟",
    "הפעולה תמחק את כל הפריטים מהרשימה.": "سيتم حذف جميع العناصر من القائمة.",
    "ביטול": "إلغاء",
    "מחק הכל": "حذف الكل",
    "הרשימה נמחקה": "تم مسح القائمة",
    "לא מצאתי פריט למחיקה": "لم أجد عنصرًا للحذف",
    "לא מצאתי פריט לסימון": "لم أجد عنصرًا للتحديد",
    "לא מצאתי פריט להגדלה": "لم أجد عنصرًا للزيادة",
    "לא מצאתי פריט להקטנה": "لم أجد عنصرًا للتقليل",
    "עוצר בגלל משפט ארוך מדי - מבצע...": "توقف بسبب عبارة طويلة جدًا - جاري التنفيذ...",
    "המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)": "الميكروفون غير متاح (قد يكون تطبيق آخر يستخدمه)",
    "לא הצלחתי להתחיל האזנה": "لم أستطع بدء الاستماع",
    "לא נקלט קול - נסה שוב": "لم يتم التقاط صوت - حاول مرة أخرى",
    "מבצע...": "جاري التنفيذ...",
    "אפשר להתנתק רק מרשימה משותפת שאינך הבעלים שלה": "يمكنك قطع الاتصال فقط عن قائمة مشتركة لست مالكها",
    "שגיאה": "خطأ",
    "מקליט": "جارٍ التسجيل",
    "לחץ לסיום": "اضغط للإيقاف",
    "לחץ כדי לדבר": "اضغط للتحدث",
    "מעבד": "جارٍ المعالجة…",
    "בדיקה לפני שליחה": "مراجعة قبل الإرسال",
    "אפשר לערוך או לבטל": "يمكنك التعديل أو الإلغاء",
    "מה אמרת?": "ماذا قلت؟",
    "שלח": "إرسال",
    "בוצע. ניתן לבטל למשך 3 שניות": "تم. يمكنك التراجع خلال 3 ثوانٍ",
    "בטל": "تراجع",
    "בוטל": "تم التراجع",
    "בוצע": "تم",
    "צור תזכורת ביומן": "إنشاء تذكير في التقويم",
    "העבר לקטגוריה": "انقل إلى فئة",
    "שמור": "حفظ",
    "נסגר": "إغلاق",   
     "הקטגוריה עודכנה": "تم تحديث الفئة",
    "הפריט כבר קיים ברשימה": "العنصر موجود بالفعل في القائمة",
    "כבר ברשימה - הגדלתי כמות ל-": "موجود بالفعل - تم زيادة الكمية إلى ",
    "ברשימה": "في القائمة",
    "➕ הוסף קטגוריה": "➕ إضافة فئة",
    "שם קטגוריה": "اسم الفئة",
    "ערוך קטגוריה": "تعديل الفئة",
    "מחק קטגוריה": "حذف الفئة",
    "הקטגוריה נמחקה": "تم حذف الفئة",
    "שם קטגוריה כבר קיים": "اسم الفئة موجود بالفعل",
    "מחק": "حذف",
    "האם למחוק את הקטגוריה": 'هل تريد حذف الفئة {name}',
    "קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר": "سيتم حذف هذه الفئة وستُنقل جميع العناصر فيها إلى فئة أخرى",
    "נוסף על ידי": "أضيف بواسطة",
    "סומן כנקנה על ידי": "تم وضع علامة تم الشراء بواسطة",
    "משתמש לא ידוע": "مستخدم غير معروف",
    "את/ה": "أنت",
    "האם לנתק משתמש מהרשימה?": "هل تريد إزالة المستخدم من القائمة؟",
    "נתק משתמש": "إزالة المستخدم",
    "הוסרת מהרשימה": "تمت إزالتك من القائمة",
    "דבר חופשי והוסף פריטים לרשימה": "تحدث بحرية وأضف عناصر إلى القائمة",
    "דוגמאות לפקודות קוליות": "أمثلة على الأوامر الصوتية",
    "דבר חופשי ולחץ שוב לסיום": "تحدث بحرية واضغط مرة أخرى للإيقاف",
    "אל תציג שוב": "لا تعرض مرة أخرى",
    "התחל": "ابدأ",
    "מחק רשימה": "مسح القائمة",
    "סיימת לקנות?": "هل أنهيت التسوق؟",
    "כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?": "تم تحديد جميع العناصر. هل تريد تنظيف القائمة والبدء من جديد؟",
  },
};

function translate(lang: AppLang, key: string) {
  const dict = I18N[lang] || I18N.he;
  const k = String(key ?? "").trim();
  return dict[k] ?? I18N.he[k] ?? k;
}

const getVoiceExamplesText = (lang: AppLang) => {
  switch (lang) {
    case "en":
      return "rice, milk, 3 sugar, 5 tomatoes";
    case "ru":
      return "рис, молоко, 3 сахар, 5 помидоров";
    case "ar":
      return "أرز، حليب، 3 سكر، 5 طماطم";
    case "he":
    default:
      return "אורז, חלב, 3 סוכר, 5 עגבניות";
  }
};

const PASTEL_COLORS = [
  "#6FA8DC",
  "#81C995",
  "#E091C0",
  "#DCB86F",
  "#9DB5E8",
  "#6FC9B0",
  "#DC9B6F",
  "#A5D86F",
];

function getStableSharedUserColorMap(
  items: ShoppingItem[],
  sharedWith: string[] = []
): Record<string, string> {
  const uidSet = new Set<string>();

  for (const uid of sharedWith || []) {
    const safeUid = String(uid || "").trim();
    if (safeUid) uidSet.add(safeUid);
  }

  for (const item of items || []) {
    const addedByUid = String(item.addedByUid || "").trim();
    const purchasedByUid = String(item.purchasedByUid || "").trim();

    if (addedByUid) uidSet.add(addedByUid);
    if (purchasedByUid) uidSet.add(purchasedByUid);
  }

  const orderedUids = Array.from(uidSet).sort((a, b) => a.localeCompare(b));
  const map: Record<string, string> = {};

  orderedUids.forEach((uid, index) => {
    map[uid] = PASTEL_COLORS[index % PASTEL_COLORS.length];
  });

  return map;
}


const MainList: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);

const [lang, setLang] = useState<AppLang>(() => {
  try {
    const saved = localStorage.getItem(APP_LANG_STORAGE_KEY) as AppLang | null;
    if (saved === "he" || saved === "en" || saved === "ru" || saved === "ar") return saved;
    return detectDeviceLang();
  } catch {
    return detectDeviceLang();
  }
});
const RTL_LANGS: AppLang[] = ["he", "ar"];
const isRTL = RTL_LANGS.includes(lang);

const rtlClasses = {
  row: isRTL
    ? "flex-row justify-between text-right"
    : "flex-row-reverse justify-between text-left",
  text: isRTL ? "text-right" : "text-left",
};

useEffect(() => {
  try {
    localStorage.setItem(APP_LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}, [lang]);

const t = useMemo(() => {
  const dict = I18N[lang] || I18N.he;
  return (key: string) => {
    const k = String(key ?? "").trim();
    return dict[k] ?? I18N.he[k] ?? k;
  };
}, [lang]);

const speechLang = useMemo(() => SPEECH_LANG_BY_APP_LANG[lang] ?? "he-IL", [lang]);

const [isOnline, setIsOnline] = useState<boolean>(() => {
  try {
    return typeof navigator !== "undefined" ? !!navigator.onLine : true;
  } catch {
    return true;
  }
});

const onlineToastInitRef = useRef(false);

useEffect(() => {
  const onOnline = () => setIsOnline(true);
  const onOffline = () => setIsOnline(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}, []);


  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreMenuView, setMoreMenuView] = useState<"main" | "language">("main");
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuElRef = useRef<HTMLDivElement | null>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; left: number; maxWidth: number } | null>(null);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(() => new Set());
  // UI-only cues
  const [favLeavingIds, setFavLeavingIds] = useState<Set<string>>(() => new Set()); // kept for backward compatibility (not used for delete flash)
  const [favoriteFlashIds, setFavoriteFlashIds] = useState<Set<string>>(() => new Set());
  const [listFlashIds, setListFlashIds] = useState<Set<string>>(() => new Set());
  const [favToListFlashIds, setFavToListFlashIds] = useState<Set<string>>(() => new Set());
  const [deleteFlashIds, setDeleteFlashIds] = useState<Set<string>>(() => new Set());
  const [favDeleteFlashIds, setFavDeleteFlashIds] = useState<Set<string>>(() => new Set());
  const pendingEnterIdsRef = useRef<Set<string>>(new Set());
  const [enterAnim, setEnterAnim] = useState<Record<string, "from" | "to">>({});

  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const [inputValue, setInputValue] = useState("");
  const swipeHintStartedRef = useRef(false);
  const swipeHintIdleTimerRef = useRef<number | null>(null);
  const [hintPhase, setHintPhase] = useState(0); // 0 = center, 1 = left, 2 = right
  const [showInitialSwipeHint, setShowInitialSwipeHint] = useState(false);

// Autocomplete state
const inputRef = useRef<HTMLInputElement | null>(null);
const [isSuggestOpen, setIsSuggestOpen] = useState(false);
const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
const historyRef = useRef<Record<string, ItemHistoryEntry>>({});
const blurCloseTimerRef = useRef<number | null>(null);
const [userCategoryMap, setUserCategoryMap] = useState<UserCategoryMap>({});
const [showBoughtAllModal, setShowBoughtAllModal] = useState(false);
const [categorySheetOpen, setCategorySheetOpen] = useState(false);
const [categorySheetItem, setCategorySheetItem] = useState<ShoppingItem | null>(null);
const [categorySheetValue, setCategorySheetValue] = useState<string>("other");
const [categorySheetPos, setCategorySheetPos] = useState<{ x: number; y: number } | null>(null);
const [customCategoryInput, setCustomCategoryInput] = useState("");
const [isAddingCategory, setIsAddingCategory] = useState(false);
const [userCustomCategories, setUserCustomCategories] = useState<string[]>([]);
const [editingCategoryItemId, setEditingCategoryItemId] = useState<string | null>(null);
const [editingCategoryText, setEditingCategoryText] = useState("");
const allCategoryOptions = useMemo(() => {
  const builtInWithoutOther = CATEGORY_ORDER.filter((c) => c !== "other");
  return [...builtInWithoutOther, ...userCustomCategories, "other"];
}, [userCustomCategories]);

const [editingCustomCategory, setEditingCustomCategory] = useState<string | null>(null);
const [editingCustomCategoryValue, setEditingCustomCategoryValue] = useState("");
const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null);

const longPressTimerRef = useRef<number | null>(null);
const longPressTriggeredRef = useRef(false);
const categoryDoubleTapRef = useRef<{ id: string; time: number } | null>(null);

const LONG_PRESS_MS = 450;

const touchLongPressStartRef = useRef<{ x: number; y: number } | null>(null);
const TOUCH_LONG_PRESS_MOVE_TOLERANCE = 12;
const pointerLongPressStartRef = useRef<{ x: number; y: number } | null>(null);
const POINTER_LONG_PRESS_MOVE_TOLERANCE = 8;

useEffect(() => {
  historyRef.current = loadItemHistory();
}, []);

const voiceExtraTerms = useMemo(() => {
  return getUserVoiceExtraTerms({
    history: historyRef.current,
    favorites,
    items,
  });
}, [favorites, items]);

useEffect(() => {
  if (pendingEnterIdsRef.current.size === 0) return;

  const pending = Array.from(pendingEnterIdsRef.current);
  for (const id of pending) {
    const it = items.find((x) => x.id === id && !x.isPurchased);
    if (!it) continue;

    pendingEnterIdsRef.current.delete(id);

    setEnterAnim((prev) => ({ ...prev, [id]: "from" }));
    // Next frame -> transition to visible
    requestAnimationFrame(() => {
      setEnterAnim((prev) => ({ ...prev, [id]: "to" }));
    });

    window.setTimeout(() => {
      setEnterAnim((prev) => {
        const next = { ...prev };
        delete (next as any)[id];
        return next;
      });
    }, 260);
  }
}, [items]);

const openCategorySheetForItem = (item: ShoppingItem, e?: any) => {
  const current = resolveItemCategory(item, userCategoryMap, userCustomCategories)

  if (e?.currentTarget?.getBoundingClientRect) {
    const rect = e.currentTarget.getBoundingClientRect();

    setCategorySheetPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  } else {
    setCategorySheetPos(null);
  }

  setCategorySheetItem(item);
  setCategorySheetValue(current);
  setEditingCategoryItemId(null);
  setEditingCategoryText("");
  setCategorySheetOpen(true);
};

const closeCategorySheet = () => {
  setCategorySheetOpen(false);
  setCategorySheetItem(null);
  setCategorySheetPos(null);
  setCustomCategoryInput("");
  setIsAddingCategory(false);
  setEditingCategoryItemId(null);
  setEditingCategoryText("");
};

const saveCustomCategory = async (name: string) => {
  const trimmed = String(name || "").trim();
  if (!trimmed || !user?.uid) return;

  const exists = userCustomCategories.some(
    (c) => c.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) return;

  const prefRef = doc(db, "users", user.uid, "preferences", "categories");

  await setDoc(
    prefRef,
    {
      customCategories: arrayUnion(trimmed),
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};

const renameCustomCategory = async (oldName: string, newName: string) => {
  if (!user?.uid || !list?.id) return;

  const oldTrimmed = String(oldName || "").trim();
  const newTrimmed = String(newName || "").trim();

  if (!oldTrimmed || !newTrimmed) return;

  if (oldTrimmed.toLowerCase() === newTrimmed.toLowerCase()) {
    setEditingCustomCategory(null);
    setEditingCustomCategoryValue("");
    return;
  }

  const exists = userCustomCategories.some(
    (c) => c.trim().toLowerCase() === newTrimmed.toLowerCase()
  );
  if (exists) {
    setToast(t("שם קטגוריה כבר קיים"));
    return;
  }

  const nextCategories = userCustomCategories.map((c) =>
    c.trim().toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : c
  );

  const nextMap = Object.fromEntries(
    Object.entries(userCategoryMap).map(([key, value]) => [
      key,
      value === oldTrimmed ? newTrimmed : value,
    ])
  );

  const prefRef = doc(db, "users", user.uid, "preferences", "categories");

  await setDoc(
    prefRef,
    {
      customCategories: nextCategories,
      itemCategoryMap: nextMap,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  const itemsToUpdate = activeItems.filter(
    (item) => String((item as any)?.category || "").trim() === oldTrimmed
  );

  if (itemsToUpdate.length > 0) {
    const batch = writeBatch(db);

    for (const item of itemsToUpdate) {
      const itemRef = doc(db, "lists", list.id, "items", item.id);
      batch.update(itemRef, { category: newTrimmed });
    }

    await batch.commit();
  }

  if (categorySheetValue === oldTrimmed) {
    setCategorySheetValue(newTrimmed);
  }

  setEditingCustomCategory(null);
  setEditingCustomCategoryValue("");
  setToast(t("הקטגוריה עודכנה"));
};

const deleteCustomCategory = async (name: string) => {
  if (!user?.uid || !list?.id) return;

  const trimmed = String(name || "").trim();
  if (!trimmed) return;

  const nextCategories = userCustomCategories.filter(
    (c) => c.trim().toLowerCase() !== trimmed.toLowerCase()
  );

  const nextMap = Object.fromEntries(
    Object.entries(userCategoryMap).map(([key, value]) => [
      key,
      value === trimmed ? "other" : value,
    ])
  );

  const prefRef = doc(db, "users", user.uid, "preferences", "categories");

  await setDoc(
    prefRef,
    {
      customCategories: nextCategories,
      itemCategoryMap: nextMap,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  const itemsToUpdate = activeItems.filter(
    (item) => String((item as any)?.category || "").trim() === trimmed
  );

  if (itemsToUpdate.length > 0) {
    const batch = writeBatch(db);

    for (const item of itemsToUpdate) {
      const itemRef = doc(db, "lists", list.id, "items", item.id);
      batch.update(itemRef, { category: "other" });
    }

    await batch.commit();
  }

  if (categorySheetValue === trimmed) {
    setCategorySheetValue("other");
  }

  if (editingCustomCategory === trimmed) {
    setEditingCustomCategory(null);
    setEditingCustomCategoryValue("");
  }

  if (categorySheetOpen) {
    closeCategorySheet();
  }

  setToast(t("הקטגוריה נמחקה"));
};

const saveItemCategory = async () => {
  if (!list?.id || !categorySheetItem) return;

  const itemRef = doc(db, "lists", list.id, "items", categorySheetItem.id);

  await updateDoc(itemRef, {
    category: categorySheetValue,
  });



  if (user?.uid) {
  const prefKey = normalizeCategoryPreferenceKey(categorySheetItem.name);
  if (prefKey) {
    const prefRef = doc(db, "users", user.uid, "preferences", "categories");
    await setDoc(
      prefRef,
      {
        itemCategoryMap: {
          [prefKey]: categorySheetValue,
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
}

  setToast(t("הקטגוריה עודכנה"));
  closeCategorySheet();
};

const startItemLongPress = (item: ShoppingItem, e?: any) => () => {
  longPressTriggeredRef.current = false;

  if (longPressTimerRef.current != null) {
    window.clearTimeout(longPressTimerRef.current);
  }

  longPressTimerRef.current = window.setTimeout(() => {
    longPressTriggeredRef.current = true;
    if (categorySheetOpen && categorySheetItem?.id === item.id) {
  closeCategorySheet();
} else {
  openCategorySheetForItem(item, e);
}
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(20);
    }
    longPressTimerRef.current = null;
  }, LONG_PRESS_MS);
};

const clearItemLongPress = () => {
  if (longPressTimerRef.current != null) {
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }
};



useEffect(() => {
  if (!user?.uid) {
    setUserCategoryMap({});
    setUserCustomCategories([]);
    return;
  }

  const prefRef = doc(db, "users", user.uid, "preferences", "categories");

  const unsub = onSnapshot(prefRef, (snap) => {
    const data = snap.data() as any;
    const map = data?.itemCategoryMap;

    if (map && typeof map === "object") {
      setUserCategoryMap(map as UserCategoryMap);
    } else {
      setUserCategoryMap({});
    }

    const custom = Array.isArray(data?.customCategories)
      ? data.customCategories.filter((x: unknown) => typeof x === "string")
      : [];

    setUserCustomCategories(custom as string[]);
  });

  return () => unsub();
}, [user?.uid]);

  const [isCopied, setIsCopied] = useState(false);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const calcFixedMenuPos = (opts: {
    anchorRect: DOMRect | null | undefined;
    menuWidth: number;
    align?: "left" | "right"; // legacy (kept for compatibility)
  }) => {
    const { anchorRect: r, menuWidth } = opts;
    const appRect = appRootRef.current?.getBoundingClientRect();

    const pad = 10;
    const gap = 8;

    // Stick right under the triggering button
    const top = r ? r.bottom + gap : 56;

    // Clamp to the app container (max-w-md) boundaries
    const minLeft = (appRect ? appRect.left : 0) + pad;
    const maxLeft = (appRect ? appRect.right : window.innerWidth) - menuWidth - pad;

    // Prefer: center under the button, then clamp.
    const preferredLeft = r ? r.left + (r.width - menuWidth) / 2 : minLeft;

    const left = clamp(preferredLeft, minLeft, Math.max(minLeft, maxLeft));
    const maxWidth = Math.max(140, (appRect ? appRect.width : window.innerWidth) - pad * 2);

    return { top, left, maxWidth };
  };

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);
  const shareMenuElRef = useRef<HTMLDivElement | null>(null);
  const [shareMenuPos, setShareMenuPos] = useState<{ top: number; left: number; maxWidth: number } | null>(null);

  const updateShareMenuPos = useCallback(() => {
    if (!shareMenuOpen) return;
    const r = shareBtnRef.current?.getBoundingClientRect();
    const measuredW = shareMenuElRef.current?.offsetWidth;
    const menuW = measuredW && measuredW > 0 ? measuredW : 320;
    setShareMenuPos(calcFixedMenuPos({ anchorRect: r, menuWidth: menuW, align: "right" }));
  }, [shareMenuOpen]);

  const openShareMenu = () => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    setShareMenuOpen(true);
  };

  const toggleShareMenu = () => {
    if (shareMenuOpen) {
      setShareMenuOpen(false);
      return;
    }
    openShareMenu();
  };

  const updateMoreMenuPos = useCallback(() => {
    if (!moreMenuOpen) return;
    const r = moreBtnRef.current?.getBoundingClientRect();
    const measuredW = moreMenuElRef.current?.offsetWidth;
    const menuW = measuredW && measuredW > 0 ? measuredW : 320;
    setMoreMenuPos(calcFixedMenuPos({ anchorRect: r, menuWidth: menuW, align: "left" }));
  }, [moreMenuOpen]);

  const openMoreMenu = () => {
    setShareMenuOpen(false);
    setMoreMenuOpen(true);
  };

  const toggleMoreMenu = () => {
    if (moreMenuOpen) {
      setMoreMenuOpen(false);
      setMoreMenuView("main");
      return;
    }
    openMoreMenu();
  };

  // When a menu opens, compute its initial fixed position on the next frame.
  useEffect(() => {
    if (!shareMenuOpen) return;
    requestAnimationFrame(() => {
      const r = shareBtnRef.current?.getBoundingClientRect();
      const measuredW = shareMenuElRef.current?.offsetWidth;
      const menuW = measuredW && measuredW > 0 ? measuredW : 320;
      setShareMenuPos(calcFixedMenuPos({ anchorRect: r, menuWidth: menuW, align: "right" }));
    });
  }, [shareMenuOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    requestAnimationFrame(() => {
      const r = moreBtnRef.current?.getBoundingClientRect();
      const measuredW = moreMenuElRef.current?.offsetWidth;
      const menuW = measuredW && measuredW > 0 ? measuredW : 320;
      setMoreMenuPos(calcFixedMenuPos({ anchorRect: r, menuWidth: menuW, align: "left" }));
    });
  }, [moreMenuOpen]);

  // Keep menus pinned under their buttons while scrolling/resizing.
  useEffect(() => {
    if (!shareMenuOpen && !moreMenuOpen) return;

    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateShareMenuPos();
        updateMoreMenuPos();
      });
    };

    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [shareMenuOpen, moreMenuOpen, updateShareMenuPos, updateMoreMenuPos]);

const [showClearConfirm, setShowClearConfirm] = useState(false);
const [creatorHintOpenId, setCreatorHintOpenId] = useState<string | null>(null);
const creatorHintTimerRef = useRef<number | null>(null);
const openCreatorHint = (itemId: string) => {
  setCreatorHintOpenId(itemId);

  if (creatorHintTimerRef.current != null) {
    window.clearTimeout(creatorHintTimerRef.current);
  }

  creatorHintTimerRef.current = window.setTimeout(() => {
    setCreatorHintOpenId((current) => (current === itemId ? null : current));
    creatorHintTimerRef.current = null;
  }, 2000);
};

const [authLoading, setAuthLoading] = useState(true);
const [authInitialized, setAuthInitialized] = useState(false);
const [listLoading, setListLoading] = useState(false);

  // Voice UI + state
  const [isListening, setIsListening] = useState(false);
  const [voiceMode] = useState<VoiceMode>("hold_to_talk");
  const [lastHeard, setLastHeard] = useState<string>("");
  const lastHeardRef = useRef<string>("");
  const nativeFinalizeRef = useRef<boolean>(false);
  const nativeRestartRequestedRef = useRef<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

// Keep the last toast as a translation key when relevant, so it can re-render when language changes.
const toastKeyRef = useRef<string | null>(null);
const showToastKey = useCallback(
  (key: string) => {
    const k = String(key ?? "").trim();
    toastKeyRef.current = k;
    setToast(t(k));
  },
  [t]
);

useEffect(() => {
  if (!onlineToastInitRef.current) {
    onlineToastInitRef.current = true;
    return;
  }
  showToastKey(isOnline ? "__toast_online_back__" : "__toast_no_internet__");
}, [isOnline, showToastKey]);

// If the user changes language while a translated toast is visible, re-translate it.
useEffect(() => {
  if (!toastKeyRef.current) return;
  setToast(t(toastKeyRef.current));
}, [t]);

  // Voice (tap-to-record) UI state
  const VOICE_COACH_DISMISS_KEY = "voiceCoachDismissed";
  const VOICE_COACH_SEEN_COUNT_KEY = "voiceCoachSeenCount";
  const VOICE_COACH_MAX_AUTO_SHOW = 3;

  type VoiceUiState = "idle" | "recording" | "processing" | "review";
  const [voiceUi, setVoiceUi] = useState<VoiceUiState>("idle");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState<string>("");
  const [showVoiceCoach, setShowVoiceCoach] = useState(false);
const [dontShowVoiceCoachAgain, setDontShowVoiceCoachAgain] = useState(false);

const [voiceCoachDismissed, setVoiceCoachDismissed] = useState<boolean>(() => {
  try {
    return localStorage.getItem(VOICE_COACH_DISMISS_KEY) === "true";
  } catch {
    return false;
  }
});

const [voiceCoachSeenCount, setVoiceCoachSeenCount] = useState<number>(() => {
  try {
    const raw = Number(localStorage.getItem(VOICE_COACH_SEEN_COUNT_KEY) || "0");
    return Number.isFinite(raw) ? raw : 0;
  } catch {
    return 0;
  }
});
  const voiceTimerRef = useRef<number | null>(null);

  const [undoToast, setUndoToast] = useState<{ msg: string; undoLabel: string; onUndo: () => void } | null>(null);
  const undoToastTimerRef = useRef<number | null>(null);

  const tapActiveRef = useRef<boolean>(false);
  const noiseStreamRef = useRef<MediaStream | null>(null);
  const nativeTapStopTimerRef = useRef<number | null>(null);
  const nativeTranscriptChunksRef = useRef<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const nativeSpeechAvailableRef = useRef<boolean | null>(null);
  const nativeFinalTranscriptRef = useRef<string>("");
  const nativeLastPartialRef = useRef<string>("");
  const micTapLockUntilRef = useRef<number>(0);
  const nativeLastStopAtRef = useRef<number>(0);
  const pendingRestartTimerRef = useRef<number | null>(null);
  const holdActiveRef = useRef<boolean>(false);
  const transcriptBufferRef = useRef<string[]>([]);
  const lastInterimRef = useRef<string>("");
  const startGuardRef = useRef<boolean>(false);

  // Auto-clear "שמענו" line shortly after listening ends (no manual refresh)
  const HEARD_CLEAR_MS = 1800;
  const heardClearTimerRef = useRef<number | null>(null);
  const MIC_TAP_DEBOUNCE_MS = 450;
  const NATIVE_RESTART_COOLDOWN_MS = 250;
  const NATIVE_SMART_START_DELAY_MS = 120;
  const NATIVE_LATE_TRANSCRIPT_WAIT_MS = 900;
  const NATIVE_LATE_TRANSCRIPT_POLL_MS = 60;
  const SILENCE_MS_HE = 3000;
  const SILENCE_MS_EN = 5000;
  const MAX_SESSION_MS = 15000;
  

  useEffect(() => {
    lastHeardRef.current = lastHeard || "";
  }, [lastHeard]);

  useEffect(() => {
  try {
    localStorage.setItem(
      VOICE_COACH_DISMISS_KEY,
      voiceCoachDismissed ? "true" : "false"
    );
  } catch {
    // ignore
  }
}, [voiceCoachDismissed]);

useEffect(() => {
  try {
    localStorage.setItem(
      VOICE_COACH_SEEN_COUNT_KEY,
      String(voiceCoachSeenCount)
    );
  } catch {
    // ignore
  }
}, [voiceCoachSeenCount]);
  useEffect(() => {
    return () => {
      if (pendingRestartTimerRef.current != null) {
        window.clearTimeout(pendingRestartTimerRef.current);
        pendingRestartTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clear "שמענו: ..." automatically shortly after listening ends
    if (!lastHeard) return;

    // While listening - don't schedule clearing
    if (isListening) {
      if (heardClearTimerRef.current) {
        window.clearTimeout(heardClearTimerRef.current);
        heardClearTimerRef.current = null;
      }
      return;
    }

    if (heardClearTimerRef.current) window.clearTimeout(heardClearTimerRef.current);
    heardClearTimerRef.current = window.setTimeout(() => {
      setLastHeard("");
      heardClearTimerRef.current = null;
    }, HEARD_CLEAR_MS);

    return () => {
      if (heardClearTimerRef.current) {
        window.clearTimeout(heardClearTimerRef.current);
        heardClearTimerRef.current = null;
      }
    };
  }, [lastHeard, isListening]);

  // ---------------------------
  // Swipe gestures (active items): swipe left = delete, swipe right = favorite
  // Works on desktop (mouse drag) and mobile (touch).
  const swipeStartRef = useRef<{ x: number; y: number; id: string; pointerId: number } | null>(null);
  const swipeLastRef = useRef<{ x: number; y: number } | null>(null);
  const swipeConsumedRef = useRef(false);
  const swipeCaptureRef = useRef<{ el: HTMLElement; pointerId: number } | null>(null);
  const [swipeUi, setSwipeUi] = useState<{ id: string | null; dx: number }>({ id: null, dx: 0 });
  const swipeVibratedRef = useRef<Record<string, boolean>>({});

  const SWIPE_THRESHOLD_PX = 70;
  const SWIPE_MAX_SHIFT_PX = 110;

  const isNoSwipeTarget = (t: EventTarget | null) => {
    const el = t as HTMLElement | null;
    if (!el) return false;
    // Don't start swipe from buttons/inputs (qty buttons etc.)
    return Boolean(el.closest("button, input, textarea, select, a, [data-noswipe='true']"));
  };

  const onSwipePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (isNoSwipeTarget(e.target)) return;

        swipeConsumedRef.current = false;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, id, pointerId: e.pointerId };
    swipeLastRef.current = { x: e.clientX, y: e.clientY };
    setSwipeUi({ id, dx: 0 });
    swipeVibratedRef.current[id] = false;
  };

  const onSwipePointerMove = (id: string) => (e: React.PointerEvent) => {
    const s = swipeStartRef.current;
    if (!s || s.id !== id || s.pointerId !== e.pointerId) return;

    swipeLastRef.current = { x: e.clientX, y: e.clientY };

    const dxRaw = e.clientX - s.x;
    const dx = Math.max(-SWIPE_MAX_SHIFT_PX, Math.min(SWIPE_MAX_SHIFT_PX, dxRaw));

    const active = Math.abs(dxRaw) >= SWIPE_THRESHOLD_PX;

    if (active && !swipeVibratedRef.current[id]) {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(15);
      }
      swipeVibratedRef.current[id] = true;
    }
    if (!active) {
      swipeVibratedRef.current[id] = false;
    }

    // Start capturing pointer only after we know this is a swipe (prevents breaking normal clicks)
    if (!swipeCaptureRef.current && Math.abs(dxRaw) > 10 && Math.abs(dxRaw) >= Math.abs(e.clientY - s.y)) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        swipeCaptureRef.current = { el: e.currentTarget as HTMLElement, pointerId: e.pointerId };
      } catch (e) {}
    }
    setSwipeUi({ id, dx });
  };

  const onSwipePointerUp = (id: string) => (e: React.PointerEvent) => {
    const s = swipeStartRef.current;
    const last = swipeLastRef.current;

    swipeStartRef.current = null;

    // Release pointer capture if we started capturing
    try {
      if (swipeCaptureRef.current) {
        swipeCaptureRef.current.el.releasePointerCapture(s.pointerId);
      }
    } catch (e) {}
    swipeCaptureRef.current = null;
    swipeLastRef.current = null;

    if (!s || s.id !== id) {
      setSwipeUi({ id: null, dx: 0 });
      return;
    }

    const endX = last?.x ?? e.clientX;
    const endY = last?.y ?? e.clientY;

    const dx = endX - s.x;
    const dy = endY - s.y;

    // reset UI immediately
    setSwipeUi({ id: null, dx: 0 });

    // horizontal swipe only
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;

    swipeConsumedRef.current = true;

      try {
      const deleteSwipe = isRTL ? dx > 0 : dx < 0;

      if (deleteSwipe) {
        deleteItemWithFlash(id);
      } else {
        if (!favoritesById.has(id)) {
          toggleFavorite(id);
        }
      }
    } finally {
      window.setTimeout(() => {
        swipeConsumedRef.current = false;
      }, 0);
    }
  };

  // Touch fallback for mobile browsers that may not deliver pointermove while scrolling
  const onSwipeTouchStart = (id: string) => (e: React.TouchEvent) => {
    if (isNoSwipeTarget(e.target)) return;

    const t = e.touches[0];
    if (!t) return;

    swipeConsumedRef.current = false;
    swipeStartRef.current = { x: t.clientX, y: t.clientY, id, pointerId: -1 };
    swipeLastRef.current = { x: t.clientX, y: t.clientY };
    setSwipeUi({ id, dx: 0 });
    swipeVibratedRef.current[id] = false;
  };

  const onSwipeTouchMove = (id: string) => (e: React.TouchEvent) => {
    const s = swipeStartRef.current;
    if (!s || s.id !== id) return;

    const t = e.touches[0];
    if (!t) return;

    swipeLastRef.current = { x: t.clientX, y: t.clientY };

    const dxRaw = t.clientX - s.x;
    const dyRaw = t.clientY - s.y;

    const active = Math.abs(dxRaw) >= SWIPE_THRESHOLD_PX;
    if (active && !swipeVibratedRef.current[id]) {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(15);
      }
      swipeVibratedRef.current[id] = true;
    }
    if (!active) {
      swipeVibratedRef.current[id] = false;
    }

    // Only treat as swipe if mostly horizontal
    if (Math.abs(dxRaw) < 6 || Math.abs(dxRaw) < Math.abs(dyRaw)) return;

    // When we are swiping horizontally, prevent the page from hijacking the gesture (best-effort)
    try {
      e.preventDefault();
    } catch (e) {}

    const dx = Math.max(-SWIPE_MAX_SHIFT_PX, Math.min(SWIPE_MAX_SHIFT_PX, dxRaw));
    setSwipeUi({ id, dx });
  };

  const onSwipeTouchEnd = (id: string) => async (_e: React.TouchEvent) => {
    const s = swipeStartRef.current;
    const last = swipeLastRef.current;

    swipeStartRef.current = null;
    swipeLastRef.current = null;

    if (!s || s.id !== id) {
      setSwipeUi({ id: null, dx: 0 });
      return;
    }

    const dxRaw = last ? last.x - s.x : 0;

    if (Math.abs(dxRaw) < SWIPE_THRESHOLD_PX) {
      setSwipeUi({ id: null, dx: 0 });
      return;
    }

    swipeConsumedRef.current = true;
const deleteSwipe = isRTL ? dxRaw > 0 : dxRaw < 0;

if (deleteSwipe) {
  deleteItemWithFlash(id);
} else {
  if (!favoritesById.has(id)) {
    toggleFavorite(id);
  }
}

    setSwipeUi({ id: null, dx: 0 });
  };

  const onSwipePointerCancel = () => {
    swipeStartRef.current = null;
    swipeLastRef.current = null;
    try {
      if (swipeCaptureRef.current) {
        swipeCaptureRef.current.el.releasePointerCapture(swipeCaptureRef.current.pointerId);
      }
    } catch (e) {}
    swipeCaptureRef.current = null;
    setSwipeUi({ id: null, dx: 0 });
  };

  const latestListIdRef = useRef<string | null>(null);
  const latestItemsRef = useRef<ShoppingItem[]>([]);
  const confettiFiredRef = useRef(false);
  const completionHandledByUserRef = useRef<string | null>(null);

const getLastPurchasedItem = (itemsToCheck: ShoppingItem[]) => {
  return [...itemsToCheck]
    .filter((i) => i.isPurchased && i.purchasedAt)
    .sort((a, b) => Number(b.purchasedAt || 0) - Number(a.purchasedAt || 0))[0];
};

  useEffect(() => {
    latestListIdRef.current = list?.id ?? null;
  }, [list?.id]);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

    useEffect(() => {
  if (!items || items.length === 0) {
    confettiFiredRef.current = false;
    completionHandledByUserRef.current = null;
    setShowBoughtAllModal(false);
    return;
  }

  const allPurchased = items.every((i) => i.isPurchased);

  if (!allPurchased) {
    confettiFiredRef.current = false;
    completionHandledByUserRef.current = null;
    setShowBoughtAllModal(false);
    return;
  }

  const lastPurchasedItem = getLastPurchasedItem(items);
  const lastPurchaserUid = String(lastPurchasedItem?.purchasedByUid || "").trim();
  const currentUid = String(user?.uid || "").trim();

  // ❌ אם זה לא המשתמש שסיים - אל תראה כלום
  if (!lastPurchaserUid || !currentUid || lastPurchaserUid !== currentUid) {
    setShowBoughtAllModal(false);
    return;
  }

  // ❌ כבר הופעל - אל תפעיל שוב
  if (confettiFiredRef.current) {
    return;
  }

  // ✅ זה המשתמש שסיים
  confettiFiredRef.current = true;
  completionHandledByUserRef.current = currentUid;

  confetti({
    particleCount: 140,
    spread: 75,
    origin: { y: 0.65 },
  });

  // 🔥 פתיחת החלון רק לו
  setTimeout(() => {
  setShowBoughtAllModal(true);
}, 900);

}, [items, user?.uid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
          try {

          setUser(u);
          setAuthLoading(false);

          if (!u) {
            setList(null);
            setItems([]);
            setFavorites([]);
            return;
          }

          setListLoading(true);

          const q = query(collection(db, "lists"), where("sharedWith", "array-contains", u.uid));
          const snap = await getDocs(q);

          if (snap.empty) {
            const newListRef = doc(collection(db, "lists"));
            const newList: ShoppingList = {
              id: newListRef.id,
              title: "My Easy List",
              ownerUid: u.uid,
              sharedWith: [u.uid],
              userColorMap: {},
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
    // Non-blocking write (important offline)
    void setDoc(newListRef, newList).catch((err) => console.error("setDoc failed", err));
setList(newList);
            localStorage.setItem("activeListId", newListRef.id);
          } else {
            const savedId = localStorage.getItem("activeListId");
            const docToUse = savedId ? snap.docs.find((d) => d.id === savedId) ?? snap.docs[0] : snap.docs[0];
            const data = docToUse.data() as ShoppingList;
            setList({ ...data, id: docToUse.id });
            localStorage.setItem("activeListId", docToUse.id);
          }

          setListLoading(false);
          } finally {
            setAuthInitialized(true);
          }
    });
  }, []);
  useEffect(() => {
    if (!list?.id) return;
  
  void (async () => {
  const currentMap = (list as any)?.userColorMap;
  if (currentMap && typeof currentMap === "object" && Object.keys(currentMap).length > 0) {
    return;
  }

  const ownerUid = String(list.ownerUid || "").trim();
  if (!ownerUid) return;

  try {
    await updateDoc(doc(db, "lists", list.id), {
      userColorMap: {
        [ownerUid]: PASTEL_COLORS[0],
      },
    });
  } catch (e) {
    console.error("Failed to initialize userColorMap", e);
  }
})();

    const listRef = doc(db, "lists", list.id);
    const itemsCol = collection(listRef, "items");
    const favsCol = collection(listRef, "favorites");

    const unsubList = onSnapshot(listRef, async (snap) => {
  if (!snap.exists()) return;

  const nextList = { ...(snap.data() as ShoppingList), id: snap.id };
  const sharedWith = Array.isArray(nextList.sharedWith) ? nextList.sharedWith : [];
  const stillHasAccess = !!user?.uid && sharedWith.includes(user.uid);

  if (!stillHasAccess) {
    if (localStorage.getItem("activeListId") === listRef.id) {
      localStorage.removeItem("activeListId");
    }

    setList(null);
    setItems([]);
    setFavorites([]);
    setShareMenuOpen(false);
    setMoreMenuOpen(false);

    const q = query(collection(db, "lists"), where("sharedWith", "array-contains", user!.uid));
    const listsSnap = await getDocs(q);

    if (listsSnap.empty) {
      const newListRef = doc(collection(db, "lists"));
      const newList: ShoppingList = {
        id: newListRef.id,
        title: "My Easy List",
        ownerUid: user!.uid,
        sharedWith: [user!.uid],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(newListRef, newList);
      setList(newList);
      localStorage.setItem("activeListId", newListRef.id);
    } else {
      const nextDoc = listsSnap.docs[0];
      const fallbackList = { ...(nextDoc.data() as ShoppingList), id: nextDoc.id };
      setList(fallbackList);
      localStorage.setItem("activeListId", nextDoc.id);
    }

    setToast(t("הוסרת מהרשימה"));
    return;
  }

  setList(nextList);
});

    const unsubItems = onSnapshot(itemsCol, (snap) => {
      const docs = snap.docs.map((d) => d.data() as ShoppingItem);
      setItems(docs);
    });

    const unsubFavs = onSnapshot(favsCol, (snap) => {
      const favDocs: FavoriteDoc[] = snap.docs.map((d) => {
  const data = d.data() as any;
  return {
    id: d.id,
    name: String(data?.name || ""),
    createdAt: Number(data?.createdAt || 0),
    updatedAt: Number(data?.updatedAt || 0),
    category: data?.category as CategoryKey | undefined,
  };
});
favDocs.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setFavorites(favDocs);
    });

    return () => {
      unsubList();
      unsubItems();
      unsubFavs();
    };
  }, [list?.id, user?.uid, t]);

useEffect(() => {
  if (!list?.id || !user?.uid) return;

  const profile = buildParticipantProfile(user);
  if (!profile.uid) return;

  const existing = (list as any)?.participantProfiles?.[user.uid];
  const sameName = String(existing?.displayName || "") === profile.displayName;
  const samePhoto = String(existing?.photoURL || "") === profile.photoURL;
  const sameEmail = String(existing?.email || "") === profile.email;

  if (sameName && samePhoto && sameEmail) return;

  void updateDoc(doc(db, "lists", list.id), {
    [`participantProfiles.${user.uid}`]: profile,
  }).catch((e) => console.error("participantProfiles update failed", e));
}, [list?.id, user?.uid, user?.displayName, user?.photoURL, user?.email]);

  const favoritesById = useMemo(() => {
    const s = new Set<string>();
    for (const f of favorites) s.add(f.id);
    return s;
  }, [favorites]);

 const favoritesUnique = useMemo(() => {
  const seen = new Set<string>();
  const out: FavoriteDoc[] = [];

  for (const f of favorites) {
    const key = normalize(f.name);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }

  return out.sort((a, b) =>
  compareNamesByLang(a?.name || "", b?.name || "", lang)
);
}, [favorites, lang]);

const activeItems = useMemo(
    () => items.filter((i) => !i.isPurchased).sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

const initialSwipeHintItemId = useMemo(() => {
  if (!activeItems.length) return null;
  return activeItems[0].id;
}, [activeItems]);

useEffect(() => {
  const userId = user?.uid;
  const listId = list?.id;
  const firstItemId = activeItems[0]?.id;

  if (!userId || !listId || !firstItemId) return;

  const storageKey = `swipe_hint_shown_${userId}_${listId}`;

  try {
    const alreadyShown = localStorage.getItem(storageKey);

    if (alreadyShown === "1") {
      setShowInitialSwipeHint(false);
      return;
    }

    // המתנה שהרשימה תסיים להיטען
    const timer = window.setTimeout(() => {
      setShowInitialSwipeHint(true);
      localStorage.setItem(storageKey, "1");

      const hideTimer = window.setTimeout(() => {
        setShowInitialSwipeHint(false);
      }, 1800);

      return () => window.clearTimeout(hideTimer);
    }, 800);

    return () => window.clearTimeout(timer);
  } catch {
    setShowInitialSwipeHint(true);

    const hideTimer = window.setTimeout(() => {
      setShowInitialSwipeHint(false);
    }, 1800);

    return () => window.clearTimeout(hideTimer);
  }
}, [user?.uid, list?.id, activeItems[0]?.id]);


useEffect(() => {
  if (!showInitialSwipeHint) return;

  const t1 = setTimeout(() => setHintPhase(1), 100);
  const t2 = setTimeout(() => setHintPhase(0), 500);
  const t3 = setTimeout(() => setHintPhase(2), 800);
  const t4 = setTimeout(() => setHintPhase(0), 1200);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
    clearTimeout(t4);
  };
}, [showInitialSwipeHint]);


  const purchasedItems = useMemo(
    () => items.filter((i) => i.isPurchased).sort((a, b) => (b.purchasedAt || 0) - (a.purchasedAt || 0)),
    [items]
  );

const isSharedList = (list?.sharedWith?.length || 0) > 1;
const headerSharedUsersPreview = useMemo(() => {
  const shared = Array.isArray(list?.sharedWith) ? list.sharedWith : [];
  const profiles = ((list as any)?.participantProfiles || {}) as Record<
    string,
    { displayName?: string; photoURL?: string; email?: string }
  >;

  if (shared.length <= 1) return [];

  const visibleUsers = shared.slice(0, 2).map((uid, index) => {
    const profile = profiles[uid] || {};
    const isMe = uid === user?.uid;

    const displayName =
      String(profile.displayName || profile.email || "").trim() ||
      (isMe ? getUserDisplayName(user) : `User ${index + 1}`);

    const initial =
      displayName.trim().charAt(0).toUpperCase() ||
      (isMe ? getUserInitial(user) || "U" : String(index + 1));

   return {
  id: uid,
  uid,
  label: initial,
  bg: index % 2 === 0 ? "bg-indigo-500" : "bg-sky-500",
  displayName,
  photoURL: String(profile.photoURL || "").trim(),
  isMore: false,
  hiddenUsers: [],
};
  });

  const extraCount = shared.length - visibleUsers.length;

  if (extraCount > 0) {
  const hiddenUsers = shared.slice(2).map((uid) => {
  const profile = profiles[uid] || {};
  return {
    uid,
    displayName:
      String(profile.displayName || profile.email || "").trim() || "User",
  };
});

visibleUsers.push({
  id: "more",
  uid: "",
  label: `+${extraCount}`,
  bg: "bg-slate-200",
  text: "text-slate-600",
  displayName: "",
  photoURL: "",
  isMore: true,
  hiddenUsers,
});
}

  return visibleUsers;
}, [list?.sharedWith, (list as any)?.participantProfiles, user]);
const sharedUserColorMap = useMemo(() => {
  return getStableSharedUserColorMap(items, list?.sharedWith || []);
}, [items, list?.sharedWith]);

const groupedActiveItems = useMemo(() => {
  const groups: Record<string, ShoppingItem[]> = {};

  for (const key of CATEGORY_ORDER) {
    groups[key] = [];
  }

  for (const key of userCustomCategories) {
    if (!groups[key]) groups[key] = [];
  }

  for (const item of activeItems) {
    const category = resolveItemCategory(item, userCategoryMap, userCustomCategories) || "other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
  }

  return groups;
}, [activeItems, userCategoryMap, userCustomCategories]);


const recordHistory = (rawName: string) => {
  const name = rawName.trim();
  if (!name) return;
  const key = normalizeItemName(name);
  if (!key) return;

  const prev = historyRef.current[key];
  const next: ItemHistoryEntry = {
    name,
    count: (prev?.count || 0) + 1,
    lastUsed: Date.now(),
  };
  historyRef.current = { ...historyRef.current, [key]: next };
  saveItemHistory(historyRef.current);
};

const hiddenSuggestRef = useRef<Set<string>>(new Set());

useEffect(() => {
  hiddenSuggestRef.current = new Set(loadHiddenSuggestions());
}, []);


const suggestionList = useMemo(() => {
  const hidden = new Set(loadHiddenSuggestions());
  hiddenSuggestRef.current = hidden;

  return getAutocompleteSuggestions({
  query: inputValue,
  favorites: (favorites ?? []).map((f) => f.name),
  items: items ?? [],
  history: historyRef.current,
  hiddenKeys: hidden,
  lang,
  limit: 8,
});
}, [inputValue, favorites, items, lang]);

const visibleSuggestionList = useMemo(() => suggestionList, [suggestionList]);

const closeSuggestionsSoon = () => {
  if (blurCloseTimerRef.current) window.clearTimeout(blurCloseTimerRef.current);
  blurCloseTimerRef.current = window.setTimeout(() => {
    setIsSuggestOpen(false);
    setActiveSuggestIndex(-1);
  }, 120);
};

const openSuggestions = () => {
  if (blurCloseTimerRef.current) window.clearTimeout(blurCloseTimerRef.current);
  setIsSuggestOpen(true);
};

const applySuggestion = async (s: SuggestView) => {
  if (!user) {
    await signInSmart();
    return;
  }
  if (!list?.id) return;

  const pickKey = s.key || normalizeItemName(s.name);

  // אם כבר ברשימה - תציג שקיים
  if (s.isInList && s.itemId) {
  const pickKey = s.key || normalizeItemName(s.name);
  if (pickKey) {
    unhideSuggestionKey(pickKey);
    hiddenSuggestRef.current.delete(pickKey);
  }

  setInputValue("");
  setActiveSuggestIndex(-1);
  setIsSuggestOpen(false);
  window.requestAnimationFrame(() => inputRef.current?.focus());
  return;
}

  // אם לא ברשימה - להוסיף ישר
  const normalized = normalizeItemName(s.name);
  const existing = items.find((it) => normalizeItemName(it.name) === normalized);

  if (existing) {
    await updateQty(existing.id, +1);

    if (pickKey) {
      unhideSuggestionKey(pickKey);
      hiddenSuggestRef.current.delete(pickKey);
    }

    recordHistory(existing.name);
    setToast(t("כבר ברשימה - הגדלתי כמות ל-") + ((existing.quantity ?? 1) + 1));
    setInputValue("");
    setActiveSuggestIndex(-1);
    setIsSuggestOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return;
  }

  const itemId = crypto.randomUUID();
  const cleanName = stripWrappingBrackets(s.name.trim());

  const newItem: ShoppingItem = {
  id: itemId,
  name: cleanName,
  quantity: 1,
  isPurchased: false,
  isFavorite: false,
  createdAt: Date.now(),
  addedByUid: user.uid,
  addedByName: getUserDisplayName(user),
  addedByInitial: getUserInitial(user),
  category: userCategoryMap[normalizeCategoryPreferenceKey(cleanName)] || detectCategory(cleanName),
};

  await setDoc(doc(db, "lists", list.id, "items", itemId), newItem);

  if (pickKey) {
    unhideSuggestionKey(pickKey);
    hiddenSuggestRef.current.delete(pickKey);
  }

  recordHistory(cleanName);
  setInputValue("");
  setActiveSuggestIndex(-1);
  setIsSuggestOpen(false);
  window.requestAnimationFrame(() => inputRef.current?.focus());
};

const hideSuggestion = (s: SuggestView) => {
  const key = s.key || normalizeItemName(s.name);
  if (!key) return;

  // 1) remove from history (so it won't reappear)
  const nextHistory = { ...historyRef.current };
  if (nextHistory[key]) {
    delete nextHistory[key];
    historyRef.current = nextHistory;
    saveItemHistory(nextHistory);
  }

  // 2) add to hidden list (so it won't show even from static later)
  const nextHidden = new Set(hiddenSuggestRef.current);
  nextHidden.add(key);
  hiddenSuggestRef.current = nextHidden;
  hideSuggestionKey(key);

  // close suggestions and keep focus
  setIsSuggestOpen(false);
  setActiveSuggestIndex(-1);
  window.requestAnimationFrame(() => inputRef.current?.focus());
};

const hideItemFromSuggestionsByName = (rawName: string) => {
  const key = normalizeItemName(rawName);
  if (!key) return;

  const nextHistory = { ...historyRef.current };
  if (nextHistory[key]) {
    delete nextHistory[key];
    historyRef.current = nextHistory;
    saveItemHistory(nextHistory);
  }

  const nextHidden = new Set(hiddenSuggestRef.current);
  nextHidden.add(key);
  hiddenSuggestRef.current = nextHidden;
  hideSuggestionKey(key);
};

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      await signInSmart();
      return;
    }
    if (!list?.id) return;

    const name = stripWrappingBrackets(inputValue.trim());
    if (!name) return;

    // If the item already exists in the list, increment quantity instead of creating a duplicate row
    const normalized = normalizeItemName(name);
    const existing = items.find((it) => normalizeItemName(it.name) === normalized);

            if (existing) {
      if (normalized) {
        unhideSuggestionKey(normalized);
        hiddenSuggestRef.current.delete(normalized);
      }
      recordHistory(existing.name);
      setToast(t("הפריט כבר קיים ברשימה"));
      setInputValue("");
      setIsSuggestOpen(false);
      setActiveSuggestIndex(-1);
      return;
    }

    const itemId = crypto.randomUUID();
    const newItem: ShoppingItem = {
  id: itemId,
  name,
  quantity: 1,
  isPurchased: false,
  isFavorite: false,
  createdAt: Date.now(),
  addedByUid: user.uid,
  addedByName: getUserDisplayName(user),
  addedByInitial: getUserInitial(user),
  category: userCategoryMap[normalizeCategoryPreferenceKey(name)] || detectCategory(name),
};

    // Clear the add box immediately (especially important offline where Firestore writes may not resolve quickly)
    setInputValue("");
    setIsSuggestOpen(false);
    setActiveSuggestIndex(-1);

    await setDoc(doc(db, "lists", list.id, "items", itemId), newItem);
    if (normalized) {
      unhideSuggestionKey(normalized);
      hiddenSuggestRef.current.delete(normalized);
    }
    recordHistory(name);
    setInputValue("");
    setIsSuggestOpen(false);
      setActiveSuggestIndex(-1);
  };

  const togglePurchased = async (id: string) => {
    if (!list?.id) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const isNowPurchased = !item.isPurchased;
    await ensureUserColorAssigned(user?.uid);
   await updateDoc(doc(db, "lists", list.id, "items", id), {
  isPurchased: isNowPurchased,
  purchasedAt: isNowPurchased ? Date.now() : null,
  purchasedByUid: isNowPurchased ? user?.uid || "" : "",
  purchasedByName: isNowPurchased ? getUserDisplayName(user) : "",
  purchasedByInitial: isNowPurchased ? getUserInitial(user) : "",
});
  };

const saveCategoryItemName = async (id: string) => {
  const newName = editingCategoryText.trim();
  if (!newName) return;
  if (!list?.id) return;

  const currentItem = items.find((item) => item.id === id);
  if (!currentItem) return;

  const oldName = currentItem.name;
  const oldKey = normalizeItemName(oldName);
  const newKey = normalizeItemName(newName);

  await updateDoc(doc(db, "lists", list.id, "items", id), {
    name: newName,
  });

  setItems((prev) =>
    prev.map((item) =>
      item.id === id
        ? { ...item, name: newName }
        : item
    )
  );

  const nextHistory = { ...historyRef.current };

  if (oldKey && nextHistory[oldKey]) {
    const oldEntry = nextHistory[oldKey];
    delete nextHistory[oldKey];

    nextHistory[newKey] = {
      name: newName,
      count: oldEntry.count || 1,
      lastUsed: oldEntry.lastUsed || Date.now(),
    };
  } else if (newKey) {
    nextHistory[newKey] = {
      name: newName,
      count: 1,
      lastUsed: Date.now(),
    };
  }

  historyRef.current = nextHistory;
  saveItemHistory(nextHistory);

  setEditingCategoryItemId(null);
  setEditingCategoryText("");
};

  const ensureUserColorAssigned = async (uid?: string | null) => {
  if (!list?.id) return;
  const safeUid = String(uid || "").trim();
  if (!safeUid) return;

  const currentMap = ((list as any)?.userColorMap || {}) as Record<string, string>;
  if (currentMap[safeUid]) return;

  const usedColors = new Set(Object.values(currentMap));
  const nextColor =
    PASTEL_COLORS.find((c) => !usedColors.has(c)) || PASTEL_COLORS[0];

  try {
    await updateDoc(doc(db, "lists", list.id), {
      [`userColorMap.${safeUid}`]: nextColor,
    });
  } catch (e) {
    console.error("Failed to assign user color", e);
  }
};

  const LEAVE_MS = 240;

  const markPurchasedWithAnimation = (id: string) => {
    const item = items.find((i) => i.id === id);
    // Animate only when the item is leaving the active list (not when restoring from 'purchased')
    if (!item || item.isPurchased) {
      void togglePurchased(id);
      return;
    }

    setLeavingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      void togglePurchased(id).finally(() => {
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    }, LEAVE_MS);
  };

  const updateQty = async (id: string, delta: number) => {
  if (!list?.id) return;

  const item = items.find((i) => i.id === id);
  if (!item) return;

  const step = getQtyStepForItem(item, userCategoryMap, userCustomCategories);

  // Preserve atomic increment logic for positive updates
  if (delta > 0) {
    void updateDoc(doc(db, "lists", list.id, "items", id), {
      quantity: increment(step),
    }).catch((err) => console.error("updateDoc failed", err));
    return;
  }

  // Preserve local clamp logic for negative updates
  const minQty = step === 0.5 ? 0.5 : 1;
  const nextQty = Math.max(
    minQty,
    Math.round((item.quantity - step) * 10) / 10
  );

  void updateDoc(doc(db, "lists", list.id, "items", id), {
    quantity: nextQty,
  }).catch((err) => console.error("updateDoc failed", err));
};

  const deleteItem = async (id: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "items", id));
  };

  const deleteItemWithFlash = (id: string) => {
  if (!list?.id) return;
  if (deleteFlashIds.has(id)) return;

  setDeleteFlashIds((prev) => {
    const next = new Set(prev);
    next.add(id);
    return next;
  });

  window.setTimeout(() => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, 80);

  void deleteItem(id).catch((e) => console.warn("delete failed", e));

  window.setTimeout(() => {
    setDeleteFlashIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, 260);
};

  const toggleFavorite = (itemId: string) => {
    if (!list?.id) return;

    const favRef = doc(db, "lists", list.id, "favorites", itemId);

    // Remove favorite (optimistic)
    if (favoritesById.has(itemId)) {
      setFavorites((prev) => prev.filter((f) => f.id !== itemId));
      void deleteDoc(favRef).catch((e) => console.warn("favorite remove failed", e));
      return;
    }

    const item = items.find((i) => i.id === itemId);
    const itemName = String(item?.name || "");
    const key = normalize(itemName);

    // Prevent duplicates by normalized name (even if different itemId)
    if (key) {
      const existsByName = favorites.some((f) => normalize(f.name) === key);
      if (existsByName) return;
    }

    const createdAt = Date.now();

    // Add favorite (optimistic)
    setFavorites((prev) => {
      // Avoid duplicate id if it already exists
      if (prev.some((f) => f.id === itemId)) return prev;
      return [{ id: itemId, name: itemName, createdAt }, ...prev];
    });

    // Visual cue: item was added to favorites (no text)
    setFavoriteFlashIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    window.setTimeout(() => {
      setFavoriteFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 260);

    // Write in background (offline-friendly)
void setDoc(
  favRef,
  {
    name: itemName,
    createdAt,
    category: item?.category || resolveItemCategory(item as ShoppingItem, userCategoryMap),
  },
  { merge: true }
).catch((e) =>      console.warn("favorite add failed", e)
    );
  };

  const removeFavorite = async (favId: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "favorites", favId));
  };

  const removeFavoriteWithFlash = (favId: string) => {
    if (!list?.id) return;
    if (favDeleteFlashIds.has(favId)) return;

    setFavDeleteFlashIds((prev) => {
      const next = new Set(prev);
      next.add(favId);
      return next;
    });

    window.setTimeout(() => {
      void removeFavorite(favId).finally(() => {
        setFavDeleteFlashIds((prev) => {
          const next = new Set(prev);
          next.delete(favId);
          return next;
        });
      });
    }, 240);
  };

  const clearListServer = async () => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const itemsCol = collection(db, "lists", listId, "items");
    const snap = await getDocs(itemsCol);
    if (snap.empty) {
      setShowClearConfirm(false);
      return;
    }

    const docs = snap.docs;
    let idx = 0;
    while (idx < docs.length) {
      const batch = writeBatch(db);
      const slice = docs.slice(idx, idx + 450);
      for (const d of slice) batch.delete(d.ref);
      await batch.commit();
      idx += slice.length;
    }

    setShowClearConfirm(false);
  };

  // Invite
  const generateInviteTokenAndLink = async () => {
    if (!user) {
      await signInSmart();
      return null;
    }
    if (!list?.id) return null;

    const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

    await updateDoc(doc(db, "lists", list.id), {
      [`pendingInvites.${token}`]: { createdAt: Date.now(), expiresAt },
    });

    return buildInviteLink(list.id, token);
  };

  const shareInviteLinkSystem = async () => {
    const link = await generateInviteTokenAndLink();
    if (!link) return;

    const title = t("קישור לרשימה");
    const text = t("קישור הצטרפות להרשימה שלי:");

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title,
          text,
          url: link,
          dialogTitle: t("הזמן חברים לרשימה"),
        });
        return;
      }

      if (typeof navigator !== "undefined" && "share" in navigator) {
        // @ts-ignore
        await navigator.share({
          title,
          text,
          url: link,
        });
        return;
      }
    } catch (e) {
      // ignore and continue to clipboard fallback
    }

    await copyToClipboard(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // WhatsApp share
const openNativeCalendar = async () => {
  const activeItemsForCalendar = items.filter((i) => !i.isPurchased);

  const calendarLang: AppLang = lang || "he";

  const myListNameByLang: Record<AppLang, string> = {
    he: "הרשימה שלי",
    en: "My List",
    ru: "Мой список",
    ar: "قائمتي",
  };

  const emptyByLang: Record<AppLang, string> = {
    he: "הרשימה כרגע ריקה",
    en: "The list is currently empty",
    ru: "Список сейчас пуст",
    ar: "القائمة فارغة حاليًا",
  };

  const footerByLang: Record<AppLang, string> = {
    he: `נשלח מ${myListNameByLang.he} 🛒`,
    en: `Sent from ${myListNameByLang.en} 🛒`,
    ru: `Отправлено из ${myListNameByLang.ru} 🛒`,
    ar: `تم الإرسال من ${myListNameByLang.ar} 🛒`,
  };

  const defaultTitleByLang: Record<AppLang, string> = {
    he: "My Easy List",
    en: "My list",
    ru: "Мой список",
    ar: "قائمتي",
  };

  const rawTitle = (list?.title || "").trim();
  const rawTitleNorm = rawTitle.toLowerCase();

  const knownDefaultTitlesNorm = new Set(
    [
      defaultTitleByLang.he,
      defaultTitleByLang.en,
      defaultTitleByLang.ru,
      defaultTitleByLang.ar,
      myListNameByLang.he,
      myListNameByLang.en,
      myListNameByLang.ru,
      myListNameByLang.ar,
      `${myListNameByLang.he}:`,
      `${myListNameByLang.en}:`,
      `${myListNameByLang.ru}:`,
      `${myListNameByLang.ar}:`,
      "shopping-list",
      "shopping list",
      "my easy list",
    ].map((s) => String(s || "").trim().toLowerCase())
  );

  const titleIsDefault = !rawTitleNorm || knownDefaultTitlesNorm.has(rawTitleNorm);
  const shareLikeTitle = titleIsDefault
    ? `${myListNameByLang[calendarLang] || myListNameByLang.he}:`
    : rawTitle;

  const itemsBlock = activeItemsForCalendar.length
  ? activeItemsForCalendar
      .map((i) => {
        //if ((i.quantity || 1) <= 1) return i.name;
        if ((i.quantity || 1) === 1) return i.name; 

        if (calendarLang === "en" || calendarLang === "ru") {
          return `${i.name} X ${i.quantity}`;
        }

        return `${i.name} ${i.quantity}X`;
      })
      .join("\n")
  : `(${emptyByLang[calendarLang] || emptyByLang.he})`;

const calendarTitle = `${t("תזכורת לקניות")} - My Easy List`;
const calendarDescription = `${shareLikeTitle}\n\n${itemsBlock}\n\n${footerByLang[calendarLang] || footerByLang.he}`;

  const isNative = Capacitor.isNativePlatform();
if (isNative) {
  try {
    await CalendarPlugin.openCalendar({
      title: calendarTitle,
      description: calendarDescription,
    });
    return;
  } catch (e) {
    console.error("CalendarPlugin failed", e);
    setToast("CalendarPlugin נכשל באנדרואיד");
    return;
  }
}

  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(calendarTitle)}` +
    `&details=${encodeURIComponent(calendarDescription)}` +
    `&dates=${fmt(start)}/${fmt(end)}`;

  window.open(googleUrl, "_blank");
};

const shareListWhatsApp = () => {
    const active = items.filter((i) => !i.isPurchased);

    const RLE = "\u202B";
    const PDF = "\u202C";
    const LRI = "\u2066";
    const PDI = "\u2069";

    // Resolve share language (Production-safe):
    // 1) localStorage (the actual chosen UI language)
    // 2) current React state
    // 3) <html lang="">
    // 4) default he
    const getActiveLangForShare = (): AppLang => {
      const pick = (v: string | null | undefined): AppLang | null => {
        const s = String(v || "").toLowerCase();
        if (!s) return null;
        if (s === "he" || s.startsWith("he") || s.startsWith("iw")) return "he";
        if (s === "en" || s.startsWith("en")) return "en";
        if (s === "ru" || s.startsWith("ru")) return "ru";
        if (s === "ar" || s.startsWith("ar")) return "ar";
        return null;
      };

      try {
        // Your app stores the chosen language under shoppingListLang in Production
        const lsKeys = ["shoppingListLang", APP_LANG_STORAGE_KEY, "appLang", "appLanguage", "uiLang", "lang", "language", "selectedLanguage"];
        for (const k of lsKeys) {
          const fromLs = pick(localStorage.getItem(k));
          if (fromLs) return fromLs;
        }

        const fromState = pick(lang as any);
        if (fromState) return fromState;

        const fromHtml = pick(document?.documentElement?.lang);
        if (fromHtml) return fromHtml;
      } catch {}

      return "he";
    };

    const shareLang = getActiveLangForShare();
    const defaultTitleByLang: Record<AppLang, string> = {
      he: "My Easy List",
      en: "My list",
      ru: "Мой список",
      ar: "قائمتي",
    };

    const emptyByLang: Record<AppLang, string> = {
      he: "הרשימה כרגע ריקה",
      en: "The list is currently empty",
      ru: "Список сейчас пуст",
      ar: "القائمة فارغة حاليًا",
    };

    const myListNameByLang: Record<AppLang, string> = {
  he: "הרשימה שלי",
  en: "My List",
  ru: "Мой список",
  ar: "قائمتي",
};

const rawTitle = (list?.title || "").trim();
const rawTitleNorm = rawTitle.toLowerCase();

// Treat list titles that equal the app default title in ANY language/version as "default"
// so we can localize them during WhatsApp sharing.
const knownDefaultTitlesNorm = new Set(
  [
    defaultTitleByLang.he,
    defaultTitleByLang.en,
    defaultTitleByLang.ru,
    defaultTitleByLang.ar,
    myListNameByLang.he,
    myListNameByLang.en,
    myListNameByLang.ru,
    myListNameByLang.ar,
    `${myListNameByLang.he}:`,
    `${myListNameByLang.en}:`,
    `${myListNameByLang.ru}:`,
    `${myListNameByLang.ar}:`,
    // Older/variant spellings that may exist in persisted data
    "shopping-list",
    "shopping list",
    "my easy list",
  ].map((s) => String(s || "").trim().toLowerCase())
);

const titleIsDefault = !rawTitleNorm || knownDefaultTitlesNorm.has(rawTitleNorm);

const appName = myListNameByLang[shareLang] || myListNameByLang.he;

// If user didn't rename the list (or it matches a known default), localize it for sharing.
const title = titleIsDefault ? `${appName}:` : rawTitle;

const lines =
  active.length > 0
    ? active
        .map((i) => {
          const qtyText = formatItemQuantity(i.quantity || 1);

          if ((i.quantity || 1) === 1) return `${RLE}${i.name}${PDF}`;

          if (shareLang === "en" || shareLang === "ru") {
            return `${RLE}${LRI}${qtyText}${PDI} ${i.name} X${PDF}`;
          }

          return `${RLE}${i.name} X ${LRI}${qtyText}${PDI}${PDF}`;
        })
        .join("\n")
    : `${RLE}(${emptyByLang[shareLang] || emptyByLang.he})${PDF}`;

const header = `*${title}*`;

const footerByLang: Record<AppLang, string> = {
  he: `נשלח מ${appName} 🛒`,
  en: `Sent from ${appName} 🛒`,
  ru: `Отправлено из ${appName} 🛒`,
  ar: `تم الإرسال من ${appName} 🛒`,
};

const footer = footerByLang[shareLang] || footerByLang.he;const text = `${header}

${lines}

${footer}`;

    openWhatsApp(text);
  };

  // ---------------------------
  // Swipe gestures (favorites): swipe right = remove from favorites (delete), swipe left = add to list
  // Pointer-only for Android stability.
  const favSwipeStartRef = useRef<{ x: number; y: number; id: string; pointerId: number } | null>(null);
  const favSwipeLastRef = useRef<{ x: number; y: number } | null>(null);
  const favSwipeCaptureRef = useRef<{ el: HTMLElement; pointerId: number } | null>(null);
  const [favSwipeUi, setFavSwipeUi] = useState<{ id: string | null; dx: number; rawDx: number }>({ id: null, dx: 0, rawDx: 0 });
  const favSwipeVibratedRef = useRef<Record<string, boolean>>({});

  const FAV_SWIPE_THRESHOLD_PX = 60;
  const FAV_SWIPE_MAX_SHIFT_PX = 110;

  const addFavoriteToList = async (fav: FavoriteDoc) => {
    if (!list?.id) return { targetId: null as string | null, created: false };

    const favKey = normalizeItemName(stripWrappingBrackets(fav.name));

    const existing = items.find((i) => !i.isPurchased && normalizeItemName(i.name) === favKey);

    if (existing) {
      // Visual cue on the existing row in the main list (no text)
      setListFlashIds((prev) => {
        const next = new Set(prev);
        next.add(existing.id);
        return next;
      });
      window.setTimeout(() => {
        setListFlashIds((prev) => {
          const next = new Set(prev);
          next.delete(existing.id);
          return next;
        });
      }, 260);

      return { targetId: existing.id, created: false };
    }

    // Visual cue on the favorites card: item was moved to the main list (no text)
    setFavToListFlashIds((prev) => {
      const next = new Set(prev);
      next.add(fav.id);
      return next;
    });
    window.setTimeout(() => {
      setFavToListFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(fav.id);
        return next;
      });
    }, 260);

    const itemId = crypto.randomUUID();
    const cleanFavName = stripWrappingBrackets(fav.name);

      const newItem: ShoppingItem = {
  id: itemId,
  name: cleanFavName,
  quantity: 1,
  isPurchased: false,
  isFavorite: false,
  createdAt: Date.now(),
  addedByUid: user?.uid || "",
  addedByName: getUserDisplayName(user),
  addedByInitial: getUserInitial(user),
  category:
  userCategoryMap[normalizeCategoryPreferenceKey(cleanFavName)] ||
  fav.category ||
  detectCategory(cleanFavName),
};

    // Queue enter animation for when Firestore pushes the new item into state
    pendingEnterIdsRef.current.add(itemId);

    await setDoc(doc(db, "lists", list.id, "items", itemId), newItem);

    return { targetId: itemId, created: true };
  };

  const onFavSwipePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (isNoSwipeTarget(e.target)) return;

    favSwipeStartRef.current = { x: e.clientX, y: e.clientY, id, pointerId: e.pointerId };
    favSwipeLastRef.current = { x: e.clientX, y: e.clientY };
    setFavSwipeUi({ id, dx: 0, rawDx: 0 });
    favSwipeVibratedRef.current[id] = false;
  };

  const onFavSwipePointerMove = (id: string) => (e: React.PointerEvent) => {
    const s = favSwipeStartRef.current;
    if (!s || s.id !== id) return;

    favSwipeLastRef.current = { x: e.clientX, y: e.clientY };

    const dxRaw = e.clientX - s.x;
    const dyRaw = e.clientY - s.y;

    const active = Math.abs(dxRaw) >= FAV_SWIPE_THRESHOLD_PX;

    if (active && !favSwipeVibratedRef.current[id]) {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(15);
      }
      favSwipeVibratedRef.current[id] = true;
    }
    if (!active) {
      favSwipeVibratedRef.current[id] = false;
    }

    // start capture only when it's clearly horizontal
    if (!favSwipeCaptureRef.current && Math.abs(dxRaw) > 10 && Math.abs(dyRaw) <= Math.abs(dxRaw) * 1.2) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        favSwipeCaptureRef.current = { el: e.currentTarget as HTMLElement, pointerId: e.pointerId };
      } catch (e) {}
    }

    // allow a bit of vertical movement (so swipe doesn't "fail" on real phones)
    if (Math.abs(dyRaw) > Math.abs(dxRaw) * 1.6) return;

    const dxClamped = Math.max(-FAV_SWIPE_MAX_SHIFT_PX, Math.min(FAV_SWIPE_MAX_SHIFT_PX, dxRaw));
    setFavSwipeUi({ id, dx: dxClamped, rawDx: dxRaw });
  };

  const onFavSwipePointerUp = (id: string) => async (e: React.PointerEvent) => {
    const s = favSwipeStartRef.current;
    const last = favSwipeLastRef.current;

    favSwipeStartRef.current = null;

    try {
      if (favSwipeCaptureRef.current && s) {
        favSwipeCaptureRef.current.el.releasePointerCapture(s.pointerId);
      }
    } catch (e) {}
    favSwipeCaptureRef.current = null;
    favSwipeLastRef.current = null;

    // reset UI
    setFavSwipeUi({ id: null, dx: 0, rawDx: 0 });

    if (!s || s.id !== id) return;

    const endX = last?.x ?? e.clientX;
    const endY = last?.y ?? e.clientY;

    const dxRaw = endX - s.x;
    const dyRaw = endY - s.y;

    // require a meaningful horizontal swipe (but not too strict)
    if (Math.abs(dxRaw) < FAV_SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dyRaw) > Math.abs(dxRaw) * 1.6) return;


    const fav = favorites.find((f) => f.id === id);

    if (dxRaw > 0) {
      // swipe right -> remove from favorites
      removeFavoriteWithFlash(id);
    } else {
      // swipe left -> add to list
      if (fav) await addFavoriteToList(fav);
    }
  };

  const onFavSwipePointerCancel = () => {
    favSwipeStartRef.current = null;
    favSwipeLastRef.current = null;
    favSwipeCaptureRef.current = null;
    setFavSwipeUi({ id: null, dx: 0, rawDx: 0 });
  };

  // ---------------------------
  // Voice actions
  // ---------------------------
  const findItemByName = (name: string) => {
    const n = normalize(stripWrappingBrackets(name));
    const exact = items.find((i) => normalize(i.name) === n);
    if (exact) return exact;
    const contains = items.find((i) => normalize(i.name).includes(n) || n.includes(normalize(i.name)));
    return contains || null;
  };

  const addOrSetQuantity = async (nameRaw: string, qty: number) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const itemsNow = latestItemsRef.current || items;
    const name = stripWrappingBrackets(nameRaw.trim());
    if (!name) return;

    const existing = itemsNow.find((i) => !i.isPurchased && normalize(i.name) === normalize(name));
    if (existing) {
      await updateDoc(doc(db, "lists", listId, "items", existing.id), { quantity: qty });
      return;
    }

    const itemId = crypto.randomUUID();
   const newItem: ShoppingItem = {
  id: itemId,
  name,
  quantity: qty,
  isPurchased: false,
  isFavorite: false,
  createdAt: Date.now(),
  addedByUid: user?.uid || "",
  addedByName: getUserDisplayName(user),
  addedByInitial: getUserInitial(user),
  category: userCategoryMap[normalizeCategoryPreferenceKey(name)] || detectCategory(name),
};
    
    await setDoc(doc(db, "lists", listId, "items", itemId), newItem);
    await setDoc(doc(db, "lists", listId, "items", itemId), newItem);
  };

  const executeVoiceText = async (raw: string) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const text = normalize(normalizeVoiceText(raw));
    if (!text) return;

    // Clear list
    if (isClearListCommand(text, lang)) {
      await clearListServer();
      setToast(t("הרשימה נמחקה"));
      return;
    }

    // Delete item
    if (/^(מחק|תמחק|תמחוק|תמחקי)\s+/.test(text)) {
      const name = text.replace(/^(מחק|תמחק|תמחוק|תמחקי)\s+/, "").trim();
      const item = findItemByName(name);
      if (!item) {
        setToast(t("לא מצאתי פריט למחיקה"));
        return;
      }
      deleteItemWithFlash(item.id);
      setToast(`מחקתי: ${item.name}`);
      return;
    }

    // Mark purchased
    const buyMatch = text.match(/^(סמן|תסמן|תסמני)\s+(.+)\s+(נקנה|כנקנה|נקנתה)$/);
    if (buyMatch) {
      const name = buyMatch[2].trim();
      const item = findItemByName(name);
      if (!item) {
        setToast(t("לא מצאתי פריט לסימון"));
        return;
      }
      if (!item.isPurchased) await togglePurchased(item.id);
      setToast(`סימנתי נקנה: ${item.name}`);
      return;
    }

    // Increase / decrease
    const incMatch = text.match(/^(הגדל|תגדיל|תגדילי)\s+(.+)$/);
    if (incMatch) {
      const name = incMatch[2].trim();
      const item = findItemByName(name);
      if (!item) return setToast(t("לא מצאתי פריט להגדלה"));
      await updateQty(item.id, 1);
      return setToast(`הגדלתי: ${item.name}`);
    }

    const decMatch = text.match(/^(הקטן|תקטין|תקטיני)\s+(.+)$/);
    if (decMatch) {
      const name = decMatch[2].trim();
      const item = findItemByName(name);
      if (!item) return setToast(t("לא מצאתי פריט להקטנה"));
      await updateQty(item.id, -1);
      return setToast(`הקטנתי: ${item.name}`);
    }

    // ADD: with or without "הוסף"
    const addPrefix = text.match(/^(הוסף|תוסיף|תוסיפי|הוספה)(?:\s+פריט)?\s+(.+)$/);
    const payload = addPrefix ? addPrefix[2] : text;

const parsed = collapseParsedItemsForExecution(
  parseItemsForExecution(payload, lang, voiceExtraTerms)
);

for (const p of parsed) {
  await addOrSetQuantity(p.name, p.qty);
}

    // intentionally no toast for "added items" via microphone
  };

  const isNativeSpeechMode = () => {
    try {
      return Capacitor.isNativePlatform();
    } catch (e) {
      return false;
    }
  };

  const clearNativeSpeechState = () => {
    nativeFinalTranscriptRef.current = "";
    nativeLastPartialRef.current = "";
  };

  const restartNativeTapListeningSoon = (bypassTapLock = true) => {
  window.setTimeout(() => {
    void startTapListening(bypassTapLock);
  }, 120);
};

  const mergeTranscriptParts = (parts: string[]) => {
    let acc = "";
    for (const raw of parts) {
      const c = String(raw || "").trim();
      if (!c) continue;
      if (!acc) {
        acc = c;
        continue;
      }
      const a = acc.trim();
      if (c.startsWith(a)) {
        acc = c;
        continue;
      }
      if (a.startsWith(c)) {
        continue;
      }
      const maxOverlap = Math.min(a.length, c.length, 60);
      let stitched = false;
      for (let k = maxOverlap; k >= 10; k--) {
        if (a.slice(-k) === c.slice(0, k)) {
          acc = a + c.slice(k);
          stitched = true;
          break;
        }
      }
      if (!stitched) acc = a + " " + c;
    }
    return acc.replace(/\s+/g, " ").trim();
  };

  const mergeTranscriptCandidate = (prevRaw: string, nextRaw: string) => {
  const prev = normalizeVoiceText(String(prevRaw || "")).trim();
  const next = normalizeVoiceText(String(nextRaw || "")).trim();

  if (!prev) return next;
  if (!next) return prev;

  if (prev === next) return prev;
  if (next.startsWith(prev)) return next;
  if (prev.startsWith(next)) return prev;

  const prevWords = prev.split(" ").filter(Boolean);
  const nextWords = next.split(" ").filter(Boolean);

  const maxWordOverlap = Math.min(prevWords.length, nextWords.length);
  for (let k = maxWordOverlap; k >= 2; k--) {
    const prevTail = prevWords.slice(-k).join(" ");
    const nextHead = nextWords.slice(0, k).join(" ");
    if (prevTail === nextHead) {
      return [...prevWords, ...nextWords.slice(k)].join(" ").trim();
    }
  }

  return mergeTranscriptParts([prev, next]);
};

  const mergeFinalAndInterimTranscript = (finalText: string, interimText: string) => {
    const f = String(finalText || "").trim();
    const i = String(interimText || "").trim();

    if (!f) return i;
    if (!i) return f;

    if (f === i) return f;
    if (i.startsWith(f)) return i;
    if (f.startsWith(i)) return f;

    return `${f} ${i}`.replace(/\s+/g, " ").trim();
  };

  const ensureNativeSpeechReady = async () => {
    if (!isNativeSpeechMode()) return false;

    try {
      const available = await SpeechRecognition.available();
      const isAvailable = !!available?.available;
      nativeSpeechAvailableRef.current = isAvailable;
      if (!isAvailable) return false;
    } catch (e) {
      nativeSpeechAvailableRef.current = false;
      return false;
    }

    try {
      const perms: any = await SpeechRecognition.checkPermissions();

      // Android fix:
      // The speech-recognition plugin exposes Android permission state via
      // `speechRecognition`, which maps to RECORD_AUDIO.
      // It does not require a separate `microphone` field to be present.
      const speechGranted =
        perms?.speechRecognition === "granted" ||
        perms?.speechRecognition === "prompt-with-rationale" ||
        perms?.permission === "granted";

      if (!speechGranted) {
        const req: any = await SpeechRecognition.requestPermissions();
        const speechOk =
          req?.speechRecognition === "granted" ||
          req?.permission === "granted";
        return !!speechOk;
      }

      return true;
    } catch (e) {
      return false;
    }
  };

  const ensureSpeechRecognition = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    return SR;
  };
  const formatMmSs = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const startVoiceTimer = () => {
    if (voiceTimerRef.current != null) window.clearInterval(voiceTimerRef.current);
    setVoiceSeconds(0);
    voiceTimerRef.current = window.setInterval(() => {
      setVoiceSeconds((x) => x + 1);
    }, 1000);
  };

  const stopVoiceTimer = () => {
    if (voiceTimerRef.current != null) window.clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = null;
  };

  const requestNoiseSuppressedMic = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) return;
      // Best-effort: request a stream with noise suppression.
      // Important (mobile): do NOT keep the stream open - it can block SpeechRecognition from accessing the mic.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        } as any,
      });

      // Immediately release the mic. This only "warms" the permission prompt.
      try {
        stream.getTracks?.().forEach((t) => t.stop());
      } catch (e) {}

      noiseStreamRef.current = null;
    } catch (e) {
      // ignore (permissions may be handled by SpeechRecognition)
    }
  };

  const stopNoiseSuppressedMic = () => {
    try {
      noiseStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch (e) {}
    noiseStreamRef.current = null;
  };

  type VoiceUndoAction =
    | { type: "delete_item"; id: string }
    | { type: "restore_qty"; id: string; prevQty: number };

  const runUndoActions = async (actions: VoiceUndoAction[]) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;
    for (const a of actions) {
      try {
        if (a.type === "delete_item") {
          await deleteDoc(doc(db, "lists", listId, "items", a.id));
        } else if (a.type === "restore_qty") {
          await updateDoc(doc(db, "lists", listId, "items", a.id), { quantity: a.prevQty });
        }
      } catch (e) {
        // ignore single-action failures
      }
    }
  };

  // Voice execution with optional undo support (undo is implemented for "add items" path only)
  const executeVoiceTextWithUndo = async (raw: string): Promise<VoiceUndoAction[]> => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return [];

    const text = normalize(normalizeVoiceText(raw));
    if (!text) return [];

    // Clear list / delete / mark purchased / qty changes - no undo (too risky without a full snapshot)
    if (isClearListCommand(text, lang)) {
      await clearListServer();
      setToast(t("הרשימה נמחקה"));
      return [];
    }

    if (/^(מחק|תמחק|תמחוק|תמחקי)\s+/.test(text)) {
      const name = text.replace(/^(מחק|תמחק|תמחוק|תמחקי)\s+/, "").trim();
      const item = findItemByName(name);
      if (!item) {
        setToast(t("לא מצאתי פריט למחיקה"));
        return [];
      }
      deleteItemWithFlash(item.id);
      setToast(`מחקתי: ${item.name}`);
      return [];
    }

    const buyMatch = text.match(/^(סמן|תסמן|תסמני)\s+(.+)\s+(נקנה|כנקנה|נקנתה)$/);
    if (buyMatch) {
      const name = buyMatch[2].trim();
      const item = findItemByName(name);
      if (!item) {
        setToast(t("לא מצאתי פריט לסימון"));
        return [];
      }
      if (!item.isPurchased) await togglePurchased(item.id);
      setToast(`סימנתי נקנה: ${item.name}`);
      return [];
    }

    const incMatch = text.match(/^(הגדל|תגדיל|תגדילי)\s+(.+)$/);
    if (incMatch) {
      const name = incMatch[2].trim();
      const item = findItemByName(name);
      if (!item) return (setToast(t("לא מצאתי פריט להגדלה")), []);
      await updateQty(item.id, 1);
      setToast(`הגדלתי: ${item.name}`);
      return [];
    }

    const decMatch = text.match(/^(הקטן|תקטין|תקטיני)\s+(.+)$/);
    if (decMatch) {
      const name = decMatch[2].trim();
      const item = findItemByName(name);
      if (!item) return (setToast(t("לא מצאתי פריט להקטנה")), []);
      await updateQty(item.id, -1);
      setToast(`הקטנתי: ${item.name}`);
      return [];
    }

    // ADD: with or without "הוסף"
    const addPrefix = text.match(/^(הוסף|תוסיף|תוסיפי|הוספה)(?:\s+פריט)?\s+(.+)$/);
    const payload = addPrefix ? addPrefix[2] : text;

const parsed = collapseParsedItemsForExecution(
  parseItemsForExecution(payload, lang, voiceExtraTerms)
);

    const actions: VoiceUndoAction[] = [];

    const itemsNow = latestItemsRef.current || items;

    for (const p of parsed) {
      const name = stripWrappingBrackets((p.name || "").trim());
      const lower = name.toLowerCase();
      if (lower === "list" || lower === "the list") continue;
      if (!name) continue;

      const existing = itemsNow.find((i) => !i.isPurchased && normalize(i.name) === normalize(name));
      if (existing) {
        const prevQty = existing.quantity;
        await updateDoc(doc(db, "lists", listId, "items", existing.id), { quantity: p.qty });
        actions.push({ type: "restore_qty", id: existing.id, prevQty });
      } else {
        const itemId = crypto.randomUUID();
       const newItem: ShoppingItem = {
  id: itemId,
  name,
  quantity: p.qty,
  isPurchased: false,
  isFavorite: false,
  createdAt: Date.now(),
  addedByUid: user?.uid || "",
  addedByName: getUserDisplayName(user),
  addedByInitial: getUserInitial(user),
  category: userCategoryMap[normalizeCategoryPreferenceKey(name)] || detectCategory(name),
};
        await setDoc(doc(db, "lists", listId, "items", itemId), newItem);
        actions.push({ type: "delete_item", id: itemId });
      }
    }

    return actions;
  };

  const waitForLateNativeTranscript = async (maxWaitMs = NATIVE_LATE_TRANSCRIPT_WAIT_MS) => {
    const startedAt = Date.now();
    let latest = "";

    while (Date.now() - startedAt < maxWaitMs) {
      latest = mergeTranscriptParts(
  [
    ...nativeTranscriptChunksRef.current,
    nativeFinalTranscriptRef.current,
    nativeLastPartialRef.current,

  ]
    .map((x) => normalizeVoiceText(String(x || "")))
    .filter(Boolean)
);

      if (latest) return latest;
      await new Promise((resolve) => setTimeout(resolve, NATIVE_LATE_TRANSCRIPT_POLL_MS));
    }

    return latest;
  };

  const finalizeNativeTapListening = async () => {
    if (nativeFinalizeRef.current) return;
    nativeFinalizeRef.current = true;

    setIsListening(false);
    setVoiceUi("processing");
    stopVoiceTimer();
    nativeLastStopAtRef.current = Date.now();

    try {
      await Promise.race([
        SpeechRecognition.stop().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 180)),
      ]);
    } catch (e) {
      // ignore
    }

    await new Promise((resolve) => setTimeout(resolve, 90));

    let combined = mergeTranscriptParts(
  [
    ...nativeTranscriptChunksRef.current,
    nativeFinalTranscriptRef.current,
    nativeLastPartialRef.current,
  
  ]
    .map((x) => normalizeVoiceText(String(x || "")))
    .filter(Boolean)
);

    if (!combined) {
      combined = await waitForLateNativeTranscript();
    }

    try {
      await SpeechRecognition.removeAllListeners();
    } catch (e) {
      // ignore
    }

combined = combined
  .replace(/clear list\s+clear list/gi, "clear list")
  .trim();

if (!combined) {
  setVoiceUi("idle");
  setToast(t("לא נקלט קול - נסה שוב"));
  nativeFinalizeRef.current = false;

  if (nativeRestartRequestedRef.current) {
    nativeRestartRequestedRef.current = false;
  }
  return;
}

const normalizedCmd = combined
  .toLowerCase()
  .replace(/\bthe\b/g, "")
  .replace(/\bmy\b/g, "")
  .replace(/\s+/g, " ")
  .trim();

if (normalizedCmd.includes("clear list")) {
  await clearListServer();
  setVoiceUi("idle");
  nativeFinalizeRef.current = false;
  return;
}

clearNativeSpeechState();

   if (nativeRestartRequestedRef.current) {
  nativeRestartRequestedRef.current = false;
  setVoiceDraft("");
  setVoiceUi("idle");
  nativeFinalizeRef.current = false;
  scheduleNativeTapRestart(0);
  return;
}

if (isClearListCommand(combined, lang)) {
  await clearListServer();
  setVoiceDraft("");
  setVoiceUi("idle");
  nativeFinalizeRef.current = false;
  setToast(t("הרשימה נמחקה"));
  return;
}

setVoiceDraft(
  cleanVoiceReviewText(formatDraftForReview(combined, lang, voiceExtraTerms))
);
setVoiceUi("review");
nativeFinalizeRef.current = false;
};

  
  
 
   const scheduleNativeTapRestart = (delayMs: number, bypassTapLock = true) => {
  if (pendingRestartTimerRef.current != null) {
    window.clearTimeout(pendingRestartTimerRef.current);
    pendingRestartTimerRef.current = null;
  }

  pendingRestartTimerRef.current = window.setTimeout(() => {
    pendingRestartTimerRef.current = null;
    void startTapListening(bypassTapLock);
  }, Math.max(0, delayMs));
};

const shouldShowVoiceCoach = () => {
  if (voiceCoachDismissed) return false;
  if (voiceCoachSeenCount >= VOICE_COACH_MAX_AUTO_SHOW) return false;
  return true;
};

const openVoiceCoachIfNeeded = () => {
  if (!shouldShowVoiceCoach()) return false;

  setDontShowVoiceCoachAgain(false);
  setShowVoiceCoach(true);
  setVoiceCoachSeenCount((prev) => prev + 1);
  return true;
};

  const startTapListening = async (bypassTapLock = false) => {
    nativeRestartRequestedRef.current = false;

    if (!bypassTapLock) {
      if (Date.now() < micTapLockUntilRef.current) return;
      micTapLockUntilRef.current = Date.now() + MIC_TAP_DEBOUNCE_MS;
    }

    if (!isOnline) {
      setToast(t("__toast_no_internet__"));
      setVoiceUi("idle");
      setIsListening(false);
      return;
    }

    if (!user) {
      setToast(t("צריך להתחבר לפני פקודות קוליות"));
      signInSmart();
      return;
    }

   if (isNativeSpeechMode()) {
      const ready = await ensureNativeSpeechReady();
      if (!ready) {
        alert(t("אין הרשאה למיקרופון. אשר הרשאה ואז נסה שוב."));
        return;
      }

      const sinceLastStop = Date.now() - nativeLastStopAtRef.current;
      if (nativeLastStopAtRef.current) {
        const requiredDelay = Math.max(
          0,
          Math.max(
            NATIVE_RESTART_COOLDOWN_MS - sinceLastStop,
            NATIVE_SMART_START_DELAY_MS - sinceLastStop
          )
        );

        if (requiredDelay > 0) {
          setVoiceUi("processing");
          setIsListening(false);
          scheduleNativeTapRestart(requiredDelay, true);
          return;
        }
      }

      clearNativeSpeechState();
      nativeFinalizeRef.current = false;
      transcriptBufferRef.current = [];
      lastInterimRef.current = "";
      startGuardRef.current = false;
      nativeTranscriptChunksRef.current = [];

      tapActiveRef.current = true;
      setVoiceDraft("");
      setLastHeard("");
      setIsListening(true);
      setVoiceUi("recording");
      startVoiceTimer();

      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(10);
      }

      try {
        await Promise.race([
          SpeechRecognition.stop().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 80)),
        ]);
      } catch (e) {
        // ignore stale previous session stop
      }

      try {
        await SpeechRecognition.removeAllListeners();
        await new Promise((resolve) => setTimeout(resolve, 90));

        await SpeechRecognition.addListener("partialResults", (data: any) => {
          const matches = Array.isArray(data?.matches) ? data.matches : [];
          const merged = mergeTranscriptParts(
            matches
              .map((m: any) => normalizeVoiceText(String(m || "")))
              .filter(Boolean)
          ).trim();

          if (!merged) return;

          nativeLastPartialRef.current = merged;

          const previewBase =
          nativeTranscriptChunksRef.current.length > 0
          ? nativeTranscriptChunksRef.current[nativeTranscriptChunksRef.current.length - 1]
          : "";

const preview = mergeTranscriptCandidate(previewBase, merged);

          setLastHeard(preview);
        });

        await SpeechRecognition.addListener("listeningState", async (data: any) => {
          const status = String(data?.status || "");

          if (status === "started" || status === "listening") {
            if (nativeTapStopTimerRef.current != null) {
              window.clearTimeout(nativeTapStopTimerRef.current);
              nativeTapStopTimerRef.current = null;
            }
            nativeRestartRequestedRef.current = false;
            return;
          }

          if (status === "stopped" && tapActiveRef.current) {
            const partial = String(nativeLastPartialRef.current || "").trim();
            const lastChunk =
              nativeTranscriptChunksRef.current.length > 0
                ? String(
                    nativeTranscriptChunksRef.current[
                      nativeTranscriptChunksRef.current.length - 1
                    ] || ""
                  ).trim()
                : "";

            // Ignore very short partials (English produces many unstable fragments)
            if (partial && partial !== lastChunk) {
            const mergedChunk = mergeTranscriptCandidate(lastChunk, partial);

              if (!lastChunk) {
                nativeTranscriptChunksRef.current.push(mergedChunk);
              } else {
                nativeTranscriptChunksRef.current[
                  nativeTranscriptChunksRef.current.length - 1
                ] = mergedChunk;
              }
            }

            nativeLastPartialRef.current = "";

            if (nativeRestartRequestedRef.current) return;
            nativeRestartRequestedRef.current = true;

            if (nativeTapStopTimerRef.current != null) {
              window.clearTimeout(nativeTapStopTimerRef.current);
            }

            if (!partial || partial.length < 2) {
            nativeRestartRequestedRef.current = false;
            return;
             }

            nativeTapStopTimerRef.current = window.setTimeout(async () => {
              nativeTapStopTimerRef.current = null;

              if (!tapActiveRef.current) {
                nativeRestartRequestedRef.current = false;
                return;
              }

              try {
                await SpeechRecognition.start({
                  language: speechLang,
                  partialResults: true,
                  popup: false,
                  maxResults: 1,
                  prompt: "",
                });
              } catch (e) {
                // ignore
              } finally {
                nativeRestartRequestedRef.current = false;
              }
            }, lang === "en" ? 350 : 250);
          }
        });

        const started = await SpeechRecognition.start({
          language: speechLang,
          maxResults: 1,
          prompt: "",
          partialResults: true,
          popup: false,
        } as any);

        const initialMatches = Array.isArray((started as any)?.matches)
          ? (started as any).matches
          : [];
        const initialMerged = mergeTranscriptParts(
          initialMatches
            .map((m: any) => normalizeVoiceText(String(m || "")))
            .filter(Boolean)
        );

        if (initialMerged) {
          nativeFinalTranscriptRef.current = initialMerged;
          setLastHeard(initialMerged);
        }
      } catch (e) {
        console.error(e);
        stopVoiceTimer();
        setIsListening(false);
        setVoiceUi("idle");
        tapActiveRef.current = false;
        setToast(t("לא הצלחתי להתחיל האזנה"));
      }
      return;
    }

    const SR = ensureSpeechRecognition();
    if (!SR) {
      alert(t("הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge."));
      return;
    }

    await requestNoiseSuppressedMic();

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";
    startGuardRef.current = false;

    tapActiveRef.current = true;
    setVoiceDraft("");
    setLastHeard("");
    setIsListening(true);
    setVoiceUi("recording");
    startVoiceTimer();

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const rec = new SR();
recognitionRef.current = rec;

rec.lang = speechLang;
rec.interimResults = true;
rec.maxAlternatives = 1;
rec.continuous = true;

// Tap mode - אין עצירה אוטומטית על שקט
const clearLocalTimers = () => {
  // no-op
};

rec.onresult = (event: any) => {
  try {
    let interimCombined = "";
    const results = (event as any).results;
    if (!results) return;

    for (let i = (event as any).resultIndex ?? 0; i < (results?.length ?? 0); i++) {
      const r = results[i];
      const best = r?.[0];
      let transcript = normalizeVoiceText(String(best?.transcript || ""));
      transcript = removeStopWords(transcript, lang);
      if (!transcript) continue;

      if (r.isFinal) {
        // ignore duplicate final that is identical to what we already have
        if (transcriptBufferRef.current[i] !== transcript) {
          transcriptBufferRef.current[i] = transcript;
        }
        lastInterimRef.current = "";
      } else {
        // ignore duplicate interim repeats that Chrome often emits in English
        
          interimCombined = transcript;
          lastInterimRef.current = transcript;
        
      }
    }

    const mergedPreview = mergeTranscriptParts(
      [
        ...transcriptBufferRef.current.filter(Boolean),
        interimCombined || lastInterimRef.current || "",
      ].filter(Boolean)
    );

 
    const last = mergedPreview;

if (last) setLastHeard(cleanVoicePreviewText(last));

} catch (e) {
  // ignore
}
};



    rec.onerror = (e: any) => {
      const err = String(e?.error || "");
      console.warn("Speech error:", err, e);

      if (err === "no-speech") return;

      clearLocalTimers();
      stopVoiceTimer();
      stopNoiseSuppressedMic();
      setIsListening(false);
      setVoiceUi("idle");
      tapActiveRef.current = false;

      if (err === "not-allowed" || err === "service-not-allowed") {
        alert(t("אין הרשאה למיקרופון. אשר הרשאה ואז נסה שוב."));
      } else if (err === "audio-capture") {
        setToast(t("המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)"));
      } else if (err === "network" || err === "network-error" || !isOnline) {
        setToast(t("זיהוי קולי דורש חיבור לאינטרנט"));
      } else {
        setToast(`שגיאת מיקרופון: ${err || "unknown"}`);
      }
    };

    rec.onend = () => {
      clearLocalTimers();

// If user is still recording, try to restart (Chrome sometimes ends spontaneously)
if (!tapActiveRef.current) return;

if (nativeTapStopTimerRef.current != null) {
  window.clearTimeout(nativeTapStopTimerRef.current);
  nativeTapStopTimerRef.current = null;
}

if (startGuardRef.current) return;
startGuardRef.current = true;
      setTimeout(() => {
        if (!tapActiveRef.current) {
          startGuardRef.current = false;
          return;
        }
        try {
          rec.start();
        } catch (e) {
          // ignore
        } finally {
          startGuardRef.current = false;
        }
      }, 40);
    };

    try {
      rec.start();
      
    } catch (e) {
      console.error(e);
      clearLocalTimers();
      stopVoiceTimer();
      stopNoiseSuppressedMic();
      setIsListening(false);
      setVoiceUi("idle");
      tapActiveRef.current = false;
      setToast(t("לא הצלחתי להתחיל האזנה"));
    }
  };

  const stopTapListening = async () => {
  if (!tapActiveRef.current) return;

  if (nativeTapStopTimerRef.current != null) {
    window.clearTimeout(nativeTapStopTimerRef.current);
    nativeTapStopTimerRef.current = null;
  }

  tapActiveRef.current = false;
  setIsListening(false);
  setVoiceUi("processing");
  stopVoiceTimer();

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(20);
  }

  if (isNativeSpeechMode()) {
    await finalizeNativeTapListening();
    return;
  }

  try {
    recognitionRef.current?.stop?.();
  } catch (e) {}

  stopNoiseSuppressedMic();

  // allow final events to flush
  await new Promise((r) => setTimeout(r, 650));

    const chunks = transcriptBufferRef.current.filter(Boolean);
const mergeChunks = (parts: string[]) => {
  let acc = "";
  for (const raw of parts) {
    const c = String(raw || "").trim();
    if (!c) continue;
    if (!acc) {
      acc = c;
      continue;
    }
    const a = acc.trim();
    // If recognizer returns cumulative text, prefer the longer one
    if (c.startsWith(a)) {
      acc = c;
      continue;
    }
    if (a.startsWith(c)) {
      continue;
    }
    // Try to stitch by overlap (end of acc matches start of c)
    const maxOverlap = Math.min(a.length, c.length, 60);
    let stitched = false;
    for (let k = maxOverlap; k >= 10; k--) {
      if (a.slice(-k) === c.slice(0, k)) {
        acc = a + c.slice(k);
        stitched = true;
        break;
      }
    }
    if (!stitched) acc = a + " " + c;
  }
  return acc.replace(/\s+/g, " ").trim();
};
const finalText = mergeChunks(chunks);
const interimText = (lastInterimRef.current || "").trim();
const combined = mergeFinalAndInterimTranscript(finalText, interimText);

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";

    if (!combined) {
  setVoiceUi("idle");
  setToast(t("לא נקלט קול - נסה שוב"));
  return;
}

if (isClearListCommand(combined, lang)) {
  await clearListServer();
  setVoiceDraft("");
  setVoiceUi("idle");
  setToast(t("הרשימה נמחקה"));
  return;
}

const normalizedCmd = combined
  .toLowerCase()
  .replace(/\b(the|my|a)\b/g, "")
  .replace(/\s+/g, " ")
  .trim();

if (
  normalizedCmd.includes("clear list") ||
  normalizedCmd.includes("delete list") ||
  normalizedCmd.includes("מחק רשימה") ||
  normalizedCmd.includes("רק רשימה") ||
  normalizedCmd.includes("מרחק רשימה") ||
  normalizedCmd === "רשימה"
) {
  await clearListServer();

  setVoiceDraft("");
  setVoiceUi("idle");
  nativeFinalizeRef.current = false;
  setToast(t("הרשימה נמחקה"));
  return;
}

if (
  normalizedCmd.includes("clear list") ||
  normalizedCmd.includes("delete list") ||
  normalizedCmd.includes("מחק רשימה") ||
  normalizedCmd.includes("רק רשימה") ||
  normalizedCmd.includes("מרחק רשימה") ||
  normalizedCmd === "רשימה"
) {
  await clearListServer();

  setVoiceDraft("");
  setVoiceUi("idle");
  nativeFinalizeRef.current = false;
  setToast(t("הרשימה נמחקה"));
  return;
}

setVoiceDraft(
  cleanVoiceReviewText(formatDraftForReview(combined, lang, voiceExtraTerms))
);
setVoiceUi("review");
};

  const confirmVoiceDraft = async () => {
    const draft = voiceDraft.trim();
    if (!draft) {
      setVoiceUi("idle");
      return;
    }

    setVoiceUi("processing");

    try {
      const actions = await executeVoiceTextWithUndo(draft);

      setVoiceUi("idle");
      setVoiceDraft("");

      // Undo (3 seconds) - only when we have reversible actions (add items path)
      if (actions.length > 0) {
        if (undoToastTimerRef.current != null) window.clearTimeout(undoToastTimerRef.current);

        setUndoToast({
          msg: t(t("בוצע. ניתן לבטל למשך 3 שניות")),
          undoLabel: t("בטל"),
          onUndo: async () => {
            await runUndoActions(actions);
            setUndoToast(null);
            if (undoToastTimerRef.current != null) window.clearTimeout(undoToastTimerRef.current);
            undoToastTimerRef.current = null;
            setToast(t("בוטל"));
          },
        });

        undoToastTimerRef.current = window.setTimeout(() => {
          setUndoToast(null);
          undoToastTimerRef.current = null;
        }, 3000);
      } else {
        // For non-undoable voice actions
        setToast(t("בוצע"));
      }
    } catch (e: any) {
      console.error(e);
      setVoiceUi("idle");
      setToast(`${t("שגיאה")}: ${String(e?.message || e || "")}`);
    }
  };

  const cancelVoiceDraft = () => {
    setVoiceDraft("");
    setVoiceUi("idle");
  };

  const startHoldListening = () => {
    const SR = ensureSpeechRecognition();
    if (!SR) {
      alert(t("הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge."));
      return;
    }

    if (!user) {
      setToast(t("צריך להתחבר לפני פקודות קוליות"));
      signInSmart();
      return;
    }

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";
    startGuardRef.current = false;

    holdActiveRef.current = true;
    setLastHeard("");
    setIsListening(true);
    setToast(t("דבר עכשיו - שחרר כדי לבצע"));

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

  const rec = new SR();
recognitionRef.current = rec;

rec.lang = speechLang;
rec.interimResults = true;
rec.maxAlternatives = 1;
rec.continuous = true;

let silenceTimer: number | null = null;
let sessionTimer: number | null = null;
let hadAnyResult = false;
let lastResultAt = Date.now();

const clearLocalTimers = () => {
  if (silenceTimer != null) {
    window.clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (sessionTimer != null) {
    window.clearTimeout(sessionTimer);
    sessionTimer = null;
  }
};

    // Clear timers related to voice UI (e.g. auto-clear of "שמענו")
    const clearVoiceTimers = () => {
      if (heardClearTimerRef.current != null) {
        window.clearTimeout(heardClearTimerRef.current);
        heardClearTimerRef.current = null;
      }
    };

    const scheduleSilenceStop = () => {
  if (!holdActiveRef.current) return;
  if (!hadAnyResult) return;

  if (silenceTimer != null) window.clearTimeout(silenceTimer);

  const silenceMs = lang === "en" ? SILENCE_MS_EN : SILENCE_MS_HE;

  silenceTimer = window.setTimeout(() => {
    if (!holdActiveRef.current) return;
    const dt = Date.now() - lastResultAt;
    if (dt >= silenceMs) stopHoldListening();
  }, silenceMs + 50);
};

    sessionTimer = window.setTimeout(() => {
      if (!holdActiveRef.current) return;
      setToast(t("עוצר בגלל משפט ארוך מדי - מבצע..."));
      stopHoldListening();
    }, MAX_SESSION_MS);

    rec.onstart = () => {
      // לא חובה, אבל נוח לדיבוג
      // console.log("SR_START");
    };

    rec.onaudiostart = () => {
      // console.log("AUDIO_START");
    };

    rec.onspeechstart = () => {
      // console.log("SPEECH_START");
    };

    rec.onresult = (event: any) => {
      try {
        let interimCombined = "";
        const results = (event as any).results;
        if (!results) return;
        for (let i = (event as any).resultIndex ?? 0; i < (results?.length ?? 0); i++) {
          const r = results[i];
          const best = r?.[0];
          let transcript = normalizeVoiceText(String(best?.transcript || ""));
          transcript = removeStopWords(transcript, lang);
          if (!transcript) continue;
          hadAnyResult = true;
          lastResultAt = Date.now();

          if (r.isFinal) {
            transcriptBufferRef.current[i] = transcript;
            lastInterimRef.current = "";
          } else {
            interimCombined = transcript;
            lastInterimRef.current = transcript;
          }
        }

        const last =
  interimCombined ||
  (transcriptBufferRef.current.length
    ? transcriptBufferRef.current[transcriptBufferRef.current.length - 1]
    : "");

if (last) setLastHeard(cleanVoicePreviewText(last));

} catch (e) {
  // ignore
}
};

    rec.onerror = (e: any) => {
      const err = String(e?.error || "");
      console.warn("Speech error:", err, e);

      // no-speech בדסקטופ הוא מצב נפוץ - לא מפסיקים את ההאזנה
      if (err === "no-speech") {
        // no-speech is common in Chrome desktop - ignore without user toast
        return;
      }

      clearLocalTimers();
      clearVoiceTimers();
      setIsListening(false);
      holdActiveRef.current = false;

      if (err === "not-allowed" || err === "service-not-allowed") {
        alert(t("אין הרשאה למיקרופון. אשר הרשאה ואז נסה שוב."));
      } else if (err === "audio-capture") {
        setToast(t("המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)"));
      } else if (err === "network" || err === "network-error" || !isOnline) {
        setToast(t("זיהוי קולי דורש חיבור לאינטרנט"));
      } else {
        setToast(`שגיאת מיקרופון: ${err || "unknown"}`);
      }
    };

    rec.onend = () => {
      // Chrome לפעמים עוצר לבד. אם עדיין במצב “רציף”, נרים מחדש
      if (!holdActiveRef.current) {
        clearLocalTimers();
        return;
      }

      scheduleSilenceStop();

      if (startGuardRef.current) return;
      startGuardRef.current = true;

      setTimeout(() => {
        if (!holdActiveRef.current) {
          startGuardRef.current = false;
          clearLocalTimers();
          return;
        }
        try {
          rec.start();
        } catch (e) {
          // ignore
        } finally {
          startGuardRef.current = false;
        }
      }, 40);
    };

    try {
      rec.start();
      scheduleSilenceStop();
    } catch (e) {
      console.error(e);
      clearLocalTimers();
      clearVoiceTimers();
      setIsListening(false);
      holdActiveRef.current = false;
      setToast(t("לא הצלחתי להתחיל האזנה"));
    }
  };

    const stopHoldListening = async () => {
    if (!holdActiveRef.current) return;

    holdActiveRef.current = false;
    setIsListening(false);

    try {
      recognitionRef.current?.stop?.();
    } catch (e) {
    // ignore
  }

    // חשוב: מחברים Final + Interim יחד
    // זה מונע מצב כמו: "שתי" ב-final ו-"מלפפונים" ב-interim שנדבקים בטעות לפריט קודם
  const finalText = transcriptBufferRef.current.filter(Boolean).join(" ").trim();
const interimText = (lastInterimRef.current || "").trim();
const combined = mergeFinalAndInterimTranscript(finalText, interimText);

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";

    if (!combined) {
      setToast(t("לא נקלט קול - נסה שוב"));
      return;
    }

    setToast(t("מבצע..."));
    try {
      await executeVoiceText(combined);
    } catch (e: any) {
      console.error(e);
      setToast(`${t("שגיאה")}: ${String(e?.message || e || "")}`);
    }
  };
    async function leaveSharedList() {
  try {
    if (!user || !list?.id) return;

    const leavingListId = list.id;
    const ref = doc(db, "lists", leavingListId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    const sharedWith = Array.isArray(data.sharedWith) ? data.sharedWith : [];

    const updated = sharedWith.filter((uid: string) => uid !== user.uid);

    await updateDoc(ref, {
      sharedWith: updated,
    });

    // נקה מצב מקומי של הרשימה שממנה יצאנו
    if (localStorage.getItem("activeListId") === leavingListId) {
      localStorage.removeItem("activeListId");
    }
    setList(null);
    setItems([]);
    setFavorites([]);

    // טען מחדש את כל הרשימות שעוד שייכות למשתמש
    const q = query(collection(db, "lists"), where("sharedWith", "array-contains", user.uid));
    const listsSnap = await getDocs(q);

    if (listsSnap.empty) {
      const newListRef = doc(collection(db, "lists"));
      const newList: ShoppingList = {
        id: newListRef.id,
        title: "My Easy List",
        ownerUid: user.uid,
        sharedWith: [user.uid],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(newListRef, newList);
      setList(newList);
      localStorage.setItem("activeListId", newListRef.id);
    } else {
      const nextDoc = listsSnap.docs[0];
      const nextList = { ...(nextDoc.data() as ShoppingList), id: nextDoc.id };
      setList(nextList);
      localStorage.setItem("activeListId", nextDoc.id);
    }

  setToast(t("הוסרת מהרשימה"));
  } catch (e) {
    console.error("leaveSharedList error", e);
  }
}

async function removeSharedUser(targetUid: string) {
  try {
    if (!user || !list?.id) return;
    if (user.uid !== list.ownerUid) return;
    if (!targetUid) return;
    if (targetUid === list.ownerUid) return;

    const ok = window.confirm(t("האם לנתק משתמש מהרשימה?"));
    if (!ok) return;

    const ref = doc(db, "lists", list.id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data() as any;
    const sharedWith = Array.isArray(data.sharedWith) ? data.sharedWith : [];
    const updated = sharedWith.filter((uid: string) => uid !== targetUid);

    await updateDoc(ref, {
      sharedWith: updated,
      [`participantProfiles.${targetUid}`]: deleteField(),
      updatedAt: Date.now(),
    });

    setToast(t("בוצע"));
  } catch (e) {
    console.error("removeSharedUser error", e);
    setToast(t("שגיאה"));
  }
}

  useEffect(() => {
    return () => {
      try {
        holdActiveRef.current = false;
        tapActiveRef.current = false;
        nativeRestartRequestedRef.current = false;
        recognitionRef.current?.stop?.();
      } catch (e) {
        // ignore
      }
      if (isNativeSpeechMode()) {
        void SpeechRecognition.removeAllListeners().catch(() => {});
        void SpeechRecognition.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const onDocPointerDown_shareMenu = (e: PointerEvent) => {
      if (!shareMenuOpen) return;
      const menuEl = shareMenuElRef.current;
      const btnEl = shareBtnRef.current;
      const target = e.target as Node | null;
      if (target && menuEl && menuEl.contains(target)) return;
      if (target && btnEl && btnEl.contains(target)) return;
      setShareMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown_shareMenu);
    return () => document.removeEventListener("pointerdown", onDocPointerDown_shareMenu);
  }, [shareMenuOpen]);

  useEffect(() => {
    const onDocPointerDown_moreMenu = (e: PointerEvent) => {
      if (!moreMenuOpen) return;
      const menuEl = moreMenuElRef.current;
      const btnEl = moreBtnRef.current;
      const target = e.target as Node | null;
      if (target && menuEl && menuEl.contains(target)) return;
      if (target && btnEl && btnEl.contains(target)) return;
      setMoreMenuOpen(false);
      setMoreMenuView("main");
    };
    document.addEventListener("pointerdown", onDocPointerDown_moreMenu);
    return () => document.removeEventListener("pointerdown", onDocPointerDown_moreMenu);
  }, [moreMenuOpen]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl"
           style={{ fontFamily: 'Segoe UI, system-ui, -apple-system, "Heebo", "Rubik", Arial' }}>
        <div className="flex flex-col items-center gap-3 opacity-70">
          <Loader2 className="w-10 h-10 animate-spin" />
          <div className="font-bold text-slate-500">...Loading</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 text-center">
          <div className="flex justify-center">
            <img
              src={appLogo}
              alt="My Easy List"
              className="w-24 h-24 object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-800">{t("הרשימה שלי: חכמה")}</h1>
          <p className="text-slate-500 font-bold">{t("כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.")}</p>
          <button
            onClick={async () => {
  try {
    const ok = await signInSmart();
    if (!ok) {
      return;
    }
  } catch (e) {
    console.error(e);
  }
}}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black"
          >
            <LogIn className="w-4 h-4" />
            {t("התחבר עם גוגל")}
          </button>
          <LegalFooter lang={lang} className="pt-1" />
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (listLoading || !list?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }




const DogEarBadge: React.FC<{
  itemId: string;
  mode: "added" | "purchased";
  name?: string;
  initial?: string;
}> = ({ itemId, mode, name, initial }) => {
  if (!isSharedList) return null;

  const safeName = String(name || "").trim();
  const safeInitial = String(initial || "").trim();
  const seed = safeName || safeInitial;

  if (!seed) return null;

  const targetUid =
  mode === "added"
    ? items.find((x) => x.id === itemId)?.addedByUid
    : items.find((x) => x.id === itemId)?.purchasedByUid;

const earColor =
  (targetUid && sharedUserColorMap[targetUid]) || PASTEL_COLORS[0];

  const label = buildCreatorLabel(lang, mode, safeName);

  const isOpen = creatorHintOpenId === itemId;

  return (
   <div
  className={`absolute -top-[3px] ${isRTL ? "-left-[3px]" : "-right-[3px]"} z-20`}
  data-noswipe="true"
>
      <button
        type="button"
       onClick={(e) => {
  e.stopPropagation();

  setCreatorHintOpenId(itemId);

  if (creatorHintTimerRef.current != null) {
    window.clearTimeout(creatorHintTimerRef.current);
  }

  creatorHintTimerRef.current = window.setTimeout(() => {
    setCreatorHintOpenId((current) => (current === itemId ? null : current));
    creatorHintTimerRef.current = null;
  }, 2000);
}}
        title={label}
        aria-label={label}
        className="relative block w-6 h-7 active:scale-90 transition-transform duration-150"
style={{
  touchAction: "manipulation",
  transform: isRTL ? "rotate(-49deg)" : "rotate(49deg)",
}}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" className="block">
  <path
    d="M 2 17 A 12 12 0 0 1 29 14 A 16 16 0 0 0 2 14 Z"
    fill={earColor}
  />
</svg>
      </button>

   {isOpen ? (
  <div
    className={`absolute top-[26px] ${
      isRTL ? "left-0" : "right-0"
    } whitespace-nowrap rounded-md bg-[#333] text-white text-[11px] px-2.5 py-1 shadow-lg z-30`}
    dir={isRTL ? "rtl" : "ltr"}
  >
    {label}

    <div
      className={`absolute -top-1 ${
        isRTL ? "left-2" : "right-2"
      } w-2 h-2 bg-[#333] rotate-[30deg]`}
    />
  </div>
) : null}
    </div>
  );
};
  
  return (
    <div
  ref={appRootRef}
  className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 relative pb-44 shadow-2xl overflow-visible"
  dir={isRTL ? "rtl" : "ltr"}
  style={{ fontFamily: 'Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif' }}
>
    <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      {/* Sticky top chrome */}
      <div
        className="sticky top-0 z-40 bg-slate-50"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
  {/* Header */}
<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100">
  <div className="relative flex items-center justify-between gap-2 min-h-[44px]">
    {/* Left: More */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        ref={moreBtnRef}
        type="button"
        onClick={toggleMoreMenu}
        style={{ touchAction: "manipulation" }}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-transform"
        aria-label="Menu"
        title="Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>

 {/* Center title */}
<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
  <div className="flex items-center gap-2">
    <img
      src={appLogo}
      alt="My Easy List"
      className="w-8 h-8 object-contain shrink-0"
    />
    <span className="text-lg font-bold text-indigo-600 whitespace-nowrap">
      My Easy List
    </span>
  </div>
</div>

{/* Avatars (separate layer) */}
{headerSharedUsersPreview.length > 0 ? (
  <div
    onClick={toggleShareMenu}
    className="absolute left-1/2 top-[calc(50%+18px)] -translate-x-1/2 flex items-center justify-center cursor-pointer"
    title={t("שיתוף")}
    aria-label={t("שיתוף")}
  >
    <HeaderUsersPreview
      users={headerSharedUsersPreview}
      isOwner={user?.uid === list?.ownerUid}
      ownerUid={list?.ownerUid}
      currentUid={user?.uid}
      onRemoveUser={removeSharedUser}
      t={t}
    />
  </div>
) : null}

    {/* Right: Share */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        ref={shareBtnRef}
        type="button"
        onClick={toggleShareMenu}
        style={{ touchAction: "manipulation" }}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-transform"
        title={t("שיתוף")}
        aria-label={t("שיתוף")}
      >
        {isCopied ? (
          <Check className="w-5 h-5 text-emerald-500" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </button>
    </div>
  </div>

  {/* Share menu */}
  {shareMenuOpen && shareMenuPos ? createPortal(
    (
<div
      ref={shareMenuElRef}
      className="fixed z-[100] w-[260px] max-w-[calc(100%-20px)] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden text-[15px] leading-tight"
      style={{ top: shareMenuPos.top, left: shareMenuPos.left, maxWidth: shareMenuPos.maxWidth }}
    >
      <button
  type="button"
  onClick={() => {
    setShareMenuOpen(false);
    shareListWhatsApp();
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <MessageCircle className="w-4 h-4 text-green-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none">
    {t("וואטסאפ")}
  </span>
</button>

     <button
  type="button"
  onClick={async () => {
    setShareMenuOpen(false);
    await shareInviteLinkSystem();
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Share2 className="w-4 h-4 text-amber-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none">
    {t("הזמן חברים לרשימה")}
  </span>
</button>

      <button
  type="button"
  onClick={async () => {
    const canLeave = !!(user && list?.ownerUid && user.uid !== list.ownerUid);
    setShareMenuOpen(false);
    if (!canLeave) {
      setToast(t("אפשר להתנתק רק מרשימה משותפת שאינך הבעלים שלה"));
      return;
    }
    const ok = window.confirm(`${t("התנתק מרשימת קניות משותפת")} ?`);
    if (!ok) return;
    await leaveSharedList();
  }}
  className={`w-full py-3 flex items-center gap-3 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  } ${
    user && list?.ownerUid && user.uid !== list.ownerUid
      ? "text-rose-700 hover:bg-rose-50"
      : "text-slate-400 cursor-not-allowed"
  }`}
>
  <LogOut
    className={`w-4 h-4 shrink-0 ${
      user && list?.ownerUid && user.uid !== list.ownerUid
        ? "text-rose-600"
        : "text-slate-400"
    }`}
  />
  <span className="font-semibold text-[15px] leading-none">
    {t("התנתק מרשימת קניות משותפת")}
  </span>
</button>
    </div>
    ),
    document.body
  ) : null}
{/* More menu */}
  {moreMenuOpen && moreMenuPos ? createPortal(
    (
<div
      ref={moreMenuElRef}
      className="fixed z-[100] w-[300px] max-w-[calc(100%-20px)] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden text-[15px] leading-tight"
      style={{ top: moreMenuPos.top, left: moreMenuPos.left, maxWidth: moreMenuPos.maxWidth }}
    >
      {moreMenuView === "main" ? (
        <>
          <button
  type="button"
  onClick={() => setMoreMenuView("language")}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Languages className="w-4 h-4 text-sky-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("שפה")}
  </span>
</button>

            <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    void openNativeCalendar();
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("צור תזכורת ביומן")}
  </span>
</button>
          <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    setShowClearConfirm(true);
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("נקה רשימה")}
  </span>
</button>

          <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    openExternalUrl(buildLegalUrl("privacy"));
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("Privacy Policy")}
  </span>
</button>

          <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    openExternalUrl(buildLegalUrl("terms"));
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("Terms & Conditions")}
  </span>
</button>

<div className="h-px bg-slate-100" />

        
          <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    void signOutSmart();
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <LogOut className="w-4 h-4 text-amber-500 shrink-0" />
  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("יציאה")}
  </span>
</button>
        </>
      ) : (
        <>
          {([
            { code: "he" as AppLang, label: "עברית" },
            { code: "en" as AppLang, label: "English" },
            { code: "ru" as AppLang, label: "Русский" },
            { code: "ar" as AppLang, label: "العربية" },
          ] as const).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                setLang(opt.code);
                setMoreMenuOpen(false);
                setMoreMenuView("main");
              }}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 ${
                lang === opt.code ? "font-black text-slate-900" : "font-bold text-slate-600"
              }`}
            >
              <span>{opt.label}</span>
              {lang === opt.code ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : null}
            </button>
          ))}
        </>
      )}
    </div>
    ),
    document.body
  ) : null}
</header>

{deleteCategoryConfirm ? createPortal(
  (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200">
        <div className={`text-lg font-black text-slate-800 ${isRTL ? "text-right" : "text-left"}`}>
          {t("מחק קטגוריה")}
        </div>

        <div className={`mt-3 text-sm font-bold text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>
        {t("האם למחוק את הקטגוריה").replace("{name}", deleteCategoryConfirm || "")}
        </div>

        <div className={`mt-2 text-sm text-slate-500 leading-6 ${isRTL ? "text-right" : "text-left"}`}>
          {t("קטגוריה זו תוסר וכל הפריטים שבה יעברו לקטגוריה אחר")}
        </div>

        <div className={`mt-5 flex gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <button
            type="button"
            onClick={() => setDeleteCategoryConfirm(null)}
            className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700"
          >
            {t("ביטול")}
          </button>

          <button
            type="button"
            onClick={async () => {
              const categoryToDelete = deleteCategoryConfirm;
              setDeleteCategoryConfirm(null);
              if (!categoryToDelete) return;
              await deleteCustomCategory(categoryToDelete);
            }}
            className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white"
          >
           {t("נתק משתמש")}
          </button>
        </div>
      </div>
    </div>
  ),
  document.body
) : null}

        {/* Voice hint */}
{(voiceUi === "recording" || voiceUi === "processing" || !!lastHeard) ? (
  <div className="px-5 pt-3">
    <div
      className={`bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm ${
        isRTL ? "text-right" : "text-left"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="text-[11px] font-black text-slate-400">
        {voiceUi === "recording"
          ? t("מקשיב עכשיו - דבר ושחרר כדי לבצע")
          : voiceUi === "processing"
          ? t("מעבד")
          : t("שמענו:")}
      </div>

      {lastHeard ? (
  <div
    className={`text-sm font-bold text-slate-700 mt-1 ${isRTL ? "text-right" : "text-left"}`}
    style={{ direction: isRTL ? "rtl" : "ltr", unicodeBidi: "plaintext" }}
  >
    {t("שמענו:")} {cleanVoicePreviewText(lastHeard)}
  </div>
) : null}

      
    </div>
  </div>
) : null}

      </div>

      {/* Content */}
      <main className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
{activeTab === "list" ? (
  <>
    <form onSubmit={addItem} className="relative">
      <input
        ref={inputRef}
        value={inputValue}
        onFocus={openSuggestions}
        onBlur={closeSuggestionsSoon}
        onKeyDown={(e) => {
          if (!isSuggestOpen) return;

          if (e.key === "Escape") {
            e.preventDefault();
            setIsSuggestOpen(false);
            setActiveSuggestIndex(-1);
            return;
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (visibleSuggestionList.length === 0) return;
            setActiveSuggestIndex((prev) => {
              const next = prev + 1;
              return next >= visibleSuggestionList.length ? 0 : next;
            });
            return;
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (visibleSuggestionList.length === 0) return;
            setActiveSuggestIndex((prev) => {
              const next = prev - 1;
              return next < 0 ? visibleSuggestionList.length - 1 : next;
            });
            return;
          }

          if (e.key === "Tab") {
            if (visibleSuggestionList.length === 0) return;
            e.preventDefault();
            applySuggestion(
              visibleSuggestionList[Math.max(0, activeSuggestIndex >= 0 ? activeSuggestIndex : 0)]
            );
            return;
          }

          if (e.key === "Enter") {
            if (visibleSuggestionList.length > 0) {
              e.preventDefault();
              const idx = activeSuggestIndex >= 0 ? activeSuggestIndex : 0;
              applySuggestion(visibleSuggestionList[idx]);
              return;
            }
          }
        }}
        onChange={(e) => {
          setInputValue(e.target.value);
          openSuggestions();
          setActiveSuggestIndex(-1);
        }}
        placeholder={t("מה להוסיף לרשימה?")}
        className={`w-full py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-white ${
          isRTL
            ? "pr-[20px] pl-14 text-right placeholder:text-right"
            : "pl-[20px] pr-14 text-left placeholder:text-left"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      />

      <button
        type="submit"
        className={`absolute top-2.5 ${
          isRTL ? "left-2.5" : "right-2.5"
        } bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-all`}
        title="הוסף"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isSuggestOpen && inputValue.trim() && visibleSuggestionList.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto overscroll-contain touch-pan-y"
          dir={isRTL ? "rtl" : "ltr"}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          {visibleSuggestionList.map((s, idx) => (
            <div
              key={s.key + "-" + idx}
              className={
                "w-full flex items-stretch justify-between gap-2 hover:bg-slate-50 transition-colors " +
                (idx === activeSuggestIndex ? "bg-slate-100" : "")
              }
            >
              <button
                type="button"
                className={`flex-1 ${isRTL ? "text-right" : "text-left"} px-4 py-3 flex items-center justify-between`}
                onClick={() => {
                  void applySuggestion(s);
                }}
                title="השלמה"
              >
                <span className="font-semibold text-slate-700">{s.name}</span>

                {s.isInList ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {translate(lang, "ברשימה")}
                    {typeof s.currentQty === "number" ? ` (${s.currentQty})` : ""}
                  </span>
                ) : null}
              </button>

              {s.canHide ? (
                <button
                  type="button"
                  className="px-3 text-slate-400 hover:text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    hideSuggestion(s);
                  }}
                  title="הסר מההשלמות"
                  aria-label="הסר מההשלמות"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </form>

    {(items?.length ?? 0) === 0 ? (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-full max-w-[260px]">
          <img
            src={appLogo}
            alt="My Easy List"
            className="w-40 h-40 mx-auto object-contain opacity-95 drop-shadow-sm animate-[floatY_3.6s_ease-in-out_infinite]"
          />
          <p className="mt-5 text-2xl font-black text-slate-400">{t("הרשימה שלך עדיין ריקה")}</p>
          <p className="mt-2 text-base font-bold text-slate-400 leading-relaxed px-3 break-words">
            {t("בוא נתחיל להוסיף מוצרים לקניות 🛒")}
          </p>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="space-y-3">
          {allCategoryOptions.map((categoryKey) => {
            const categoryItems = groupedActiveItems[categoryKey];
            if (!categoryItems?.length) return null;

            return (
              <div key={categoryKey} className="space-y-3">
                <div className="px-1 pt-2">
                  <h3 className={`text-sm font-black text-slate-400 ${isRTL ? "text-right" : "text-left"}`}>
                    {categoryLabelByLang[lang]?.[categoryKey as CategoryKey] ||
                      categoryLabelByLang.he[categoryKey as CategoryKey] ||
                      categoryKey}
                  </h3>
                </div>

                {categoryItems.map((item) => {
                  const isCategoryOpen = categorySheetOpen && categorySheetItem?.id === item.id;

                  const isHintItem = showInitialSwipeHint && activeItems[0]?.id === item.id;
                  const hintDx = isHintItem
                    ? hintPhase === 1
                      ? isRTL
                        ? 50
                        : -50
                      : hintPhase === 2
                        ? isRTL
                          ? -50
                          : 50
                        : 0
                    : 0;

                  const effectiveDx = swipeUi.id === item.id ? swipeUi.dx : hintDx;

                  const revealDelete = isRTL ? effectiveDx > 0 : effectiveDx < 0;
                  const revealFavorite = isRTL ? effectiveDx < 0 : effectiveDx > 0;

                  return (
                    <div
                      key={item.id}
                      className={`relative overflow-visible rounded-2xl border border-slate-100 shadow-sm select-none transition-all duration-200 ease-out ${
                        leavingIds.has(item.id)
                          ? "opacity-0 translate-y-1 scale-[0.99] pointer-events-none"
                          : enterAnim[item.id] === "from"
                            ? "opacity-0 translate-y-1 scale-[0.99]"
                            : "opacity-100 translate-y-0 scale-100"
                      }`}
                      dir="rtl"
                      onPointerDown={(e) => {
                      pointerLongPressStartRef.current = { x: e.clientX, y: e.clientY };
                      onSwipePointerDown(item.id)(e);
                      startItemLongPress(item, e)();
                    }}
                      onPointerMove={(e) => {
                        

                        const s = pointerLongPressStartRef.current;
                        if (s) {
                          const dx = Math.abs(e.clientX - s.x);
                          const dy = Math.abs(e.clientY - s.y);

                          if (dx > POINTER_LONG_PRESS_MOVE_TOLERANCE || dy > POINTER_LONG_PRESS_MOVE_TOLERANCE) {
                            clearItemLongPress();
                          }
                        }

                        onSwipePointerMove(item.id)(e);
                      }}
                      onPointerUp={(e) => {
                        pointerLongPressStartRef.current = null;
                        onSwipePointerUp(item.id)(e);
                        clearItemLongPress();
                      }}
                      onPointerCancel={() => {
                        pointerLongPressStartRef.current = null;
                        onSwipePointerCancel();
                        clearItemLongPress();
                      }}
                      onPointerLeave={() => {
                        pointerLongPressStartRef.current = null;
                        clearItemLongPress();
                      }}
                      onTouchStart={(e) => {
                        

                        const t0 = e.touches[0];
                        touchLongPressStartRef.current = t0 ? { x: t0.clientX, y: t0.clientY } : null;

                        onSwipeTouchStart(item.id)(e);
                        startItemLongPress(item, e)();
                      }}
                      onTouchMove={(e) => {
                        

                        const t0 = e.touches[0];
                        const s = touchLongPressStartRef.current;

                        if (t0 && s) {
                          const dx = Math.abs(t0.clientX - s.x);
                          const dy = Math.abs(t0.clientY - s.y);

                          if (dx > TOUCH_LONG_PRESS_MOVE_TOLERANCE || dy > TOUCH_LONG_PRESS_MOVE_TOLERANCE) {
                            clearItemLongPress();
                          }
                        }

                        onSwipeTouchMove(item.id)(e);
                      }}
                      onTouchEnd={(e) => {
                        touchLongPressStartRef.current = null;
                        onSwipeTouchEnd(item.id)(e);
                        clearItemLongPress();
                      }}
                      onTouchCancel={() => {
                        touchLongPressStartRef.current = null;
                        clearItemLongPress();
                      }}
                      style={{ touchAction: "pan-y" }}
                    >
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <div
                          className={`absolute top-0 bottom-0 bg-rose-50 ${isRTL ? "left-0" : "right-0"}`}
                          style={{
                            width: revealDelete ? Math.min(Math.abs(effectiveDx), SWIPE_MAX_SHIFT_PX) : 0,
                            opacity: 0.9,
                            zIndex: 0,
                          }}
                        />
                        <div
                          className={`absolute top-0 bottom-0 bg-emerald-50 ${isRTL ? "right-0" : "left-0"}`}
                          style={{
                            width: revealFavorite ? Math.min(Math.abs(effectiveDx), SWIPE_MAX_SHIFT_PX) : 0,
                            opacity: 0.9,
                            zIndex: 0,
                          }}
                        />

                        <div
                          className={`absolute inset-0 flex items-center justify-between px-4 ${
                            isRTL ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className="text-rose-600"
                            style={{
                              zIndex: 2,
                              opacity: revealDelete
                                ? Math.abs(effectiveDx) >= SWIPE_THRESHOLD_PX
                                  ? 1
                                  : 0.65
                                : 0,
                              transform:
                                revealDelete && Math.abs(effectiveDx) >= SWIPE_THRESHOLD_PX
                                  ? "scale(1.15)"
                                  : "scale(1)",
                              transition: "transform 120ms ease, opacity 120ms ease",
                            }}
                          >
                            <Trash2 className="w-6 h-6" />
                          </div>

                          <div
                            className="text-emerald-600"
                            style={{
                              zIndex: 2,
                              opacity: revealFavorite
                                ? Math.abs(effectiveDx) >= SWIPE_THRESHOLD_PX
                                  ? 1
                                  : 0.65
                                : 0,
                              transform:
                                revealFavorite && Math.abs(effectiveDx) >= SWIPE_THRESHOLD_PX
                                  ? "scale(1.15)"
                                  : "scale(1)",
                              transition: "transform 120ms ease, opacity 120ms ease",
                            }}
                          >
                            <Star className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      <div
                        className={`relative z-10 flex items-center justify-between w-full px-3 pt-2 pb-3 rounded-2xl transition-colors ${
                          deleteFlashIds.has(item.id)
                            ? "bg-rose-50"
                            : favoriteFlashIds.has(item.id)
                              ? "bg-emerald-100"
                              : listFlashIds.has(item.id)
                                ? "bg-emerald-50"
                                : "bg-white"
                        }`}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={{
                          transform: `translateX(${effectiveDx}px)`,
                          transition: swipeUi.id === item.id ? "none" : "transform 260ms ease",
                        }}
                      >
                        <div
  className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"} font-bold text-slate-700 cursor-pointer px-3`}
  style={{ direction: isRTL ? "rtl" : "ltr", unicodeBidi: "plaintext" }}
 onClick={() => {
  if (swipeConsumedRef.current) return;
  if (deleteFlashIds.has(item.id)) return;

  if (longPressTriggeredRef.current) {
    longPressTriggeredRef.current = false;
    return;
  }

  if (categorySheetOpen && categorySheetItem?.id === item.id) {
    closeCategorySheet();
    return;
  }

  markPurchasedWithAnimation(item.id);
}}
>
  {isCategoryOpen && editingCategoryItemId === item.id ? (
    <input
      autoFocus
      value={editingCategoryText}
      onChange={(e) => setEditingCategoryText(e.target.value)}
      onBlur={() => saveCategoryItemName(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          saveCategoryItemName(item.id);
        }
      }}
      className={`w-full text-sm font-bold outline-none bg-white border border-indigo-200 rounded-xl px-2 py-1 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
        <div className={!isCategoryOpen ? "truncate" : "min-w-0"}>
        {item.name}
    </div>
  )}
</div>

                  {isCategoryOpen ? (
  editingCategoryItemId === item.id &&
  editingCategoryText.trim() !== item.name.trim() ? (
    <button
      type="button"
      data-noswipe="true"
      onClick={() => saveCategoryItemName(item.id)}
      className="p-2 text-emerald-600 hover:text-emerald-700"
    >
      <Check className="w-4 h-4" />
    </button>
  ) : (
    <button
      type="button"
      data-noswipe="true"
      onClick={() => {
        setEditingCategoryItemId(item.id);
        setEditingCategoryText(item.name);
      }}
      className="p-2 text-slate-400 hover:text-indigo-600"
    >
      <Pencil className="w-4 h-4" />
    </button>
  )
) : (
        <div className="shrink-0 flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
        <button
      disabled={leavingIds.has(item.id) || deleteFlashIds.has(item.id)}
      onClick={() => updateQty(item.id, -1)}
      className={`p-1 text-slate-400 ${
        leavingIds.has(item.id) || deleteFlashIds.has(item.id)
          ? "opacity-40 cursor-not-allowed"
          : ""
      }`}
      data-noswipe="true"
    >
      <Minus className="w-3 h-3" />
    </button>

    <span className="min-w-[2rem] text-center font-black text-slate-700">
      {formatItemQuantity(item.quantity)}
    </span>

    <button
      disabled={leavingIds.has(item.id) || deleteFlashIds.has(item.id)}
      onClick={() => updateQty(item.id, 1)}
      className={`p-1 text-slate-400 ${
        leavingIds.has(item.id) || deleteFlashIds.has(item.id)
          ? "opacity-40 cursor-not-allowed"
          : ""
      }`}
      data-noswipe="true"
    >
      <Plus className="w-3 h-3" />
    </button>
  </div>
)}

                        <DogEarBadge
                          itemId={item.id}
                          mode="added"
                          name={item.addedByName}
                          initial={item.addedByInitial}
                        />
                      </div>

                      {isCategoryOpen ? (
                        <div
                          className="border-t-2 border-indigo-200 bg-indigo-50/60 rounded-b-2xl shadow-inner ring-1 ring-indigo-200 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
  
                          <div className={`text-sm font-black text-slate-700 mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                            {t("העבר לקטגוריה")}
                          </div>

                          <div className="px-4 pb-2">
                            <div className="space-y-2">
                              {allCategoryOptions.map((cat) => {
                                const isBuiltInCategory = CATEGORY_ORDER.includes(cat as CategoryKey);
                                const isCustomCategory = !isBuiltInCategory;
                                const isEditingThisCategory = editingCustomCategory === cat;

                                return (
                                  <div key={cat} className="space-y-2">
                                    {isEditingThisCategory ? (
                                      <div
                                        className="w-full px-3 py-3 rounded-2xl border border-indigo-200 bg-white space-y-3"
                                        data-noswipe="true"
                                      >
                                        <input
                                          autoFocus
                                          value={editingCustomCategoryValue}
                                          onChange={(e) => setEditingCustomCategoryValue(e.target.value)}
                                          placeholder={t("שם קטגוריה")}
                                          className={`w-full border rounded-xl px-3 py-3 text-sm ${
                                            isRTL ? "text-right" : "text-left"
                                          }`}
                                          dir={isRTL ? "rtl" : "ltr"}
                                        />

                                        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                                          <button
                                            type="button"
                                            data-noswipe="true"
                                            onClick={async () => {
                                              const nextName = editingCustomCategoryValue.trim();
                                              if (!nextName) return;
                                              await renameCustomCategory(cat, nextName);
                                            }}
                                            className="flex-1 py-2 rounded-xl font-bold bg-emerald-500 text-white"
                                          >
                                            {t("שמור")}
                                          </button>

                                          <button
                                            type="button"
                                            data-noswipe="true"
                                            onClick={() => {
                                              setEditingCustomCategory(null);
                                              setEditingCustomCategoryValue("");
                                            }}
                                            className="flex-1 py-2 rounded-xl font-bold bg-slate-100 text-slate-600"
                                          >
                                            {t("ביטול")}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className={`w-full px-4 py-3 rounded-2xl border flex items-center gap-3 ${
                                          isRTL
                                            ? "flex-row justify-between text-right"
                                            : "flex-row-reverse justify-between text-left"
                                        } ${
                                          categorySheetValue === cat
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-200 bg-white text-slate-700"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          data-noswipe="true"
                                          onClick={() => setCategorySheetValue(cat)}
                                          className={`flex-1 flex items-center ${
                                            isRTL
                                              ? "flex-row justify-between text-right"
                                              : "flex-row-reverse justify-between text-left"
                                          }`}
                                        >
                                          <span className="font-bold">
                                            {categoryLabelByLang[lang]?.[cat as CategoryKey] ||
                                              categoryLabelByLang.he[cat as CategoryKey] ||
                                              cat}
                                          </span>
                                          {categorySheetValue === cat ? <Check className="w-4 h-4" /> : null}
                                        </button>

                                        {isCustomCategory ? (
                                          <div className={`flex items-center gap-2 ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
                                            <button
                                              type="button"
                                              data-noswipe="true"
                                              title={t("ערוך קטגוריה")}
                                              onClick={() => {
                                                setEditingCustomCategory(cat);
                                                setEditingCustomCategoryValue(cat);
                                              }}
                                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                                            >
                                              <Pencil className="w-4 h-4" />
                                            </button>

                                            <button
                                              type="button"
                                              data-noswipe="true"
                                              title={t("מחק קטגוריה")}
                                              onClick={() => {
                                                setDeleteCategoryConfirm(cat);
                                              }}
                                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              data-noswipe="true"
                              onClick={() => setIsAddingCategory(true)}
                              className="w-full text-sm font-bold text-indigo-600 py-2"
                            >
                              {t("➕ הוסף קטגוריה")}
                            </button>

                            {isAddingCategory && (
                              <div className="px-2 py-2 space-y-2" data-noswipe="true">
                                <input
                                  autoFocus
                                  value={customCategoryInput}
                                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                                  placeholder={t("שם קטגוריה")}
                                  className={`w-full border rounded-xl px-3 py-3 text-sm ${
                                    isRTL ? "text-right" : "text-left"
                                  }`}
                                  dir={isRTL ? "rtl" : "ltr"}
                                />

                                <button
                                  type="button"
                                  data-noswipe="true"
                                  onClick={async () => {
                                    const name = customCategoryInput.trim();
                                    if (!name) return;

                                    await saveCustomCategory(name);
                                    setCategorySheetValue(name);
                                    setCustomCategoryInput("");
                                    setIsAddingCategory(false);
                                  }}
                                  className="w-full py-3 rounded-2xl font-black bg-emerald-500 text-white"
                                >
                                  {t("שמור")}
                                </button>
                              </div>
                            )}

                            
                          </div>

                          <div className={`flex gap-3 p-3 border-t bg-white ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                            <button
                              type="button"
                              onClick={saveItemCategory}
                              className="flex-1 py-3 rounded-2xl font-black bg-indigo-600 text-white"
                            >
                              {t("שמור")}
                            </button>
                            <button
                              type="button"
                              onClick={closeCategorySheet}
                              className="flex-1 py-3 rounded-2xl font-black bg-white text-slate-700 border-2 border-slate-300"
                            >
                              {t("נסגר")}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {purchasedItems.length > 0 ? (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h3 className={`text-lg font-bold text-slate-700 ${rtlClasses.text} mb-2`}>
              {t("נקנו")} ({purchasedItems.length})
            </h3>

            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className={`relative flex items-center justify-between p-3 ${
                  deleteFlashIds.has(item.id) ? "bg-rose-50" : "bg-slate-100/50"
                } rounded-2xl transition-all`}
                dir="rtl"
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className="flex items-center gap-3 flex-1 justify-start cursor-pointer"
                    onClick={() => togglePurchased(item.id)}
                    style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-slate-400 flex-shrink-0" />

                    <span className="text-base font-bold text-slate-400 line-through truncate text-left">
                      <span className="flex gap-1">
                        <span>{item.name}</span>
                        {(item.quantity || 1) > 1 && (
                          <>
                            <span>x</span>
                            <span>{item.quantity}</span>
                          </>
                        )}
                      </span>
                    </span>
                  </div>

                  <button
                    onClick={() => deleteItemWithFlash(item.id)}
                    className="p-2 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <DogEarBadge
                  itemId={item.id}
                  mode="purchased"
                  name={item.purchasedByName}
                  initial={item.purchasedByInitial}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )}
  </>
) : (
  <div className="space-y-6">
    <div className={rtlClasses.text}>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t("מועדפים")}</h2>
      <p className="text-sm text-slate-400 font-bold">
        <span className="font-semibold text-[15px] leading-none">{t("פריטים שחוזרים לסל")}</span>
      </p>
    </div>

    {favoritesUnique.length === 0 ? (
      <div className="text-center py-20 opacity-20">
        <Star className="w-16 h-16 mx-auto mb-4 stroke-1" />
        <p className="font-bold">{t("אין מועדפים עדיין")}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3">
        {favoritesUnique.map((fav) => {
          const revealFavDelete = favSwipeUi.id === fav.id && favSwipeUi.rawDx > 0;
          const revealFavAdd = favSwipeUi.id === fav.id && favSwipeUi.rawDx < 0;

          return (
            <div
              key={fav.id}
              className={`relative overflow-hidden rounded-2xl select-none transition-all duration-200 ease-out ${
                favDeleteFlashIds.has(fav.id) ? "pointer-events-none" : ""
              } ${
                favLeavingIds.has(fav.id)
                  ? "opacity-0 translate-y-1 scale-[0.99] pointer-events-none"
                  : "opacity-100 translate-y-0 scale-100"
              }`}
              dir="ltr"
              onPointerDown={onFavSwipePointerDown(fav.id)}
              onPointerMove={onFavSwipePointerMove(fav.id)}
              onPointerUp={onFavSwipePointerUp(fav.id)}
              onPointerCancel={onFavSwipePointerCancel}
              style={{ touchAction: "pan-y" }}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-rose-50"
                  style={{
                    width: revealFavDelete ? Math.min(Math.abs(favSwipeUi.rawDx), FAV_SWIPE_MAX_SHIFT_PX) : 0,
                    opacity: 0.9,
                    zIndex: 0,
                  }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-50"
                  style={{
                    width: revealFavAdd ? Math.min(Math.abs(favSwipeUi.rawDx), FAV_SWIPE_MAX_SHIFT_PX) : 0,
                    opacity: 0.9,
                    zIndex: 0,
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-between px-4 flex-row">
                  <div
                    className="text-rose-600"
                    style={{
                      zIndex: 2,
                      opacity:
                        revealFavDelete
                          ? Math.abs(favSwipeUi.rawDx) >= FAV_SWIPE_THRESHOLD_PX
                            ? 1
                            : 0.65
                          : 0,
                      transform:
                        revealFavDelete && Math.abs(favSwipeUi.rawDx) >= FAV_SWIPE_THRESHOLD_PX
                          ? "scale(1.15)"
                          : "scale(1)",
                      transition: "transform 120ms ease, opacity 120ms ease",
                    }}
                  >
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <div
                    className="text-emerald-600"
                    style={{
                      zIndex: 2,
                      opacity:
                        revealFavAdd
                          ? Math.abs(favSwipeUi.rawDx) >= FAV_SWIPE_THRESHOLD_PX
                            ? 1
                            : 0.65
                          : 0,
                      transform:
                        revealFavAdd && Math.abs(favSwipeUi.rawDx) >= FAV_SWIPE_THRESHOLD_PX
                          ? "scale(1.15)"
                          : "scale(1)",
                      transition: "transform 120ms ease, opacity 120ms ease",
                    }}
                  >
                    <ListPlusIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div
                className={`relative z-10 flex items-center justify-between p-4 rounded-2xl border border-slate-100 shadow-sm transition-colors ${
                  favDeleteFlashIds.has(fav.id)
                    ? "bg-rose-50"
                    : favToListFlashIds.has(fav.id)
                      ? "bg-emerald-100"
                      : "bg-white"
                }`}
                style={{
                  transform: favSwipeUi.id === fav.id ? `translateX(${favSwipeUi.dx}px)` : undefined,
                  transition: favSwipeUi.id === fav.id ? "none" : "transform 160ms ease-out",
                }}
              >
                <div className="flex items-center gap-2" />

                <div
                  className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-bold text-slate-700 truncate px-3 text-base`}
                  style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                >
                  {fav.name}
                </div>

                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
</main>
      {/* Bottom nav */}
<div
  className="fixed bottom-0 left-0 right-0 z-50"
  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
>
  <div className="max-w-md mx-auto px-4 pb-0">
    {activeTab === "favorites" ? (
  <div className="relative h-0 pointer-events-none">
    <div
      className={`absolute -top-5 text-[11px] font-bold text-slate-400 ${
        isRTL ? "left-3" : "right-3"
      }`}
    >
      v{APP_VERSION}
    </div>
  </div>
) : null}

    <footer className="bg-white border-t border-slate-200 rounded-2xl" dir="ltr">
      <div className="relative flex items-center justify-between px-6 py-2">
        {/* Favorites */}
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                activeTab === "favorites" ? "text-indigo-600" : "text-slate-300"
              } ${isRTL ? "order-1" : "order-3"}`}
                title={t("מועדפים")}
              >
                <Star className={`w-7 h-7 ${activeTab === "favorites" ? "fill-indigo-600 text-indigo-600" : "text-slate-300"}`} />
                {t("מועדפים")}
              </button>

              {/* Voice button (tap-to-record) */}
              <div className="order-2 relative flex flex-col items-center justify-center">
                {voiceUi === "recording" ? (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 text-white text-[12px] font-black flex items-center gap-2 whitespace-nowrap">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                   {t("מקליט")} {formatMmSs(voiceSeconds)} • {t("לחץ לסיום")}
                  </div>
                ) : null}

                <button
                  style={{ touchAction: "manipulation" }}
                  onPointerDown={(e) => {
  e.preventDefault();

  if (Date.now() < micTapLockUntilRef.current) return;
  if (voiceUi === "review") return;

  if (voiceUi === "processing") {
    nativeRestartRequestedRef.current = true;
    return;
  }

  if (voiceUi === "idle") {
    const openedCoach = openVoiceCoachIfNeeded();
    if (openedCoach) return;

    void startTapListening();
    return;
  }

  if (voiceUi === "recording") {
    void stopTapListening();
  }
}}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className={`w-14 h-14 rounded-full border-4 border-white shadow-xl flex items-center justify-center ${
                    voiceUi === "recording" ? "bg-rose-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } ${voiceUi === "processing" ? "opacity-60" : ""}`}
                  title={
  voiceUi === "recording"
    ? t("לחץ לסיום")
    : voiceUi === "processing"
    ? t("מעבד")
    : t("לחץ כדי לדבר")
}
                >
                  {voiceUi === "processing" ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : voiceUi === "recording" ? (
                    <MicOff className="w-7 h-7" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>
 {/* List */}
              <button
                onClick={() => setActiveTab("list")}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                  activeTab === "list" ? "text-indigo-600" : "text-slate-300"
                } ${isRTL ? "order-3" : "order-1"}`}
                title={t("רשימה")}
              >
                <ListChecks className="w-7 h-7" />
                {t("רשימה")}
              </button>
            </div>
          </footer>
        </div>
      </div>

                  {/* Bought all items modal */}
{showBoughtAllModal ? (
  <div
    className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center px-4"
    dir={isRTL ? "rtl" : "ltr"}
  >
    <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
      <div className="p-6 space-y-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className={`flex-1 ${rtlClasses.text}`}>
            <h3 className="text-xl font-black text-slate-800">
              {t("סיימת לקנות?")}
            </h3>

            <p className="mt-1 text-sm font-bold text-slate-400 leading-6">
              {t("כל הפריטים סומנו. רוצה לנקות את הרשימה ולהתחיל מחדש?")}
            </p>
          </div>
        </div>

        <div className={`flex gap-3 pt-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <button
            type="button"
            onClick={() => setShowBoughtAllModal(false)}
            className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700"
          >
            {t("ביטול")}
          </button>

          <button
            type="button"
            onClick={async () => {
              setShowBoughtAllModal(false);
              await clearListServer();
            }}
            className="flex-1 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-100"
          >
            {t("נקה רשימה")}
          </button>
        </div>

      </div>
    </div>
  </div>
) : null}

      {/* Clear Confirm Modal */}
      {showClearConfirm ? (
<div
            className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6"
            dir={isRTL ? "rtl" : "ltr"}
>          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className={rtlClasses.text}>
                <div className="text-lg font-black text-slate-800">{t("לנקות את כל הרשימה?")}</div>
                <div className="text-sm font-bold text-slate-400">{t("הפעולה תמחק את כל הפריטים מהרשימה.")}</div>
              </div>
            </div>

            <div className={`flex gap-3 pt-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700">
                {t("ביטול")}
              </button>
              <button onClick={clearListServer} className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white">
                {t("מחק הכל")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Voice Review Modal */}
      {voiceUi === "review" ? (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-6"
          dir={isRTL ? "rtl" : "ltr"}
        >         
         <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className={rtlClasses.text}>
                <div className="text-xl font-black text-slate-800">{t("בדיקה לפני שליחה")}</div>
                <div className="text-sm font-bold text-slate-400">{t("אפשר לערוך או לבטל")}</div>
              </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
              </div>

              <textarea
              value={voiceDraft}
              onChange={(e) => setVoiceDraft(e.target.value)}
              rows={3}
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${isRTL ? "text-right" : "text-left"}`}
              placeholder={t("מה אמרת?")}
            />

                    <div className={`flex gap-3 p-3 border-t bg-white ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                    <button
                  onClick={() => cancelVoiceDraft()}
                  className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700"
                >
                  {t("ביטול")}
                </button>
                <button
                  onClick={() => confirmVoiceDraft()}
                  className="flex-1 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                >
                  {t("שלח")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {undoToast ? (
        <div
          className="fixed left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-2xl shadow-lg z-50 flex items-center gap-2 max-w-[92vw]"
          style={{ bottom: "calc(92px + env(safe-area-inset-bottom))" }}
        >
          <span className="font-bold text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">{undoToast.msg}</span>
          <button
            onClick={undoToast.onUndo}
            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 font-black text-[12px] shrink-0"
          >
            {undoToast.undoLabel}
          </button>
        </div>
      ) : null}
      
      {showVoiceCoach ? (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4">
  <div
    className={`w-full max-w-[340px] rounded-[26px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] border border-slate-100 p-4 ${
      isRTL ? "text-right" : "text-left"
    }`}
    dir={isRTL ? "rtl" : "ltr"}
  >
      <div className="flex items-center gap-3 mb-2">
  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
    <Mic className="w-4.5 h-4.5 text-indigo-500" />
  </div>
  <div>
    <div className="text-[15px] font-extrabold text-slate-800">
      {t("דוגמאות לפקודות קוליות")}
    </div>
    <div className="text-[11px] font-bold text-slate-400 mt-0.5">
      {t("דבר חופשי ולחץ שוב לסיום")}
    </div>
  </div>
</div>

     <div className="rounded-2xl bg-slate-50/80 border border-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 leading-7">
  <div className="mb-1">{t("דוגמאות:")}</div>
  <div>"{getVoiceExamplesText(lang)}"</div>
  <div>"{t("מחק רשימה")}"</div>
</div>

      <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
        <input
  type="checkbox"
  checked={dontShowVoiceCoachAgain}
  onChange={(e) => {
    const checked = e.target.checked;
    setDontShowVoiceCoachAgain(checked);
    setVoiceCoachDismissed(checked);

    try {
      localStorage.setItem(VOICE_COACH_DISMISS_KEY, checked ? "true" : "false");
    } catch {
      // ignore
    }
  }}
  className="w-4 h-4 accent-indigo-600"
/>
      {t("אל תציג שוב")}
      </label>

      <div className={`mt-5 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
        <button
          type="button"
          onClick={() => {
            setShowVoiceCoach(false);
          }}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold text-slate-700 hover:bg-slate-50"
        >
        {t("ביטול")}
        </button>

        <button
          type="button"
          onClick={() => {
            if (dontShowVoiceCoachAgain) {
              setVoiceCoachDismissed(true);
            }
            setShowVoiceCoach(false);
            void startTapListening(true);
          }}
          className="flex-1 rounded-2xl bg-indigo-600 text-white px-4 py-2.5 font-extrabold shadow-md shadow-indigo-100 hover:bg-indigo-500"        >
          {t("התחל")}
        </button>
      </div>
    </div>
  </div>
) : null}


      {toast ? (
        <div
          className="fixed left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-2xl shadow-lg z-50 text-[12px] font-bold whitespace-nowrap max-w-[92vw] overflow-hidden text-ellipsis"
          style={{ bottom: "calc(92px + env(safe-area-inset-bottom))" }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------
// App Router
// ---------------------------
const RootRoute: React.FC = () => {
  if (isNativeOrLocalAppRuntime()) return <MainList />;
  return <InstallLandingPage forcedLang="en" />;
};

const WebInviteBridge: React.FC = () => {
  const [searchParams] = useSearchParams();
  const listId = searchParams.get("listId");
  const token = searchParams.get("token");
  const triedRef = useRef(false);

  useEffect(() => {
    if (!listId || !token) return;
    if (triedRef.current) return;
    triedRef.current = true;

    const appDeepLink = `myeasylist://invite?listId=${encodeURIComponent(listId)}&token=${encodeURIComponent(token)}`;

    const timer = window.setTimeout(() => {
      console.log("App not opened, staying on landing page");
    }, 1600);

    try {
      window.location.href = appDeepLink;
    } catch (e) {
      console.error("Failed to open deep link", e);
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [listId, token]);

  return <InstallLandingPage inviteMode forcedLang="en" />;
};

const InviteRoute: React.FC = () => {
  if (isNativeOrLocalAppRuntime()) return <InvitePage />;
  return <WebInviteBridge />;
};

const App: React.FC = () => {
  useEffect(() => {
    const applyInviteUrl = (rawUrl: string) => {
      const inviteHash = buildInviteHashFromUrl(rawUrl);
      if (!inviteHash) return;

      if (window.location.hash !== inviteHash) {
        window.location.hash = inviteHash;
      }
    };

    try {
      applyInviteUrl(window.location.href);
    } catch (e) {
      // ignore
    }

    let sub: { remove: () => Promise<void> } | null = null;

    const setup = async () => {
      try {
        sub = await CapacitorApp.addListener("appUrlOpen", (event: { url: string }) => {
          applyInviteUrl(event.url);
        });
      } catch (e) {
        // ignore
      }
    };

    void setup();

    return () => {
      try {
        void sub?.remove();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/invite" element={<InviteRoute />} />
      </Routes>
    </HashRouter>
  );
  
};
export default App;
