using UnityEngine;

public static class OkapMobileInput
{
    public static Vector2 Move;
    public static bool Fire;
    public static bool Jump;
    public static bool Sprint;
    public static void SetMove(Vector2 value) => Move = Vector2.ClampMagnitude(value, 1f);
    public static void SetFire(bool value) => Fire = value;
    public static void SetJump(bool value) => Jump = value;
    public static void SetSprint(bool value) => Sprint = value;
    public static void ResetOneShotButtons() => Jump = false;
}
