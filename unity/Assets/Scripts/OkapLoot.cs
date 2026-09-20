using UnityEngine;

public enum OkapLootType { Ammo, Medkit, Armor, Coins }

public class OkapLoot : MonoBehaviour
{
    public OkapLootType type;
    public int amount = 25;
    public float spinSpeed = 70f;

    private void Update() => transform.Rotate(0, spinSpeed * Time.deltaTime, 0);

    private void OnTriggerEnter(Collider other)
    {
        OkapPlayer player = other.GetComponent<OkapPlayer>();
        if (!player) return;
        switch (type)
        {
            case OkapLootType.Ammo:
                if (player.currentWeapon) player.currentWeapon.reserveAmmo += amount;
                break;
            case OkapLootType.Medkit:
                player.Heal(amount);
                break;
            case OkapLootType.Armor:
                player.AddArmor(amount);
                break;
            case OkapLootType.Coins:
                Debug.Log("OKAP COINS +" + amount);
                break;
        }
        Destroy(gameObject);
    }
}
