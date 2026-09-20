# OKAP CITY — Architecture

## Engine
Three.js + TypeScript + Vite, pakèt Android ak Capacitor (`com.okapcity.game`).

Unity pa t disponib nan anviwònman devlopman an. Three.js se yon motè 3D ki apwopriye pou Android (WebView/Capacitor) epi ki pèmèt yon MVP playable kounye a.

## Modil
- `GameManager` — bouk, faz, koneksyon sistèm
- `MatchManager` — eta match
- `PlayerController` / `PlayerCombat` / `HealthSystem` / `ArmorSystem`
- `WeaponSystem` / `InventorySystem` / `LootSystem`
- `SafeZoneSystem` / `AirDropSystem` / `WeatherSystem` / `MapBuilder`
- `BotAI` / `VehicleController`
- `MissionSystem` / `XPSystem` / `CurrencySystem` / `ShopSystem`
- `UIManager` / `AudioManager` / `SaveManager` / `SettingsManager`
- `NetworkManager` — architecture offline + validasyon pou miltiplè pita

## Miltiplè (faz 12)
`NetworkManager` prepare:
- authentication / lobby / matchmaking / room
- snapshot jwè
- reconnect
- validasyon deplase ak damage sou sèvè (pa fè konfyans client)

MVP a ranpli match ak bots jiska 24 (architecture pou 50+).

## Anti-cheat (baz)
Sèvè dwe verifye: vitès, teleport, ammo, damage maksimòm. Client la pa sous verite pou combat online.
