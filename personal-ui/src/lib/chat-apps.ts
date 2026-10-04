export const chatApps = [
  { name: 'T3 Chat', url: 'https://t3.chat/new' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Claude', url: 'https://claude.ai/new' },
] as const;
export type AppName = typeof chatApps[number]['name'];
