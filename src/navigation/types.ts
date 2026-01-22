export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Presets: undefined;
};

export type TabParamList = {
  Siren: undefined;
  LFO: undefined;
  Echo: undefined;
};

export type AppScreens = keyof RootStackParamList;
export type TabScreens = keyof TabParamList;
