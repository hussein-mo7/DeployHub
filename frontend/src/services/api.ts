import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function checkHealth() {
  const { data } = await api.get("/health");
  return data;
}
