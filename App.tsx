import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import {
  Share2,
  Star,
  Trash2,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  ListChecks,
  Check,
  Sparkles,
  LogOut,
  LogIn,
  Loader2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User as FirebaseUser,
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
        const invite = data.pendingInvites?.[token];

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
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center dir-rtl"
      dir="rtl"
    >
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

    if (!inputValue.trim() || !list?.id) return;

    const itemId = crypto.randomUUID();
    const newItem: ShoppingItem = {
      id: itemId,
      name: inputValue.trim(),
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
      await setDoc(favRef, {
        name: item.name,
        createdAt: Date.now(),
      });
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
      if (suggestions.length > 0) {
        setInputValue(suggestions[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateInviteLink = async () => {
    if (!user) {
      await signInSmart();
      return;
    }
    if (!list?.id) return;

    const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

    await updateDoc(doc(db, "lists", list.id), {
      [`pendingInvites.${token}`]: { createdAt: Date.now(), expiresAt },
    });

    const inviteLink = buildInviteLink(list.id, token);

    await copyToClipboard(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 relative pb-40 shadow-2xl overflow-hidden dir-rtl" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={getAiSuggestions}
            className={`p-2 rounded-full ${
              isAiLoading ? "bg-indigo-100 animate-pulse" : "bg-slate-100 hover:bg-indigo-50 text-indigo-600"
            }`}
            title="הצעות AI"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-slate-400 hover:text-rose-500"
            title="נקה רשימה"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button onClick={generateInviteLink} className="p-2 text-slate-400 hover:text-indigo-600" title="הזמן חבר">
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

      {/* Content */}
      <main className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
        {activeTab === "list" ? (
          <div className="space-y-6">
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

                  {purchasedItems.length > 0 && (
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

                          <div className="flex items-center gap-3 flex-1 justify-end cursor-pointer" onClick={() => togglePurchased(item.id)}>
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
                  )}
                </div>
              </div>
            )}
          </div>
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

                          setActiveTab("list");
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white shadow-md active:scale-90 transition-transform font-black"
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

      {/* Bottom Bar: share button above + swapped positions (favorites left, list right) */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-3">
          {/* Share button aligned left above bottom nav */}
          <div className="flex justify-start mb-2">
            <button
              onClick={generateInviteLink}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 px-6 rounded-full font-black shadow-lg shadow-emerald-200"
              title="שתף רשימה"
            >
              <MessageCircle className="w-5 h-5" />
              שתף רשימה
            </button>
          </div>

          {/* Bottom nav */}
          <footer className="bg-white border-t border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between px-10 py-3">
              {/* Favorites on the left */}
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

              {/* List on the right */}
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
