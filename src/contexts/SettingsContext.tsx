/**
 * ==================================================================
 * SETTINGS CONTEXT — Frontend Caching untuk Pengaturan Sistem
 * ==================================================================
 * Context menyimpan `app_settings` (key-value store) yang di-fetch
 * sekali saat user login. Nilai disimpan di:
 *   1. `localStorage` (persist antar reload halaman)
 *   2. React state (memory — cepat untuk komponen re-render)
 *
 * Flux data:
 * - User login → AuthProvider.mount / LoginPage → fetch /api/settings
 *   → SettingsProvider.onMount → simpan ke state + localStorage
 * - User merefresh → Provider hydrate dari localStorage → render cepat
 *   → background fetch untuk re-sync (stale 5 menit)
 * - User logout → SettingsProvider.reset() → hapus state + localStorage
 *
 * API:
 * - `useSettings()`  → { targetFyap, targetActiveAgent, fyapTargets,
 *                         activeAgentTargets, loading, settings, refresh }
 * - `SettingsProvider` → wrap app di level tertinggi (dalam AuthProvider)
 * - `refreshSettings()` → fetch ulang tanpa menunggu expiry
 * ==================================================================
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'fdpro_settings';
const STALE_MS = 5 * 60 * 1000; // 5 menit

/** Default target per role (digunakan jika setting belum ada). */
const DEFAULT_FYAP: RoleTargetValues = { FC: 50_000_000, ABP: 150_000_000, BP: 300_000_000 };
const DEFAULT_AA: RoleTargetValues = { FC: 3, ABP: 5, BP: 10 };

/** Normalisasi role DB (fc/abp/bp) → key penyimpanan (FC/ABP/BP). */
function normalizeRoleKey(role?: string): string {
  if (!role) return '';
  if (role === 'fc') return 'FC';
  if (role === 'abp') return 'ABP';
  if (role === 'bp') return 'BP';
  return role.toUpperCase();
}

interface SettingsMap {
  target_fyap?: string;
  target_active_agent?: string;
  [key: string]: string | undefined;
}

/** Target per role (FC/ABP/BP) — di-parse dari setting JSON. */
export interface RoleTargetValues {
  FC?: number;
  ABP?: number;
  BP?: number;
  [roleKey: string]: number | undefined;
}

interface SettingsContextType {
  /** Seluruh map key→value dari app_settings. */
  settings: SettingsMap;
  /** Target FYAP per role (di-parse dari JSON). */
  fyapTargets: RoleTargetValues;
  /** Target Agen Aktif per role (di-parse dari JSON). */
  activeAgentTargets: RoleTargetValues;
  /** Target FYAP untuk role login (fallback default FC/ABP/BP). */
  targetFyap: number;
  /** Target Agen Aktif untuk role login (fallback default FC/ABP/BP). */
  targetActiveAgent: number;
  /** true selama fetch pertama masih berjalan. */
  loading: boolean;
  /** Fetch ulang paksa dari API (bypass localStorage cache). */
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function readLocalStorage(): { settings: SettingsMap; ts: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { settings: SettingsMap; ts: number };
    if (parsed?.settings && typeof parsed.ts === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeLocalStorage(settings: SettingsMap) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, ts: Date.now() }),
    );
  } catch {
    // localStorage penuh / disabled — abaikan
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState<SettingsMap>(() => {
    const cached = readLocalStorage();
    return cached?.settings ?? {};
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    // Jika user belum login, jangan fetch — fallback default akan terpakai.
    if (!isAuthenticated) {
      setSettings({});
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/settings?category=performa');
      const map: SettingsMap = res?.map ?? {};
      setSettings(map);
      writeLocalStorage(map);
    } catch (err) {
      console.warn('[SettingsContext] Gagal fetch settings, menggunakan cache:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch/segerakan ulang saat status autentikasi berubah (login/logout).
  useEffect(() => {
    if (!isAuthenticated) {
      setSettings({});
      setLoading(false);
      return;
    }
    const cached = readLocalStorage();
    const isStale = !cached || Date.now() - cached.ts > STALE_MS;

    if (!isStale && cached) {
      // localStorage masih segar → gunakan, lalu sync di background
      setSettings(cached.settings);
      setLoading(false);
      fetchSettings(); // background refresh (tidak mengubah loading state)
    } else {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  // ── Parse setting JSON per-role ──────────────────────────────────────
  // `setting_value` menyimpan JSON object: {"FC":..,"ABP":..,"BP":..}.
  // Backward-compat: jika berupa angka tunggal (plain number string),
  // sebar nilai tsb ke seluruh role.
  const parseRoleRaw = (raw: string | undefined): RoleTargetValues => {
    if (!raw) return {};
    const asNumber = Number(raw);
    if (!raw.trim().startsWith('{') && Number.isFinite(asNumber)) {
      return { FC: asNumber, ABP: asNumber, BP: asNumber };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const out: RoleTargetValues = {};
        for (const [k, v] of Object.entries(parsed)) {
          const n = Number(v);
          if (Number.isFinite(n)) out[k] = n;
        }
        return out;
      }
    } catch {
      if (Number.isFinite(asNumber)) {
        return { FC: asNumber, ABP: asNumber, BP: asNumber };
      }
    }
    return {};
  };

  const fyapTargets = useMemo<RoleTargetValues>(
    () => parseRoleRaw(settings.target_fyap),
    [settings.target_fyap],
  );
  const activeAgentTargets = useMemo<RoleTargetValues>(
    () => parseRoleRaw(settings.target_active_agent),
    [settings.target_active_agent],
  );

  // Resolusi target sesuai ROLE user login (fc→FC, abp→ABP, bp→BP).
  // Jika bukan role target (calon_agen/admin/super_admin) → 0, sehingga
  // kartu Builder Path menampilkan empty-state / ter-hidden.
  const activeRoleKey = normalizeRoleKey(user?.role);
  const isTargetRole = ['FC', 'ABP', 'BP'].includes(activeRoleKey);

  const targetFyap = useMemo(
    () => (isTargetRole ? (fyapTargets[activeRoleKey] ?? DEFAULT_FYAP[activeRoleKey] ?? 0) : 0),
    [isTargetRole, fyapTargets, activeRoleKey],
  );
  const targetActiveAgent = useMemo(
    () => (isTargetRole ? (activeAgentTargets[activeRoleKey] ?? DEFAULT_AA[activeRoleKey] ?? 0) : 0),
    [isTargetRole, activeAgentTargets, activeRoleKey],
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      fyapTargets,
      activeAgentTargets,
      targetFyap,
      targetActiveAgent,
      loading,
      refreshSettings: fetchSettings,
    }),
    [settings, fyapTargets, activeAgentTargets, targetFyap, targetActiveAgent, loading, fetchSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export default SettingsContext;
