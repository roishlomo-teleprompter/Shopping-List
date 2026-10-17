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
  Monitor,
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
  OAuthProvider,
  signOut,
  deleteUser,
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

import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { App as CapacitorApp } from "@capacitor/app";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { KeepAwake } from "@capacitor-community/keep-awake";
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
      if ((data as any).deletedAt) throw new Error("הרשימה לא קיימת");
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

  const primaryStoreLabel = "Get it on Google Play";
const secondaryStoreLabel = "App Store - Coming soon";

  const storeButtonClass =
    "w-full rounded-2xl px-4 py-4 font-black border border-emerald-200 bg-emerald-500 text-white shadow-lg shadow-emerald-100";

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

       <div className="flex items-center justify-center gap-3 pt-1">
  <button
    type="button"
    onClick={() =>
      openExternalUrl("https://apps.apple.com/app/id6763803409")
    }
    className="block"
    aria-label="Download on the App Store"
  >
    <img
      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
      alt="Download on the App Store"
      className="h-12 w-auto"
    />
  </button>

  <button
    type="button"
    onClick={() =>
      openExternalUrl("https://play.google.com/store/apps/details?id=com.rsh.myeasylist")
    }
    className="block"
    aria-label="Get it on Google Play"
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
      alt="Get it on Google Play"
      className="h-12 w-auto"
    />
  </button>
</div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 text-sm font-bold text-slate-500 leading-6">
         {inviteMode ? (
  <div className="space-y-2">
    {lang === "he" ? (
      <>
        <p>
          התקן את האפליקציה, לאחר מכן חזור להודעת ההזמנה ולחץ שוב על הקישור.
        </p>
        <p className="text-emerald-600 font-black">
          כך תתחבר לרשימה המשותפת.
        </p>
      </>
    ) : (
      <>
        <p>
          Install the app, then return to the invite message and tap the link again.
        </p>
        <p className="text-emerald-600 font-black">
          This will connect you to the shared list.
        </p>
      </>
    )}
  </div>
) : (
  translate(lang, "התקן את האפליקציה כדי ליצור לשתף ולנהל רשימות קניות")
)}
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
const APP_VERSION = "1.4.5";

type AppThemeMode = "light" | "dark" | "night" | "system";

const APP_THEME_STORAGE_KEY = "shoppingListThemeMode";

const LAST_UI_CACHE_KEY = "my_easy_list_last_ui_cache_v1";

type LastUiCache = {
  list: ShoppingList | null;
  items: ShoppingItem[];
  favorites: FavoriteDoc[];
  savedAt: number;
};

function loadLastUiCache(): LastUiCache | null {
  try {
    const raw = localStorage.getItem(LAST_UI_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      list: parsed.list || null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      savedAt: Number(parsed.savedAt || 0),
    };
  } catch {
    return null;
  }
}

