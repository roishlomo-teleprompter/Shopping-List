import React, { useEffect, useMemo, useRef, useState } from "react";
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
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
  signInWithRedirect,
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

import { auth, db, googleProvider } from "./firebase.ts";
import { ShoppingItem, ShoppingList, Tab } from "./types.ts";

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
function buildInviteLink(listId: string, token: string) {
  const basePath = import.meta.env.BASE_URL || "/";
  const origin = window.location.origin;
  return `${origin}${basePath}#/invite?listId=${encodeURIComponent(listId)}&token=${encodeURIComponent(token)}`;
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

async function signInSmart() {
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
    // ignore
  }
    await signInWithPopup(auth, googleProvider);
  } catch (e: any) {
    const code = e?.code as string | undefined;
    if (
      code === "auth/popup-blocked" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/popup-closed-by-user"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    await signInWithRedirect(auth, googleProvider);
  }
}

function openWhatsApp(text: string) {
  const message = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${message}`, "_blank");
}

// ---------------------------
// Invite Page
// ---------------------------
const InvitePage: React.FC = () => {
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
      setError("קישור ההזמנה חסר נתונים (listId או token)");
      return;
    }
    if (!user) {
      await handleLogin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const listDocRef = doc(db, "lists", listId);
        const listSnap = await transaction.get(listDocRef);

        if (!listSnap.exists()) throw new Error("הרשימה לא קיימת");

        const data = listSnap.data() as ShoppingList;
        const invite = (data as any).pendingInvites?.[token];

        if (!invite) throw new Error("הזמנה לא בתוקף");
        if (invite.expiresAt < Date.now()) throw new Error("פג תוקף ההזמנה");

        transaction.update(listDocRef, {
          sharedWith: arrayUnion(user.uid),
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
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Share2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-slate-800">הוזמנת לרשימה</h1>

        {!listId || !token ? <p className="text-rose-500 font-bold">קישור ההזמנה לא תקין</p> : null}
        {error ? <p className="text-rose-500 font-bold break-words">{error}</p> : null}

        {!user ? (
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black"
          >
            <LogIn className="w-4 h-4" />
            התחבר עם גוגל להצטרפות
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "הצטרף לרשימה"}
          </button>
        )}
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

const normalize = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/[״"']/g, "")
    .replace(/\s+/g, " ");

const normalizeVoiceText = (s: string) => {
  const t = (s || "").trim();
  return t
    .replace(/[.?!]/g, " ")
    .replace(/，/g, ",")
    .replace(/\bפסיקים\b/g, ",")
    .replace(/\bפסיק\b/g, ",")
    .replace(/\s+(בבקשה|פליז|תודה)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

function isQtyToken(tok: string) {
  if (!tok) return false;
  if (/^\d+$/.test(tok)) return true;
  return HEB_NUMBER_WORDS[tok] != null;
}

function qtyFromToken(tok: string): number | null {
  if (!tok) return null;
  if (/^\d+$/.test(tok)) return Number(tok);
  const n = HEB_NUMBER_WORDS[tok];
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
function parseSegmentTokensToItems(segRaw: string): Array<{ name: string; qty: number }> {
  const seg = normalize(segRaw);
  if (!seg) return [];

  let tokens = seg.split(" ").filter(Boolean);
  tokens = mergeCompounds(tokens);
  if (tokens.length === 0) return [];

  const out: Array<{ name: string; qty: number }> = [];

  let pendingQty = 1;
  let nameParts: string[] = [];

  const flush = (qtyOverride?: number) => {
    const name = nameParts.join(" ").trim();
    if (name) {
      const q = Math.max(1, Number(qtyOverride ?? pendingQty ?? 1));
      out.push({ name, qty: q });
    }
    pendingQty = 1;
    nameParts = [];
  };

  const nextToken = (i: number) => (i + 1 < tokens.length ? tokens[i + 1] : "");

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (isQtyToken(tok)) {
      const q = Math.max(1, qtyFromToken(tok) || 1);
      const nxt = nextToken(i);

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
    const nxt = nextToken(i);

    // keep at least 2 words for known prefixes (רסק עגבניות, שמן זית וכו')
    if (nameParts.length === 1 && shouldKeepAsMultiwordByPrefix(nameParts[0])) {
      continue;
    }

    // keep phrases with connectors
    if (tok === "של" || tok === "עם") continue;
    if (nxt === "של" || nxt === "עם") continue;

    // if next is qty, wait (suffix qty) or prefix qty handling will flush
    if (isQtyToken(nxt)) continue;

    // otherwise flush after each word/phrase - this splits "ביצים חלב עגבניה"
    flush();
  }

  if (nameParts.length > 0) flush();

  return out
    .map((x) => ({ name: x.name.replace(/\s+/g, " ").trim(), qty: Math.max(1, Number(x.qty || 1)) }))
    .filter((x) => x.name.length > 0);
}

/**
 * Parse a phrase into multiple items.
 * Supports commas / וגם / ואז / אחר כך, and also no commas.
 */
function parseItemsFromText(raw: string): Array<{ name: string; qty: number }> {
  const t0 = normalizeVoiceText(raw);
  const t = normalize(t0);
  if (!t) return [];

  const cleaned = t
    .replace(/\s+וגם\s+/g, ",")
    .replace(/\s+ואז\s+/g, ",")
    .replace(/\s+אחר כך\s+/g, ",")
    .replace(/\s+ואחר כך\s+/g, ",")
    .replace(/\s+ו\s+/g, ",");

  const segments = cleaned
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: Array<{ name: string; qty: number }> = [];
  for (const seg of segments) {
    const parsed = parseSegmentTokensToItems(seg);
    for (const p of parsed) out.push(p);
  }
  return out;
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

function getAutocompleteSuggestions(opts: {
  query: string;
  favorites: string[];
  items: ShoppingItem[];
  history: Record<string, ItemHistoryEntry>;
  hiddenKeys: Set<string>;
  limit?: number;
}) {
  const qRaw = opts.query;
  const q = normalizeItemName(qRaw);
  const limit = opts.limit ?? 8;
  if (!q) return [] as string[];

  const map = new Map<string, SuggestCandidate>();

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
  for (const n of COMMON_GROCERY_HE) add(n, "static");

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
    const contains = !starts && nameKey.includes(q);
    if (!starts && !contains) return -Infinity;

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

const MainList: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const [inputValue, setInputValue] = useState("");

// Autocomplete state
const inputRef = useRef<HTMLInputElement | null>(null);
const [isSuggestOpen, setIsSuggestOpen] = useState(false);
const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
const historyRef = useRef<Record<string, ItemHistoryEntry>>({});
const blurCloseTimerRef = useRef<number | null>(null);

useEffect(() => {
  historyRef.current = loadItemHistory();
}, []);


  const [isCopied, setIsCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDateTime, setCalendarDateTime] = useState<string>(() => {
    // default: today at 18:00 (local), or next hour if past
    const now = new Date();
    const d = new Date(now);
    d.setMinutes(0, 0, 0);
    d.setHours(18);
    if (d.getTime() < now.getTime()) {
      d.setHours(now.getHours() + 1);
    }
    // datetime-local format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [calendarDurationMin, setCalendarDurationMin] = useState<number>(60);


  const [authLoading, setAuthLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Voice UI + state
  const [isListening, setIsListening] = useState(false);
  const [voiceMode] = useState<VoiceMode>("hold_to_talk");
  const [lastHeard, setLastHeard] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const holdActiveRef = useRef<boolean>(false);
  const transcriptBufferRef = useRef<string[]>([]);
  const lastInterimRef = useRef<string>("");
  const startGuardRef = useRef<boolean>(false);

  // ---------------------------
  // Swipe gestures (active items): swipe left = delete, swipe right = favorite
  // Works on desktop (mouse drag) and mobile (touch).
  const swipeStartRef = useRef<{ x: number; y: number; id: string; pointerId: number } | null>(null);
  const swipeLastRef = useRef<{ x: number; y: number } | null>(null);
  const swipeConsumedRef = useRef(false);
  const swipeCaptureRef = useRef<{ el: HTMLElement; pointerId: number } | null>(null);
  const [swipeUi, setSwipeUi] = useState<{ id: string | null; dx: number }>({ id: null, dx: 0 });

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
  };

  const onSwipePointerMove = (id: string) => (e: React.PointerEvent) => {
    const s = swipeStartRef.current;
    if (!s || s.id !== id || s.pointerId !== e.pointerId) return;

    swipeLastRef.current = { x: e.clientX, y: e.clientY };

    const dxRaw = e.clientX - s.x;
    const dx = Math.max(-SWIPE_MAX_SHIFT_PX, Math.min(SWIPE_MAX_SHIFT_PX, dxRaw));

    // Start capturing pointer only after we know this is a swipe (prevents breaking normal clicks)
    if (!swipeCaptureRef.current && Math.abs(dxRaw) > 10 && Math.abs(dxRaw) >= Math.abs(e.clientY - s.y)) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        swipeCaptureRef.current = { el: e.currentTarget as HTMLElement, pointerId: e.pointerId };
      } catch (e) {}
    }
    setSwipeUi({ id, dx });
  };

  const onSwipePointerUp = (id: string) => async (e: React.PointerEvent) => {
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
      if (dx < 0) {
        await deleteItem(id); // swipe left
      } else {
        await toggleFavorite(id); // swipe right
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
  };

  const onSwipeTouchMove = (id: string) => (e: React.TouchEvent) => {
    const s = swipeStartRef.current;
    if (!s || s.id !== id) return;

    const t = e.touches[0];
    if (!t) return;

    swipeLastRef.current = { x: t.clientX, y: t.clientY };

    const dxRaw = t.clientX - s.x;
    const dyRaw = t.clientY - s.y;

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

    if (dxRaw < 0) {
      await deleteItem(id);
    } else {
      await toggleFavorite(id);
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

  useEffect(() => {
    latestListIdRef.current = list?.id ?? null;
  }, [list?.id]);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
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
          title: "הרשימה שלי",
          ownerUid: u.uid,
          sharedWith: [u.uid],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await setDoc(newListRef, newList);
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
    });
  }, []);
  useEffect(() => {
    if (!list?.id) return;

    const listRef = doc(db, "lists", list.id);
    const itemsCol = collection(listRef, "items");
    const favsCol = collection(listRef, "favorites");

    const unsubList = onSnapshot(listRef, (snap) => {
      if (snap.exists()) setList({ ...(snap.data() as ShoppingList), id: snap.id });
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
        };
      });
      favDocs.sort((a, b) => b.createdAt - a.createdAt);
      setFavorites(favDocs);
    });

    return () => {
      unsubList();
      unsubItems();
      unsubFavs();
    };
  }, [list?.id]);

  const favoritesById = useMemo(() => {
    const s = new Set<string>();
    for (const f of favorites) s.add(f.id);
    return s;
  }, [favorites]);

  const activeItems = useMemo(
    () => items.filter((i) => !i.isPurchased).sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  const purchasedItems = useMemo(
    () => items.filter((i) => i.isPurchased).sort((a, b) => (b.purchasedAt || 0) - (a.purchasedAt || 0)),
    [items]
  );



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
    favorites: favorites.map((f) => f.name),
    items: items,
    history: historyRef.current,
    hiddenKeys: hidden,
    limit: 8,
  });
}, [inputValue, favorites, items]);

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
  // If already in list: increment quantity instead of inserting duplicate
  if (s.isInList && s.itemId) {
    const nextQty = (s.currentQty ?? 1) + 1;
    await updateQty(s.itemId, +1);
    const pickKey = s.key || normalizeItemName(s.name);
    if (pickKey) {
      unhideSuggestionKey(pickKey);
      hiddenSuggestRef.current.delete(pickKey);
    }
    setToast(`כבר ברשימה - הגדלתי כמות ל-${nextQty}`);
    setInputValue("");
    setActiveSuggestIndex(-1);
    setIsSuggestOpen(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return;
  }

  // Otherwise: fill input for regular add flow
  setInputValue(s.name);
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



  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      await signInSmart();
      return;
    }
    if (!list?.id) return;

    const name = inputValue.trim();
    if (!name) return;

    // If the item already exists in the list, increment quantity instead of creating a duplicate row
    const normalized = normalizeItemName(name);
    const existing = items.find((it) => normalizeItemName(it.name) === normalized);

    if (existing) {
      await updateQty(existing.id, 1);
      if (normalized) {
        unhideSuggestionKey(normalized);
        hiddenSuggestRef.current.delete(normalized);
      }
      recordHistory(existing.name);
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
    };

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
    await updateDoc(doc(db, "lists", list.id, "items", id), {
      isPurchased: isNowPurchased,
      purchasedAt: isNowPurchased ? Date.now() : null,
    });
  };

  const updateQty = async (id: string, delta: number) => {
    if (!list?.id) return;

    // For positive deltas (the common case), use an atomic Firestore increment to avoid stale-state bugs
    // when the user adds the same item multiple times quickly.
    if (delta > 0) {
      await updateDoc(doc(db, "lists", list.id, "items", id), {
        quantity: increment(delta),
      });
      return;
    }

    // For negative deltas we clamp locally to keep quantity >= 1.
    const item = items.find((i) => i.id === id);
    if (!item) return;

    await updateDoc(doc(db, "lists", list.id, "items", id), {
      quantity: Math.max(1, item.quantity + delta),
    });
  };

  const deleteItem = async (id: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "items", id));
  };

  const toggleFavorite = async (itemId: string) => {
    if (!list?.id) return;
    const favRef = doc(db, "lists", list.id, "favorites", itemId);
    if (favoritesById.has(itemId)) {
      await deleteDoc(favRef);
    } else {
      const item = items.find((i) => i.id === itemId);
      await setDoc(favRef, { name: item?.name || "", createdAt: Date.now() });
    }
  };

  const removeFavorite = async (favId: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "favorites", favId));
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

    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        // @ts-ignore
        await navigator.share({
          title: "קישור לרשימה",
          text: "קישור הצטרפות להרשימה שלי",
          url: link,
        });
        return;
      }
    } catch (e) {
    // ignore
  }

    await copyToClipboard(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // WhatsApp share
  
  const buildGoogleCalendarTemplateUrl = (startLocal: string, durationMin: number) => {
    // startLocal: 'YYYY-MM-DDTHH:mm' (local time)
    const [datePart, timePart] = startLocal.split("T");
    const [y, mo, d] = datePart.split("-").map((x) => parseInt(x, 10));
    const [hh, mm] = timePart.split(":").map((x) => parseInt(x, 10));
    const start = new Date(y, mo - 1, d, hh, mm, 0, 0);
    const end = new Date(start.getTime() + Math.max(15, durationMin) * 60_000);

    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

    const dates = `${fmt(start)}/${fmt(end)}`;
    const text = encodeURIComponent("תזכורת לביצוע קניות");
    const details = encodeURIComponent("תזכורת לביצוע קניה - פתח את אפליקציית רשימת הקניות");
    const ctz = encodeURIComponent("Asia/Jerusalem");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${encodeURIComponent(dates)}&details=${details}&ctz=${ctz}`;
  };

  const openGoogleCalendar = () => {
    const webUrl = buildGoogleCalendarTemplateUrl(calendarDateTime, calendarDurationMin);

    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    // Note:
    // From a browser, Chrome/Android may show an OS handoff confirmation ("Open with...").
    // This prompt cannot always be removed programmatically.
    //
    // Our best effort is to trigger the native "INSERT event" intent WITHOUT forcing Google Calendar,
    // so Android routes it to the user's DEFAULT calendar app (e.g., Samsung Calendar).

    if (isAndroid) {
      const startMs = new Date(calendarDateTime).getTime();
      const endMs = startMs + Math.max(5, Number(calendarDurationMin || 60)) * 60 * 1000;

      const title = "תזכורת לביצוע קניות";
      const description = "תזכורת לביצוע קניות (ללא פירוט פריטים)";

      const enc = encodeURIComponent;

      // ACTION_INSERT with type=vnd.android.cursor.item/event is the most compatible deep link across vendors.
      // No package is set, so the system should use the default calendar app.
      const intentUrl =
        "intent:#Intent" +
        ";action=android.intent.action.INSERT" +
        ";type=vnd.android.cursor.item/event" +
        `;S.title=${enc(title)}` +
        `;S.description=${enc(description)}` +
        `;l.beginTime=${startMs}` +
        `;l.endTime=${endMs}` +
        ";end";

      // Must be called directly from a user click.
      window.location.href = intentUrl;
      return;
    }

    // iOS: there is no reliable deep link from a browser to the default calendar app insert screen.
    // Best effort: open Google Calendar web template.
    if (isIOS) {
      window.location.assign(webUrl);
      return;
    }

    // Desktop / others: open Google Calendar web template
    window.open(webUrl, "_blank", "noopener,noreferrer");
  };

