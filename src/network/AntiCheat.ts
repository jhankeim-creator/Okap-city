/** Mezi baz: pa fè konfyans client pou aksyon enpòtan. */
export class AntiCheat {
  static maxSpeed(stance: string, sprint: boolean) {
    if (stance === "prone") return 2.4;
    if (stance === "crouch") return 3.8;
    return sprint ? 11.2 : 7.0;
  }

  static plausibleMove(dist: number, dt: number, maxSpeed: number) {
    return dist <= maxSpeed * dt + 0.5;
  }

  static plausibleDamage(amount: number) {
    return amount > 0 && amount <= 200;
  }

  static plausibleAmmo(mag: number, max: number) {
    return mag >= 0 && mag <= max;
  }
}
