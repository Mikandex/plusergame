# Pluser Game — Codebase Overview

A mobile "virtual games" betting app (Naira-denominated) built with **Expo / React Native**. Users register, fund a wallet, play stake-based mini-games, and withdraw winnings. Guests can browse the home screen and try demo versions of each game; real play requires an account.

- **Package name:** `pluser-game` · **Display name:** Pluser Game · **Version:** 1.0.0
- **Bundle / package id:** `com.loxfordnavoplus.plusergame` · **URL scheme:** `plusergame`
- **Backend:** REST API at `EXPO_PUBLIC_SERVER_URI` (`https://buzzycash.viaspark.site/api/v1`, set in `eas.json`); images from `EXPO_PUBLIC_IMAGE_URI`.

---

## 1. Tech stack

| Area | Choice |
|---|---|
| Framework | Expo SDK ~55, React Native 0.83, React 19.2, React Compiler enabled, typed routes |
| Routing | `expo-router` (file-based, under `src/app`) |
| Styling | NativeWind 4 + Tailwind 3 (`src/global.css`, `tailwind.config.js`) |
| State | Zustand stores (`src/store`) |
| Networking | Axios (`src/globalApi.ts`) with auth/refresh interceptors |
| Validation | Zod 4 |
| Storage | `expo-secure-store` (tokens), AsyncStorage (profile, UI prefs) |
| Animation | Reanimated 4, Moti, Lottie, `react-native-worklets` |
| UI libs | `@gorhom/bottom-sheet`, `react-native-toast-message`, `react-native-otp-entry`, `react-native-element-dropdown`, `react-native-select-dropdown`, `react-native-date-picker`, `react-native-reanimated-carousel`, `react-native-tab-view`, `react-native-webview` |
| Media | `expo-audio` (sound effects), `expo-haptics`, `expo-image`, `expo-image-picker` |
| Fonts | Montserrat (Thin → Black), SpaceMono |
| Build | EAS (`development`, `preview`, `production` profiles) |

### Scripts
`npm start` · `npm run android` · `npm run ios` · `npm run web` · `npm run lint`

### Path alias
`@/*` → `src/*` (see `tsconfig.json`).

### Design tokens (`tailwind.config.js`)
Colors: `red #9A2121`, `yellow #D4AF37` (gold), `charcoal #0F1115` / `charcoal-light #1B1F27`, `gray #9CA3AF` / `gray-light #F5F7FA`, `green #22C55E`.
Font utilities: `font-mthin`, `mlight`, `mregular`, `mmedium`, `msbold`, `mbold`, `mblack`. Also a `blink` animation.

---

## 2. Repository layout

```
plusergame/
├── app.json, eas.json, babel.config.js, metro.config.js, tailwind.config.js, tsconfig.json
├── declarations.d.ts, nativewind-env.d.ts
├── assets/
│   ├── fonts/        Montserrat family + SpaceMono
│   ├── images/       logo, splash, game art, cards, coins, wallet, lottie loading.json
│   └── sounds/       flip, win, lose, error, start, dice-win, roll-dice
├── types/            shared TS types (types.ts, react-native-stars.d.ts)
└── src/
    ├── app/          expo-router routes (thin wrappers)
    ├── screens/      real screen implementations
    ├── components/   reusable UI
    ├── store/        Zustand stores
    ├── utils/        helpers (formatting, wallet fetch, haptics …)
    ├── constants/    images, sounds, static option lists
    ├── hooks/        useSfx, LayoutLoader
    ├── globalApi.ts  Axios client + token refresh
    └── global.css    Tailwind entry
```

**Pattern:** files in `src/app/**` are intentionally tiny — they import and render a component from `src/screens/**`. Logic lives in `screens`.

---

## 3. Navigation map (`src/app`)

