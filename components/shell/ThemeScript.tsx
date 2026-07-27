// components/shell/ThemeScript.tsx
// Runs before first paint to set data-theme from the stored preference (or the
// OS setting for "system"), preventing a flash of the wrong theme. Kept as a
// tiny stringified script because it must execute synchronously in <head>.
import { THEME_STORAGE_KEY } from "@/lib/theme";

const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var m=localStorage.getItem(k);if(m!=='light'&&m!=='dark'&&m!=='system')m='system';var d=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.dataset.theme=d;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
