# Personal prompt workspace prototypes

Run `pnpm install` then `pnpm dev`. Layout A is `/?variant=A`; B is `/?variant=B`. The development-only switcher and arrow keys switch layouts. Both use Astro, React, Tailwind, and shadcn/Radix.

Compare how quickly you can find Grammar corrector, paste a transcript, select a tone preset, and open T3 Chat. A keeps tools beside the editor. B starts with a personal library and opens an individual tool.

All prompt edits and presets are in memory. Refresh resets them. No accounts, cloud storage, moderation, or short links are connected. Curated examples are sample data. Text is sent to the selected external chat app only through the launch action. Claude and URLs longer than 6,000 characters use clipboard-and-paste; the length cutoff is a prototype heuristic, not a documented provider limit. T3/ChatGPT URL handoff requires testing in your signed-in browser.

Dedicated local port: 4328. Tailscale Serve HTTPS port: 8448. The existing GitHub Pages site is unchanged.