```
_layout.tsx            Root Stack: loads Montserrat, GestureHandlerRootView, BottomSheetModalProvider,
                       toast config (success/error/info), global <LayoutLoader/>
index.tsx              Boot gate: reads accessToken (SecureStore), userProfile + hideBalance (AsyncStorage);
                       → /(tabs)/home if authenticated, else /Splash
Splash.tsx             Animated logo (3 zoom stages) → router.replace("/(tabs)/home") after 3.2 s

(onboarding)/          Stack, light status bar
  Index                "Create Account" / "Log In" landing
  Register → RegisterOTP
  LogIn
  ForgotPassword → ResetPasswordOTP → NewResetPassword

(tabs)/                Bottom tabs (home, GamesPlayed, Transactions, profile)
  home/                index (Auth or UnAuth home), Deposit, Withdraw  (nested Stack)
  GamesPlayed          game history
  Transactions         transaction list/search
  profile/             index, EditProfile, Support
  — tabPress on GamesPlayed/Transactions/profile redirects guests to /(onboarding)/Index

(protected)/(routes)/  Authenticated, real-money screens
  Card, Coin, Dice, HotCold, Lottery, LuckyBox, RPSBet, ReelStreak, SpinWheel
  ChangePin, Notifications
  DepositPaymentGateway (WebView), Successful/FailedDepositReceipt, SuccessfulWithdrawalReceipt

(landing)/             Guest demo games: LandingCard/Coin/Dice/HotCold/Lottery/LuckyBox/
                       ReelStreak/RpsBet/Spin
```

Tab bar: background `#1B1F27`, active tint `#9A2121`, inactive `#9CA3AF`; icons from Ionicons / MaterialCommunityIcons.

---

## 4. Authentication & session

**Boot (`src/app/index.tsx`)** — restore token from SecureStore, profile from AsyncStorage, `hideBalance` preference → populate `AuthStore`, `ProfileStore`, `WalletStore.hideWallet`.

**Login / OTP register** — on success, `accessToken` and `refreshToken` are written to SecureStore and `AuthStore.login(token)` is called.

**Axios client (`src/globalApi.ts`)**
- Base URL from `EXPO_PUBLIC_SERVER_URI`, `withCredentials: true`.
- *Request interceptor:* reads `accessToken` from SecureStore each call → `Authorization: Bearer …`; every **POST** gets a fresh `Idempotency-Key` (UUID v4).
- *Response interceptor:* on a 401 whose message matches a known "session expired / invalid token" set, it performs a **single-flight refresh** (`POST /auth/refresh-token` with `refresh_token`), queues concurrent requests until the new token arrives, retries the original request once (`_retry` flag).
- On refresh failure: clears SecureStore tokens + `userProfile`, resets auth/profile stores, `router.replace('/(onboarding)/LogIn')`.

---

## 5. State (Zustand, `src/store`)

| Store | State | Notes |
|---|---|---|
| `AuthStore` | `isAuthenticated`, `token`, `isLoading` | `login`, `logout`, `setLoading`; `isLoading` starts `true` for boot gate |
| `ProfileStore` | `userProfile` {phoneNumber, countryOfResidence, email, fullName, profilePicture, kycVerified, gender, dateOfBirth, isEmailVerified}, `email` | `setProfile`, `setEmail`, `clearProfile` |
| `WalletStore` | `wallet` {total, bonus, playing, winning}, `balanceLoading`, `hideWallet` | default export |
| `NotificationStore` | `unreadCount` | default export |
| `ReferralStore` | `refData` {invitees, referralCode, totalEarned}, `referralLoading` | older richer shape left commented out in file |
| `ThemeStore` | light/dark palettes, `preference` (`light`/`dark`/`system`) | persisted via AsyncStorage; `initializeTheme`, `setPreference`, `toggleTheme` |
| `loaderStore` | `isLoading` | drives global `LayoutLoader` overlay |

---

## 6. Backend API surface (as called by the client)

