/**
 * CONFIGURATION & CONSTANTS
 */
const STORAGE_KEY = "promptLauncher_state";
const SAVE_DEBOUNCE_MS = 500;
const CUSTOM_CHATBOTS_KEY = "promptLauncher_customChatbots";
const HIDDEN_CHATBOTS_KEY = "promptLauncher_hiddenChatbots";
const TEMPLATES_KEY = "promptLauncher_templates";

const builtInChatbots = [
  {
    name: "ChatGPT",
    icon: "💬",
    supportsQueryParam: true,
    urlTemplate: "https://chatgpt.com/?q={{{s}}}&hints=search&temporary-chat=true",
  },
  {
    name: "Claude",
    icon: "🧠",
    supportsQueryParam: false,
    urlTemplate: "https://claude.ai/new",
  },
  {
    name: "Perplexity",
    icon: "🔍",
    supportsQueryParam: true,
    urlTemplate: "https://www.perplexity.ai/search/new?q={{{s}}}",
  },
  {
    name: "T3 Chat",
    icon: "🤖",
    supportsQueryParam: true,
    urlTemplate: "https://t3.chat/new?q={{{s}}}",
  },
  {
    name: "Google Gemini",
    icon: "✨",
    supportsQueryParam: false,
    urlTemplate: "https://gemini.google.com/app",
  },
  {
    name: "Grok",
    icon: "🚀",
    supportsQueryParam: true,
    urlTemplate: "https://grok.com/?q={{{s}}}",
  },
  {
    name: "Mistral Le Chat",
    icon: "🌬️",
    supportsQueryParam: true,
    urlTemplate: "https://chat.mistral.ai/chat?q={{{s}}}",
  },
  {
    name: "Poe",
    icon: "🐦",
    supportsQueryParam: false,
    urlTemplate: "https://poe.com",
  },
  {
    name: "DeepSeek",
    icon: "🔭",
    supportsQueryParam: false,
    urlTemplate: "https://chat.deepseek.com",
  },
  {
    name: "Copilot",
    icon: "✈️",
    supportsQueryParam: true,
    urlTemplate: "https://copilot.microsoft.com/?q={{{s}}}",
  },
];

