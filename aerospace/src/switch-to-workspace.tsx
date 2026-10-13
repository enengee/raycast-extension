import { List, ActionPanel, Action, Icon, showToast, Toast, showHUD } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { aero, getWorkspaceData, rankWorkspaces, sortByWindowsThenName } from "./lib/aerospace";

export default function Command() {
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [appsByWorkspace, setAppsByWorkspace] = useState<Record<string, string[]>>({});
  const [windowCounts, setWindowCounts] = useState<Record<string, number>>({});
  const [focusedWorkspace, setFocusedWorkspace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getWorkspaceData();
        setWorkspaces(data.workspaces);
        setAppsByWorkspace(data.appsByWorkspace);
        setWindowCounts(data.windowCounts);
        setFocusedWorkspace(data.focusedWorkspace);
      } catch (e) {
        await showToast({ style: Toast.Style.Failure, title: "Failed to query AeroSpace", message: String(e) });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => sortByWindowsThenName(workspaces, windowCounts), [workspaces, windowCounts]);

  const filtered = useMemo(() => rankWorkspaces(searchText, sorted), [sorted, searchText]);

  async function switchTo(workspace: string) {
    try {
      await aero(["workspace", "--", workspace]);
      await showHUD(`Switched to "${workspace}"`);
    } catch (e) {
      await showToast({ style: Toast.Style.Failure, title: "Switch failed", message: String(e) });
    }
  }

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Switch to workspace…"
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
            accessories={isFocused ? [{ tag: "current" }] : undefined}
            actions={
              <ActionPanel>
                <Action title={`Switch to "${w}"`} icon={Icon.ArrowRight} onAction={() => switchTo(w)} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
