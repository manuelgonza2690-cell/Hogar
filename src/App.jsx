import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

// Importación manual de iconos
import {
  Plus,
  Home,
  PieChart,
  Zap,
  Droplets,
  Flame,
  Utensils,
  PawPrint,
  Leaf,
  ShoppingBag,
  Trash2,
  X,
  Store,
  Package,
  Car,
  Wifi,
  Smartphone,
  Gift,
  Briefcase,
  Heart,
  Music,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  Split,
  Cloud,
  Printer,
  Moon,
  HelpCircle,
  DollarSign,
} from "lucide-react";

// --- TUS DATOS DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCtUbkoIRHx1dkCI8tlKtDK7EDLGKkO2O4",
  authDomain: "gastoshogar-9effd.firebaseapp.com",
  projectId: "gastoshogar-9effd",
  storageBucket: "gastoshogar-9effd.firebasestorage.app",
  messagingSenderId: "106262369198",
  appId: "1:106262369198:web:cb6aea94ec72c6423cee3f",
  measurementId: "G-V2NM4W3EKV",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mi-app-gastos-v1";

// --- MAPA DE ICONOS ---
const iconMap = {
  ShoppingBag: ShoppingBag,
  Utensils: Utensils,
  Zap: Zap,
  Droplets: Droplets,
  Flame: Flame,
  PawPrint: PawPrint,
  Leaf: Leaf,
  Car: Car,
  Briefcase: Briefcase,
  Store: Store,
  Gift: Gift,
  DollarSign: DollarSign,
  Package: Package,
  Wifi: Wifi,
  Smartphone: Smartphone,
  Heart: Heart,
  Music: Music,
  HelpCircle: HelpCircle,
};
const getIcon = (name) => iconMap[name] || HelpCircle;

// --- CONSTANTES ---
const ACCOUNTS = [
  "Nequi",
  "Efectivo",
  "Bancolombia",
  "DaviPlata",
  "Ahorro a la Mano",
];
const STORES = [
  "D1",
  "Ara",
  "Yomeda",
  "Carnicería",
  "Tienda Barrio",
  "Éxito",
  "Plaza",
  "Olimpica",
];
const PET_FOOD_TYPES = [
  "Suelta (Libras)",
  "Bulto (Paquete)",
  "Sobres/Latas",
  "Premios",
];
const RESPONSIBLES = ["Yo", "Mamá", "Papá", "Esposa", "Compartido"];