function saveLastUiCache(cache: LastUiCache) {
  try {
    localStorage.setItem(LAST_UI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function clearLastUiCache() {
  try {
    localStorage.removeItem(LAST_UI_CACHE_KEY);
  } catch {
    // ignore
  }
}

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
    // Hebrew
    "עגבניה","עגבניות","מלפפון","מלפפונים","בצל","בצלים","בצל ירוק","שום","גזר","תפוח אדמה","תפוחי אדמה","בטטה",
    "פלפל","פלפלים","פלפל חריף","חסה","כרוב","כרובית","ברוקולי","קישוא","חציל","תירס","פטריה","פטריות",
    "דלעת","סלרי","אפונה","שעועית ירוקה","צנון","סלק","תרד","קייל","פטרוזיליה","כוסברה","שמיר","נענע",
    "ג׳ינג׳ר","כורכום","שורש חזרת",

    "תפוח","תפוחים","בננה","בננות","אבוקדו","לימון","תפוז","תפוזים","קלמנטינה","אשכולית","אגס","אגסים",
    "אפרסק","אפרסקים","שזיף","שזיפים","ענבים","אבטיח","מלון","קיווי","מנגו","אננס","תות","תותים",
    "אוכמניות","פטל","רימון","קוקוס","תמר","תמרים","תאנה","תאנים",

    // English
    "tomato","tomatoes","cucumber","cucumbers","onion","onions","green onion","spring onion","garlic",
    "carrot","carrots","potato","potatoes","sweet potato","sweet potatoes",
    "pepper","peppers","hot pepper","lettuce","cabbage","cauliflower","broccoli","zucchini","eggplant",
    "corn","mushroom","mushrooms","pumpkin","celery","peas","green beans","radish","beet","beets",
    "spinach","kale","parsley","cilantro","dill","mint","ginger","turmeric","horseradish",

    "apple","apples","banana","bananas","avocado","lemon","lemons","orange","oranges","mandarin",
    "grapefruit","pear","pears","peach","peaches","plum","plums","grapes","watermelon","melon",
    "kiwi","kiwis","mango","pineapple","strawberry","strawberries","blueberry","blueberries",
    "raspberry","pomegranate","coconut","date","dates","fig","figs",

    // Russian
    "помидор","помидоры","огурец","огурцы","лук","зелёный лук","чеснок","морковь","картофель",
    "батат","перец","острый перец","салат","капуста","цветная капуста","брокколи","кабачок",
    "баклажан","кукуруза","гриб","грибы","тыква","сельдерей","горох","зелёная фасоль",
    "редис","свекла","шпинат","петрушка","кинза","укроп","мята","имбирь","куркума",

    "яблоко","яблоки","банан","бананы","авокадо","лимон","апельсин","апельсины","мандарин",
    "грейпфрут","груша","груши","персик","персики","слива","сливы","виноград","арбуз",
    "дыня","киви","манго","ананас","клубника","черника","малина","гранат","кокос",
    "финик","инжир",

    // Arabic
    "طماطم","بندورة","خيار","بصل","بصل أخضر","ثوم","جزر","بطاطا","بطاطس","بطاطا حلوة",
    "فلفل","فلفل حار","خس","ملفوف","قرنبيط","بروكلي","كوسا","باذنجان","ذرة","فطر",
    "يقطين","كرفس","بازلاء","فاصوليا خضراء","فجل","شمندر","سبانخ","بقدونس","كزبرة",
    "شبت","نعناع","زنجبيل","كركم",

    "تفاح","موز","أفوكادو","افوكادو","ليمون","برتقال","يوسفي","جريب فروت","كمثرى",
    "خوخ","برقوق","عنب","بطيخ","شمام","كيوي","مانجو","أناناس","فراولة","توت",
    "رمان","جوز الهند","تمر","تين"
  ],

dairy_eggs: [
  // Hebrew
  "חלב","גבינה","גבינות","יוגורט","יוגורטים","ביצה","ביצים","קוטג","קוטג'","שמנת","חמאה",
  "גבינה צהובה","גבינה לבנה","גבינת שמנת","מוצרלה","פטה","פרמזן","קשקבל","ריקוטה",
  "לאבנה","גאודה","גבינה בולגרית","שמנת מתוקה","שמנת לבישול","שמנת חמוצה",
  "חלב סויה","חלב שקדים","חלב שיבולת שועל","חלב קוקוס",
  "אשל","לבן","מעדן","מעדנים","גלידה","קצפת",

  // English
  "milk","cheese","cheeses","yogurt","yoghurt","egg","eggs","cottage","cream","butter",
  "yellow cheese","white cheese","cream cheese","mozzarella","feta","parmesan","ricotta",
  "gouda","bulgarian cheese","sweet cream","sour cream","whipping cream",
  "soy milk","almond milk","oat milk","coconut milk",
  "labneh","ice cream","dessert","pudding",

  // Russian
  "молоко","сыр","йогурт","яйцо","яйца","творог","сливки","масло",
  "сметана","моцарелла","фета","пармезан","рикотта","гауда",
  "соевое молоко","миндальное молоко","овсяное молоко","кокосовое молоко",
  "мороженое","десерт",

  // Arabic
  "حليب","جبنة","جبن","لبن","بيض","قشطة","زبدة",
  "جبنة صفراء","جبنة بيضاء","جبنة كريمية","موزاريلا","فيتا","بارميزان",
  "كريمة","كريمة طبخ","كريمة حامضة",
  "حليب الصويا","حليب اللوز","حليب الشوفان","حليب جوز الهند",
  "لبنة","بوظة","آيس كريم","مهلبية"
],

meat_fish: [
  // Hebrew
  "עוף","חזה עוף","שוקיים","כנפיים","פרגית","שניצל","בשר","בשר טחון","סטייק",
  "אנטריקוט","אסאדו","קבב","המבורגר","נקניק","נקניקים","נקניקיות","פסטרמה",
  "כבש","כבד","הודו","חזה הודו","עגל",

  "דג","דגים","סלמון","טונה","אמנון","מוסר","בורי","דניס","סרדינים",
  "פילה סלמון","פילה דג","טונה בשימורים","פירות ים",

  // English
  "chicken","chicken breast","drumsticks","wings","pargiyot","schnitzel",
  "meat","ground beef","beef","steak","entrecote","asado","kebab","burger",
  "sausage","sausages","pastrami","lamb","liver","turkey","turkey breast",
  "veal",

  "fish","salmon","tuna","tilapia","sea bass","bream","sardines",
  "salmon fillet","fish fillet","canned tuna","seafood",

  // Russian
  "курица","куриная грудка","крылья","ножки","шницель",
  "мясо","фарш","говядина","стейк","кебаб","бургер",
  "колбаса","сосиски","пастрами","баранина","печень",
  "индейка","грудка индейки",

  "рыба","лосось","тунец","тиляпия","сардины",
  "филе лосося","рыбное филе","консервированный тунец",
  "морепродукты",

  // Arabic
  "دجاج","صدر دجاج","أجنحة","أفخاذ","شنيتسل",
  "لحم","لحم مفروم","لحم بقري","ستيك","كباب","برغر",
  "نقانق","مرتديلا","بسترمة","لحم غنم","كبدة",
  "ديك رومي","صدر ديك رومي",

  "سمك","سلمون","تونة","بلطي","سردين",
  "فيليه سلمون","فيليه سمك","تونة معلبة",
  "مأكولات بحرية"
],


bakery_bread: [
  // Hebrew
  "לחם","לחמים","פיתה","פיתות","חלה","חלות","בגט","לחמניה","לחמניות","טוסט","טורטיה",
  "ג׳בטה","בריוש","קרואסון","מאפה","מאפים","בורקס","עוגה","עוגיות","עוגיה",
  "בייגל","דונאט","סופגניה","קמח","שמרים","פירורי לחם","לחם מלא",
  "לחם שיפון","לחם מחמצת","טוסטונים","קרקרים","מצה","מצות",

  // English
  "bread","breads","pita","pitas","challah","baguette","roll","rolls","bun","buns","toast","tortilla",
  "ciabatta","brioche","croissant","pastry","pastries","burekas","cake","cookies","cookie",
  "bagel","donut","doughnut","sufganiya","flour","yeast","breadcrumbs","whole wheat bread",
  "rye bread","sourdough","crackers","matzah","matzot",

  // Russian
  "хлеб","пита","батон","багет","булка","булочки","тост","тортилья",
  "чиабатта","бриошь","круассан","выпечка","бурекас","торт","печенье",
  "бублик","пончик","мука","дрожжи","сухари","цельнозерновой хлеб",
  "ржаной хлеб","крекеры","маца",

  // Arabic
  "خبز","بيتا","باغيت","لفافة","لفافات","توست","تورتيلا",
  "تشاباتا","بريوش","كرواسون","معجنات","بوركس","كعكة","بسكويت",
  "بيغل","دونات","طحين","خميرة","بقسماط","خبز قمح كامل",
  "خبز الجاودار","كراكر","ماتسا"
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
    "רזולוציה": "רזולוציה",
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
      "מסנכרן רשימה...": "מסנכרן רשימה...",
      "מחיקת חשבון": "מחיקת חשבון",
      "למחוק את החשבון?": "למחוק את החשבון?",
      "הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.": "הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.",
      "מחק חשבון": "מחק חשבון",
      "החשבון נמחק": "החשבון נמחק",
      "צריך להתחבר מחדש": "צריך להתחבר מחדש",
      "המסך נשאר דולק": "המסך נשאר דולק",
      "השאר מסך דולק": "השאר מסך דולק",
      "הפריט הוחזר לרשימה": "הפריט הוחזר לרשימה",
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
    "רזולוציה": "Resolution",
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
    "מסנכרן רשימה...": "Syncing list...",
    "מחיקת חשבון": "Delete account",
    "למחוק את החשבון?": "Delete account?",
    "הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.": "This will delete your user details and remove you from your lists.",
    "מחק חשבון": "Delete account",
    "החשבון נמחק": "Account deleted",
    "צריך להתחבר מחדש": "Please sign in again",
    "המסך נשאר דולק": "Screen stays awake",
    "השאר מסך דולק": "Keep screen awake",
    "הפריט הוחזר לרשימה": "Item restored to the list",

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
    "רזולוציה": "Разрешение",
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
    "מסנכרן רשימה...": "Синхронизация списка...",
    "מחיקת חשבון": "Удалить аккаунт",
    "למחוק את החשבון?": "Удалить аккаунт?",
    "הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.": "Это действие удалит данные пользователя и удалит вас из списков.",
    "מחק חשבון": "Удалить аккаунт",
    "החשבון נמחק": "Аккаунт удалён",
    "צריך להתחבר מחדש": "Пожалуйста, войдите снова",
    "המסך נשאר דולק": "Экран не выключается",
    "השאר מסך דולק": "Не выключать экран",
    "הפריט הוחזר לרשימה": "Товар возвращён в список",


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
    "רזולוציה": "الدقة",
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
    "מסנכרן רשימה...": "جارٍ مزامنة القائمة...",
    "מחיקת חשבון": "حذف الحساب",
    "למחוק את החשבון?": "هل تريد حذف الحساب؟",
    "הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.": "سيؤدي هذا إلى حذف بيانات المستخدم وإزالتك من القوائم.",
    "מחק חשבון": "حذف الحساب",
    "החשבון נמחק": "تم حذف الحساب",
    "צריך להתחבר מחדש": "يرجى تسجيل الدخول مرة أخرى",
    "המסך נשאר דולק": "تبقى الشاشة قيد التشغيل",
    "השאר מסך דולק": "إبقاء الشاشة قيد التشغيل",
    "הפריט הוחזר לרשימה": "تمت إعادة العنصر إلى القائمة",

  },
};

function translate(lang: AppLang, key: string) {
  const dict = I18N[lang] || I18N.he;
  const k = String(key ?? "").trim();
  return MULTI_LIST_I18N[lang]?.[k] ?? dict[k] ?? I18N.he[k] ?? k;
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


const MULTI_LIST_I18N: Record<"he" | "en" | "ru" | "ar", Record<string, string>> = {
  "he": {
    "רשימה חדשה": "רשימה חדשה",
    "שם הרשימה": "שם הרשימה",
    "שינוי שם הרשימה": "שינוי שם הרשימה",
    "מחיקת רשימה": "מחיקת רשימה",
    "ביטול": "ביטול",
    "שמירה": "שמירה",
    "יצירה": "יצירה",
    "שם הרשימה נדרש": "שם הרשימה נדרש",
    "מחיקת הרשימה תסיר אותה ואת המוצרים והמועדפים שלה לכל המשתתפים. להמשיך?": "הרשימה תוסר לכל המשתתפים והשיתוף וההזמנות יבוטלו. המוצרים והמועדפים יישמרו בנתונים, ללא מחיקה פיזית. להמשיך?",
    "הרשימה נמחקה": "הרשימה נמחקה",
    "הרשימה לא קיימת": "הרשימה לא קיימת",
    "מועדפים": "מועדפים",
    "ניהול רשימה": "ניהול רשימה",
    "יש לסיים את הפעולה לפני החלפת רשימה": "יש לסיים את הפעולה לפני החלפת רשימה",
    "פעולת הרשימה נכשלה": "פעולת הרשימה נכשלה"
  },
  "en": {
    "רשימה חדשה": "New list",
    "שם הרשימה": "List name",
    "שינוי שם הרשימה": "Rename list",
    "מחיקת רשימה": "Delete list",
    "ביטול": "Cancel",
    "שמירה": "Save",
    "יצירה": "Create",
    "שם הרשימה נדרש": "Enter a list name",
    "מחיקת הרשימה תסיר אותה ואת המוצרים והמועדפים שלה לכל המשתתפים. להמשיך?": "The list will be removed for all participants. Sharing and invitations will be revoked. Items and favorites remain stored, without permanent deletion. Continue?",
    "הרשימה נמחקה": "List deleted",
    "הרשימה לא קיימת": "List does not exist",
    "מועדפים": "Favorites",
    "ניהול רשימה": "Manage list",
    "יש לסיים את הפעולה לפני החלפת רשימה": "Finish the current action before switching lists",
    "פעולת הרשימה נכשלה": "List operation failed"
  },
  "ru": {
    "רשימה חדשה": "Новый список",
    "שם הרשימה": "Название списка",
    "שינוי שם הרשימה": "Переименовать список",
    "מחיקת רשימה": "Удалить список",
    "ביטול": "Отмена",
    "שמירה": "Сохранить",
    "יצירה": "Создать",
    "שם הרשימה נדרש": "Введите название списка",
    "מחיקת הרשימה תסיר אותה ואת המוצרים והמועדפים שלה לכל המשתתפים. להמשיך?": "Список будет удалён из интерфейса всех участников. Общий доступ и приглашения будут отменены. Товары и избранное останутся в хранилище. Продолжить?",
    "הרשימה נמחקה": "Список удалён",
    "הרשימה לא קיימת": "Список не существует",
    "מועדפים": "Избранное",
    "ניהול רשימה": "Управление списком",
    "יש לסיים את הפעולה לפני החלפת רשימה": "Завершите действие перед сменой списка",
    "פעולת הרשימה נכשלה": "Не удалось выполнить действие"
  },
  "ar": {
    "רשימה חדשה": "قائمة جديدة",
    "שם הרשימה": "اسم القائمة",
    "שינוי שם הרשימה": "تغيير اسم القائمة",
    "מחיקת רשימה": "حذف القائمة",
    "ביטול": "إلغاء",
    "שמירה": "حفظ",
    "יצירה": "إنشاء",
    "שם הרשימה נדרש": "أدخل اسم القائمة",
    "מחיקת הרשימה תסיר אותה ואת המוצרים והמועדפים שלה לכל המשתתפים. להמשיך?": "ستتم إزالة القائمة لجميع المشاركين وإلغاء المشاركة والدعوات. ستبقى المنتجات والمفضلة محفوظة دون حذف نهائي. هل تريد المتابعة؟",
    "הרשימה נמחקה": "تم حذف القائمة",
    "הרשימה לא קיימת": "القائمة غير موجودة",
    "מועדפים": "المفضلة",
    "ניהול רשימה": "إدارة القائمة",
    "יש לסיים את הפעולה לפני החלפת רשימה": "أكمل العملية الحالية قبل تبديل القائمة",
    "פעולת הרשימה נכשלה": "تعذرت العملية"
  }
};

// Share one initialization across repeated auth callbacks and React remounts.
const initialListLoads = new Map<string, Promise<ShoppingList>>();
function loadInitialShoppingList(uid: string): Promise<ShoppingList> {
  const pending = initialListLoads.get(uid);
  if (pending) return pending;
  const operation = (async () => {
    const snapshot = await getDocs(query(collection(db, "lists"), where("sharedWith", "array-contains", uid)));
    const available = snapshot.docs.filter((entry) => !entry.data().deletedAt);
    if (available.length) {
      const savedId = localStorage.getItem("activeListId");
      const selected = available.find((entry) => entry.id === savedId) || available[0];
      return { ...selected.data(), id: selected.id } as ShoppingList;
    }
    const ref = doc(collection(db, "lists"));
    const next: ShoppingList = { id: ref.id, title: "My Easy List", ownerUid: uid,
      sharedWith: [uid], userColorMap: {}, createdAt: Date.now(), updatedAt: Date.now() };
    // Do not publish a nonexistent list to the live recovery subscription.
    await setDoc(ref, next);
    return next;
  })();
  initialListLoads.set(uid, operation);
  void operation.finally(() => { if (initialListLoads.get(uid) === operation) initialListLoads.delete(uid); }).catch(() => {});
  return operation;
}

const DEFAULT_LIST_NAMES: Record<AppLang, string> = {
  he: "הרשימה שלי", en: "My list", ru: "Мой список", ar: "قائمتي",
};
const LEGACY_DEFAULT_LIST_NAMES = new Set([
  ...Object.values(DEFAULT_LIST_NAMES), "My Easy List", "shopping-list", "shopping list",
].flatMap((name) => [name.toLowerCase(), `${name.toLowerCase()}:`]));
function getLocalizedListTitle(entry: ShoppingList | null, language: AppLang): string {
  const title = String(entry?.title || "").trim();
  if ((entry as (ShoppingList & { titleIsCustom?: boolean }) | null)?.titleIsCustom === true) return title;
  return !title || LEGACY_DEFAULT_LIST_NAMES.has(title.toLowerCase()) ? DEFAULT_LIST_NAMES[language] : title;
}

function isPrivateDefaultList(entry: ShoppingList, uid: string): boolean {
  const metadata = entry as ShoppingList & { titleIsCustom?: boolean; pendingInvites?: Record<string, unknown> };
  return entry.ownerUid === uid && metadata.titleIsCustom !== true &&
    LEGACY_DEFAULT_LIST_NAMES.has(String(entry.title || "").trim().toLowerCase()) &&
    Array.isArray(entry.sharedWith) && entry.sharedWith.every((member) => member === uid) &&
    !Object.keys(metadata.pendingInvites || {}).length;
}
function selectVisibleListTabs(entries: ShoppingList[], activeId: string | undefined, uid: string,
  content: Record<string, {items?: boolean; favorites?: boolean}>): ShoppingList[] {
  const protectedLists = entries.filter((entry) => !isPrivateDefaultList(entry, uid));
  const defaults = entries.filter((entry) => isPrivateDefaultList(entry, uid));
  const canonical = protectedLists.find((entry) => entry.id === activeId) ||
    protectedLists.find((entry) => entry.ownerUid !== uid || entry.sharedWith.some((member) => member !== uid)) ||
    protectedLists[0] || defaults.find((entry) => entry.id === activeId) ||
    defaults.find((entry) => content[entry.id]?.items || content[entry.id]?.favorites) || defaults[0];
  return entries.filter((entry) => !isPrivateDefaultList(entry, uid) || entry.id === canonical?.id ||
    content[entry.id]?.items || content[entry.id]?.favorites);
}

type ListTabsContent = Record<string, {items?: boolean; favorites?: boolean}>;
type ListTabsCache = { uid: string; lists: ShoppingList[]; content: ListTabsContent };
const LIST_TABS_CACHE_KEY = "my_easy_list_tabs_cache_v1";
function loadListTabsCache(uid?: string): ListTabsCache | null {
  try {
    const owner = uid || localStorage.getItem(`${LIST_TABS_CACHE_KEY}:last-user`);
    if (!owner) return null;
    const value = JSON.parse(localStorage.getItem(`${LIST_TABS_CACHE_KEY}:${owner}`) || "null");
    if (value?.uid !== owner || !Array.isArray(value.lists)) return null;
    return { uid: owner, lists: value.lists.filter((entry: ShoppingList) => entry?.id &&
      Array.isArray(entry.sharedWith) && entry.sharedWith.includes(owner) && !(entry as any).deletedAt),
      content: value.content && typeof value.content === "object" ? value.content : {} };
  } catch { return null; }
}
function saveListTabsCache(cache: ListTabsCache) {
  try {
    localStorage.setItem(`${LIST_TABS_CACHE_KEY}:${cache.uid}`, JSON.stringify(cache));
    localStorage.setItem(`${LIST_TABS_CACHE_KEY}:last-user`, cache.uid);
  } catch { /* Storage is optional; live updates still work. */ }
}
function clearListTabsCachePointer() {
  try { localStorage.removeItem(`${LIST_TABS_CACHE_KEY}:last-user`); } catch {}
}

function chooseLastListTab(cache: ListTabsCache | null, activeId: string | null): ShoppingList | null {
  return cache?.lists.find((entry) => entry.id === activeId) || cache?.lists[0] || null;
}

// The introduction is presentation-only: it never calls shopping or sharing operations.
type IntroductionLanguage = "he" | "en" | "ru" | "ar";
const INTRO_COPY: Record<IntroductionLanguage, {menu: string; next: string; back: string; skip: string; done: string; steps: string[][]}> = {
  "he": {
    "menu": "הדרכה ראשונית",
    "next": "הבא",
    "back": "הקודם",
    "skip": "דלג",
    "done": "הבנתי, מתחילים",
    "steps": [
      [
        "כל רשימה, עם האנשים שלה",
        "שתפו כל רשימת קניות בנפרד עם משפחה או חברים. לכל רשימה משתתפים משלה, והשינויים מתעדכנים אצל כולם בזמן אמת.",
        "בחרו לשונית, לחצו על סמל השיתוף ואז על ״הזמן חברים לרשימה״."
      ],
      [
        "שיתוף ב־WhatsApp",
        "שלחו את תוכן רשימת הקניות למשפחה ולחברים, גם למי שאין את האפליקציה. זו הודעה עם תוכן הרשימה, שאינה מצרפת משתתפים לעריכה משותפת.",
        "בחרו רשימה, לחצו על סמל השיתוף ואז על ״וואטסאפ״."
      ],
      [
        "הכול מסודר בקטגוריות",
        "שייכו מוצרים לקטגוריות לקנייה נוחה ומסודרת. בחירת קטגוריה נשמרת מיד, ללא כפתור אישור.",
        "לחצו לחיצה ממושכת על מוצר ואז בחרו קטגוריה."
      ],
      [
        "מוסיפים פריטים בקול",
        "לחצו על המיקרופון ואמרו אילו מוצרים להוסיף לרשימת הקניות הפעילה.",
        "אשרו גישה למיקרופון אם תתבקשו, ודברו בשפה המוגדרת באפליקציה."
      ]
    ]
  },
  "en": {
    "menu": "Getting started",
    "next": "Next",
    "back": "Back",
    "skip": "Skip",
    "done": "Got it, let’s start",
    "steps": [
      [
        "Each list, its own people",
        "Share each shopping list separately with family or friends. Each list has its own participants, and changes appear for everyone in real time.",
        "Select a list tab, tap the share icon, then Invite friends to the list."
      ],
      [
        "Share on WhatsApp",
        "Send your shopping list contents to family and friends, even if they do not have the app. This sends a message; it does not invite people to edit the list.",
        "Select a list, tap the share icon, then WhatsApp."
      ],
      [
        "Organize by category",
        "Assign products to categories for easier shopping. Your category selection is saved immediately, with no confirmation button.",
        "Press and hold a product, then select a category."
      ],
      [
        "Add items by voice",
        "Tap the microphone and say which products to add to the active shopping list.",
        "Allow microphone access if asked, and speak in the language selected in the app."
      ]
    ]
  },
  "ru": {
    "menu": "Знакомство с приложением",
    "next": "Далее",
    "back": "Назад",
    "skip": "Пропустить",
    "done": "Понятно, начнём",
    "steps": [
      [
        "У каждого списка свои участники",
        "Делитесь каждым списком покупок отдельно с семьёй или друзьями. У каждого списка свои участники, а изменения видны всем в реальном времени.",
        "Выберите вкладку списка, нажмите значок «Поделиться», затем приглашение друзей в список."
      ],
      [
        "Отправка в WhatsApp",
        "Отправляйте содержимое списка семье и друзьям, даже если у них нет приложения. Это сообщение, а не приглашение к совместному редактированию.",
        "Выберите список, нажмите значок «Поделиться», затем WhatsApp."
      ],
      [
        "Порядок по категориям",
        "Распределяйте товары по категориям для удобных покупок. Выбранная категория сохраняется сразу, без кнопки подтверждения.",
        "Нажмите и удерживайте товар, затем выберите категорию."
      ],
      [
        "Добавление товаров голосом",
        "Нажмите на микрофон и назовите товары, которые нужно добавить в текущий список покупок.",
        "Разрешите доступ к микрофону, если появится запрос, и говорите на языке приложения."
      ]
    ]
  },
  "ar": {
    "menu": "دليل البدء",
    "next": "التالي",
    "back": "السابق",
    "skip": "تخطي",
    "done": "فهمت، لنبدأ",
    "steps": [
      [
        "لكل قائمة مشاركون مختلفون",
        "شارك كل قائمة تسوق بشكل منفصل مع العائلة أو الأصدقاء. لكل قائمة مشاركون خاصون بها، وتظهر التغييرات للجميع فورًا.",
        "اختر تبويب القائمة، ثم اضغط على رمز المشاركة واختر دعوة الأصدقاء إلى القائمة."
      ],
      [
        "المشاركة عبر WhatsApp",
        "أرسل محتوى قائمة التسوق إلى العائلة والأصدقاء، حتى لمن ليس لديهم التطبيق. تُرسل رسالة بالمحتوى دون دعوتهم لتعديل القائمة.",
        "اختر قائمة، ثم اضغط على رمز المشاركة واختر WhatsApp."
      ],
      [
        "تنظيم المنتجات حسب الفئات",
        "وزّع المنتجات على الفئات لتسهيل التسوق. يُحفظ اختيار الفئة فورًا دون زر تأكيد.",
        "اضغط مطولًا على منتج، ثم اختر الفئة."
      ],
      [
        "إضافة المنتجات بالصوت",
        "اضغط على الميكروفون واذكر المنتجات التي تريد إضافتها إلى قائمة التسوق الحالية.",
        "اسمح بالوصول إلى الميكروفون إذا طُلب منك ذلك، وتحدث باللغة المحددة في التطبيق."
      ]
    ]
  }
};
const INTRO_ILLUSTRATION_SPRITE = "data:image/webp;base64,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";
const INTRO_STORAGE_PREFIX = "my_easy_list_intro_v1:";
function ShoppingIntroduction({ uid, lang, request, ready }: {key?: string; uid: string; lang: IntroductionLanguage; request: number; ready: boolean}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const handled = useRef(0);
  const attempted = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const labels = INTRO_COPY[lang];
  const rtl = lang === "he" || lang === "ar";
  const finish = useCallback(() => {
    try { localStorage.setItem(INTRO_STORAGE_PREFIX + uid, "done"); } catch { /* Optional device storage. */ }
    setOpen(false);
  }, [uid]);
  useEffect(() => {
    if (!ready) return;
    if (request > handled.current) {
      handled.current = request; attempted.current = true; setStep(0); setOpen(true); return;
    }
    if (attempted.current) return;
    const timer = window.setTimeout(() => {
      attempted.current = true;
      let completed = false;
      try { completed = localStorage.getItem(INTRO_STORAGE_PREFIX + uid) === "done"; } catch {}
      if (!completed) { setStep(0); setOpen(true); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [uid, request, ready]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const host = dialog.current?.parentElement;
    const siblings = Array.from(document.body.children).filter((node) => node !== host) as HTMLElement[];
    const previousInert = siblings.map((node) => node.inert);
    siblings.forEach((node) => { node.inert = true; });
    primary.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); }
      if (event.key !== "Tab") return;
      const buttons = Array.from(dialog.current?.querySelectorAll("button:not(:disabled)") || []) as HTMLButtonElement[];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      siblings.forEach((node, index) => { node.inert = previousInert[index]; });
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, finish]);
  useEffect(() => { if (open) primary.current?.focus(); }, [open, step]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/45 flex items-center justify-center overflow-y-auto p-5" dir={rtl ? "rtl" : "ltr"} lang={lang} data-noswipe="true"
      style={{paddingTop: "max(20px, env(safe-area-inset-top))", paddingBottom: "max(20px, env(safe-area-inset-bottom))"}}
      onTouchStart={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="shopping-intro-title" aria-describedby="shopping-intro-body"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl overflow-y-auto text-center text-slate-800"
        style={{maxHeight: "calc(100dvh - 80px)", fontFamily: 'Segoe UI, system-ui, sans-serif'}}>
        <div className="flex justify-center gap-2 mb-5" aria-label={`${step + 1} / 4`}>
          {labels.steps.map((_, index) => <span key={index} aria-hidden="true" className={`h-2 w-2 rounded-full ${index === step ? "bg-indigo-600" : "bg-slate-200"}`} />)}
        </div>
        <div aria-hidden="true" className="mx-auto mb-4 w-full max-w-[280px] shrink-0"
          style={{aspectRatio: "3 / 2", backgroundImage: `url(${INTRO_ILLUSTRATION_SPRITE})`, backgroundSize: "200% 200%",
            backgroundPosition: ["0% 0%", "100% 0%", "0% 100%", "100% 100%"][step], backgroundRepeat: "no-repeat"}} />
        <div aria-live="polite" aria-atomic="true">
          <h2 id="shopping-intro-title" className="text-xl font-extrabold mb-3">{labels.steps[step][0]}</h2>
          <p id="shopping-intro-body" className="text-base leading-relaxed text-slate-600">{labels.steps[step][1]}</p>
          <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{labels.steps[step][2]}</p>
        </div>
        <button ref={primary} type="button" onClick={() => step === 3 ? finish() : setStep((value) => Math.min(3, value + 1))}
          className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-base font-bold text-white">{step === 3 ? labels.done : labels.next}</button>
        <div className="mt-2 flex justify-center gap-4">
          {step > 0 && <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="px-4 py-3 text-sm font-bold text-slate-500">{labels.back}</button>}
          {step < 3 && <button type="button" onClick={finish} className="px-4 py-3 text-sm font-bold text-slate-500">{labels.skip}</button>}
        </div>
      </div>
    </div>, document.body);
}

const MainList: React.FC = () => {
  const [introRequest, setIntroRequest] = useState({uid: "", count: 0});
  const [initialTabsCache] = useState(() => loadListTabsCache(auth.currentUser?.uid));
  const directoryOwnerRef = useRef<string | null>(initialTabsCache?.uid || null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const showStatusBar = async () => {
      try {
        await SystemBars.show({ bar: SystemBarType.StatusBar });
        await SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Light });
      } catch (error) { console.warn("Status bar configuration failed", error); }
    };
    void showStatusBar();
    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void showStatusBar();
    }).then((handle) => { if (disposed) void handle.remove(); else listener = handle; });
    return () => { disposed = true; void listener?.remove(); };
  }, []);

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

