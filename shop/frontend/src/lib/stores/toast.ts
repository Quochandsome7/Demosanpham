import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const createToastsStore = () => {
  const { subscribe, update } = writable<Toast[]>([]);

  const add = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2);
    update((toasts) => [...toasts, { id, type, message }]);
    setTimeout(() => remove(id), duration);
  };

  const remove = (id: string) => {
    update((toasts) => toasts.filter((t) => t.id !== id));
  };

  return { subscribe, add, remove };
};

export const toasts = createToastsStore();

export const addToast = (
  message: string,
  type: ToastType = "info",
  duration = 3000,
) => {
  toasts.add(message, type, duration);
};
