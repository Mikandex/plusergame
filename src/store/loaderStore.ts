import { create } from 'zustand'

interface LoaderState {
  isLoading: boolean
  setLoading: (value: boolean) => void
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isLoading: false,
  setLoading: (value) => set({ isLoading: value }),
}))