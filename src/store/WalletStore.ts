import { create } from "zustand";

interface WalletBalances {
  total: number;
  bonus: number;
  playing: number;
  winning: number;
}

interface WalletStore {
  wallet: WalletBalances;
  balanceLoading: boolean;
  hideWallet: string | null;
  setWalletInfo: (data: WalletBalances) => void;
  setBalanceLoading: (loading: boolean) => void;
  setHideWallet: (status: string | null) => void;
}

const useWalletStore = create<WalletStore>((set) => ({
  wallet: {
    total: 0,
    bonus: 0,
    playing: 0,
    winning: 0,
  },
  balanceLoading: false,
  hideWallet: null,

  setWalletInfo: (data) => set({ wallet: data }),
  setBalanceLoading: (loading) => set({ balanceLoading: loading }),
  setHideWallet: (status) => set({ hideWallet: status }),
}));

export default useWalletStore;
