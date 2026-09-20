/**
 * Architecture miltiplè pou vèsyon pita.
 * MVP a jwe lokal ak bots. Sèvè a dwe verifye aksyon enpòtan
 * (damage, deplase, inventory) lè online lan vini.
 */
export type NetState = "offline" | "connecting" | "online" | "reconnecting";

export interface NetSnapshot {
  playerId: string;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  shooting: boolean;
}

export class NetworkManager {
  state: NetState = "offline";
  roomId: string | null = null;
  maxPlayers = 24;
  futureCap = 50;
  private queue: NetSnapshot[] = [];

  connect() {
    this.state = "connecting";
    this.state = "offline";
    return false;
  }

  enqueue(snapshot: NetSnapshot) {
    this.queue.push(snapshot);
    if (this.queue.length > 60) this.queue.shift();
  }

  handleDisconnect() {
    this.state = "reconnecting";
  }

  validateMove(dx: number, dz: number, dt: number) {
    const max = 14 * dt;
    return Math.hypot(dx, dz) <= max + 0.35;
  }

  validateDamage(amount: number) {
    return amount > 0 && amount < 220;
  }
}