const INCOME_CATEGORIES = {
  Plataforma: {
    iconName: "Car",
    label: "Plataforma/Apps",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  Nomina: {
    iconName: "Briefcase",
    label: "Nómina/Sueldo",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  Venta: {
    iconName: "Store",
    label: "Venta/Negocio",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  Regalo: {
    iconName: "Gift",
    label: "Regalo/Extra",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  Otro: {
    iconName: "DollarSign",
    label: "Otro Ingreso",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
};

const DEFAULT_EXPENSE_CATEGORIES = {
  Comida: {
    iconName: "Utensils",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    label: "Comida",
    trackDuration: false,
  },
  Luz: {
    iconName: "Zap",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Energía",
    trackDuration: true,
  },
  Agua: {
    iconName: "Droplets",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Agua",
    trackDuration: false,
  },
  Gas: {
    iconName: "Flame",
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Gas",
    trackDuration: true,
  },
  Mascotas: {
    iconName: "PawPrint",
    color: "text-amber-600",
    bg: "bg-amber-600/10",
    label: "Mascotas",
    trackDuration: true,
  },
  Cannabis: {
    iconName: "Leaf",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Cannabis",
    trackDuration: true,
  },
  Suministros: {
    iconName: "ShoppingBag",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    label: "Varios",
    trackDuration: false,
  },
};

// --- UTILIDADES ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
const formatFriendlyDate = (date) =>
  date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + parseInt(days));
  return result;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [budget, setBudget] = useState(0);

  const allExpenseCategories = useMemo(
    () => ({ ...DEFAULT_EXPENSE_CATEGORIES, ...customCategories }),
    [customCategories]
  );

  // --- 1. AUTO-CARGA DE ESTILOS (MAGIC FIX) ---
  useEffect(() => {
    // Esto inyecta Tailwind automáticamente si no está presente
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  // --- 2. AUTENTICACIÓN SEGURA ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.warn("Reintentando Auth...", error);
        try {
          await signOut(auth);
          await signInAnonymously(auth);
        } catch (e) {}
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 3. CARGA DATOS ---
  useEffect(() => {
    if (!user) return;

    // Cargar Config
    getDoc(
      doc(db, "artifacts", appId, "users", user.uid, "settings", "general")
    ).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.customCategories) setCustomCategories(data.customCategories);
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
        if (data.budget) setBudget(data.budget);
      }
    });

    // Cargar Transacciones
    const q = query(
      collection(db, "artifacts", appId, "users", user.uid, "transactions")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date:
            data.date && data.date.toDate
              ? data.date.toDate()
              : new Date(data.date || Date.now()),
        };
      });
      loaded.sort((a, b) => b.date - a.date);
      setTransactions(loaded);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // --- CÁLCULOS ---
  const incomePockets = useMemo(() => {
    const pockets = {};
    transactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === "income") {
        const name = t.incomeSource || "General";
        if (!pockets[name]) pockets[name] = 0;
        pockets[name] += amount;
      } else if (t.type === "expense" && t.linkedIncomeSource) {
        if (!pockets[t.linkedIncomeSource]) pockets[t.linkedIncomeSource] = 0;
        pockets[t.linkedIncomeSource] -= amount;
      }
    });
    return pockets;
  }, [transactions]);

  const walletBalances = useMemo(() => {
    const balances = {};
    ACCOUNTS.forEach((acc) => (balances[acc] = 0));
    transactions.forEach((t) => {
      if (t.splits?.length > 0) {
        t.splits.forEach((s) => {
          if (balances[s.account] !== undefined)
            balances[s.account] += parseFloat(s.amount);
        });
      } else {
        const amount = parseFloat(t.amount) || 0;
        if (balances[t.account] !== undefined) {
          if (t.type === "income") balances[t.account] += amount;
          else balances[t.account] -= amount;
        }
      }
    });
    return balances;
  }, [transactions]);

  const electricityAnalysis = useMemo(() => {
    const lightTx = transactions
      .filter((t) => t.category === "Luz" && t.type === "expense" && t.kw)
      .sort((a, b) => a.date - b.date);
    if (lightTx.length < 2) return null;
    let incidents = [];
    const byMonth = {};
    lightTx.forEach((t) => {
      if (t.date) {
        const k = `${t.date.getFullYear()}-${t.date.getMonth()}`;
        if (!byMonth[k]) byMonth[k] = [];
        byMonth[k].push(t);
      }
    });
    Object.values(byMonth).forEach((monthTxs) => {
      if (monthTxs.length < 2) return;
      monthTxs.sort((a, b) => a.date - b.date);
      let cumMoney = 0;
      let basePrice = monthTxs[0].amount / monthTxs[0].kw;
      for (let i = 0; i < monthTxs.length; i++) {
        const p = monthTxs[i].amount / monthTxs[i].kw;
        if (i > 0 && p > basePrice * 1.3) {
          incidents.push({ money: cumMoney, day: monthTxs[i].date.getDate() });
          break;
        }
        cumMoney += parseFloat(monthTxs[i].amount);
      }
    });
    if (incidents.length === 0) return null;
    return {
      avgMoney: incidents.reduce((s, x) => s + x.money, 0) / incidents.length,
      avgDay: Math.round(
        incidents.reduce((s, x) => s + x.day, 0) / incidents.length
      ),
    };
  }, [transactions]);

  const saveSettings = async (cats, theme) => {
    setCustomCategories(cats);
    setDarkMode(theme);
    if (user)
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "settings", "general"),
        { customCategories: cats, darkMode: theme },
        { merge: true }
      );
  };

  const handleBackup = () => {
    const backupData = {
      transactions: transactions.map((t) => ({
        ...t,
        date: t.date.toISOString(),
      })),
      settings: { customCategories, budget },
      exportDate: new Date().toISOString(),
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `backup_gastos_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // --- VISTAS ---

  const CreateCategoryModal = ({ onClose }) => {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("ShoppingBag");
    const [track, setTrack] = useState(false);
    const handleSave = () => {
      if (!name) return;
      const newCats = {
        ...customCategories,
        [name]: {
          iconName: icon,
          color: "text-pink-500",
          bg: "bg-pink-500/10",
          label: name,
          trackDuration: track,
        },
      };
      saveSettings(newCats, darkMode);
      onClose();
    };
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-sm p-6 rounded-2xl ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            Nueva Categoría
          </h3>
          <input
            placeholder="Nombre (ej. Moto)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full p-3 mb-4 rounded-xl border ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-slate-50 border-slate-200"
            }`}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(iconMap).map((k) => {
              const I = iconMap[k];
              return (
                <button
                  key={k}
                  onClick={() => setIcon(k)}
                  className={`p-2 rounded-lg border ${
                    icon === k
                      ? "bg-indigo-600 text-white"
                      : "border-slate-600 text-slate-400"
                  }`}
                >
                  <I size={18} />
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 mb-6"
            onClick={() => setTrack(!track)}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center ${
                track ? "bg-indigo-600 border-indigo-600" : "border-slate-500"
              }`}
            >
              {track && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="text-sm text-slate-400">¿Rastrear duración?</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 p-3 rounded-xl border border-slate-600 text-slate-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 p-3 rounded-xl bg-indigo-600 text-white font-bold"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    return (
      <div className="pb-24 space-y-6 animate-in slide-in-from-left">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs font-bold uppercase mb-1">
              Disponible Total (Teórico)
            </p>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {formatCurrency(totalIncome - totalExpense)}
            </h1>
            <div className="space-y-2 mt-4">
              <p className="text-[10px] text-slate-400 uppercase font-bold">
                Tus Bolsillos (Orígenes)
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {Object.entries(incomePockets).map(
                  ([name, bal]) =>
                    bal > 0 && (
                      <div
                        key={name}
                        className="bg-white/10 px-3 py-2 rounded-lg min-w-[110px] border border-white/5"
                      >
                        <p className="text-[10px] text-indigo-300 truncate font-bold">
                          {name}
                        </p>
                        <p className="text-sm font-bold">
                          {formatCurrency(bal)}
                        </p>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">
            Cuentas Físicas
          </h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
            {Object.entries(walletBalances).map(
              ([acc, bal]) =>
                bal !== 0 && (
                  <div
                    key={acc}
                    className={`flex-shrink-0 p-3 rounded-xl min-w-[120px] border ${
                      darkMode
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    <p className="text-[10px] text-slate-400 truncate mb-1">
                      {acc}
                    </p>
                    <p
                      className={`font-bold text-sm ${
                        bal < 0
                          ? "text-red-500"
                          : darkMode
                          ? "text-white"
                          : "text-slate-800"
                      }`}
                    >
                      {formatCurrency(bal)}
                    </p>
                  </div>
                )
            )}
          </div>
        </div>

        {electricityAnalysis && (
          <div className="mx-2 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl relative">
            <div className="absolute top-2 right-2 text-yellow-500/20">
              <Zap size={40} />
            </div>
            <h3 className="font-bold text-sm text-yellow-600 flex items-center gap-2 mb-1">
              <AlertTriangle size={14} /> Subsidio Luz
            </h3>
            <p className="text-xs text-slate-500">
              Se acaba aprox. al gastar{" "}
              <strong>{formatCurrency(electricityAnalysis.avgMoney)}</strong>{" "}
              (Día {electricityAnalysis.avgDay}).
            </p>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-2 pb-2">
          {Object.entries(allExpenseCategories).map(([key, cfg]) => {
            if (!cfg.trackDuration) return null;
            const last = transactions.find(
              (t) => t.type === "expense" && t.category === key
            );
            if (!last || !last.duration) return null;
            const end = addDays(last.date, last.duration);
            const daysLeft = Math.ceil(
              (end - new Date()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft > 15) return null;
            return (
              <div
                key={key}
                className={`flex-shrink-0 p-3 rounded-xl w-32 border ${
                  daysLeft < 5
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span
                    className={`text-xs font-bold ${
                      daysLeft < 5 ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    {key}
                  </span>
                  {daysLeft < 3 && (
                    <AlertTriangle
                      size={12}
                      className="text-red-500 animate-pulse"
                    />
                  )}
                </div>
                <p
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {daysLeft}{" "}
                  <span className="text-xs font-normal opacity-50">días</span>
                </p>
                <div className="h-1 w-full bg-slate-500/20 mt-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      daysLeft < 5 ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(daysLeft / last.duration) * 100}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 px-2">
          {transactions.slice(0, 5).map((t) => {
            const isIncome = t.type === "income";
            const CatConfig = isIncome
              ? INCOME_CATEGORIES[t.category]
              : allExpenseCategories[t.category];
            const Icon = getIcon(CatConfig?.iconName || "HelpCircle");
            return (
              <div
                key={t.id}
                onClick={() => {
                  setEditMode(t.id);
                  setView("add");
                }}
                className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-100"
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    isIncome
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownCircle size={20} />
                  ) : (
                    <ArrowUpCircle size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p
                      className={`font-bold truncate ${
                        darkMode ? "text-slate-200" : "text-slate-800"
                      }`}
                    >
                      {t.category}
                    </p>
                    <p
                      className={`font-bold whitespace-nowrap ${
                        isIncome
                          ? "text-emerald-500"
                          : darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </p>
                  </div>
                  {t.type === "expense" && t.linkedIncomeSource && (
                    <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
                      De: {t.linkedIncomeSource}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {t.splits ? "Repartido" : t.account} •{" "}
                    {formatFriendlyDate(t.date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const AddTransactionView = () => {
    const original = editMode
      ? transactions.find((t) => t.id === editMode)
      : null;
    const [tab, setTab] = useState(original?.type || "expense");
    const [showCatModal, setShowCatModal] = useState(false);

    const [formData, setFormData] = useState({
      amount: original?.amount || "",
      category: original?.category || "Comida",
      date: original
        ? original.date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      account: original?.account || "Nequi",
      incomeSource: original?.incomeSource || "",
      linkedIncomeSource: original?.linkedIncomeSource || "",
      kw: original?.kw || "",
      note: original?.note || "",
      place: original?.place || "",
      petFoodType: original?.petFoodType || "",
      splits: original?.splits || [],
      duration: original?.duration || "",
      responsible: original?.responsible || "Yo",
    });

    const [isSplit, setIsSplit] = useState(original?.splits?.length > 0);
    const splitTotal = formData.splits.reduce(
      (s, i) => s + (parseFloat(i.amount) || 0),
      0
    );
    const remaining = (parseFloat(formData.amount) || 0) - splitTotal;

    useEffect(() => {
      if (
        tab === "expense" &&
        !editMode &&
        allExpenseCategories[formData.category]?.trackDuration
      ) {
        const history = transactions.filter(
          (t) =>
            t.type === "expense" &&
            t.category === formData.category &&
            t.duration
        );
        if (history.length > 0) {
          const avg = Math.round(
            history.reduce((s, t) => s + parseInt(t.duration), 0) /
              history.length
          );
          setFormData((prev) => ({ ...prev, duration: avg }));
        }
      }
    }, [formData.category]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const payload = {
          ...formData,
          type: tab,
          amount: parseFloat(formData.amount),
          date: Timestamp.fromDate(new Date(formData.date)),
          incomeSource:
            tab === "income"
              ? formData.incomeSource || "Ingreso General"
              : null,
          linkedIncomeSource:
            tab === "expense" ? formData.linkedIncomeSource : null,
          splits: isSplit ? formData.splits : [],
        };
        if (
          tab === "expense" &&
          !editMode &&
          allExpenseCategories[formData.category]?.trackDuration
        ) {
          const history = transactions
            .filter(
              (t) => t.type === "expense" && t.category === formData.category
            )
            .sort((a, b) => b.date - a.date);
          if (history.length > 0) {
            const days = Math.ceil(
              (new Date(formData.date) - history[0].date) /
                (1000 * 60 * 60 * 24)
            );
            if (days > 0)
              await updateDoc(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "users",
                  user.uid,
                  "transactions",
                  history[0].id
                ),
                { duration: days }
              );
          }
        }
        const ref = editMode
          ? doc(
              db,
              "artifacts",
              appId,
              "users",
              user.uid,
              "transactions",
              editMode
            )
          : collection(
              db,
              "artifacts",
              appId,
              "users",
              user.uid,
              "transactions"
            );
        editMode ? await updateDoc(ref, payload) : await addDoc(ref, payload);
        setEditMode(null);
        setView("dashboard");
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div className="pb-24 animate-in fade-in zoom-in">
        {showCatModal && (
          <CreateCategoryModal onClose={() => setShowCatModal(false)} />
        )}
        <header className="mb-4 flex justify-between items-center">
          <h2
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            {editMode ? "Editar" : "Registrar"}
          </h2>
          <button
            onClick={() => {
              setEditMode(null);
              setView("dashboard");
            }}
            className="text-slate-500"
          >
            <X size={24} />
          </button>
        </header>
        {!editMode && (
          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
            <button
              onClick={() => setTab("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                tab === "expense"
                  ? "bg-white shadow text-red-500"
                  : "text-slate-500"
              }`}
            >
              Gasto
            </button>
            <button
              onClick={() => setTab("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                tab === "income"
                  ? "bg-white shadow text-emerald-500"
                  : "text-slate-500"
              }`}
            >
              Ingreso
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {Object.entries(
              tab === "expense" ? allExpenseCategories : INCOME_CATEGORIES
            ).map(([key, cfg]) => {
              const Icon = getIcon(cfg.iconName);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: key })}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border ${
                    formData.category === key
                      ? tab === "income"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : darkMode
                      ? "border-slate-800 bg-slate-900 text-slate-400"
                      : "border-transparent bg-white shadow-sm text-slate-500"
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-[10px] font-medium truncate w-full text-center">
                    {cfg.label}
                  </span>
                </button>
              );
            })}
            {tab === "expense" && (
              <button
                type="button"
                onClick={() => setShowCatModal(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-500 text-slate-500"
              >
                <Plus size={20} className="mb-1" />
                <span className="text-[10px]">Crear</span>
              </button>
            )}
          </div>
          <div
            className={`${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-100"
            } p-4 rounded-2xl shadow-sm border`}
          >
            <label className="text-xs font-bold text-slate-500 uppercase mb-1">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                $
              </span>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className={`w-full pl-6 text-3xl font-bold bg-transparent outline-none ${
                  darkMode ? "text-white" : "text-slate-800"
                }`}
              />
            </div>
          </div>
          {tab === "expense" && (
            <div
              className={`${
                darkMode
                  ? "bg-red-500/5 border-red-500/10"
                  : "bg-red-50 border-red-100"
              } p-4 rounded-2xl border animate-in slide-in-from-bottom-2`}
            >
              <div className="mb-4">
                <label className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                  <Tag size={12} /> ¿De qué bolsillo sale?
                </label>
                <select
                  value={formData.linkedIncomeSource}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      linkedIncomeSource: e.target.value,
                    })
                  }
                  className={`w-full p-2 rounded-lg text-sm font-bold border outline-none ${
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-white"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <option value="">-- Sin asignar (General) --</option>
                  {Object.entries(incomePockets).map(
                    ([k, v]) =>
                      v > 0 && (
                        <option key={k} value={k}>
                          {k} ({formatCurrency(v)})
                        </option>
                      )
                  )}
                </select>
              </div>
              {(formData.category === "Comida" ||
                formData.category === "Suministros") && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 mb-2 block">
                    Tienda
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STORES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, place: s })}
                        className={`px-2 py-1 text-xs rounded border ${
                          formData.place === s
                            ? "bg-red-500 text-white border-red-500"
                            : "border-slate-400 text-slate-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {formData.category === "Mascotas" && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 mb-2 block">
                    Tipo de Comida
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PET_FOOD_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, petFoodType: t })
                        }
                        className={`p-2 text-xs rounded border ${
                          formData.petFoodType === t
                            ? "bg-amber-600 text-white"
                            : "border-slate-500 text-slate-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {formData.category === "Luz" && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      kW Comprados
                    </label>
                    <input
                      type="number"
                      value={formData.kw}
                      onChange={(e) =>
                        setFormData({ ...formData, kw: e.target.value })
                      }
                      className={`w-full p-2 rounded border ${
                        darkMode ? "bg-slate-900 border-slate-600" : "bg-white"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Días Estimados
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className={`w-full p-2 rounded border ${
                        darkMode ? "bg-slate-900 border-slate-600" : "bg-white"
                      }`}
                    />
                  </div>
                </div>
              )}
              {allExpenseCategories[formData.category]?.trackDuration &&
                formData.category !== "Luz" && (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500">
                      Duración (Días)
                    </label>
                    <input
                      type="number"
                      placeholder="Auto-calculado..."
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className={`w-full p-2 rounded border ${
                        darkMode ? "bg-slate-900 border-slate-600" : "bg-white"
                      }`}
                    />
                  </div>
                )}
            </div>
          )}
          {tab === "income" && (
            <div
              className={`${
                darkMode
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-emerald-50 border-emerald-100"
              } p-4 rounded-2xl border`}
            >
              <label className="text-xs font-bold text-emerald-600 uppercase mb-2">
                Nombre del Ingreso (Bolsillo)
              </label>
              <input
                type="text"
                placeholder="Ej. Nómina, Venta..."
                value={formData.incomeSource}
                onChange={(e) =>
                  setFormData({ ...formData, incomeSource: e.target.value })
                }
                className={`w-full p-3 rounded-xl font-bold outline-none ${
                  darkMode ? "bg-slate-900 text-white" : "bg-white"
                }`}
              />
            </div>
          )}
          <div
            className={`${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-100"
            } p-4 rounded-2xl shadow-sm border space-y-4`}
          >
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {tab === "income" ? "¿A dónde entra?" : "¿De dónde sale?"}
              </label>
              {tab === "income" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSplit(!isSplit);
                    if (!isSplit && formData.splits.length === 0)
                      setFormData({
                        ...formData,
                        splits: [{ account: "Nequi", amount: "" }],
                      });
                  }}
                  className={`text-xs font-bold flex items-center gap-1 ${
                    isSplit ? "text-indigo-400" : "text-slate-400"
                  }`}
                >
                  <Split size={14} /> Repartir
                </button>
              )}
            </div>
            {isSplit ? (
              <div className="space-y-2">
                {formData.splits.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={s.account}
                      onChange={(e) => {
                        const n = [...formData.splits];
                        n[i].account = e.target.value;
                        setFormData({ ...formData, splits: n });
                      }}
                      className={`flex-1 p-2 rounded text-sm bg-transparent border ${
                        darkMode
                          ? "border-slate-700 text-white"
                          : "border-slate-200"
                      }`}
                    >
                      {ACCOUNTS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={s.amount}
                      onChange={(e) => {
                        const n = [...formData.splits];
                        n[i].amount = e.target.value;
                        setFormData({ ...formData, splits: n });
                      }}
                      className={`w-24 p-2 rounded text-sm bg-transparent border ${
                        darkMode
                          ? "border-slate-700 text-white"
                          : "border-slate-200"
                      }`}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      splits: [
                        ...formData.splits,
                        { account: "Nequi", amount: "" },
                      ],
                    })
                  }
                  className="text-xs text-indigo-400"
                >
                  + Agregar
                </button>
                <p
                  className={`text-xs text-right font-bold ${
                    remaining !== 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {remaining !== 0
                    ? `Faltan ${formatCurrency(remaining)}`
                    : "Cuadrado"}
                </p>
              </div>
            ) : (
              <select
                value={formData.account}
                onChange={(e) =>
                  setFormData({ ...formData, account: e.target.value })
                }
                className={`w-full p-2 rounded-lg bg-transparent border ${
                  darkMode
                    ? "border-slate-700 text-white"
                    : "border-slate-200 text-slate-800"
                }`}
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className={`w-full p-2 bg-transparent text-sm border-b ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200"
                  }`}
                />
              </div>
              {tab === "expense" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Responsable
                  </label>
                  <select
                    value={formData.responsible}
                    onChange={(e) =>
                      setFormData({ ...formData, responsible: e.target.value })
                    }
                    className={`w-full p-2 bg-transparent text-sm border-b ${
                      darkMode
                        ? "border-slate-700 text-slate-300"
                        : "border-slate-200"
                    }`}
                  >
                    {RESPONSIBLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <input
              placeholder="Nota..."
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className={`w-full p-2 bg-transparent text-sm border-b ${
                darkMode
                  ? "border-slate-700 text-slate-300"
                  : "border-slate-200"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={isSplit && remaining !== 0}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${
              tab === "income" ? "bg-emerald-600" : "bg-red-600"
            } disabled:opacity-50`}
          >
            {editMode ? "Actualizar" : "Guardar"}
          </button>
        </form>
      </div>
    );
  };

  const StatsView = () => {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const monthlyTx = useMemo(
      () =>
        transactions.filter(
          (t) => t.date.getMonth() === month && t.date.getFullYear() === year
        ),
      [transactions, month, year]
    );
    const expenses = monthlyTx.filter((t) => t.type === "expense");
    const income = monthlyTx.filter((t) => t.type === "income");
    const totalExp = expenses.reduce(
      (s, t) => s + (parseFloat(t.amount) || 0),
      0
    );
    const totalInc = income.reduce(
      (s, t) => s + (parseFloat(t.amount) || 0),
      0
    );

    const byCat = useMemo(() => {
      const d = {};
      expenses.forEach((t) => {
        d[t.category] = (d[t.category] || 0) + parseFloat(t.amount);
      });
      return Object.entries(d).sort((a, b) => b[1] - a[1]);
    }, [expenses]);

    return (
      <div className="pb-24 animate-in fade-in zoom-in print:p-0">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            Estadísticas
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrintPDF}
              className="bg-slate-700 text-white p-2 rounded-lg"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleBackup}
              className="bg-indigo-600 text-white p-2 rounded-lg flex items-center gap-2"
            >
              <Cloud size={20} />
              <span className="text-xs font-bold">Backup Drive</span>
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6 print:hidden">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className={`p-2 rounded-lg border ${
              darkMode ? "bg-slate-800 text-white border-slate-700" : "bg-white"
            }`}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleDateString("es-CO", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={`p-2 rounded-lg border ${
              darkMode ? "bg-slate-800 text-white border-slate-700" : "bg-white"
            }`}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div className="print:text-black">
          <div className="bg-white p-6 rounded-2xl shadow-sm text-slate-800 mb-6 print:shadow-none print:border print:border-slate-300">
            <h3 className="font-bold text-lg mb-4 text-center">
              Reporte Mensual:{" "}
              {new Date(year, month).toLocaleDateString("es-CO", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="flex items-end gap-4 h-32 justify-center mb-6 px-10">
              <div
                className="w-16 bg-emerald-500 rounded-t-lg relative flex items-end justify-center text-white font-bold text-xs pb-2"
                style={{
                  height: `${Math.max(
                    20,
                    (totalInc / (Math.max(totalInc, totalExp) || 1)) * 100
                  )}%`,
                }}
              >
                {formatCurrency(totalInc)}
              </div>
              <div
                className="w-16 bg-red-500 rounded-t-lg relative flex items-end justify-center text-white font-bold text-xs pb-2"
                style={{
                  height: `${Math.max(
                    20,
                    (totalExp / (Math.max(totalInc, totalExp) || 1)) * 100
                  )}%`,
                }}
              >
                {formatCurrency(totalExp)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Ingresos</p>
                <p className="font-bold text-emerald-600 text-xl">
                  {formatCurrency(totalInc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Gastos</p>
                <p className="font-bold text-red-600 text-xl">
                  {formatCurrency(totalExp)}
                </p>
              </div>
            </div>
            <div className="mt-4 text-center border-t pt-2">
              <p className="text-xs text-slate-500 uppercase">Balance</p>
              <p
                className={`font-bold text-xl ${
                  totalInc - totalExp >= 0 ? "text-slate-800" : "text-red-600"
                }`}
              >
                {formatCurrency(totalInc - totalExp)}
              </p>
            </div>
          </div>

          <h4
            className={`font-bold mb-4 print:text-black ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            Desglose de Gastos
          </h4>
          <div className="space-y-3">
            {byCat.map(([cat, val]) => (
              <div
                key={cat}
                className={`flex items-center justify-between p-3 rounded-lg border print:border-slate-300 print:bg-white print:text-black ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {cat}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {formatCurrency(val)}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({Math.round((val / totalExp) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">
        Cargando...
      </div>
    );

  return (
    <div
      className={`min-h-screen font-sans ${
        darkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div
        className={`fixed top-0 left-0 right-0 z-20 px-6 py-4 flex justify-between items-center backdrop-blur-md print:hidden ${
          darkMode ? "bg-slate-950/80" : "bg-white/80"
        }`}
      >
        <h1 className="font-bold text-lg">
          Control<span className="text-indigo-400">Total</span>
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 bg-slate-800 rounded-full text-yellow-400"
        >
          <Moon size={16} />
        </button>
      </div>
      <main className="pt-24 px-4 max-w-md mx-auto min-h-screen print:pt-0 print:max-w-none">
        {view === "dashboard" && <DashboardView />}
        {view === "add" && <AddTransactionView />}
        {view === "stats" && <StatsView />}
      </main>
      <div
        className={`fixed bottom-0 left-0 right-0 border-t px-6 py-2 pb-6 z-30 print:hidden ${
          darkMode
            ? "bg-slate-950 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setView("dashboard")}
            className={`flex flex-col items-center gap-1 p-2 ${
              view === "dashboard" ? "text-indigo-500" : "text-slate-500"
            }`}
          >
            <Home size={20} />
            <span className="text-[10px]">Inicio</span>
          </button>
          <button
            onClick={() => {
              setEditMode(null);
              setView("add");
            }}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg -translate-y-6"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => setView("stats")}
            className={`flex flex-col items-center gap-1 p-2 ${
              view === "stats" ? "text-indigo-500" : "text-slate-500"
            }`}
          >
            <PieChart size={20} />
            <span className="text-[10px]">Stats</span>
          </button>
        </div>
      </div>
      <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @media print {
            body * { visibility: hidden; }
            .print\\:text-black, .print\\:text-black * { visibility: visible; color: black !important; }
            .print\\:hidden { display: none !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border { border: 1px solid #ddd !important; }
            .print\\:bg-white { background: white !important; }
            main { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          }
        `}</style>
    </div>
  );
}
