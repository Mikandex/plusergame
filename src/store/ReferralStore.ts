import { create } from 'zustand'

interface RefData {
  invitees: number
  referralCode: string
  totalEarned: number
}

interface ReferralStore {
  refData: RefData
  setReferralInfo: (payload: RefData) => void
  referralLoading: boolean
  setReferralLoading: (payload: boolean) => void
}

export const useReferralStore = create<ReferralStore>((set) => ({
  refData: {
    invitees: 0,
    referralCode: "",
    totalEarned: 0
  },

  setReferralInfo: (payload) =>
    set(() => ({
      refData: payload,
    })),

  referralLoading: true,

  setReferralLoading: (loading) => set({ referralLoading: loading }),
}))

// import { create } from 'zustand'

// interface ReferralWallet {
//   createdAt: string
//   id: string
//   pointsExpired: string
//   pointsUsed: string
//   referralBalance: string
//   updatedAt: string
//   userId: string
// }

// interface RefData {
//   pendingSignups: number
//   referralCode: string
//   referralWallet: ReferralWallet
//   referrals: any[] // Use specific type if available
//   signupsThatTransacted: number
//   totalSignups: number
// }

// interface ReferralStore {
//   refData: RefData
//   setReferralInfo: (payload: RefData) => void
//   referralLoading: boolean
//   setReferralLoading: (payload: boolean) => void
// }

// export const useReferralStore = create<ReferralStore>((set) => ({
//   refData: {
//     pendingSignups: 0,
//     referralCode: '',
//     referralWallet: {
//       createdAt: '',
//       id: '',
//       pointsExpired: '0',
//       pointsUsed: '0',
//       referralBalance: '0',
//       updatedAt: '',
//       userId: '',
//     },
//     referrals: [],
//     signupsThatTransacted: 0,
//     totalSignups: 0,
//   },

//   setReferralInfo: (payload) =>
//     set(() => ({
//       refData: payload,
//     })),

//   referralLoading: false,

//   setReferralLoading: (loading) => set({ referralLoading: loading }),
// }))
