# raycast-aerospace

This is a Raycast extension for the [AeroSpace](https://github.com/nikitabobko/AeroSpace) tiling
window manager. The extension gives you four commands. You can move a window, switch a workspace,
rename a workspace, and move a workspace to a monitor.

All four commands use the same helper module (`src/lib/aerospace.ts`) and the same preference.

## Requirements

- macOS with Raycast.
- AeroSpace. Install AeroSpace before you use this extension.
- The `aerospace` binary. The default path is `/opt/homebrew/bin/aerospace`.

## Installation

Do these steps to load the extension:

1. Open a terminal.
2. Go to the extension directory.
3. Run `npm install`.
4. Run `npm run dev`.

Raycast loads the four commands in development mode. To build the extension, run `npm run build`.
The build command does a type check and makes a bundle.

## Commands

### Move Window to Workspace

This command moves the focused window to a workspace.

1. Start the command. The extension records the focused window by its id.
2. Select a workspace from the list. Or type a new name. AeroSpace makes the new workspace.
3. Press **Enter** to move the window and switch to the workspace.
4. Or press **Cmd+Enter** to move the window and stay on the current workspace.

The extension identifies the window by its id. The move is correct even when Raycast takes the
focus. If AeroSpace reports Raycast as the focused window, the extension closes Raycast first. Then
the extension moves the window.

### Switch to Workspace

This command switches to a workspace.

1. Start the command.
2. Type text to filter the list. The filter matches the workspace name and the applications in the
   workspace. For example, type `chrome` to find the workspace that runs Google Chrome.
3. Press **Enter** to switch to the selected workspace.

### Rename Current Workspace

This command renames the focused workspace. AeroSpace has no command to rename a workspace directly.
The command moves each window in the focused workspace to a new name. Then the command switches to
the new name.

1. Start the command.
2. Type the new name. A name must not contain a space.
3. Press **Enter**.

Note: A persistent workspace is a workspace in your AeroSpace configuration. If the focused
workspace is a persistent workspace, the old name stays as an empty workspace.

### Bring Workspace to This Monitor

This command moves a workspace to the focused monitor. Use this command when you have more than one
monitor.

1. Start the command.
2. Type text to filter the list. The filter matches the workspace name and the applications in the
   workspace.
3. Press **Enter**. AeroSpace moves the workspace to the current monitor.

## Workspace List

The Switch, Rename, and Bring commands show more data for each workspace:

- The list shows the applications in each workspace.
- The list marks the current workspace.
- The list shows the workspaces that have windows first. Then the list shows the empty workspaces.
- The list sorts each group by name.

## Preferences

**AeroSpace Binary Path** — the full path to the `aerospace` binary. The default value is
`/opt/homebrew/bin/aerospace`. To find the correct path, run `which aerospace` in a terminal. Change
this value if the path is different.

## Project Structure

| File | Function |
| --- | --- |
| `src/move-window-to-workspace.tsx` | The Move Window to Workspace command. |
| `src/switch-to-workspace.tsx` | The Switch to Workspace command. |
| `src/rename-workspace.tsx` | The Rename Current Workspace command. |
| `src/summon-workspace.tsx` | The Bring Workspace to This Monitor command. |
| `src/lib/aerospace.ts` | The shared helper module. It runs the `aerospace` CLI and reads the workspace data. |

## Development Scripts

| Command | Function |
| --- | --- |
| `npm run dev` | Load the commands into Raycast in development mode. |
| `npm run build` | Do a type check and make a bundle. |
| `npm run lint` | Check the code for problems. |
| `npm run fix-lint` | Correct the lint problems automatically. |

## License

MIT.
