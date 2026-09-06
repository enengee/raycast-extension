import { List, ActionPanel, Action, Icon, showToast, Toast, showHUD } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { aero, fuzzyMatch, getFocusedMonitor, getWorkspaceData, sortByWindowsThenName } from "./lib/aerospace";

export default function Command() {
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [appsByWorkspace, setAppsByWorkspace] = useState<Record<string, string[]>>({});
  const [windowCounts, setWindowCounts] = useState<Record<string, number>>({});
  const [focusedWorkspace, setFocusedWorkspace] = useState<string | null>(null);
  const [monitor, setMonitor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [data, mon] = await Promise.all([getWorkspaceData(), getFocusedMonitor()]);
        setWorkspaces(data.workspaces);
        setAppsByWorkspace(data.appsByWorkspace);
        setWindowCounts(data.windowCounts);
        setFocusedWorkspace(data.focusedWorkspace);
        setMonitor(mon);
      } catch (e) {
        await showToast({ style: Toast.Style.Failure, title: "Failed to query AeroSpace", message: String(e) });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => sortByWindowsThenName(workspaces, windowCounts), [workspaces, windowCounts]);

  const query = searchText.trim();
  const filtered = useMemo(() => {
    if (!query) return sorted;
    return sorted.filter(
      (w) => fuzzyMatch(query, w) || (appsByWorkspace[w] ?? []).some((app) => fuzzyMatch(query, app)),
    );
  }, [sorted, appsByWorkspace, query]);

  async function summon(workspace: string) {
    try {
      // Brings the named workspace to the currently focused monitor and focuses it.
      await aero(["summon-workspace", "--", workspace]);
      await showHUD(monitor ? `Brought "${workspace}" to ${monitor}` : `Summoned "${workspace}"`);
    } catch (e) {
      await showToast({ style: Toast.Style.Failure, title: "Summon failed", message: String(e) });
    }
  }

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={monitor ? `Bring a workspace to ${monitor}…` : "Bring a workspace to this monitor…"}
    >
      {filtered.map((w) => {
        const apps = appsByWorkspace[w] ?? [];
        const isFocused = w === focusedWorkspace;
        return (
          <List.Item
            key={w}
            icon={isFocused ? Icon.Dot : Icon.Window}
            title={w}
            subtitle={apps.length ? apps.join(", ") : "empty"}
            accessories={isFocused ? [{ tag: "on this monitor" }] : undefined}
            actions={
              <ActionPanel>
                <Action title="Bring to This Monitor" icon={Icon.ArrowRight} onAction={() => summon(w)} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