**Auth** — `POST /auth/register`, `/auth/verify-account`, `/auth/resend-otp`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/verify-reset-password-otp`, `/auth/refresh-token`; `PUT /auth/reset-password`; `PATCH /auth/change-password` (used by both ChangePassword and ChangePin screens).

**Profile** — `PATCH /profile/update`; `POST /upload/profile-picture`.

**Wallet** — `GET /wallet/` (balance, bonus_balance, playing_balance, winning_balance); `POST /wallet/fund` `{amount, payment_method:"nomba"}` → returns `checkout_link` opened in a WebView.

**Withdrawal** — `GET /withdrawal/list-banks`; `POST /withdrawal/account-details` `{account_number, bank_code}` (name lookup); `POST /withdrawal/initiate` (bank payload, or `{means, phone, amount, currency:"NGN"}` for airtime/data).

**Notifications** — `GET /notification/?type=games|transactions&limit&page`; `GET /notification/unread`; `PATCH /notification/read-all?type=…`; `PATCH /notification/:id/read`.

**History / feeds** — `GET /virtual/history?limit&page`; `GET /transactions/search?search&limit&page`; `GET /result/leaderboard`.

**Games** (all `POST` unless noted):

| Endpoint | Body |
|---|---|
| `/virtual/toss` | `{pick, stake}` |
| `/virtual/dice` | `{bet_type: "exact"\|<mode>, stake, guess?}` |
| `/virtual/guess` | `{game_type: pot1\|pot2\|pot3, pick, stake}` |
| `/virtual/box` | `{pick: boxIndex+1, stake}` |
| `/virtual/rsp` | `{pick, stake}` |
| `/virtual/spin` | `{stake}` |
| `/virtual/reel` | `{stake}` |
| `/virtual/play-lottery` | `{stake, picks…}` |
| `GET /virtual/start-card` then `/virtual/pick-card` | `{…, stake, session_id}` |

Server errors surface through `error.response.data.message` (sometimes `message.stake`) and are shown with `Toast`.

---

## 7. Games (`src/screens/virtual_games/*`)

Every game follows the same shape: Zod-validate stake → call endpoint → animate the server-decided result → play SFX/haptics → refresh wallet. Server is authoritative; the client only animates.

| Game | Route | Mechanic | Default multiplier | Stake limits |
|---|---|---|---|---|
| Coin Toss | `Coin` | Pick heads/tails | 3x | 50–1000 |
| Dice | `Dice` | Modes incl. "specific" number (5x) vs. range/parity (2.5x); 3D dice roll | 2.5x | 50–1000 |
| Hot / Cold | `HotCold` | Pick a number in 1–10 / 1–20 / larger pot (`pot1`–`pot3`) | up to 10x | 50–1000 |
| Lottery | `Lottery` | Choose numbers; draw result | 3x | 50–1000 |
| Lucky Box | `LuckyBox` | Pick one box | 2.5x | 50–1000 |
| Rock-Paper-Scissors | `RPSBet` | Beat the AI; draw returns stake | 5x | 50–1000 |
| Card | `Card` | Start session, then pick a card | 2x | 50–1000 |
| Spin Wheel | `SpinWheel` | Reanimated wheel; server returns `spine_number`, `multiplier`, `payout`, `is_win` | 2x | 50–**500** |
| Reel Streak | `ReelStreak` | Slot-style reels | 15x | 50–**500** |

`src/screens/landing/virtual_games/*` mirrors these nine games for **guests**: same UI, no API calls (local `Math.random`), and a prompt that routes to `/(onboarding)/Register` to play for real.

Shared pieces: `useSfx` (flip/win/lose/next/error players, seek-to-0 then play), `utils/vibration.ts` (`triggerHaptic`), `components/virtuals/AnimatedBox.tsx`, `components/CountDown.tsx`, `components/PulsingButton.tsx`.

---

## 8. Money flows

**Deposit** (`screens/payment/deposit`)
1. `DepositScreen` – choose means (`cash` / `airtime`) and amount. Cash → `POST /wallet/fund`.
2. `DepositPaymentGatewayScreen` – opens `checkout_link` (`paylink` param) in a `react-native-webview`. A redirect-detection hook (`?orderId` → refresh wallet, dismiss) is present but commented out.
3. `SuccessfulReceiptScreen` / `FailedReceiptScreen` – result receipts.

**Withdrawal** (`screens/payment/withdrawal`)
1. `WithdrawalScreen` – means: `cash` (bank), `airtime`, `data`. Banks come from `NgnBankModal` (`GET /withdrawal/list-banks`); the account name is resolved via `/withdrawal/account-details` before confirming.
2. `ConfirmPin` bottom sheet (4-digit dial pad) authorizes the request → `POST /withdrawal/initiate`.
3. `SuccessfulReceiptScreen` shows amount, reference, status, transaction id.

**Wallet display** – `BalanceCard` / `BalanceCardWithdrawal` show total, bonus, playing and winning balances, with a hide-balance toggle (persisted as `hideBalance`). `utils/WalletApi.getWallet(runOnBackground)` fetches and populates `WalletStore`. `utils/displayCurrency` formats NGN (`en-NG`) and GBP (`en-GB`).

---

## 9. Other screens

- **Home** (`screens/home`): `AuthHomeScreen` (balance card, sticky `RecentWinnings` leaderboard, `HomeBanner` carousel, game grid with skeletons, pull-to-refresh, unread-notification badge) vs. `UnAuthHomeScreen` (same, with demo-game links and login prompts). Chosen in `(tabs)/home/index.tsx` by `isAuthenticated`.
- **Games Played** (`screens/games`): paginated `/virtual/history` using `GameHistoryCard`.
- **Transactions** (`screens/transaction`): search + paginated list using `TransactionCard`; filters from `constants/data` (types: topup/bonus/profit/payout; statuses: pending/successful/failed/reversed/rejected).
- **Notifications** (`screens/notifications`): tabbed Games / Transactions lists, mark-one and mark-all read.
- **Profile** (`screens/profile`): `ProfileScreen` (logout), `EditProfileScreen` (fields + image-picker upload), `ChangePasswordScreen`, `ChangePinScreen`. **Support** (`screens/more/support`) uses `SupportBox`.

---

## 10. Shared components (`src/components`)

Buttons/inputs: `CustomButton`, `IconButton`, `PulsingButton`, `FormField`, `SearchInput`, `TextArea`, `Picker`.
Layout/feedback: `Header`, `HomeHeader`, `Loading`, `FullScreenLoader`, `CustomButtomSheet` (gorhom wrapper; note filename spelling), `ConfirmPin`.
Cards: `BalanceCard`, `BalanceCardWithdrawal`, `GameCard`, `GameHistoryCard`, `NotificationCard`, `TransactionCard`, `SupportBox`, `HomeBanner`.
Landing: `landing/LandingHeader`, `landing/RecentWinnings` (leaderboard ticker), `landing/VirtualGameCard`.
Modals: `select-modals/NgnBankModal`.
Game visuals: `virtuals/AnimatedBox`.

## 11. Utilities & constants

- `utils/`: `DateLabels` (grouping labels), `SkeletonProps` (shared Moti skeleton props), `WalletApi`, `displayCurrency`, `formatCount`, `formatEnums` (`IN_ACTIVE` → `In Active`), `getUnreadNotifications`, `vibration`.
- `constants/`: `images.ts` (asset registry), `sounds.ts`, `data.ts` (deposit/withdraw methods, gender, transaction filters), `index.ts` re-exports `images`, `data`, `sounds`.
- `types/types.ts`: `ticketGameType`, `transactionsType`, `leaderBoardType`.

---

## 12. Things worth knowing (observations, nothing changed)

- **Duplicate code:** `screens/landing/virtual_games/*` and `screens/virtual_games/*` are near-copies (≈16k lines total across screens). Shared game UI could be extracted.
- **`ChangePinScreen` calls `PATCH /auth/change-password`** — the same endpoint as password change; confirm this is intended.
- **Splash always routes to `/(tabs)/home`** after 3.2 s (guests land on the unauthenticated home).
- **Leftover debug logging:** several `console.log` calls print API responses (wallet, withdrawal, game results, user profile).
- **Dead/commented code:** `ReferralStore` old shape, `ConfirmPin.handleSetPin`, the deposit WebView redirect handler.
- **`build/config.gypi`** is committed to git and looks like a stray build artifact.
- **README.md** is still the default Expo template text.
- **No tests** and no `scripts/reset-project.js` (referenced by the `reset-project` npm script) are present.
- Stake limits are enforced client-side by Zod (50–1000, or 50–500 for Spin and Reel Streak) and presumably re-validated server-side.
