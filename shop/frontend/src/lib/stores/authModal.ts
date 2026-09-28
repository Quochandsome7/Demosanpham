import { writable } from "svelte/store";

interface AuthModalState {
  isOpen: boolean;
  activeTab: "login" | "register";
}

function createAuthModalStore() {
  const { subscribe, set, update } = writable<AuthModalState>({
    isOpen: false,
    activeTab: "login",
  });

  return {
    subscribe,
    open: (tab: "login" | "register" = "login") => {
      set({ isOpen: true, activeTab: tab });
    },
    close: () => {
      update((s) => ({ ...s, isOpen: false }));
    },
    switchTab: (tab: "login" | "register") => {
      update((s) => ({ ...s, activeTab: tab }));
    },
  };
}

export const authModal = createAuthModalStore();
