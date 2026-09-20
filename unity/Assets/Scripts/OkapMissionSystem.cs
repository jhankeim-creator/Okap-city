using UnityEngine;

[System.Serializable]
public class OkapMissionData
{
    public string title = "Ranmase valiz la";
    public int required = 1;
    public int progress;
    public int xpReward = 500;
    public bool completed;
}

public class OkapMissionSystem : MonoBehaviour
{
    public OkapMissionData currentMission = new OkapMissionData();

    public void AddProgress(int amount = 1)
    {
        if (currentMission.completed) return;
        currentMission.progress = Mathf.Min(currentMission.required, currentMission.progress + amount);
        if (currentMission.progress >= currentMission.required)
        {
            currentMission.completed = true;
            Debug.Log("MISYON KONPLÈ: +" + currentMission.xpReward + " XP");
        }
    }
}