const shareListWhatsApp = () => {
    const title = list?.title || "הרשימה שלי";
    const active = items.filter((i) => !i.isPurchased);

    const RLE = "\u202B";
    const PDF = "\u202C";
    const LRI = "\u2066";
    const PDI = "\u2069";

    const lines =
      active.length > 0
        ? active
            .map((i) => {
              if ((i.quantity || 1) <= 1) return `${RLE}${i.name}${PDF}`;
              return `${RLE}${i.name} X ${LRI}${i.quantity}${PDI}${PDF}`;
            })
            .join("\n")
        : `${RLE}(הרשימה כרגע ריקה)${PDF}`;

    const header = `*${title}:*`;
    const footer = `נשלח מהרשימה החכמה 🛒`;
    const text = `${header}\n\n${lines}\n\n${footer}`;
    openWhatsApp(text);
  };


  // ---------------------------
  // Swipe gestures (favorites): swipe right = remove from favorites (delete), swipe left = add to list
  // Pointer-only for Android stability.
  const favSwipeStartRef = useRef<{ x: number; y: number; id: string; pointerId: number } | null>(null);
  const favSwipeLastRef = useRef<{ x: number; y: number } | null>(null);
  const favSwipeCaptureRef = useRef<{ el: HTMLElement; pointerId: number } | null>(null);
  const [favSwipeUi, setFavSwipeUi] = useState<{ id: string | null; dx: number; rawDx: number }>({ id: null, dx: 0, rawDx: 0 });

  const FAV_SWIPE_THRESHOLD_PX = 60;
  const FAV_SWIPE_MAX_SHIFT_PX = 110;

  const addFavoriteToList = async (fav: { id: string; name: string }) => {
    if (!list?.id) return;

    const favKey = normalizeItemName(fav.name);

    const existing = items.find(
      (i) => !i.isPurchased && normalizeItemName(i.name) === favKey
    );

    if (existing) {
      await updateQty(existing.id, 1);
    } else {
      const itemId = crypto.randomUUID();
      const newItem: ShoppingItem = {
        id: itemId,
        name: fav.name,
        quantity: 1,
        isPurchased: false,
        isFavorite: false,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "lists", list.id, "items", itemId), newItem);
    }
  };

  const onFavSwipePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (isNoSwipeTarget(e.target)) return;

    favSwipeStartRef.current = { x: e.clientX, y: e.clientY, id, pointerId: e.pointerId };
    favSwipeLastRef.current = { x: e.clientX, y: e.clientY };
    setFavSwipeUi({ id, dx: 0, rawDx: 0 });
  };

  const onFavSwipePointerMove = (id: string) => (e: React.PointerEvent) => {
    const s = favSwipeStartRef.current;
    if (!s || s.id !== id) return;

    favSwipeLastRef.current = { x: e.clientX, y: e.clientY };

    const dxRaw = e.clientX - s.x;
    const dyRaw = e.clientY - s.y;

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
      // swipe right -> add to list (or increment if exists)
      if (fav) await addFavoriteToList(fav);
    } else {
      // swipe left -> remove from favorites ONLY
      await removeFavorite(id);
      setToast("הוסר מהמועדפים");
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
    const n = normalize(name);
    const exact = items.find((i) => normalize(i.name) === n);
    if (exact) return exact;
    const contains = items.find((i) => normalize(i.name).includes(n) || n.includes(normalize(i.name)));
    return contains || null;
  };

  const addOrSetQuantity = async (nameRaw: string, qty: number) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const itemsNow = latestItemsRef.current || items;
    const name = nameRaw.trim();
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
    };

    await setDoc(doc(db, "lists", listId, "items", itemId), newItem);
  };

