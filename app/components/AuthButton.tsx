"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { syncLocalProgressToCloud } from "@/lib/progressRepository";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error("Error checking auth status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      // Sync local progress to cloud on successful login
      if (event === "SIGNED_IN" && session?.user) {
        syncLocalProgressToCloud().catch(console.error);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      } else {
        setUser(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "ออกจากระบบไม่สำเร็จ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <button
        disabled
        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
      >
        กำลังโหลด...
      </button>
    );
  }

  if (error) {
    return (
      <div className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">
          {user.email?.split("@")[0] || "ผู้ใช้งาน"}
        </span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-700">Guest mode</span>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="rounded-full border border-slate-200 bg-emerald-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        Sign in with Google
      </button>
    </div>
  );
}