const purchasedDeleteLabels: Record<AppLang, Record<string, string>> = {"he": {"מחק את כל המוצרים שנקנו": "מחק את כל המוצרים שנקנו", "למחוק את כל המוצרים שנקנו ברשימה זו?": "למחוק את כל המוצרים שנקנו ברשימה זו?", "מחיקת המוצרים נכשלה": "מחיקת המוצרים נכשלה"}, "en": {"מחק את כל המוצרים שנקנו": "Delete all bought items", "למחוק את כל המוצרים שנקנו ברשימה זו?": "Delete all bought items in this list?", "מחיקת המוצרים נכשלה": "Could not delete items"}, "ru": {"מחק את כל המוצרים שנקנו": "Удалить все купленные товары", "למחוק את כל המוצרים שנקנו ברשימה זו?": "Удалить все купленные товары в этом списке?", "מחיקת המוצרים נכשלה": "Не удалось удалить товары"}, "ar": {"מחק את כל המוצרים שנקנו": "حذف جميع المنتجات المشتراة", "למחוק את כל המוצרים שנקנו ברשימה זו?": "هل تريد حذف جميع المنتجات المشتراة في هذه القائمة؟", "מחיקת המוצרים נכשלה": "تعذر حذف المنتجات"}};
const t = useMemo(() => {
  const dict = I18N[lang] || I18N.he;
  return (key: string) => {
    const k = String(key ?? "").trim();
    return purchasedDeleteLabels[lang]?.[k] ?? MULTI_LIST_I18N[lang]?.[k] ?? dict[k] ?? I18N.he[k] ?? k;
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
  const KEEP_AWAKE_STORAGE_KEY = "keepAwakeEnabled";
const [keepAwakeEnabled, setKeepAwakeEnabled] = useState<boolean>(() => {
  try {
    return localStorage.getItem(KEEP_AWAKE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
});

useEffect(() => {
  try {
    localStorage.setItem(KEEP_AWAKE_STORAGE_KEY, keepAwakeEnabled ? "true" : "false");
  } catch {
    // ignore
  }

  if (!Capacitor.isNativePlatform()) return;

  void (async () => {
    try {
      if (keepAwakeEnabled) {
        await KeepAwake.keepAwake();
      } else {
        await KeepAwake.allowSleep();
      }
    } catch (e) {
      console.error("KeepAwake failed", e);
    }
  })();
}, [keepAwakeEnabled]);

  const [moreMenuView, setMoreMenuView] = useState<"main" | "language">("main");
  const APP_ZOOM_STORAGE_KEY = "myEasyListAppZoom";
const APP_ZOOM_OPTIONS = [0.9, 1, 1.1] as const;

const [appZoom, setAppZoom] = useState<number>(() => {
  try {
    const saved = Number(localStorage.getItem(APP_ZOOM_STORAGE_KEY) || "1");
    return APP_ZOOM_OPTIONS.includes(saved as any) ? saved : 1;
  } catch {
    return 1;
  }
});

useEffect(() => {
  try {
    localStorage.setItem(APP_ZOOM_STORAGE_KEY, String(appZoom));
  } catch {
    // ignore
  }
}, [appZoom]);
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuElRef = useRef<HTMLDivElement | null>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; left: number; maxWidth: number } | null>(null);
  const [showSyncHint, setShowSyncHint] = useState(false);
 const [list, setList] = useState<ShoppingList | null>(() => {
  return loadLastUiCache()?.list || chooseLastListTab(initialTabsCache, localStorage.getItem("activeListId"));
});
  const [disconnectConfirm, setDisconnectConfirm] = useState<{title: string; message: string; label: string} | null>(null);
  const disconnectConfirmResolver = useRef<((accepted: boolean) => void) | null>(null);
  const askDisconnectConfirm = (title: string, message: string, label: string) => new Promise<boolean>((resolve) => {
    disconnectConfirmResolver.current?.(false);
    disconnectConfirmResolver.current = resolve;
    setDisconnectConfirm({ title, message, label });
  });
  const finishDisconnectConfirm = (accepted: boolean) => {
    const resolve = disconnectConfirmResolver.current;
    disconnectConfirmResolver.current = null; setDisconnectConfirm(null); resolve?.(accepted);
  };
  useEffect(() => { finishDisconnectConfirm(false); }, [list?.id, user?.uid]);
  useEffect(() => () => { disconnectConfirmResolver.current?.(false); }, []);
  const [listActionsPos, setListActionsPos] = useState<{top: number; left: number} | null>(null);
  const [purchasedConfirmListId, setPurchasedConfirmListId] = useState<string | null>(null);
  useEffect(() => { setPurchasedConfirmListId(null); }, [list?.id]);
  const [clearingPurchased, setClearingPurchased] = useState(false);
  const purchasedDeleteLock = useRef(false);
  useEffect(() => { setListActionsPos(null); }, [list?.id]);
  const [availableLists, setAvailableLists] = useState<ShoppingList[]>(() => initialTabsCache?.lists || []);
  const [defaultListContent, setDefaultListContent] = useState<ListTabsContent>(() => initialTabsCache?.content || {});
  const duplicateDefaultIds = availableLists.filter((entry) => user?.uid && isPrivateDefaultList(entry, user.uid)).map((entry) => entry.id).sort().join("|");
  useEffect(() => {
    const ids = duplicateDefaultIds ? duplicateDefaultIds.split("|") : [];
    // Retain the last known content flags until live snapshots update them.
    if (!ids.length) return;
    let active = true;
    const unsubscribe = ids.flatMap((id) => (["items", "favorites"] as const).map((kind) =>
      onSnapshot(collection(db, "lists", id, kind), (snapshot) => {
        if (!active) return;
        // A cached empty result cannot prove absence of server data.
        if (snapshot.empty && snapshot.metadata.fromCache) return;
        const containsData = !snapshot.empty;
        setDefaultListContent((previous) => ({ ...previous, [id]: { ...previous[id], [kind]: containsData } }));
      }, () => {
        if (active) setDefaultListContent((previous) => ({ ...previous, [id]: { ...previous[id], [kind]: true } }));
      })
    ));
    return () => { active = false; unsubscribe.forEach((stop) => stop()); };
  }, [duplicateDefaultIds, user?.uid]);
  const visibleListTabs = selectVisibleListTabs(
    list && !availableLists.some((entry) => entry.id === list.id) ? [...availableLists, list] : availableLists,
    list?.id, user?.uid || (!auth.currentUser && initialTabsCache?.uid) || auth.currentUser?.uid || "", defaultListContent
  );
  const [listEditor, setListEditor] = useState<"create" | "rename" | "delete" | null>(null);
  const [listNameDraft, setListNameDraft] = useState("");
  const [listOperationBusy, setListOperationBusy] = useState(false);
  const listOperationLockRef = useRef(false);
  const listRecoveryRef = useRef<string | null>(null);
  const listDirectorySeenRef = useRef<Set<string>>(new Set());
  const listEditorIdRef = useRef<string | null>(null);
  const activeListButtonRef = useRef<HTMLButtonElement | null>(null);
  const listUiIdRef = useRef<string | null>(list?.id || null);
  const listCacheReadyRef = useRef({ items: true, favorites: true });


const [items, setItems] = useState<ShoppingItem[]>(() => {
  return loadLastUiCache()?.items || [];
});
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

  const [favorites, setFavorites] = useState<FavoriteDoc[]>(() => {
  return loadLastUiCache()?.favorites || [];
});
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => {
  try {
    const saved = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "night" || saved === "system") {
      return saved;
    }
  } catch {}

  return "system";
});

useEffect(() => {
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, themeMode);
  } catch {}

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = () => {
    const systemIsDark = media.matches;
    const effectiveTheme = themeMode === "system"
      ? systemIsDark ? "dark" : "light"
      : themeMode;

    // Dark mode temporarily disabled
  };

  applyTheme();

  media.addEventListener("change", applyTheme);

  return () => {
    media.removeEventListener("change", applyTheme);
  };
}, [themeMode]);

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
const [categorySaveBusy, setCategorySaveBusy] = useState(false);
const categorySaveLock = useRef(false);
const [categorySheetValue, setCategorySheetValue] = useState<string>("other");
const [categorySheetPos, setCategorySheetPos] = useState<{ x: number; y: number } | null>(null);
const [customCategoryInput, setCustomCategoryInput] = useState("");
const [isAddingCategory, setIsAddingCategory] = useState(false);
const [userCustomCategories, setUserCustomCategories] = useState<string[]>([]);
const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
const [editingCategoryItemId, setEditingCategoryItemId] = useState<string | null>(null);
const [editingCategoryText, setEditingCategoryText] = useState("");
const allCategoryOptions = useMemo(() => {
  const builtInWithoutOther = CATEGORY_ORDER.filter((c) => c !== "other");
  return [...builtInWithoutOther, ...userCustomCategories, "other"];
}, [userCustomCategories]);

