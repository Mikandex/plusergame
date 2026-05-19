import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { create } from 'zustand';

type ThemeType = typeof LightTheme | typeof DarkTheme;
type ThemePreference = 'light' | 'dark' | 'system';

type AccentColor = 'green' | 'blue' | 'red' | 'orange';
const accentMap: Record<AccentColor, string> = {
  green: '#008236', 
  blue: '#2F7DBA',
  red: '#E53935',
  orange: '#F97316',
};

const LightTheme = {
  dark: false,
  colors: {
    background: '#F3F4F6',
    text: '#000',
    textOpposite: "#fff",
    textMuted: "#000",
    grayBorderLine: "#C7C7C7",
    inputBg: "#fff",
    inputBorder: "#1F1F1F",
    appleBg: "#000",
    darkGray: "#fff",
    primary: accentMap.green,
  },
};

const DarkTheme = {
  dark: true,
  colors: {
    background: '#000',
    text: '#ffffff',
    textOpposite: "#000",
    textMuted: "#7C7C7C",
    grayBorderLine: "#000",
    inputBg: "#1A1A1A",
    inputBorder: "#D9D9D9",
    appleBg: "#1A1A1A",
    darkGray: "#1A1A1A",
    primary: accentMap.green,
  },
};

interface ThemeState {
  theme: ThemeType;
  preference: ThemePreference;
  toggleTheme: () => void;
  setPreference: (preference: ThemePreference) => Promise<void>;
  initializeTheme: () => Promise<void>;

  accent: AccentColor;
  setAccent: (accent: AccentColor) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => {
    // Helper to apply theme based on preference
    const applyTheme = (pref: ThemePreference, systemScheme?: ColorSchemeName) => {
        let themeToApply: ThemeType;

        if (pref === 'dark') {
            themeToApply = DarkTheme;
        } else if (pref === 'light') {
            themeToApply = LightTheme;
        } else {
            const systemColorScheme = systemScheme ?? Appearance.getColorScheme();
            themeToApply = systemColorScheme === 'dark' ? DarkTheme : LightTheme;
        }

        const accent = get().accent;

        set({ theme: applyAccent(themeToApply, accent)});
    };

    const applyAccent = (theme: ThemeType, accent: AccentColor): ThemeType => ({
      ...theme,
      colors: {
        ...theme.colors,
        primary: accentMap[accent],
      },
    });

  // Listener for system theme changes
  const handleAppearanceChange = (preferences:  { colorScheme: ColorSchemeName }) => {
    const pref = get().preference;
    if (pref === 'system') {
      applyTheme('system', preferences.colorScheme);
    }
  };

  Appearance.addChangeListener(handleAppearanceChange);

  return {
    theme: LightTheme,
    preference: 'light', // Default

    accent: 'green',

    setAccent: async (accent) => {
      const currentTheme = get().theme;
      set({
        accent,
        theme: applyAccent(currentTheme, accent),
      });
      await AsyncStorage.setItem('userAccent', accent);
    },

    toggleTheme: async () => {
      const currentPref = get().preference;

      // Cycle through: light -> dark -> system -> light...
      const newPref: ThemePreference =
      currentPref === 'light' ? 'dark' : currentPref === 'dark' ? 'system' : 'light';

      await get().setPreference(newPref);
    },

    setPreference: async (pref: ThemePreference) => {
      set({ preference: pref });
      applyTheme(pref);
      await AsyncStorage.setItem('userTheme', pref);
    },

    initializeTheme: async () => {
      const savedPref = (await AsyncStorage.getItem('userTheme')) as ThemePreference | null;
      const savedAccent = (await AsyncStorage.getItem('userAccent')) as AccentColor | null;
      
      const preference: ThemePreference = savedPref ?? 'light';
      const accent = savedAccent ?? 'green';
      
      set({ preference, accent });
      applyTheme(preference);

      // set({ theme: applyAccent(get().theme, accent) });
    },
  };
});
