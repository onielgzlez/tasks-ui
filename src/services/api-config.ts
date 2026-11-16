const STORAGE_URL_KEY = 'tasks_studio_api_url';
const STORAGE_TOKEN_KEY = 'tasks_studio_api_token';

export interface ApiConfig {
  baseUrl: string;
  token: string;
}

const DEFAULT_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api/tasks';
const DEFAULT_TOKEN = (import.meta.env.VITE_API_TOKEN as string) || '';

export function getStoredConfig(): ApiConfig {
  const customUrl = localStorage.getItem(STORAGE_URL_KEY);
  const customToken = localStorage.getItem(STORAGE_TOKEN_KEY);

  return {
    baseUrl: customUrl !== null && customUrl.trim() !== '' ? customUrl.trim() : DEFAULT_BASE_URL,
    token: customToken !== null ? customToken.trim() : DEFAULT_TOKEN,
  };
}

export function saveStoredConfig(config: Partial<ApiConfig>): void {
  if (config.baseUrl !== undefined) {
    if (config.baseUrl === '' || config.baseUrl === DEFAULT_BASE_URL) {
      localStorage.removeItem(STORAGE_URL_KEY);
    } else {
      localStorage.setItem(STORAGE_URL_KEY, config.baseUrl.trim());
    }
  }

  if (config.token !== undefined) {
    if (config.token === '' && !DEFAULT_TOKEN) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } else {
      localStorage.setItem(STORAGE_TOKEN_KEY, config.token.trim());
    }
  }

  window.dispatchEvent(new Event('tasks_studio_config_change'));
}

export function resetStoredConfig(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  window.dispatchEvent(new Event('tasks_studio_config_change'));
}
