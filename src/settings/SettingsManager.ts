import { bus } from "../core/EventBus";
import type { SaveManager, SettingsState } from "../progression/SaveManager";

export class SettingsManager {
  constructor(private save: SaveManager) {}

  get all(): SettingsState {
    return this.save.state.settings;
  }

  set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    this.save.state.settings[key] = value;
    this.save.persist();
    bus.emit("settings", this.save.state.settings);
  }
}
