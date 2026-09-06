# raycast-extension

Raycast extensions, one directory each.

| Extension | Description |
| --- | --- |
| [`aerospace/`](aerospace/) | Commands for the [AeroSpace](https://github.com/nikitabobko/AeroSpace) tiling window manager: switch, rename and summon workspaces, and move windows between them |

Each directory is a self-contained Raycast extension with its own `package.json`
and dependencies — there is no shared root install. To work on one:

```sh
cd aerospace
npm install
npm run dev
```

See the extension's own README for its commands and preferences.

## Adding an extension

```sh
mkdir <name> && cd <name>
npx create-raycast-extension
```

Keep dependencies inside the extension directory so each one stays independently
installable and publishable.
