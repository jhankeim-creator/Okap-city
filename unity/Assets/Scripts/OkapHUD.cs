using UnityEngine;

public class OkapHUD : MonoBehaviour
{
    public OkapPlayer player;
    public OkapMissionSystem mission;
    private GUIStyle style;

    private void Awake()
    {
        style = new GUIStyle { fontSize = 22, normal = { textColor = Color.white } };
    }

    private void OnGUI()
    {
        if (!player) return;
        GUI.Box(new Rect(15, 15, 360, 160), "");
        GUI.Label(new Rect(30, 25, 330, 30), "OKAP CITY", style);
        GUI.Label(new Rect(30, 60, 330, 25), "HP: " + Mathf.CeilToInt(player.health), style);
        GUI.Label(new Rect(30, 88, 330, 25), "ARMOR: " + Mathf.CeilToInt(player.armor), style);
        if (player.currentWeapon)
            GUI.Label(new Rect(30, 116, 330, 25), player.currentWeapon.weaponName + " " + player.currentWeapon.AmmoInMagazine + "/" + player.currentWeapon.reserveAmmo, style);
        if (mission && mission.currentMission != null)
        {
            var m = mission.currentMission;
            GUI.Label(new Rect(30, 144, 330, 25), "Misyon: " + m.title + " " + m.progress + "/" + m.required, style);
        }
    }
}
