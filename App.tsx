import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Share2, Star, Trash2,
  ShoppingCart, Plus, Minus, MessageCircle,
  CheckCircle2, Circle, ListChecks, Check, AlertCircle,
  Sparkles, LogOut, User, LogIn, Loader2
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  doc, setDoc, updateDoc, onSnapshot, collection,
  query, where, getDocs, arrayUnion, runTransaction,
  deleteDoc, deleteField
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { auth, db, googleProvider } from './firebase.ts';
import { ShoppingItem, ShoppingList, Tab } from './types.ts';

// --- Invite Page Component ---
const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const listId = searchParams.get('listId');
  const token = searchParams.get('token');
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleJoin = async () => {
    if (!user || !listId || !token) return;
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
          [`pendingInvites.${token}`]: deleteField()
        });
      });

      // לשמור את הרשימה הפעילה
      localStorage.setItem("activeListId", listId);
      navigate('/');
    } catch (e: any) {
      setError(e?.message || "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center dir-rtl" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Share2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-800">הוזמנת לרשימה</h1>
        {error && <p className="text-rose-500 font-bold">{error}</p>}

        {!user ? (
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
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
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'הצטרף לרשימה'}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main List Component ---
const MainList: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [inputValue, setInputValue] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);

      if (!u) {
        setList(null);
        setItems([]);
        return;
      }

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
          updatedAt: Date.now()
        };

        await setDoc(newListRef, newList);
        setList(newList);
        localStorage.setItem("activeListId", newListRef.id);
      } else {
        const savedId = localStorage.getItem("activeListId");
        const docToUse = savedId
          ? (snap.docs.find(d => d.id === savedId) ?? snap.docs[0])
          : snap.docs[0];

        const data = docToUse.data() as ShoppingList;
        setList({ ...data, id: docToUse.id });
        localStorage.setItem("activeListId", docToUse.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!list?.id) return;

    const listRef = doc(db, "lists", list.id);
    const itemsCol = collection(listRef, "items");

    const unsubList = onSnapshot(listRef, (snap) => {
      if (snap.exists()) setList({ ...(snap.data() as ShoppingList), id: snap.id });
    });

    const unsubItems = onSnapshot(itemsCol, (snap) => {
      const docs = snap.docs.map(d => d.data() as ShoppingItem);
      setItems(docs);
    });

    return () => { unsubList(); unsubItems(); };
  }, [list?.id]);

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !list?.id) return;

    const itemId = crypto.randomUUID();
    const newItem: ShoppingItem = {
      id: itemId,
      name: inputValue.trim(),
      quantity: 1,
      isPurchased: false,
      isFavorite: false,
      createdAt: Date.now()
    };

    await setDoc(doc(db, "lists", list.id, "items", itemId), newItem);
    setInputValue('');
  };

  const togglePurchased = async (id: string) => {
    if (!list?.id) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const isNowPurchased = !item.isPurchased;
    await updateDoc(doc(db, "lists", list.id, "items", id), {
      isPurchased: isNowPurchased,
      purchasedAt: isNowPurchased ? Date.now() : null
    });
  };

  const updateQty = async (id: string, delta: number) => {
    if (!list?.id) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    await updateDoc(doc(db, "lists", list.id, "items", id), {
      quantity: Math.max(1, item.quantity + delta)
    });
  };

  const deleteItem = async (id: string) => {
    if (!list?.id) return;
    await deleteDoc(doc(db, "lists", list.id, "items", id));
  };

  const toggleFavorite = async (id: string) => {
    if (!list?.id) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    await updateDoc(doc(db, "lists", list.id, "items", id), {
      isFavorite: !item.isFavorite
    });
  };

  const clearList = async () => {
    if (!list?.id) return;
    const batch = items.map(i => deleteDoc(doc(db, "lists", list.id, "items", i.id)));
    await Promise.all(batch);
    setShowClearConfirm(false);
  };

  const getAiSuggestions = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) return;

    setIsAiLoading(true);
    const ai = new GoogleGenAI({ apiKey });

    try {
      const currentList = items.map(i => i.name).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `אני מכין רשימת קניות. הפריטים הנוכחיים שלי הם: ${currentList}. תן לי 5 הצעות לפריטים נוספים שחסרים לי בדרך כלל עם פריטים אלו. החזר רק רשימה מופרדת בפסיקים של שמות הפריטים בעברית.`,
      });

      const suggestions = response.text?.split(',').map(s => s.trim()) || [];
      if (suggestions.length > 0) setInputValue(suggestions[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateInviteLink = async () => {
    if (!user || !list?.id) {
      await signInWithPopup(auth, googleProvider);
      return;
    }

    const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const expiresAt = Date.now() + (48 * 60 * 60 * 1000);

    await updateDoc(doc(db, "lists", list.id), {
      [`pendingInvites.${token}`]: { createdAt: Date.now(), expiresAt }
    });

   const url = new URL(window.location.href);
url.hash = `/invite?listId=${list.id}&token=${token}`;
const inviteLink = url.toString();

await navigator.clipboard.writeText(inviteLink);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const active = items.filter(i => !i.isPurchased);
    if (active.length === 0) return;

    const listText = active.map(i => `${i.name} x${i.quantity}`).join('\n');
    const message = encodeURIComponent(`*רשימת קניות*\n\n${listText}\n\nנשלח מהרשימה החכמה 🛒`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const activeItems = useMemo(
    () => items.filter(i => !i.isPurchased).sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  const purchasedItems = useMemo(
    () => items.filter(i => i.isPurchased).sort((a, b) => (b.purchasedAt || 0) - (a.purchasedAt || 0)),
    [items]
  );

  const favorites = useMemo(
    () => items.filter(i => i.isFavorite),
    [items]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 relative pb-32 shadow-2xl overflow-hidden dir-rtl" dir="rtl">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={getAiSuggestions}
            className={`p-2 rounded-full ${isAiLoading ? 'bg-indigo-100 animate-pulse' : 'bg-slate-100 hover:bg-indigo-50 text-indigo-600'}`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="p-2 text-slate-400 hover:text-rose-500">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={generateInviteLink} className="p-2 text-slate-400">
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>

        <h1 className="text-xl font-extrabold text-slate-800">הרשימה שלי</h1>

        <button
          onClick={() => !user ? signInWithPopup(auth, googleProvider) : signOut(auth)}
          className={`p-2 rounded-full shadow-lg active:scale-90 transition-transform ${user ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
        >
          {user ? <LogOut className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
        {activeTab === 'list' ? (
          <>
            <form onSubmit={addItem} className="relative">
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="מה להוסיף לרשימה?"
                className="w-full p-4 pr-4 pl-14 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-white text-right"
              />
              <button type="submit" className="absolute left-2.5 top-2.5 bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transition-all">
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
                  {activeItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-2 transition-colors ${item.isFavorite ? 'text-amber-500' : 'text-slate-300'}`}
                        >
                          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-500' : ''}`} />
                        </button>
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 mr-2">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-black text-slate-700 min-w-[1rem] text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-400">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-3 overflow-hidden flex-1 justify-end cursor-pointer"
                        onClick={() => togglePurchased(item.id)}
                      >
                        <span className="text-base font-bold text-slate-700 truncate">{item.name}</span>
                        <Circle className="w-6 h-6 text-slate-300 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>

                {purchasedItems.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right mb-2">
                      נקנו ({purchasedItems.length})
                    </h3>
                    {purchasedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-100/50 rounded-2xl opacity-60 grayscale transition-all">
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div
                          className="flex items-center gap-3 flex-1 justify-end cursor-pointer"
                          onClick={() => togglePurchased(item.id)}
                        >
                          <span className="text-base font-bold text-slate-500 line-through truncate">
                            {item.name} x{item.quantity}
                          </span>
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {favorites.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <button
                      onClick={async () => {
                        if (!list?.id) return;
                        await updateDoc(doc(db, "lists", list.id, "items", item.id), { isPurchased: false });
                        setActiveTab('list');
                      }}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                      הוסף לרשימה
                    </button>
                    <span className="font-bold text-slate-700">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {activeTab === 'list' && activeItems.length > 0 && (
        <button
          onClick={shareWhatsApp}
          className="fixed bottom-28 left-6 right-6 bg-emerald-500 text-white py-4 rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 font-black z-30 active:scale-95 transition-all border-2 border-white"
        >
          <MessageCircle className="w-6 h-6" />
          <span>שתף רשימה בוואטסאפ</span>
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 h-24 flex justify-around items-center z-50 pb-8 px-10">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'list' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
        >
          <ListChecks className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-widest">רשימה</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'favorites' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
        >
          <Star className="w-7 h-7" />
          <span className="text-[10px] font-black uppercase tracking-widest">מועדפים</span>
        </button>
      </nav>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">למחוק את כל הרשימה?</h3>
              <p className="text-sm text-slate-400 font-bold">הפעולה תנקה רק את הפריטים שלא במועדפים.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold">
                ביטול
              </button>
              <button onClick={clearList} className="py-4 rounded-2xl bg-rose-500 text-white font-bold">
                מחיקה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<MainList />} />
      <Route path="/invite" element={<InvitePage />} />
    </Routes>
  </HashRouter>
);

export default App;
