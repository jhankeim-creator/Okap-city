# OKAP CITY

**Batay la kòmanse nan Okap!**

Jwèt aksyon third-person 3D orijinal an **Kreyòl Ayisyen**. Genre: TPS / Battle Royale / Action / Open World Lite.

Pa yon kopi Free Fire, PUBG, Fortnite ni okenn lòt jwèt. Kat, pèsonaj, zam, UI, mizik, son, istwa ak logo yo orijinal.

## Referans ou voye yo
Imaj konsepsyon + kòd Unity C# yo entegre:
- HUD (konpa, minimap won, misyon, zam, HP, bouton won, machin)
- Kay Karayib ak palmis
- 8 pèsonaj ak wòl
- Misyon teren (valiz, kay, machin, pò)
- Starter Unity nan `unity/Assets/Scripts`

## Jwe kounye a

```bash
npm install
python3 tools/generate_audio.py
python3 tools/generate_icons.py
npm test
npm run dev
```

Ouvri `http://localhost:5173`.

Kontwòl PC:
- WASD deplase, Shift kouri
- Sourit vize (klik pou pointer lock)
- Klik goch tire, klik dwat vize
- R chaje, F antre/soti/pran loot, Q geri, G grenad
- C akoupi, Z kouche, Space sote, V chanje zam
- T chat rapid, P ping, Esc poz

Kontwòl mobil: joystick goch, gade dwat, bouton HUD.

## Android

- Non: **OKAP CITY**
- Package: **com.okapcity.game**
- Landscape
- APK/AAB: apre `npm run build`, `npx cap sync android`, Lè sa `./gradlew assembleDebug` oswa `bundleRelease` nan `android/`.

## MVP ki playable

- Meni tout bouton yo mache
- Intro cinematic + logo
- Kat 12 zòn (Downtown, Mache, Rezidans, Pò, Plaj, Endistri, Gaz, Mòn, Forè, Gran Plas, Abandone, Ayewopò)
- Junior + 7 lòt pèsonaj
- 16 zam orijinal, loot, armor, medkit, grenad
- Bots, safe zone, air drop, machin
- Viktwa / defèt / XP / OKAP COINS
- Shop, misyon, profil, ranking, zanmi, settings

## Faz devlopman

1 Movement · 2 Combat · 3 Weapons · 4 Loot · 5 Map · 6 Bots · 7 Battle Royale · 8 Vehicles · 9 UI · 10 Audio · 11 Progression · 12 Multiplayer · 13 Optimization · 14 Android · 15 Release
