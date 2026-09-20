import type { MatchPhase, TeamMode } from "../data/types";

export class MatchManager {
  phase: MatchPhase = "idle";
  mode: TeamMode = "SOLO";
  maxPlayers = 24;
  kills = 0;
  assists = 0;
  damage = 0;
  time = 0;
  placement = 24;

  reset(mode: TeamMode) {
    this.mode = mode;
    this.kills = 0;
    this.assists = 0;
    this.damage = 0;
    this.time = 0;
    this.placement = this.maxPlayers;
    this.phase = "matchmaking";
  }
}
