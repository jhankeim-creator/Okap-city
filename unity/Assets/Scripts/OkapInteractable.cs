using UnityEngine;

public class OkapInteractable : MonoBehaviour
{
    public enum InteractionType { Mission, Loot, Vehicle, Door }
    public InteractionType type;
    public string prompt = "ENTÈRAGI";

    public void Interact(OkapPlayer player)
    {
        switch (type)
        {
            case InteractionType.Mission:
                Debug.Log("MISYON: " + prompt);
                break;
            case InteractionType.Loot:
                OkapLoot loot = GetComponent<OkapLoot>();
                if (loot) loot.SendMessage("OnTriggerEnter", player.GetComponent<Collider>());
                break;
            case InteractionType.Vehicle:
                OkapVehicle vehicle = GetComponent<OkapVehicle>();
                if (vehicle) vehicle.EnterVehicle();
                break;
            case InteractionType.Door:
                transform.Rotate(0, 90, 0);
                break;
        }
    }
}