const isClearListCommand = (t: string) => {
  const clearRegex =
    /(מחק|תמחק|תמחוק|למחוק|נקה|תנקה|תרוקן|רוקן|מרחק|רחק)\s*(לי\s*)?(את\s*)?(כל\s*)?(הרשימה|רשימה)?/;

  return (
    clearRegex.test(t) ||
    /^(מחק|רחק|מרחק)$/.test(t) ||
    (t.includes("מחק") && t.includes("הכל") && (t.includes("רשימה") || t.includes("הרשימה"))) ||
    (t.includes("למחוק") && (t.includes("רשימה") || t.includes("הרשימה")))
  );
};


  const executeVoiceText = async (raw: string) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const text = normalize(raw);
    if (!text) return;

    // Clear list
    if (isClearListCommand(text)) {
      await clearListServer();
      setToast("הרשימה נמחקה");
      return;
    }

    // Delete item
    if (/^(מחק|תמחק|תמחוק|תמחקי)\s+/.test(text)) {
      const name = text.replace(/^(מחק|תמחק|תמחוק|תמחקי)\s+/, "").trim();
      const item = findItemByName(name);
      if (!item) {
        setToast("לא מצאתי פריט למחיקה");
        return;
      }
      await deleteItem(item.id);
      setToast(`מחקתי: ${item.name}`);
      return;
    }

    // Mark purchased
    const buyMatch = text.match(/^(סמן|תסמן|תסמני)\s+(.+)\s+(נקנה|כנקנה|נקנתה)$/);
    if (buyMatch) {
      const name = buyMatch[2].trim();
      const item = findItemByName(name);
      if (!item) {
        setToast("לא מצאתי פריט לסימון");
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
      if (!item) return setToast("לא מצאתי פריט להגדלה");
      await updateQty(item.id, 1);
      return setToast(`הגדלתי: ${item.name}`);
    }

    const decMatch = text.match(/^(הקטן|תקטין|תקטיני)\s+(.+)$/);
    if (decMatch) {
      const name = decMatch[2].trim();
      const item = findItemByName(name);
      if (!item) return setToast("לא מצאתי פריט להקטנה");
      await updateQty(item.id, -1);
      return setToast(`הקטנתי: ${item.name}`);
    }

    // ADD: with or without "הוסף"
    const addPrefix = text.match(/^(הוסף|תוסיף|תוסיפי|הוספה)(?:\s+פריט)?\s+(.+)$/);
    const payload = addPrefix ? addPrefix[2] : text;

    const parsed = parseItemsFromText(payload);
    if (parsed.length === 0) return;

    for (const p of parsed) {
      await addOrSetQuantity(p.name, p.qty);
    }

    if (parsed.length === 1) {
      const p = parsed[0];
      setToast(p.qty > 1 ? `הוספתי: ${p.name} x${p.qty}` : `הוספתי: ${p.name}`);
    } else {
      setToast(`הוספתי ${parsed.length} פריטים`);
    }
  };

  const ensureSpeechRecognition = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    return SR;
  };

  const startHoldListening = () => {
    const SR = ensureSpeechRecognition();
    if (!SR) {
      alert("הדפדפן לא תומך בזיהוי דיבור. נסה Chrome או Edge.");
      return;
    }

    if (!user) {
      setToast("צריך להתחבר לפני פקודות קוליות");
      signInSmart();
      return;
    }

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";
    startGuardRef.current = false;

    holdActiveRef.current = true;
    setLastHeard("");
    setIsListening(true);
    setToast("דבר עכשיו - שחרר כדי לבצע");

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

    rec.lang = "he-IL";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    // --- Step 2: יציבות + משפטים ארוכים ---
    // לא עוצרים מיד על no-speech (זה נפוץ בדסקטופ)
    // מוסיפים עצירה אוטומטית אחרי שקט קצר + רשת בטחון למשפטים ארוכים
    const SILENCE_MS = 3000;
    const MAX_SESSION_MS = 90_000;

    let hadAnyResult = false;
    let lastResultAt = Date.now();
    let silenceTimer: number | null = null;
    let sessionTimer: number | null = null;

    const clearLocalTimers = () => {
      if (silenceTimer != null) window.clearTimeout(silenceTimer);
      if (sessionTimer != null) window.clearTimeout(sessionTimer);
      silenceTimer = null;
      sessionTimer = null;
    };

    const scheduleSilenceStop = () => {
      // עוצרים בגלל שקט רק אחרי שכבר קיבלנו לפחות תוצאה אחת
      if (!holdActiveRef.current) return;
      if (!hadAnyResult) return;

      if (silenceTimer != null) window.clearTimeout(silenceTimer);
      silenceTimer = window.setTimeout(() => {
        if (!holdActiveRef.current) return;
        const dt = Date.now() - lastResultAt;
        if (dt >= SILENCE_MS) stopHoldListening();
      }, SILENCE_MS + 50);
    };

    sessionTimer = window.setTimeout(() => {
      if (!holdActiveRef.current) return;
      setToast("עוצר בגלל משפט ארוך מדי - מבצע...");
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
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const best = r?.[0];
          const transcript = normalizeVoiceText(String(best?.transcript || ""));
          if (!transcript) continue;

          if (r.isFinal) {
            transcriptBufferRef.current.push(transcript);
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

        if (last) setLastHeard(last);

        hadAnyResult = true;
        lastResultAt = Date.now();
        scheduleSilenceStop();
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
        alert("אין הרשאה למיקרופון. אשר הרשאה ואז נסה שוב.");
      } else if (err === "audio-capture") {
        setToast("המיקרופון לא זמין (אפליקציה אחרת אולי משתמשת בו)");
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
      }, 180);
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
      setToast("לא הצלחתי להתחיל האזנה");
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
    const finalText = transcriptBufferRef.current.join(" ").trim();
    const interimText = (lastInterimRef.current || "").trim();
    const combined = `${finalText} ${interimText}`.replace(/\s+/g, " ").trim();

    transcriptBufferRef.current = [];
    lastInterimRef.current = "";

    if (!combined) {
      setToast("לא נקלט קול - נסה שוב");
      return;
    }

    setToast("מבצע...");
    try {
      await executeVoiceText(combined);
    } catch (e: any) {
      console.error(e);
      setToast(`שגיאה: ${String(e?.message || e || "")}`);
    }
  };


  useEffect(() => {
    return () => {
      try {
        holdActiveRef.current = false;
        recognitionRef.current?.stop?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 text-center">
          <h1 className="text-2xl font-black text-slate-800">הרשימה שלי חכמה</h1>
          <p className="text-slate-500 font-bold">כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.</p>
          <button
            onClick={async () => {
              await signInSmart();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black"
          >
            <LogIn className="w-4 h-4" />
            התחבר עם גוגל
          </button>
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

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 relative pb-44 shadow-2xl overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 items-center justify-between border-b border-slate-100 relative grid grid-cols-3 items-center">
        <div className="flex items-center gap-2 justify-start">
          
<button onClick={() => setShowClearConfirm(true)} className="p-2 text-slate-400 hover:text-rose-500" title="נקה רשימה">
            <Trash2 className="w-5 h-5" />
          </button>

          <button onClick={shareInviteLinkSystem} className="p-2 text-slate-400 hover:text-indigo-600" title="הזמן חבר">
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>

        <h1 className="text-xl font-bold text-indigo-600 leading-none text-center justify-self-center whitespace-nowrap">{list?.title || "הרשימה שלי"}</h1>

        <button
          onClick={() => signOut(auth)}
          className="justify-self-end w-9 h-9 min-w-0 p-0 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-transform"
          title="התנתק"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Voice hint */}
      <div className="px-5 pt-3">
        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-right shadow-sm">
          <div className="text-[11px] font-black text-slate-400">
            {isListening ? "מקשיב עכשיו - דבר ושחרר כדי לבצע" : "פקודות קוליות: לחץ והחזק את המיקרופון, שחרר לביצוע"}
          </div>
          {lastHeard ? (
            <div className="text-sm font-bold text-slate-700 mt-1" style={{ direction: "rtl", unicodeBidi: "plaintext" }}>
              שמענו: {lastHeard}
            </div>
          ) : null}
          <div className="text-[10px] font-black text-slate-400 mt-1">
            דוגמאות: "ביצים עגבניה גמבה שתי מלפפונים" | "מלפפונים שתיים" | "מחק רשימה"
          </div>
        </div>
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
                    if (suggestionList.length === 0) return;
                    setActiveSuggestIndex((prev) => {
                      const next = prev + 1;
                      return next >= suggestionList.length ? 0 : next;
                    });
                    return;
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (suggestionList.length === 0) return;
                    setActiveSuggestIndex((prev) => {
                      const next = prev - 1;
                      return next < 0 ? suggestionList.length - 1 : next;
                    });
                    return;
                  }

                  if (e.key === "Tab") {
                    if (suggestionList.length === 0) return;
                    e.preventDefault();
                    applySuggestion(suggestionList[Math.max(0, activeSuggestIndex >= 0 ? activeSuggestIndex : 0)]);
                    return;
                  }

                  if (e.key === "Enter") {
                    if (suggestionList.length > 0) {
                      e.preventDefault();
                      const idx = activeSuggestIndex >= 0 ? activeSuggestIndex : 0;
                      applySuggestion(suggestionList[idx]);
                      return;
                    }
                  }
                }}
                onChange={(e) => {
                  setInputValue(e.target.value);                  openSuggestions();
                  setActiveSuggestIndex(-1);
                }}
                placeholder="מה להוסיף לרשימה?"
                className="w-full p-4 pr-12 pl-14 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-white text-right"
                dir="rtl"
              />

              <button
                type="submit"
                className="absolute left-2.5 top-2.5 bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-all"
                title="הוסף"
              >
                <Plus className="w-6 h-6" />
              </button>

              {isSuggestOpen && inputValue.trim() && suggestionList.length > 0 ? (
  <div
    className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
    dir="rtl"
    onMouseDown={(e) => {
      // Prevent input blur before click
      e.preventDefault();
    }}
    onPointerDown={(e) => {
      // Mobile/touch: prevent blur before selection
      e.preventDefault();
    }}
  >
    {suggestionList.map((s, idx) => (
    <div
      key={s.key + "-" + idx}
      className={
        "w-full flex items-stretch justify-between gap-2 hover:bg-slate-50 transition-colors " +
        (idx === activeSuggestIndex ? "bg-slate-100" : "")
      }
    >
      <button
        type="button"
        className="flex-1 text-right px-4 py-3 flex items-center justify-between"
        onPointerDown={(e) => {
          e.preventDefault();
          applySuggestion(s);
        }}
        title="השלמה"
      >
        <span className="font-semibold text-slate-700">{s.name}</span>
        {s.isInList ? (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            ברשימה{typeof s.currentQty === "number" ? ` (${s.currentQty})` : ""}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Tab</span>
        )}
      </button>

      {s.canHide ? (
        <button
          type="button"
          className="px-3 text-slate-400 hover:text-slate-700"
          onPointerDown={(e) => {
            e.preventDefault();
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

            {items.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <ShoppingCart className="w-20 h-20 mx-auto mb-4 stroke-1" />
                <p className="text-lg font-bold">הרשימה ריקה</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm select-none"
                      dir="rtl"
                      onPointerDown={onSwipePointerDown(item.id)}
                      onPointerMove={onSwipePointerMove(item.id)}
                      onPointerUp={onSwipePointerUp(item.id)}
                      onPointerCancel={onSwipePointerCancel}
                    
                          onTouchStart={onSwipeTouchStart(item.id)}
                          onTouchMove={onSwipeTouchMove(item.id)}
                          onTouchEnd={onSwipeTouchEnd(item.id)}
                         style={{ touchAction: "pan-y" }}

                        >
                      {/* Swipe background cue */}
                      <div
                        className={`absolute inset-0 ${
                          swipeUi.id === item.id
                            ? swipeUi.dx > 0
                              ? "bg-emerald-50"
                              : swipeUi.dx < 0
                                ? "bg-rose-50"
                                : "bg-transparent"
                            : "bg-transparent"
                        }`}
                        style={{
                          opacity:
                            swipeUi.id === item.id ? Math.min(1, Math.abs(swipeUi.dx) / SWIPE_MAX_SHIFT_PX) : 0,
                        }}
                      />

                      {/* Foreground content (slides with finger/mouse) */}
                      <div
                        className="relative z-10 flex items-center justify-between w-full"
                        style={{
                          transform: swipeUi.id === item.id ? `translateX(${swipeUi.dx}px)` : undefined,
                          transition: swipeUi.id === item.id ? "none" : "transform 120ms ease-out",
                        }}
                      >
                        <div
                          className="flex-1 text-right font-bold text-slate-700 truncate cursor-pointer px-3"
                          style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                          onClick={() => {
                            if (swipeConsumedRef.current) return;
                            togglePurchased(item.id);
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100"
                          data-noswipe="true"
                        >
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1 text-slate-400"
                            title="הפחת"
                            data-noswipe="true"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="min-w-[1.5rem] text-center font-black text-slate-700">{item.quantity}</span>

                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1 text-slate-400"
                            title="הוסף"
                            data-noswipe="true"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Left / Right hint icons */}
                      {swipeUi.id === item.id && swipeUi.dx > 12 ? (
                        <div className="absolute inset-y-0 left-3 flex items-center text-emerald-600 pointer-events-none">
                          <Star className="w-5 h-5 fill-emerald-600" />
                        </div>
                      ) : null}
                      {swipeUi.id === item.id && swipeUi.dx < -12 ? (
                        <div className="absolute inset-y-0 right-3 flex items-center text-rose-600 pointer-events-none">
                          <Trash2 className="w-5 h-5" />
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {purchasedItems.length > 0 ? (
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <h3 className="text-lg font-bold text-slate-700 text-right mb-2">נקנו ({purchasedItems.length})</h3>

                      {purchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-100/50 rounded-2xl opacity-60 grayscale transition-all"
                          dir="rtl"
                        ><div className="flex items-center justify-between w-full">
      <div
        className="flex items-center gap-3 flex-1 justify-start cursor-pointer"
        onClick={() => togglePurchased(item.id)}
        style={{ direction: "rtl", unicodeBidi: "plaintext" }}
      >
        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        <span className="text-base font-bold text-slate-500 line-through truncate text-left">
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

      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300" title="מחק">
        <Trash2 className="w-4 h-4" />
      </button>
    </div></div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">מועדפים</h2>
              <p className="text-sm text-slate-400 font-bold"><span className="font-semibold">פריטים שחוזרים לסל</span></p>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <Star className="w-16 h-16 mx-auto mb-4 stroke-1" />
                <p className="font-bold">אין מועדפים עדיין</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="relative overflow-hidden rounded-2xl select-none"
                    dir="ltr"
                    onPointerDown={onFavSwipePointerDown(fav.id)}
                    onPointerMove={onFavSwipePointerMove(fav.id)}
                    onPointerUp={onFavSwipePointerUp(fav.id)}
                    onPointerCancel={onFavSwipePointerCancel}
                    style={{ touchAction: "pan-y" }}
                  >
                    {/* Swipe background */}
                    <div
                      className={`absolute inset-0 ${
                        favSwipeUi.id === fav.id
                          ? favSwipeUi.rawDx > 0
                            ? "bg-emerald-50"
                            : favSwipeUi.rawDx < 0
                              ? "bg-rose-50"
                              : "bg-transparent"
                          : "bg-transparent"
                      }`}
                      style={{
                        opacity: favSwipeUi.id === fav.id ? Math.min(1, Math.abs(favSwipeUi.rawDx) / FAV_SWIPE_MAX_SHIFT_PX) : 0,
                      }}
                    />

                    {/* Swipe icons: RIGHT swipe shows Add-to-list on LEFT, LEFT swipe shows Delete on RIGHT */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                      {/* Swipe RIGHT (add to list) reveals LEFT side */}
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ListPlusIcon className="w-6 h-6" />
                      </div>

                      {/* Swipe LEFT (remove favorite) reveals RIGHT side */}
                      <div className="flex items-center gap-2 text-rose-600">
                        <Trash2 className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Foreground card */}
                    <div
                      className="relative z-10 flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                      style={{
                        transform: favSwipeUi.id === fav.id ? `translateX(${favSwipeUi.dx}px)` : undefined,
                        transition: favSwipeUi.id === fav.id ? "none" : "transform 160ms ease-out",
                      }}
                    >
                      <div className="flex items-center gap-2" />

                      <div
                        className="flex-1 text-right font-bold text-slate-700 truncate px-3 text-base"
                        style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                      >
                        {fav.name}
                      </div>

                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-3">
          <footer className="bg-white border-t border-slate-200 rounded-2xl" dir="ltr">
            <div className="relative flex items-center justify-between px-8 pt-9 pb-3">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                  activeTab === "favorites" ? "text-indigo-600" : "text-slate-300"
                }`}
                title="מועדפים"
              >
                <Star className={`w-7 h-7 ${activeTab === "favorites" ? "fill-indigo-600 text-indigo-600" : "text-slate-300"}`} />
                מועדפים
              </button>

              <button
                onClick={shareListWhatsApp}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                  "text-slate-300"
                }`}
                title="וואטסאפ"
              >
                <MessageCircle className="w-7 h-7" />
                וואטסאפ
              </button>

              <button
                onClick={() => setShowCalendarModal(true)}
                className={`flex flex-col items-center gap-1 text-[11px] font-black text-slate-300`}
                title="יומן"
              >
                <Calendar className="w-7 h-7" />
                יומן
              </button>

              <button
                onClick={() => setActiveTab("list")}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                  activeTab === "list" ? "text-indigo-600" : "text-slate-300"
                }`}
                title="רשימה"
              >
                <ListChecks className="w-7 h-7" />
                רשימה
              </button>

              {/* Hold-to-talk Voice button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  startHoldListening();
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  stopHoldListening();
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  stopHoldListening();
                }}
                onPointerLeave={(e) => {
                  if (holdActiveRef.current) {
                    e.preventDefault();
                    stopHoldListening();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHoldListening();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopHoldListening();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  startHoldListening();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  stopHoldListening();
                }}
                style={{ touchAction: "none" }}
                className={`absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center ${
                  isListening ? "bg-rose-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
                title={isListening ? "דבר עכשיו - שחרר כדי לבצע" : "לחץ והחזק כדי לדבר"}
              >
                {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendarModal ? (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-6" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <div className="text-xl font-black text-slate-800">תזמון קניות</div>
                  <div className="text-sm font-bold text-slate-400">נוסיף תזכורת ביומן (בלי פריטי הרשימה)</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-600">מתי נוח לך?</label>
                <input
                  type="datetime-local"
                  value={calendarDateTime}
                  onChange={(e) => setCalendarDateTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-600">משך</span>
                  <span className="text-sm font-black text-slate-500">{calendarDurationMin} דק׳</span>
                </div>
                <div className="grid grid-cols-4 gap-2" dir="ltr">
                  {[30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCalendarDurationMin(m)}
                      className={`py-2 rounded-2xl font-black text-sm ${
                        calendarDurationMin === m ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700"
                >
                  ביטול
                </button>
                <button
                  onClick={() => {
                    setShowCalendarModal(false);
                    openGoogleCalendar();
                  }}
                  className="flex-1 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                >
                  פתח ביומן בטלפון
                </button>
              </div>

              <button
                onClick={() => {
                  const url = buildGoogleCalendarTemplateUrl(calendarDateTime, calendarDurationMin);
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="w-full mt-3 py-2 rounded-2xl font-bold text-indigo-700 bg-indigo-50"
              >
                לא נפתח? פתח ב-Web
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Clear Confirm Modal */}
      {showClearConfirm ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-slate-800">לנקות את כל הרשימה?</div>
                <div className="text-sm font-bold text-slate-400">הפעולה תמחק את כל הפריטים מהרשימה.</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700">
                ביטול
              </button>
              <button onClick={clearListServer} className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white">
                מחק הכל
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-2xl shadow-lg z-50">
          {toast}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------
// App Router
// ---------------------------
const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainList />} />
        <Route path="/invite" element={<InvitePage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