const orderedCategoryOptions = useMemo(() => {
  const base = [...allCategoryOptions];

  if (!categoryOrder.length) return base;

  return base.sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);

    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;

    return ai - bi;
  });
}, [allCategoryOptions, categoryOrder]);

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


useEffect(() => {
  if (!list?.id || listUiIdRef.current !== list.id ||
      !listCacheReadyRef.current.items || !listCacheReadyRef.current.favorites) return;

  saveLastUiCache({
    list,
    items,
    favorites,
    savedAt: Date.now(),
  });
}, [list, items, favorites]);

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

const moveCategory = async (category: string, direction: "up" | "down") => {
  if (!user?.uid) return;

  const baseOrder = [...allCategoryOptions];
  const currentOrder = categoryOrder.length
    ? baseOrder.sort((a, b) => {
        const ai = categoryOrder.indexOf(a);
        const bi = categoryOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : baseOrder;

  const index = currentOrder.indexOf(category);
  if (index === -1) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

  const nextOrder = [...currentOrder];
  [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];

  setCategoryOrder(nextOrder);

  const prefRef = doc(db, "users", user.uid, "preferences", "categories");
  await setDoc(
    prefRef,
    {
      categoryOrder: nextOrder,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};


const saveItemCategory = async (selectedCategory: string = categorySheetValue) => {
  if (!list?.id || !categorySheetItem || categorySaveLock.current) return;
  categorySaveLock.current = true; setCategorySaveBusy(true);
  try {

  const itemRef = doc(db, "lists", list.id, "items", categorySheetItem.id);

  await updateDoc(itemRef, {
    category: selectedCategory,
  });



  if (user?.uid) {
  const prefKey = normalizeCategoryPreferenceKey(categorySheetItem.name);
  if (prefKey) {
    const prefRef = doc(db, "users", user.uid, "preferences", "categories");
    await setDoc(
      prefRef,
      {
        itemCategoryMap: {
          [prefKey]: selectedCategory,
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
}

  setToast(t("הקטגוריה עודכנה"));
  closeCategorySheet();
  } catch (error) {
    console.error("Category update failed", error);
    setToast(t("שגיאה"));
  } finally { categorySaveLock.current = false; setCategorySaveBusy(false); }
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
  setCategoryOrder([]);
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

    setUserCustomCategories(custom as string[]);

const savedOrder = Array.isArray(data?.categoryOrder)
  ? data.categoryOrder.filter((x: unknown) => typeof x === "string")
  : [];

setCategoryOrder(savedOrder);
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
const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
const [isDeletingAccount, setIsDeletingAccount] = useState(false);

const deleteAccountPermanently = async () => {
  console.log("DELETE_ACCOUNT_FUNCTION_START");

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert(t("צריך להתחבר מחדש"));
      return;
    }

    setIsDeletingAccount(true);

    await deleteUser(currentUser);

    clearLastUiCache();
    localStorage.removeItem("activeListId");

    setShowDeleteAccountConfirm(false);
    setList(null);
    setItems([]);
    setFavorites([]);
    setUser(null);

    setToast(t("החשבון נמחק"));
  } catch (e: any) {
    if (e?.code === "auth/requires-recent-login") {
     setToast(t("צריך להתחבר מחדש"));
      await signOutSmart();
    } else {
      setToast(e?.message || t("שגיאה"));
    }
  } finally {
    setIsDeletingAccount(false);
  }
};


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
useEffect(() => {
  if (!listLoading) {
    setShowSyncHint(false);
    return;
  }

  const timer = setTimeout(() => {
    setShowSyncHint(true);
  }, 300);

  return () => clearTimeout(timer);
}, [listLoading]);

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

  React.useLayoutEffect(() => {
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
  const completionListId = list?.id;
  const completionTimer = window.setTimeout(() => {
    if (latestListIdRef.current === completionListId) setShowBoughtAllModal(true);
  }, 900);
  return () => window.clearTimeout(completionTimer);

}, [items, user?.uid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!user?.uid || directoryOwnerRef.current !== user.uid) return;
    saveListTabsCache({ uid: user.uid, lists: availableLists, content: defaultListContent });
  }, [user?.uid, availableLists, defaultListContent]);

  useEffect(() => {
    if (!user?.uid || !list || !isPrivateDefaultList(list, user.uid) || listOperationLockRef.current || isListening || categorySaveBusy) return;
    const currentContent = defaultListContent[list.id];
    // Switch away only after both server subscriptions confirm that this automatic list is empty.
    if (currentContent?.items !== false || currentContent?.favorites !== false) return;
    const target = visibleListTabs.find((entry) => !isPrivateDefaultList(entry, user.uid));
    if (!target) return;
    latestListIdRef.current = target.id; latestItemsRef.current = [];
    setItems([]); setFavorites([]); setList(target);
    localStorage.setItem("activeListId", target.id);
  }, [user?.uid, list?.id, availableLists, defaultListContent, isListening, categorySaveBusy, listOperationBusy]);

  useEffect(() => {
    let active = true;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const request = ++generation;
      setUser(u); setAuthLoading(false);
      if (!u) {
        clearListTabsCachePointer(); directoryOwnerRef.current = null;
        setAvailableLists([]); setDefaultListContent({});
        clearLastUiCache(); setList(null); setItems([]); setFavorites([]);
        setListLoading(false); setAuthInitialized(true); return;
      }
      if (directoryOwnerRef.current !== u.uid) {
        const cachedTabs = loadListTabsCache(u.uid);
        if (directoryOwnerRef.current) { setList(null); setItems([]); setFavorites([]); }
        directoryOwnerRef.current = u.uid;
        setAvailableLists(cachedTabs?.lists || []);
        setDefaultListContent(cachedTabs?.content || {});
      }
      setListLoading(true);
      try {
        const next = await loadInitialShoppingList(u.uid);
        if (!active || generation !== request || auth.currentUser?.uid !== u.uid) return;
        latestListIdRef.current = next.id;
        setList(next); localStorage.setItem("activeListId", next.id);
      } catch (error) {
        console.error("Initial list load failed", error);
        if (active && generation === request) setToast(t("פעולת הרשימה נכשלה"));
      } finally {
        if (active && generation === request) { setListLoading(false); setAuthInitialized(true); }
      }
    });
    return () => { active = false; ++generation; unsubscribe(); };
  }, []);
  const recoverUnavailableList = async (unavailableId: string) => {
    const uid = user?.uid;
    if (!uid || latestListIdRef.current !== unavailableId || listOperationLockRef.current || listRecoveryRef.current) return;
    listRecoveryRef.current = unavailableId;
    setItems([]); setFavorites([]); latestItemsRef.current = [];
    setShareMenuOpen(false); setMoreMenuOpen(false);
    try {
      const remaining = await getDocs(query(collection(db, "lists"), where("sharedWith", "array-contains", uid)));
      if (auth.currentUser?.uid !== uid || latestListIdRef.current !== unavailableId) return;
      const nextDoc = remaining.docs.find((d) => d.id !== unavailableId && !d.data().deletedAt);
      let next: ShoppingList;
      if (nextDoc) next = { ...nextDoc.data(), id: nextDoc.id } as ShoppingList;
      else {
        const ref = doc(collection(db, "lists"));
        next = { id: ref.id, title: "My Easy List", ownerUid: uid, sharedWith: [uid], createdAt: Date.now(), updatedAt: Date.now() };
        await setDoc(ref, next);
        if (auth.currentUser?.uid !== uid || latestListIdRef.current !== unavailableId) return;
      }
      latestListIdRef.current = next.id;
      setList(next); localStorage.setItem("activeListId", next.id);
      setToast(t("הוסרת מהרשימה"));
    } catch (error) { console.error("List recovery failed", error); setToast(t("פעולת הרשימה נכשלה")); }
    finally { if (listRecoveryRef.current === unavailableId) listRecoveryRef.current = null; }
  };

  useEffect(() => {
    if (!user?.uid) {
      if (authInitialized) setAvailableLists([]);
      listDirectorySeenRef.current.clear(); return;
    }
    return onSnapshot(
      query(collection(db, "lists"), where("sharedWith", "array-contains", user.uid)),
      (snapshot) => {
        if (auth.currentUser?.uid !== user.uid) return;
        // An empty local Firestore cache is not a server-side removal of the saved tabs.
        if (snapshot.metadata.fromCache && snapshot.empty) return;
        const directory = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ShoppingList))
          .filter((entry) => !(entry as any).deletedAt)
          .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.id.localeCompare(b.id));
        const selectedId = latestListIdRef.current;
        const previouslyVisible = selectedId && listDirectorySeenRef.current.has(selectedId);
        listDirectorySeenRef.current = new Set(directory.map((entry) => entry.id));
        if (snapshot.metadata.fromCache) {
          // A partial local snapshot must not replace the last complete tab bar.
          setAvailableLists((previous) => {
            const merged = new Map<string, ShoppingList>(previous.map((entry: ShoppingList) => [entry.id, entry] as const));
            for (const entry of directory) merged.set(entry.id, entry);
            return Array.from(merged.values()).sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.id.localeCompare(b.id));
          });
        } else {
          setAvailableLists(directory);
        }
        if (!snapshot.metadata.fromCache && previouslyVisible && selectedId && !directory.some((entry) => entry.id === selectedId)) {
          void recoverUnavailableList(selectedId);
        }
      },
      (error) => { console.error("List subscription failed", error); setToast(t("פעולת הרשימה נכשלה")); }
    );
  }, [user?.uid, t, authInitialized]);

  useEffect(() => {
    if (!list?.id || !user?.uid) return;
  
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

    let subscriptionActive = true;
    const unsubList = onSnapshot(listRef, async (snap) => {
  if (!subscriptionActive || latestListIdRef.current !== listRef.id) return;
  const nextList = { ...(snap.exists() ? snap.data() as ShoppingList : { sharedWith: [] }), id: snap.id } as ShoppingList;
  const sharedWith = Array.isArray(nextList.sharedWith) ? nextList.sharedWith : [];
  const stillHasAccess = !!user?.uid && sharedWith.includes(user.uid);

  if (!stillHasAccess || (nextList as any).deletedAt) {
    await recoverUnavailableList(listRef.id);
    return;
  }

  setList(nextList);
}, (error) => {
  if (!subscriptionActive || latestListIdRef.current !== listRef.id) return;
  if (error.code === "permission-denied" || error.code === "not-found") void recoverUnavailableList(listRef.id);
  else { console.error("Active list subscription failed", error); setToast(t("פעולת הרשימה נכשלה")); }
});

    const unsubItems = onSnapshot(itemsCol, (snap) => {
      const docs = snap.docs.map((d) => d.data() as ShoppingItem);
      if (subscriptionActive && latestListIdRef.current === listRef.id && listRecoveryRef.current !== listRef.id) {
        listCacheReadyRef.current.items = true;
        setItems(docs);
      }
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
      if (subscriptionActive && latestListIdRef.current === listRef.id && listRecoveryRef.current !== listRef.id) {
        listCacheReadyRef.current.favorites = true;
        setFavorites(favDocs);
      }
    });

    return () => {
      subscriptionActive = false;
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
  const existing = items.find((it) => it.id === s.itemId);

  if (existing?.isPurchased) {
    await updateDoc(doc(db, "lists", list.id, "items", existing.id), {
      isPurchased: false,
      quantity: 1,
      purchasedAt: null,
      purchasedByUid: "",
      purchasedByName: "",
      purchasedByInitial: "",
      updatedAt: Date.now(),
    });

    setToast(t("הפריט הוחזר לרשימה"));
  }

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

  // אם הפריט נמצא ב"נקנו" - מחזירים אותו לרשימה הפעילה
  if (existing.isPurchased) {
    await updateDoc(doc(db, "lists", list.id, "items", existing.id), {
      isPurchased: false,
      quantity: 1,
      purchasedAt: null,
      purchasedByUid: "",
      purchasedByName: "",
      purchasedByInitial: "",
      updatedAt: Date.now(),
    });

    setToast(t("הפריט הוחזר לרשימה"));
  } else {
    setToast(t("הפריט כבר קיים ברשימה"));
  }

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

  const titleIsDefault = (list as (ShoppingList & { titleIsCustom?: boolean }) | null)?.titleIsCustom !== true && (!rawTitleNorm || knownDefaultTitlesNorm.has(rawTitleNorm));
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

const titleIsDefault = (list as (ShoppingList & { titleIsCustom?: boolean }) | null)?.titleIsCustom !== true && (!rawTitleNorm || knownDefaultTitlesNorm.has(rawTitleNorm));

const appName = myListNameByLang[shareLang] || myListNameByLang.he;

// If user didn't rename the list (or it matches a known default), localize it for sharing.
const title = titleIsDefault ? `${appName}:` : rawTitle;

const formatShareItemLine = (i: ShoppingItem) => {
  const qtyText = formatItemQuantity(i.quantity || 1);

  if ((i.quantity || 1) === 1) return `${RLE}${i.name}${PDF}`;

  if (shareLang === "en" || shareLang === "ru") {
    return `${RLE}${LRI}${qtyText}${PDI} ${i.name} X${PDF}`;
  }

  return `${RLE}${i.name} X ${LRI}${qtyText}${PDI}${PDF}`;
};

const categoryNameForShare = (category: string) => {
  if (CATEGORY_ORDER.includes(category as CategoryKey)) {
    return (
      categoryLabelByLang[shareLang]?.[category as CategoryKey] ||
      categoryLabelByLang.he[category as CategoryKey] ||
      category
    );
  }

  return category;
};

const lines =
  active.length > 0
    ? [...allCategoryOptions].sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  })
        .map((category) => {
          const categoryItems = active.filter(
            (i) =>
              resolveItemCategory(i, userCategoryMap, userCustomCategories) ===
              category
          );

          if (categoryItems.length === 0) return "";

          return `*${categoryNameForShare(category)}:*\n${categoryItems
            .map(formatShareItemLine)
            .join("\n")}`;
        })
        .filter(Boolean)
        .join("\n\n")
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

    const existing = items.find((i) => normalizeItemName(i.name) === favKey);

if (existing) {
  if (existing.isPurchased) {
    await updateDoc(doc(db, "lists", list.id, "items", existing.id), {
      isPurchased: false,
      quantity: 1,
      purchasedAt: null,
      purchasedByUid: "",
      purchasedByName: "",
      purchasedByInitial: "",
      updatedAt: Date.now(),
    });

    setToast(t("הפריט הוחזר לרשימה"));
    return { targetId: existing.id, created: false };
  }

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

    const existing = itemsNow.find((i) => normalize(i.name) === normalize(name));
    if (existing) {
  if (existing.isPurchased) {
    await updateDoc(doc(db, "lists", listId, "items", existing.id), {
      isPurchased: false,
      quantity: 1,
      purchasedAt: null,
      purchasedByUid: "",
      purchasedByName: "",
      purchasedByInitial: "",
      updatedAt: Date.now(),
    });

    setToast(t("הפריט הוחזר לרשימה"));
    return;
  }

  await updateDoc(doc(db, "lists", listId, "items", existing.id), {
    quantity: qty,
    updatedAt: Date.now(),
  });
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

      const existing = itemsNow.find((i) => normalize(i.name) === normalize(name));
      if (existing) {
  if (existing.isPurchased) {
    await updateDoc(doc(db, "lists", listId, "items", existing.id), {
      isPurchased: false,
      quantity: 1,
      purchasedAt: null,
      purchasedByUid: "",
      purchasedByName: "",
      purchasedByInitial: "",
      updatedAt: Date.now(),
    });

    setToast(t("הפריט הוחזר לרשימה"));
    continue;
  }

  const prevQty = existing.quantity;

  await updateDoc(doc(db, "lists", listId, "items", existing.id), {
    quantity: p.qty,
    updatedAt: Date.now(),
  });

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

    const ok = await askDisconnectConfirm(t("שיתוף"), t("האם לנתק משתמש מהרשימה?"), t("יציאה"));
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

  React.useLayoutEffect(() => {
    const nextId = list?.id || null;
    if (listUiIdRef.current === nextId) return;
    listUiIdRef.current = nextId;
    listCacheReadyRef.current = { items: false, favorites: false };
    const cached = loadLastUiCache();
    const canRestore = nextId && cached?.list?.id === nextId;
    const nextItems = canRestore ? cached.items : [];
    setItems(nextItems); setFavorites(canRestore ? cached.favorites : []);
    latestItemsRef.current = nextItems;
    setInputValue(""); setIsSuggestOpen(false); setActiveSuggestIndex(-1);
    setShareMenuOpen(false); setMoreMenuOpen(false);
    setCategorySheetOpen(false); setCategorySheetItem(null); setEditingCategoryItemId(null);
    setShowBoughtAllModal(false); confettiFiredRef.current = false;
    completionHandledByUserRef.current = null;
    setUndoToast(null);
    if (undoToastTimerRef.current !== null) window.clearTimeout(undoToastTimerRef.current);
    undoToastTimerRef.current = null;
    clearItemLongPress();
    swipeStartRef.current = null; favSwipeStartRef.current = null;
    setSwipeUi({ id: null, dx: 0 }); setFavSwipeUi({ id: null, dx: 0, rawDx: 0 });
    setLeavingIds(new Set()); setFavoriteFlashIds(new Set()); setListFlashIds(new Set());
    setFavToListFlashIds(new Set()); setDeleteFlashIds(new Set()); setFavDeleteFlashIds(new Set());
    pendingEnterIdsRef.current.clear(); setEnterAnim({});
    setListEditor(null); setShowClearConfirm(false); setDeleteCategoryConfirm(null);
    setEditingCustomCategory(null); setCustomCategoryInput("");
    setCreatorHintOpenId(null);
    activeListButtonRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [list?.id]);



  // לא חוסמים את ה-UI בזמן בדיקת התחברות

  if (!user && authInitialized) {
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
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-800 py-4 rounded-2xl font-black shadow-sm"
>
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.5 6.9l6.2 5.2C38.3 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
  </svg>

  <span>Continue with Google</span>
</button>
          <LegalFooter lang={lang} className="pt-1" />
        </div>
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
  
  // Render tabs independently of the asynchronous active-list document load.
  const displayedList = list || availableLists.find((entry) => entry.id === localStorage.getItem("activeListId")) || availableLists[0] || null;
  const multiListInteractionBusy = !!listRecoveryRef.current || isListening || voiceUi !== "idle" || !!undoToast ||
    swipeUi.id !== null || favSwipeUi.id !== null || isDeletingAccount ||
    categorySaveBusy || !!disconnectConfirm || !!purchasedConfirmListId || clearingPurchased || leavingIds.size > 0 || favoriteFlashIds.size > 0 || listFlashIds.size > 0 ||
    favToListFlashIds.size > 0 || deleteFlashIds.size > 0 || favDeleteFlashIds.size > 0;

  const clearPurchasedItems = async () => {
    const targetId = list?.id;
    if (!targetId || targetId !== purchasedConfirmListId || !user || !isOnline || (multiListInteractionBusy && !purchasedConfirmListId) || purchasedDeleteLock.current || listOperationLockRef.current) return;
    purchasedDeleteLock.current = true;
    listOperationLockRef.current = true;
    setClearingPurchased(true);
    try {
      const snapshot = await getDocs(query(collection(db, "lists", targetId, "items"), where("isPurchased", "==", true)));
      // Recheck server state in each transaction so restored items are preserved.
      for (let offset = 0; offset < snapshot.docs.length; offset += 100) {
        const group = snapshot.docs.slice(offset, offset + 100);
        await runTransaction(db, async (tx) => {
          const current = await Promise.all(group.map((entry) => tx.get(entry.ref)));
          current.forEach((entry, index) => {
            if (entry.exists() && entry.data().isPurchased === true) tx.delete(group[index].ref);
          });
        });
      }
    } catch (error) {
      console.error("Purchased items deletion failed", error);
      setToast(t("מחיקת המוצרים נכשלה"));
    } finally {
      purchasedDeleteLock.current = false;
      listOperationLockRef.current = false;
      setClearingPurchased(false);
      setPurchasedConfirmListId(null);
    }
  };

  const switchShoppingList = (next: ShoppingList) => {
    if (next.id === list?.id || listOperationLockRef.current) return;
    if (multiListInteractionBusy) { setToast(t("יש לסיים את הפעולה לפני החלפת רשימה")); return; }
    latestListIdRef.current = next.id;
    latestItemsRef.current = [];
    setList(next);
    localStorage.setItem("activeListId", next.id);
    // Keep favorites/list mode when changing the selected list.
  };

  const openListEditor = (mode: "create" | "rename" | "delete") => {
    if (multiListInteractionBusy || listOperationLockRef.current) {
      setToast(t("יש לסיים את הפעולה לפני החלפת רשימה")); return;
    }
    listEditorIdRef.current = list?.id || null;
    setListNameDraft(mode === "create" ? "" : getLocalizedListTitle(list, lang));
    setListEditor(mode);
  };

  const saveListOperation = async () => {
    if (!user || !listEditor || listOperationLockRef.current || !isOnline) return;
    const mode = listEditor;
    const targetId = listEditorIdRef.current;
    const title = listNameDraft.trim();
    if (mode !== "delete" && !title) { setToast(t("שם הרשימה נדרש")); return; }
    listOperationLockRef.current = true;
    setListOperationBusy(true);
    try {
      if (mode === "create") {
        const ref = doc(collection(db, "lists"));
        const next: ShoppingList = {
          id: ref.id, title, ...{ titleIsCustom: true }, ownerUid: user.uid, sharedWith: [user.uid],
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        await setDoc(ref, next);
        latestListIdRef.current = next.id;
        setList(next); localStorage.setItem("activeListId", next.id);
      } else {
        if (!targetId || targetId !== list?.id) throw new Error(t("הרשימה לא קיימת"));
        if (mode === "rename") {
          await runTransaction(db, async (tx) => {
            const ref = doc(db, "lists", targetId);
            const snap = await tx.get(ref);
            if (!snap.exists() || snap.data().ownerUid !== user.uid) throw new Error(t("פעולת הרשימה נכשלה"));
            tx.update(ref, { title, titleIsCustom: true, updatedAt: Date.now() });
          });
        } else {
          // Logical deletion works with existing member-update rules and revokes
          // outstanding invitations. Retain data rather than partially purge it.
          const visible = await getDocs(query(collection(db, "lists"), where("sharedWith", "array-contains", user.uid)));
          let next = visible.docs.filter((d) => d.id !== targetId)
            .map((d) => ({ ...d.data(), id: d.id } as ShoppingList))[0];
          const replacementRef = next ? null : doc(collection(db, "lists"));
          if (!next && replacementRef) next = {
            id: replacementRef.id, title: "My Easy List", ownerUid: user.uid,
            sharedWith: [user.uid], createdAt: Date.now(), updatedAt: Date.now(),
          };
          await runTransaction(db, async (tx) => {
            const ref = doc(db, "lists", targetId);
            const current = await tx.get(ref);
            if (!current.exists() || current.data().ownerUid !== user.uid) throw new Error(t("פעולת הרשימה נכשלה"));
            tx.update(ref, { deletedAt: Date.now(), sharedWith: [], pendingInvites: {}, updatedAt: Date.now() });
            if (replacementRef && next) tx.set(replacementRef, next);
          });
          if (!next) throw new Error(t("פעולת הרשימה נכשלה"));
          latestListIdRef.current = next.id;
          setItems([]); setFavorites([]); latestItemsRef.current = [];
          setList(next); localStorage.setItem("activeListId", next.id);
          setToast(t("הרשימה נמחקה"));
        }
      }
      setListEditor(null);
    } catch (error: any) {
      console.error("List operation failed", error);
      setToast(`${t("פעולת הרשימה נכשלה")}: ${error?.message || ""}`);
    } finally { listOperationLockRef.current = false; setListOperationBusy(false); }
  };

  return (
    <div
  ref={appRootRef}
className="flex flex-col h-[100dvh] max-w-md mx-auto bg-slate-50 relative shadow-2xl overflow-hidden"
  dir={isRTL ? "rtl" : "ltr"}
  style={{
  fontFamily: 'Segoe UI, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  zoom: appZoom,
}}
>
    <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      {user?.uid && list?.id ? <ShoppingIntroduction key={user.uid} uid={user.uid} lang={lang} request={introRequest.uid === user.uid ? introRequest.count : 0}
        ready={authInitialized && !listLoading && !moreMenuOpen && !shareMenuOpen && !listEditor && !purchasedConfirmListId && !disconnectConfirm && !categorySheetOpen && !showClearConfirm && !showDeleteAccountConfirm && !showBoughtAllModal && !showVoiceCoach && !isListening} /> : null}
      {listEditor ? createPortal(
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-5" dir={isRTL ? "rtl" : "ltr"} data-noswipe="true">
          <form role="dialog" aria-modal="true" aria-labelledby="list-editor-title" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl" onSubmit={(event) => { event.preventDefault(); void saveListOperation(); }}>
            <h2 id="list-editor-title" className="text-lg font-bold text-slate-800 mb-4">{t(listEditor === "create" ? "רשימה חדשה" : listEditor === "rename" ? "שינוי שם הרשימה" : "מחיקת רשימה")}</h2>
            {listEditor === "delete" ? <p className="text-sm text-slate-600 mb-4">{getLocalizedListTitle(list, lang)}<br />{t("מחיקת הרשימה תסיר אותה ואת המוצרים והמועדפים שלה לכל המשתתפים. להמשיך?")}</p> :
              <label className="block text-sm text-slate-600">{t("שם הרשימה")}<input autoFocus required maxLength={60} value={listNameDraft} disabled={listOperationBusy} onChange={(event) => setListNameDraft(event.target.value)} className="block w-full mt-2 mb-4 rounded-xl border border-slate-200 px-3 py-3 text-slate-800" /></label>}
            <div className="flex gap-2">
              <button type="submit" disabled={listOperationBusy || !isOnline} className={`flex-1 rounded-xl py-3 text-white font-bold disabled:opacity-50 ${listEditor === "delete" ? "bg-rose-600" : "bg-indigo-600"}`}>{listOperationBusy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t(listEditor === "delete" ? "מחיקת רשימה" : listEditor === "create" ? "יצירה" : "שמירה")}</button>
              <button type="button" disabled={listOperationBusy} onClick={() => setListEditor(null)} className="flex-1 rounded-xl py-3 bg-slate-100 text-slate-600 font-bold">{t("ביטול")}</button>
            </div>
          </form>
        </div>, document.body
      ) : null}

      {purchasedConfirmListId ? createPortal(
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-5" dir={isRTL ? "rtl" : "ltr"} data-noswipe="true">
          <form role="dialog" aria-modal="true" aria-labelledby="purchased-delete-title" aria-describedby="purchased-delete-description" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl"
            onSubmit={(event) => { event.preventDefault(); void clearPurchasedItems(); }}
            onKeyDown={(event) => { if (event.key === "Escape" && !clearingPurchased) setPurchasedConfirmListId(null); }}>
            <h2 id="purchased-delete-title" className="text-lg font-bold text-slate-800 mb-4">{t("מחק את כל המוצרים שנקנו")}</h2>
            <p id="purchased-delete-description" className="text-sm text-slate-600 mb-4">{getLocalizedListTitle(list, lang)}<br />{t("למחוק את כל המוצרים שנקנו ברשימה זו?")}</p>
            <div className="flex gap-2">
              <button type="submit" disabled={clearingPurchased || !isOnline} className="flex-1 rounded-xl py-3 text-white font-bold disabled:opacity-50 bg-rose-600">
                {clearingPurchased ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("מחק")}
              </button>
              <button autoFocus type="button" disabled={clearingPurchased} onClick={() => setPurchasedConfirmListId(null)} className="flex-1 rounded-xl py-3 bg-slate-100 text-slate-600 font-bold">{t("ביטול")}</button>
            </div>
          </form>
        </div>, document.body
      ) : null}

      {disconnectConfirm ? createPortal(
        <div className="fixed inset-0 z-[210] bg-black/40 flex items-center justify-center p-5" dir={isRTL ? "rtl" : "ltr"} data-noswipe="true">
          <div role="dialog" aria-modal="true" aria-labelledby="disconnect-title" aria-describedby="disconnect-description" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl"
            onKeyDown={(event) => { if (event.key === "Escape") finishDisconnectConfirm(false); }}>
            <h2 id="disconnect-title" className="text-lg font-bold text-slate-800 mb-4">{disconnectConfirm.title}</h2>
            <p id="disconnect-description" className="text-sm text-slate-600 mb-4">{disconnectConfirm.message}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => finishDisconnectConfirm(true)} className="flex-1 rounded-xl py-3 text-white font-bold bg-rose-600">{disconnectConfirm.label}</button>
              <button autoFocus type="button" onClick={() => finishDisconnectConfirm(false)} className="flex-1 rounded-xl py-3 bg-slate-100 text-slate-600 font-bold">{t("ביטול")}</button>
            </div>
          </div>
        </div>, document.body
      ) : null}

      {/* Sticky top chrome */}
      <div
        className="sticky top-0 z-40 bg-slate-50"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px), 8px)" }}
      >
  {/* Header */}
<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 pt-3 pb-1">
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

  {(user || !authInitialized) && displayedList ? (
    <div className="mt-3" data-noswipe="true">
      <div role="tablist" aria-label={t("ניהול רשימה")} className="flex items-center gap-2 overflow-x-auto pb-1" style={{ touchAction: "pan-x" }}>
        {visibleListTabs.map((entry) => (
          <div key={entry.id} className={`shrink-0 flex items-center rounded-2xl max-w-[220px] ${entry.id === displayedList.id ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600"}`}>
            <button ref={entry.id === displayedList.id ? activeListButtonRef : undefined} role="tab" aria-selected={entry.id === displayedList.id} type="button"
              disabled={!user || !list || listOperationBusy || multiListInteractionBusy} onClick={() => switchShoppingList(entry)}
              className="min-w-0 px-4 py-2 min-h-[44px] text-sm font-bold truncate disabled:opacity-60">{getLocalizedListTitle(entry, lang)}</button>
            {entry.id === displayedList.id && entry.ownerUid === user?.uid ? <button type="button"
              disabled={!user || !list || listOperationBusy || multiListInteractionBusy} aria-label={t("ניהול רשימה")} aria-haspopup="menu" aria-expanded={!!listActionsPos}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setListActionsPos(listActionsPos ? null : { top: Math.min(rect.bottom + 6, window.innerHeight - 120), left: Math.max(8, Math.min(isRTL ? rect.right - 220 : rect.left, window.innerWidth - 228)) });
              }} className="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl disabled:opacity-60">
              <MoreVertical className="w-5 h-5" />
            </button> : null}
          </div>
        ))}
        <button type="button" disabled={!user || !list || listOperationBusy || multiListInteractionBusy} onClick={() => openListEditor("create")}
          className="shrink-0 flex items-center gap-1 rounded-2xl px-3 py-2 border border-indigo-500 text-indigo-600 text-sm font-bold disabled:opacity-60">
          <Plus className="w-4 h-4" />{t("רשימה חדשה")}
        </button>
      </div>

    </div>
  ) : null}


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
    const ok = await askDisconnectConfirm(t("התנתק מרשימת קניות משותפת"), `${t("התנתק מרשימת קניות משותפת")} ?`, t("יציאה"));
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
          <button type="button" onClick={() => { setMoreMenuOpen(false); setMoreMenuView("main"); setIntroRequest((value) => ({uid: user?.uid || "", count: value.count + 1})); }}
            className="w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700">
            <ListChecks className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-semibold text-[15px]">{INTRO_COPY[lang].menu}</span>
          </button>


        <button
  type="button"
  onClick={() => setKeepAwakeEnabled((v) => !v)}
  className={`w-full py-3 hover:bg-slate-50 flex items-center justify-between text-slate-700 ${
  isRTL
    ? "flex-row-reverse pr-2 pl-4"
    : "flex-row pl-2 pr-4"
}`}
>
  <span>{keepAwakeEnabled
  ? `🔆 ${t("המסך נשאר דולק")}`
  : `🌙 ${t("השאר מסך דולק")}`}</span>

  <span
    className={`w-3 h-3 rounded-full ${
      keepAwakeEnabled ? "bg-emerald-500" : "bg-slate-300"
    }`}
  />
</button>

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
    setAppZoom((current) => {
      const currentIndex = APP_ZOOM_OPTIONS.findIndex((x) => x === current);
      const nextIndex =
        currentIndex >= 0 ? (currentIndex + 1) % APP_ZOOM_OPTIONS.length : 1;

      return APP_ZOOM_OPTIONS[nextIndex];
    });
  }}
  className={`w-full py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Monitor className="w-4 h-4 text-indigo-500 shrink-0" />

  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("רזולוציה")}
  </span>

  <span className="text-xs font-black text-indigo-600">
    {Math.round(appZoom * 100)}%
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
    setShowDeleteAccountConfirm(true);
  }}
  className={`w-full py-3 hover:bg-rose-50 flex items-center gap-3 text-rose-700 ${
    isRTL
      ? "flex-row-reverse justify-start pr-2 pl-4"
      : "flex-row justify-start pl-2 pr-4"
  }`}
>
  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />

  <span className="font-semibold text-[15px] leading-none whitespace-nowrap">
    {t("מחיקת חשבון")}
  </span>
</button>




          <button
  type="button"
  onClick={() => {
    setMoreMenuOpen(false);
    setMoreMenuView("main");
    void (async () => {
      if (await askDisconnectConfirm(t("יציאה"), `${t("יציאה")} ?`, t("יציאה"))) await signOutSmart();
    })();
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
{/* Avatars (separate layer) */}
{headerSharedUsersPreview.length > 0 ? (
  <div
    onClick={toggleShareMenu}
    className="flex items-center justify-center cursor-pointer pt-1 pb-1 bg-slate-50"
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

{listActionsPos && user?.uid === list?.ownerUid ? createPortal(
  <div className="fixed inset-0 z-[130]" onClick={() => setListActionsPos(null)} onKeyDown={(event) => { if (event.key === "Escape") setListActionsPos(null); }}>
    <div role="menu" dir={isRTL ? "rtl" : "ltr"} className="fixed w-[220px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden" style={listActionsPos}>
      <button role="menuitem" type="button" autoFocus onClick={() => { setListActionsPos(null); openListEditor("rename"); }} className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 hover:bg-slate-50"><Pencil className="w-5 h-5" />{t("שינוי שם הרשימה")}</button>
      <button role="menuitem" type="button" onClick={() => { setListActionsPos(null); openListEditor("delete"); }} className="w-full px-4 py-3 flex items-center gap-3 border-t border-slate-100 text-rose-600 hover:bg-rose-50"><Trash2 className="w-5 h-5" />{t("מחיקת רשימה")}</button>
    </div>
  </div>, document.body
) : null}


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

       <div className={`mt-5 flex gap-3 ${isRTL ? "flex-row-reverse" : "flex-row-reverse"}`}>
  <button
    type="button"
    onClick={async () => {
      const categoryToDelete = deleteCategoryConfirm;
      setDeleteCategoryConfirm(null);
      if (!categoryToDelete) return;
      await deleteCustomCategory(categoryToDelete);
    }}
    className="flex-1 py-3 rounded-2xl font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-200"
  >
    {t("מחק קטגוריה")}
  </button>

  <button
    type="button"
    onClick={() => setDeleteCategoryConfirm(null)}
    className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-600"
  >
    {t("ביטול")}
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
      <main className="flex-1 min-h-0 flex flex-col p-5 overflow-hidden">
{activeTab === "list" ? (
    <>
<form onSubmit={addItem} className="relative shrink-0 z-30 mb-6">
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

      
  
<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-5 px-5 pb-36">

     {showSyncHint && (listLoading || !list?.id) ? (
  <div className="flex items-center justify-center py-10 text-sm font-bold text-slate-400">
    <Loader2 className="w-4 h-4 animate-spin ml-2" />
{t("מסנכרן רשימה...")}
  </div>


) : (items?.length ?? 0) === 0 ? (
  
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
          {orderedCategoryOptions.map((categoryKey) => {
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

                  const effectiveDx = isCategoryOpen
  ? 0
  : swipeUi.id === item.id
    ? swipeUi.dx
    : hintDx;

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
                          className="border-t-2 border-indigo-200 bg-indigo-50/60 rounded-b-2xl overflow-hidden shadow-inner ring-1 ring-indigo-200 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
  
                          <div className={`px-4 pt-3 mb-3 flex items-center justify-between ${isRTL ? "flex-row" : "flex-row-reverse"}`}>
  <div className={`text-sm font-black text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>
    {t("העבר לקטגוריה")}
  </div>

  <div className="flex items-center gap-1" data-noswipe="true">
    <button
      type="button"
      data-noswipe="true"
      onClick={(e) => {
        e.stopPropagation();
        moveCategory(categorySheetValue, "up");
      }}
      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 font-black shadow-sm active:scale-95"
    >
      ↑
    </button>

    <button
      type="button"
      data-noswipe="true"
      onClick={(e) => {
        e.stopPropagation();
        moveCategory(categorySheetValue, "down");
      }}
      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 font-black shadow-sm active:scale-95"
    >
      ↓
    </button>
  </div>
</div>

                          <div className="px-4 pb-4">
                            <div className="space-y-2">
                              {orderedCategoryOptions.map((cat) => {
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
                                          disabled={categorySaveBusy}
                                          onClick={() => { setCategorySheetValue(cat); void saveItemCategory(cat); }}
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
                                    await saveItemCategory(name);
                                  }}
                                  className="w-full py-3 rounded-2xl font-black bg-emerald-500 text-white"
                                >
                                  {t("שמור")}
                                </button>
                              </div>
                            )}

                            
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
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-lg font-bold text-slate-700 ${rtlClasses.text}`}>{t("נקנו")} ({purchasedItems.length})</h3>
              <button type="button" disabled={clearingPurchased || !isOnline || multiListInteractionBusy || listOperationBusy} onClick={() => { if (list?.id) setPurchasedConfirmListId(list.id); }}
                aria-label={t("מחק את כל המוצרים שנקנו")} title={t("מחק את כל המוצרים שנקנו")}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-50">
                {clearingPurchased ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>

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
    </div>
  </>
) : (
<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-6 pb-36">
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


      {/* Delete Account Confirm Modal */}
{showDeleteAccountConfirm ? (
  <div
    className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6"
    dir={isRTL ? "rtl" : "ltr"}
  >
    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className={rtlClasses.text}>
          <div className="text-lg font-black text-slate-800">
            {t("למחוק את החשבון?")}
          </div>

          <div className="text-sm font-bold text-slate-400">
            {t("הפעולה תמחק את פרטי המשתמש ותסיר אותך מהרשימות.")}
          </div>
        </div>
      </div>

      <div className={`flex gap-3 pt-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
        <button
          type="button"
          disabled={isDeletingAccount}
          onClick={() => setShowDeleteAccountConfirm(false)}
          className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700 disabled:opacity-60"
        >
          {t("ביטול")}
        </button>

        <button
          type="button"
          disabled={isDeletingAccount}
          onClick={() => {
            void deleteAccountPermanently();
          }}
          className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white disabled:opacity-60"
        >
          {isDeletingAccount ? t("מעבד") : t("מחק חשבון")}
        </button>
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
