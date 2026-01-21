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
} from "lucide-react";

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
  where,
} from "firebase/firestore";

import { GoogleGenAI } from "@google/genai";
import { auth, db, googleProvider } from "./firebase.ts";
import { ShoppingItem, ShoppingList, Tab } from "./types.ts";

/**
 * Force Firebase auth persistence to LOCAL (so you won't need to login every time).
 * Runs once on module load.
 */
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
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
  } catch {
    window.prompt("העתק את הקישור:", text);
    return false;
  }
}

async function signInSmart() {
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
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
            <LogIn className="w-5 h-5" />
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

type VoiceMode = "hold_to_talk"; // נשמור מקום להרחבות

const HEB_NUMBER_WORDS: Record<string, number> = {
  "אחד": 1,
  "אחת": 1,
  "שני": 2,
  "שניים": 2,
  "שתיים": 2,
  "שתים": 2,
  "שתי": 2,
  "שלוש": 3,
  "שלושה": 3,
  "ארבע": 4,
  "ארבעה": 4,
  "חמש": 5,
  "חמישה": 5,
  "שש": 6,
  "שישה": 6,
  "שבע": 7,
  "שבעה": 7,
  "שמונה": 8,
  "תשע": 9,
  "תשעה": 9,
  "עשר": 10,
  "עשרה": 10,
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

/**
 * Parse a phrase into multiple items.
 * Supports:
 * - "חמש עגבניות שני מלפפונים רסק עגבניות"
 * - "עגבניות חמש"
 * - with commas / וגם / ואז / אחר כך
 */
function parseItemsFromText(raw: string): Array<{ name: string; qty: number }> {
  const t0 = normalizeVoiceText(raw);
  const t = normalize(t0);
  if (!t) return [];

  // First split by explicit delimiters if any
  const cleaned = t
    .replace(/\s+וגם\s+/g, ",")
    .replace(/\s+ואז\s+/g, ",")
    .replace(/\s+אחר כך\s+/g, ",")
    .replace(/\s+ואחר כך\s+/g, ",")
    .replace(/\s+ו\s+/g, ","); // "ו" באמצע משפט - עדיף לפצל

  const hasComma = cleaned.includes(",") || cleaned.includes("\n");

  const segments = hasComma
    ? cleaned
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [cleaned];

  const out: Array<{ name: string; qty: number }> = [];

  for (const seg of segments) {
    const words = seg.split(" ").filter(Boolean);
    if (words.length === 0) continue;

    // If there are multiple qty markers in one segment, scan and split by qty tokens
    const qtyPositions = words
      .map((w, i) => (isQtyToken(w) ? i : -1))
      .filter((i) => i >= 0);

    if (qtyPositions.length >= 2) {
      // Example: "חמש עגבניות שני מלפפונים רסק עגבניות"
      let i = 0;
      while (i < words.length) {
        if (isQtyToken(words[i]) && i + 1 < words.length) {
          const q = Math.max(1, qtyFromToken(words[i]) || 1);
          i++;
          const nameParts: string[] = [];
          while (i < words.length && !isQtyToken(words[i])) {
            nameParts.push(words[i]);
            i++;
          }
          const name = nameParts.join(" ").trim();
          if (name) out.push({ name, qty: q });
        } else {
          // gather until next qty as qty=1
          const nameParts: string[] = [];
          while (i < words.length && !isQtyToken(words[i])) {
            nameParts.push(words[i]);
            i++;
          }
          const name = nameParts.join(" ").trim();
          if (name) out.push({ name, qty: 1 });
        }
      }
      continue;
    }

    // Single qty token maybe at start
    if (isQtyToken(words[0]) && words.length >= 2) {
      const q = Math.max(1, qtyFromToken(words[0]) || 1);
      const name = words.slice(1).join(" ").trim();
      if (name) out.push({ name, qty: q });
      continue;
    }

    // Single qty token maybe at end: "עגבניות חמש"
    if (words.length >= 2 && isQtyToken(words[words.length - 1])) {
      const q = Math.max(1, qtyFromToken(words[words.length - 1]) || 1);
      const name = words.slice(0, -1).join(" ").trim();
      if (name) out.push({ name, qty: q });
      continue;
    }

    // Default
    out.push({ name: seg.trim(), qty: 1 });
  }

  // Clean names
  return out
    .map((x) => ({ name: x.name.replace(/\s+/g, " ").trim(), qty: Math.max(1, Number(x.qty || 1)) }))
    .filter((x) => x.name.length > 0);
}

const MainList: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const [inputValue, setInputValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [isAiLoading, setIsAiLoading] = useState(false);
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
  const latestListIdRef = useRef<string | null>(null);
  const latestItemsRef = useRef<ShoppingItem[]>([]);

  // Keep latest listId/items for callbacks
  useEffect(() => {
    latestListIdRef.current = list?.id ?? null;
  }, [list?.id]);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  // Auto-hide toast
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

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      await signInSmart();
      return;
    }
    if (!list?.id) return;

    const name = inputValue.trim();
    if (!name) return;

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
    setInputValue("");
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
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const favRef = doc(db, "lists", list.id, "favorites", itemId);
    if (favoritesById.has(itemId)) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, { name: item.name, createdAt: Date.now() });
    }
  };

  const removeFavorite = async (favId: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "favorites", favId));
  };

  const clearList = async () => {
    if (!list?.id) return;
    const batch = items.map((i) => deleteDoc(doc(db, "lists", list.id, "items", i.id)));
    await Promise.all(batch);
    setShowClearConfirm(false);
  };

  const getAiSuggestions = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) return;

    setIsAiLoading(true);
    const ai = new GoogleGenAI({ apiKey });

    try {
      const currentList = activeItems.map((i) => i.name).join(", ");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `אני מכין רשימת קניות. הפריטים הנוכחיים שלי הם: ${currentList}. תן לי 5 הצעות לפריטים נוספים שחסרים לי בדרך כלל עם פריטים אלו. החזר רק רשימה מופרדת בפסיקים של שמות הפריטים בעברית.`,
      });

      const suggestions = response.text?.split(",").map((s) => s.trim()).filter(Boolean) || [];
      if (suggestions.length > 0) setInputValue(suggestions[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
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
          text: "קישור הצטרפות לרשימת קניות",
          url: link,
        });
        return;
      }
    } catch {
      // user cancelled
    }

    await copyToClipboard(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // WhatsApp share
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
  // Voice actions (NO server, only SpeechRecognition)
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

  const executeVoiceText = async (raw: string) => {
    const listId = latestListIdRef.current || list?.id;
    if (!listId) return;

    const text = normalize(raw);
    if (!text) return;

    // Clear list commands
    if (text.includes("מחק רשימה") || (text.includes("מחק") && text.includes("הכל")) || (text.includes("נקה") && text.includes("רשימה"))) {
      await clearList();
      setToast("הרשימה נמחקה");
      return;
    }

    // Delete item: "מחק חלב"
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

    // Mark purchased: "סמן חלב נקנה"
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

    // Reset buffer
    transcriptBufferRef.current = [];
    holdActiveRef.current = true;
    setLastHeard("");
    setIsListening(true);
    setToast("דבר עכשיו - שחרר כדי לבצע");

    // clean previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
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
          } else {
            interimCombined = transcript;
          }
        }

        const last =
          interimCombined ||
          (transcriptBufferRef.current.length ? transcriptBufferRef.current[transcriptBufferRef.current.length - 1] : "");
        if (last) setLastHeard(last);
      } catch {
        // ignore
      }
    };

    rec.onerror = (e: any) => {
      const err = String(e?.error || "");
      console.error("Speech error", e);
      setIsListening(false);
      holdActiveRef.current = false;

      if (err === "not-allowed" || err === "service-not-allowed") {
        alert("אין הרשאה למיקרופון. אשר הרשאה ואז נסה שוב.");
      } else {
        setToast(`שגיאת מיקרופון: ${err || "unknown"}`);
      }
    };

    rec.onend = () => {
      // On mobile it may stop by itself. If still holding, restart.
      if (holdActiveRef.current) {
        try {
          rec.start();
        } catch {
          // ignore
        }
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.error(e);
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
    } catch {
      // ignore
    }

    const combined = transcriptBufferRef.current.join(", ").trim();
    transcriptBufferRef.current = [];

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

  // stop recognition when unmount
  useEffect(() => {
    return () => {
      try {
        holdActiveRef.current = false;
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 text-center">
          <h1 className="text-2xl font-black text-slate-800">רשימת קניות חכמה</h1>
          <p className="text-slate-500 font-bold">כדי להשתמש ברשימה ולהזמין חברים, צריך להתחבר עם גוגל.</p>
          <button
            onClick={async () => {
              await signInSmart();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black"
          >
            <LogIn className="w-5 h-5" />
            התחבר עם גוגל
          </button>
        </div>
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
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
              // if user drags finger away while holding
              if (holdActiveRef.current) {
                e.preventDefault();
                stopHoldListening();
              }
            }}
            style={{ touchAction: "none" }}
            className={`p-2 rounded-full ${
              isListening ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 hover:bg-indigo-50 text-indigo-600"
            }`}
            title={isListening ? "דבר עכשיו - שחרר כדי לבצע" : "לחץ והחזק כדי לדבר"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-slate-400 hover:text-rose-500"
            title="נקה רשימה"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button onClick={shareInviteLinkSystem} className="p-2 text-slate-400 hover:text-indigo-600" title="הזמן חבר">
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>

        <h1 className="text-xl font-extrabold text-indigo-600">{list?.title || "הרשימה שלי"}</h1>

        <button
          onClick={() => signOut(auth)}
          className="p-2 rounded-full shadow-lg active:scale-90 transition-transform bg-slate-100 text-slate-600"
          title="התנתק"
        >
          <LogOut className="w-5 h-5" />
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
            דוגמאות: "חמש עגבניות שני מלפפונים רסק עגבניות" | "מחק חלב" | "מחק רשימה"
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
        {activeTab === "list" ? (
          <>
            <form onSubmit={addItem} className="relative">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="מה להוסיף לרשימה?"
                className="w-full p-4 pr-4 pl-14 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-white text-right"
                dir="rtl"
              />
              <button
                type="submit"
                className="absolute left-2.5 top-2.5 bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-all"
                title="הוסף"
              >
                <Plus className="w-6 h-6" />
              </button>
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
                      className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm"
                      dir="rtl"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-slate-300 hover:text-rose-500"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-2 ${favoritesById.has(item.id) ? "text-amber-500" : "text-slate-300"}`}
                          title="מועדף"
                        >
                          <Star className={`w-4 h-4 ${favoritesById.has(item.id) ? "fill-amber-500" : ""}`} />
                        </button>
                      </div>

                      <div
                        className="flex-1 text-right font-bold text-slate-700 truncate cursor-pointer px-3"
                        style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                        onClick={() => togglePurchased(item.id)}
                      >
                        {item.name}
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400" title="הפחת">
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="min-w-[1.5rem] text-center font-black text-slate-700">{item.quantity}</span>

                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-400" title="הוסף">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {purchasedItems.length > 0 ? (
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right mb-2">
                        נקנו ({purchasedItems.length})
                      </h3>

                      {purchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-100/50 rounded-2xl opacity-60 grayscale transition-all"
                          dir="rtl"
                        >
                          <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300" title="מחק">
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div
                            className="flex items-center gap-3 flex-1 justify-end cursor-pointer"
                            onClick={() => togglePurchased(item.id)}
                          >
                            <span
                              className="text-base font-bold text-slate-500 line-through truncate text-right"
                              style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                            >
                              {item.name} x{item.quantity}
                            </span>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          </div>
                        </div>
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
              <p className="text-sm text-slate-400 font-bold">פריטים שחוזרים לסל</p>
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
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!list?.id) return;

                          const existing = items.find((i) => !i.isPurchased && i.name.trim() === fav.name.trim());

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
                        }}
                        className="px-1 py-0.5 text-[10px] rounded-md bg-emerald-500 text-white shadow-md active:scale-90 transition-transform font-black"
                        title="הוסף לרשימה"
                      >
                        הוסף לרשימה
                      </button>

                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="p-2 text-slate-300 hover:text-rose-500"
                        title="הסר ממועדפים"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div
                      className="flex-1 text-right font-black text-slate-700 truncate px-3"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {fav.name}
                    </div>

                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom area: Share button + bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="flex justify-start mb-2" dir="ltr">
            <button
              onClick={shareListWhatsApp}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 px-6 rounded-full font-black shadow-lg shadow-emerald-200"
              title="שתף רשימה בוואטסאפ"
            >
              <MessageCircle className="w-5 h-5" />
              שתף רשימה
            </button>
          </div>

          <footer className="bg-white border-t border-slate-200 rounded-2xl" dir="ltr">
            <div className="flex items-center justify-between px-10 py-3">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex flex-col items-center gap-1 text-[11px] font-black ${
                  activeTab === "favorites" ? "text-indigo-600" : "text-slate-300"
                }`}
                title="מועדפים"
              >
                <Star
                  className={`w-7 h-7 ${
                    activeTab === "favorites" ? "fill-indigo-600 text-indigo-600" : "text-slate-300"
                  }`}
                />
                מועדפים
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
            </div>
          </footer>
        </div>
      </div>

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
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-black bg-slate-100 text-slate-700"
              >
                ביטול
              </button>
              <button onClick={clearList} className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white">
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
