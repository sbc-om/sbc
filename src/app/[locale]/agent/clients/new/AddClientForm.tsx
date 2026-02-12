"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineSearch,
  HiOutlineUserAdd,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import type { Locale } from "@/lib/i18n/locales";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";

const texts = {
  en: {
    title: "Add a Client",
    subtitle: "Search for an existing user or create a new account",
    tabSearch: "Search Existing User",
    tabCreate: "Create New Account",
    searchPlaceholder: "Search by phone, email or name…",
    searchBtn: "Search",
    noResults: "No users found",
    addAsClient: "Add as Client",
    fullName: "Full Name",
    phone: "Phone",
    email: "Email (optional)",
    password: "Password",
    create: "Create Account & Add as Client",
    creating: "Creating…",
    successTitle: "Client Added!",
    successMsg: "The client has been added to your list.",
    viewClients: "View My Clients",
    addAnother: "Add Another",
  },
  ar: {
    title: "إضافة عميل",
    subtitle: "ابحث عن مستخدم حالي أو أنشئ حسابًا جديدًا",
    tabSearch: "بحث مستخدم موجود",
    tabCreate: "إنشاء حساب جديد",
    searchPlaceholder: "ابحث بالهاتف أو البريد أو الاسم…",
    searchBtn: "بحث",
    noResults: "لم يتم العثور على مستخدمين",
    addAsClient: "إضافة كعميل",
    fullName: "الاسم الكامل",
    phone: "الهاتف",
    email: "البريد الإلكتروني (اختياري)",
    password: "كلمة المرور",
    create: "إنشاء الحساب وإضافة كعميل",
    creating: "جاري الإنشاء…",
    successTitle: "تمت إضافة العميل!",
    successMsg: "تمت إضافة العميل إلى قائمتك.",
    viewClients: "عرض عملائي",
    addAnother: "إضافة آخر",
  },
};

type Tab = "search" | "create";

export function AddClientForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = texts[locale];
  const ar = locale === "ar";
  const [, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>("search");
  const [success, setSuccess] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [adding, setAdding] = useState(false);

  // Create state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    setSearchDone(false);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search-user", query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSearchResults(data.users || []);
      setSearchDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddUser(userId: string) {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-client", clientId: userId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setAdding(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newPassword.trim()) {
      setError(ar ? "الرجاء ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-client",
          fullName: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim(),
          password: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setCreating(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="sbc-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">{t.successTitle}</h2>
          <p className="mt-2 text-sm text-(--muted-foreground)">{t.successMsg}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/agent/clients`)}
            >
              {t.viewClients}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSuccess(false);
                setSearchQuery("");
                setSearchResults([]);
                setSearchDone(false);
                setNewName("");
                setNewPhone("");
                setNewEmail("");
                setNewPassword("");
                setError("");
                setAdding(false);
                setCreating(false);
                startTransition(() => router.refresh());
              }}
            >
              {t.addAnother}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/[0.04]">
        {(
          [
            ["search", t.tabSearch, HiOutlineSearch],
            ["create", t.tabCreate, HiOutlineUserAdd],
          ] as [Tab, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setError("");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white shadow-sm dark:bg-white/[0.08]"
                : "text-(--muted-foreground) hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {tab === "search" && (
        <div className="sbc-card space-y-4 rounded-2xl p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t.searchPlaceholder}
              className="flex-1 rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
            />
            <button
              type="button"
              disabled={searching}
              onClick={handleSearch}
              className="rounded-xl bg-(--foreground) px-5 py-2.5 text-sm font-semibold text-(--background) transition-all hover:opacity-90 disabled:opacity-50"
            >
              {searching ? "..." : t.searchBtn}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.04]">
              {searchResults.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 border-b border-gray-100/80 px-4 py-3 last:border-0 dark:border-white/[0.03]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name || u.email}</p>
                    <p className="truncate text-xs text-(--muted-foreground)">
                      {u.phone || u.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={adding}
                    onClick={() => handleAddUser(u.id)}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  >
                    {adding ? "..." : t.addAsClient}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchDone && searchResults.length === 0 && (
            <p className="text-center text-sm text-(--muted-foreground)">{t.noResults}</p>
          )}
        </div>
      )}

      {/* Create Tab */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="sbc-card space-y-4 rounded-2xl p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.fullName} *</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.phone} *</label>
            <PhoneInput
              value={newPhone}
              onChange={(val) => setNewPhone(val)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.email}</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.password} *</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={creating}
          >
            {creating ? t.creating : t.create}
          </Button>
        </form>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
