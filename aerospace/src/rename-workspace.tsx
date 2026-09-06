import { List, ActionPanel, Action, Icon, showToast, Toast, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { aero, parseLines } from "./lib/aerospace";

export default function Command() {
  const [current, setCurrent] = useState<string | null>(null);
  const [windowCount, setWindowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const focused = parseLines(await aero(["list-workspaces", "--focused"]))[0] ?? null;
        setCurrent(focused);
        if (focused) {
          const ids = parseLines(await aero(["list-windows", "--workspace", focused, "--format", "%{window-id}"]));
          setWindowCount(ids.length);
        }
      } catch (e) {
        await showToast({ style: Toast.Style.Failure, title: "Failed to read focused workspace", message: String(e) });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function rename(rawTarget: string) {
    const target = rawTarget.trim();
    if (!current) {
      await showToast({ style: Toast.Style.Failure, title: "No focused workspace found" });
      return;
    }
    if (!target || /\s/.test(target)) return; // guarded by the UI below
    if (target === current) {
      await showHUD("Name unchanged");
      return;
    }
    try {
      // Re-read windows at action time so we act on current state.
      const ids = parseLines(await aero(["list-windows", "--workspace", current, "--format", "%{window-id}"]));
      let moved = 0;
      for (const id of ids) {
        try {
          await aero(["move-node-to-workspace", "--window-id", id, "--", target]);
          moved++;
        } catch {
          // A window may have closed mid-operation; skip it.
        }
      }
      // Follow to the renamed workspace so you stay with your windows.
      await aero(["workspace", "--", target]);
      await showHUD(
        moved > 0
          ? `Renamed "${current}" → "${target}" (${moved} window${moved === 1 ? "" : "s"})`
          : `Switched to "${target}" (focused workspace was empty)`,
      );
    } catch (e) {
      await showToast({ style: Toast.Style.Failure, title: "Rename failed", message: String(e) });
    }
  }

  const typed = searchText.trim();
  const hasSpace = /\s/.test(typed);
  const canRename = typed.length > 0 && !hasSpace && current !== null;

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={current ? `Rename "${current}" to…  (type a name, then Enter)` : "No focused workspace"}
      navigationTitle={current ? `Rename workspace "${current}"` : "Rename workspace"}
    >
      {canRename ? (
        <List.Item
          icon={Icon.Pencil}
          title={`Rename to "${typed}"`}
          subtitle={`from "${current}" · ${windowCount} window${windowCount === 1 ? "" : "s"}`}
          actions={
            <ActionPanel>
              <Action title={`Rename to "${typed}"`} icon={Icon.Pencil} onAction={() => rename(typed)} />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          icon={Icon.Pencil}
          title={
            isLoading
              ? "Loading…"
              : !current
                ? "No focused workspace found"
                : hasSpace
                  ? "Workspace names can't contain spaces"
                  : `Type a new name for "${current}"`
          }
          description={
            current && !hasSpace && !isLoading
              ? `${windowCount} window${windowCount === 1 ? "" : "s"} will move to the new name`
              : undefined
          }
        />
      )}
    </List>
  );
}
