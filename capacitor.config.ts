import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.okapcity.game",
  appName: "OKAP CITY",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1600,
      backgroundColor: "#07111f",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07111f",
    },
  },
};

export default config;
