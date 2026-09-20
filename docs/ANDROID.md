# Android / Google Play

- Application Name: OKAP CITY
- Package: `com.okapcity.game`
- Orientation: landscape
- Permissions: `INTERNET`, `VIBRATE` only

## Build

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug      # APK tès
./gradlew bundleRelease      # AAB pou Play
```

Mete `sdk.dir` nan `android/local.properties` (pa commit).

## Ikòn
Adaptive icons nan `mipmap-*` ak `ic_launcher_foreground`.
