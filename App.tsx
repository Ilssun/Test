// Safety-net entry shim: some Android/EAS build paths default to
// node_modules/expo/AppEntry.js, which does `import App from '../../App'`
// relative to itself. In this monorepo (node_modules hoisted to the repo
// root), that resolves here — so this re-export keeps that default working
// regardless of which entry convention a given build pipeline picks,
// alongside apps/mobile/index.js (used by the dev server/web/EAS builds
// that do respect package.json's "main" field).
export { default } from "./apps/mobile/App";
