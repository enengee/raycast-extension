import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  showHUD,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import {
  aero,
  getWorkspaceData,
  getFocusedWindow,
  sortByWindowsThenName,
  type FocusedWindow,
} from "./lib/aerospace";

export default function Command() {
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [appsByWorkspace, setAppsByWorkspace] = useState<
    Record<string, string[]>
  >({});
  const [windowCounts, setWindowCounts] = useState<Record<string, number>>({});
  const [focusedWorkspace, setFocusedWorkspace] = useState<string | null>(null);
  const [focused, setFocused] = useState<FocusedWindow>({
    id: null,
    app: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [data, fw] = await Promise.all([
          getWorkspaceData(),
          getFocusedWindow(),
        ]);
        setWorkspaces(data.workspaces);
        setAppsByWorkspace(data.appsByWorkspace);
        setWindowCounts(data.windowCounts);
        setFocusedWorkspace(data.focusedWorkspace);
        setFocused(fw);
      } catch (e) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to query AeroSpace",
          message: String(e),
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function move(workspace: string, follow: boolean) {
    const target = workspace.trim();
    if (!target) return;

    // Resolve the window to act on NOW, at action time.
    //
    // It must NOT be read from mount-time state. Raycast keeps a command's process
    // and its mounted component alive between invocations, so the useEffect above
    // runs once per *process*, not once per press: `focused` holds whatever was
    // focused the first time the command was opened that session, and every later
    // press would move that same stale window. Measured before this was fixed: a
    // single mount served ten presses over 47 seconds, all of them moving the
    // window focused at the first press.
    //
    // Querying AeroSpace while Raycast is open is safe, and is what makes this
    // work: AeroSpace does not track Raycast's own window, so `list-windows
    // --focused` still reports the window underneath — the one the user means.
    //
    // The mount-time capture remains only as a fallback for the case the original
    // code guarded against, where AeroSpace does report Raycast as focused.
    const live = await getFocusedWindow();
    const id = live.id ?? focused.id;

    if (!id) {
      // Deliberately no "close Raycast, wait 120ms, ask again" fallback here. That
      // path read focus back *after* macOS had restored it, and macOS restores an
      // app's most recently fronted window rather than the one that was focused —
      // a second way to grab an unintended window. Failing visibly is better than
      // silently moving the wrong one.
      await showToast({
        style: Toast.Style.Failure,
        title: "No window to move",
        message: "Could not resolve a focused window",
      });
      return;
    }

    const args = ["move-node-to-workspace", "--window-id", id];
    if (follow) args.push("--focus-follows-window");
    args.push("--", target);

    try {
      await aero(args);
      await showHUD(
        follow
          ? `Moved & switched to "${target}"`
          : `Moved window to "${target}"`,
      );
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Move failed",
        message: String(e),
      });
    }
  }

  const typed = searchText.trim();
  const lower = typed.toLowerCase();
  const exists = useMemo(
    () => workspaces.some((w) => w.toLowerCase() === lower),
    [workspaces, lower],
  );
  const sorted = useMemo(
    () => sortByWindowsThenName(workspaces, windowCounts),
    [workspaces, windowCounts],
  );
  // Manual filtering: because `onSearchTextChange` is set, Raycast disables its
  // built-in filtering, so we narrow the workspace list ourselves.
  const filtered = useMemo(
    () =>
      lower ? sorted.filter((w) => w.toLowerCase().includes(lower)) : sorted,
    [sorted, lower],
  );

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={
        focused.app
          ? `Move "${focused.app}" to workspace…`
          : "Type a workspace name to move to (or create)…"
      }
    >
      {/* Rendered first so it is the default-selected row: type a name, press Enter to create + move. */}
      {typed.length > 0 && !exists && (
        <List.Section title="Create new workspace">
          <List.Item
            icon={Icon.PlusCircle}
            title={`Create & move to "${typed}"`}
            subtitle="New workspace — press Enter"
            actions={
              <ActionPanel>
                <Action
                  title="Create, Move & Follow"
                  icon={Icon.ArrowRight}
                  onAction={() => move(typed, true)}
                />
                <Action
                  title="Create & Move (Stay)"
                  icon={Icon.PlusCircle}
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                  onAction={() => move(typed, false)}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}

      <List.Section title="Workspaces">
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
                  <Action
                    title={`Move & Follow to "${w}"`}
                    icon={Icon.ArrowRight}
                    onAction={() => move(w, true)}
                  />
                  <Action
                    title="Move Here (Stay)"
                    icon={Icon.Window}
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                    onAction={() => move(w, false)}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
