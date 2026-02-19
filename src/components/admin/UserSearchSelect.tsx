"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type UserHit = {
  id: string;
  email: string;
  role: "admin" | "user";
};

export function UserSearchSelect({
  locale,
  label,
  name,
  placeholder,
  initialUser,
  helpText,
}: {
  locale: "en" | "ar";
  label: string;
  /** Form field name to submit the selected user's id. */
  name: string;
  placeholder?: string;
  initialUser?: { id: string; email: string };
  helpText?: string;
}) {
  const ar = locale === "ar";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(initialUser?.email ?? "");
  const [selected, setSelected] = useState<{ id: string; email: string } | null>(
    initialUser ?? null,
  );
  const [results, setResults] = useState<UserHit[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // When user starts typing after a selection, we consider it a new search.
  useEffect(() => {
    if (!selected) return;
    if (query.trim() !== selected.email) {
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const run = async () => {
      setError(null);

      // If empty, just reset results.
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(trimmed)}&limit=20`, {
          method: "GET",
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          setError(ar ? "فشل البحث" : "Search failed");
          setResults([]);
          return;
        }

        const data = (await res.json()) as { ok?: boolean; users?: UserHit[] };
        const users = Array.isArray(data.users) ? data.users : [];
        if (!alive) return;
        setResults(users);
      } catch (e) {
        if (!alive) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(ar ? "فشل البحث" : "Search failed");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const t = window.setTimeout(run, 250);
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [trimmed, ar]);

  const selectUser = (u: UserHit) => {
    setSelected({ id: u.id, email: u.email });
    setQuery(u.email);
    setOpen(false);
    setResults([]);
    setError(null);
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="grid gap-2">
      <label className="group grid gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>

        {/* hidden field that actually gets submitted */}
        <input type="hidden" name={name} value={selected?.id ?? ""} />

        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
          />

          {query ? (
            <div className="absolute inset-y-0 end-2 flex items-center">
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                {ar ? "مسح" : "Clear"}
              </Button>
            </div>
          ) : null}

          {open ? (
            <div className="absolute z-50 mt-2 w-full rounded-xl border border-(--surface-border) bg-(--surface) shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-xs text-(--muted-foreground) border-b" style={{ borderColor: "var(--surface-border)" }}>
                {loading
                  ? ar ? "جارٍ البحث..." : "Searching..."
                  : selected
                    ? ar ? "تم اختيار مستخدم" : "User selected"
                    : ar ? "ابدأ بالكتابة للبحث" : "Type to search"}
              </div>

              {error ? (
                <div className="px-3 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
              ) : null}

              {!loading && !error ? (
                results.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-(--muted-foreground)">
                    {trimmed ? (ar ? "لا توجد نتائج" : "No results") : (ar ? "" : "")}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-auto">
                    {results.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-start px-3 py-2 hover:bg-(--chip-bg) transition"
                        onClick={() => selectUser(u)}
                      >
                        <div className="text-sm font-semibold truncate">{u.email}</div>
                        <div className="mt-0.5 text-xs text-(--muted-foreground) truncate">
                          {u.role} • {u.id}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      </label>

      {helpText ? <p className="text-xs text-(--muted-foreground)">{helpText}</p> : null}

      {/* Small validation hint: if user typed something but didn't pick a result */}
      {query.trim() && !selected ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {ar ? "يرجى اختيار مستخدم من القائمة." : "Please select a user from the list."}
        </p>
      ) : null}
    </div>
  );
}
