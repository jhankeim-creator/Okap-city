using System;
using UnityEngine;

[Serializable]
public class OkapSaveData
{
    public int level = 1;
    public int xp;
    public int coins;
    public int wins;
    public int kills;
}

public static class OkapSaveSystem
{
    private const string Key = "OKAP_CITY_SAVE";

    public static void Save(OkapSaveData data)
    {
        PlayerPrefs.SetString(Key, JsonUtility.ToJson(data));
        PlayerPrefs.Save();
    }

    public static OkapSaveData Load()
    {
        if (!PlayerPrefs.HasKey(Key)) return new OkapSaveData();
        try { return JsonUtility.FromJson<OkapSaveData>(PlayerPrefs.GetString(Key)); }
        catch { return new OkapSaveData(); }
    }

    public static void Delete()
    {
        PlayerPrefs.DeleteKey(Key);
        PlayerPrefs.Save();
    }
}
