import axios from 'axios';

/**
 * Axios-клієнт. У dev'і запити йдуть через Vite-proxy `/api → :3000`.
 * У production base URL береться з `VITE_API_BASE_URL` (порожній за замовчуванням,
 * якщо frontend хоститься з тим самим origin що й backend).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 30_000,
});

export default api;
