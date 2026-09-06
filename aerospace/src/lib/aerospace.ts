import { getPreferenceValues } from "@raycast/api";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);

interface Preferences {
  aerospacePath: string;
}

const prefs = getPreferenceValues<Preferences>();
export const AEROSPACE = prefs.aerospacePath?.trim() || "/opt/homebrew/bin/aerospace";

/** Run the aerospace CLI with an argument array (no shell, so names are safe). */
export async function aero(args: string[]): Promise<string> {
  const { stdout } = await execFileP(AEROSPACE, args);
  return stdout;
}

export function parseLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export interface WorkspaceData {
  workspaces: string[];
  appsByWorkspace: Record<string, string[]>;
  windowCounts: Record<string, number>;
  focusedWorkspace: string | null;
}

/** Query all workspaces plus, per workspace, the apps in it and its window count. */
export async function getWorkspaceData(): Promise<WorkspaceData> {
  const [wsOut, winOut, focusedWsOut] = await Promise.all([
    aero(["list-workspaces", "--all"]),
    aero(["list-windows", "--all", "--format", "%{workspace}|%{app-name}"]),
    aero(["list-workspaces", "--focused"]).catch(() => ""),
  ]);

  const workspaces = parseLines(wsOut);
  const appsByWorkspace: Record<string, string[]> = {};
  const windowCounts: Record<string, number> = {};
  for (const line of parseLines(winOut)) {
    const idx = line.indexOf("|");
    if (idx === -1) continue;
    const ws = line.slice(0, idx).trim();
    const app = line.slice(idx + 1).trim();
    windowCounts[ws] = (windowCounts[ws] ?? 0) + 1;
    if (!appsByWorkspace[ws]) appsByWorkspace[ws] = [];
    if (app && !appsByWorkspace[ws].includes(app)) appsByWorkspace[ws].push(app);
  }

  return {
    workspaces,
    appsByWorkspace,
    windowCounts,
    focusedWorkspace: parseLines(focusedWsOut)[0] ?? null,
  };
}

export interface FocusedWindow {
  id: string | null;
  app: string | null;
}

/**
 * The focused window at launch. If AeroSpace reports Raycast itself as focused,
 * returns { id: null } so callers fall back to focus restoration after closeMainWindow.
 */
export async function getFocusedWindow(): Promise<FocusedWindow> {
  const out = await aero(["list-windows", "--focused", "--format", "%{window-id}|%{app-name}"]).catch(() => "");
  const line = parseLines(out)[0];
  if (!line) return { id: null, app: null };

  const idx = line.indexOf("|");
  const id = (idx === -1 ? line : line.slice(0, idx)).trim();
  const app = idx === -1 ? null : line.slice(idx + 1).trim();

  if (app && /raycast/i.test(app)) return { id: null, app: null };
  return { id: id || null, app };
}

/** Workspaces with windows first, then empty ones; each group sorted by name. */
export function sortByWindowsThenName(workspaces: string[], windowCounts: Record<string, number>): string[] {
  return [...workspaces].sort((a, b) => {
    const aHas = (windowCounts[a] ?? 0) > 0 ? 1 : 0;
    const bHas = (windowCounts[b] ?? 0) > 0 ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
}

/** Case-insensitive subsequence match: the characters of `query` appear in order in `target`. */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return true;
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}

/** Name of the currently focused monitor (e.g. "Built-in Retina Display"), or null. */
export async function getFocusedMonitor(): Promise<string | null> {
  const line = parseLines(await aero(["list-monitors", "--focused"]).catch(() => ""))[0];
  if (!line) return null;
  const idx = line.indexOf("|");
  return (idx === -1 ? line : line.slice(idx + 1)).trim() || null;
}
