using UnityEngine;

public enum MatchState { Lobby, Playing, Finished }

public class OkapGameManager : MonoBehaviour
{
    public static OkapGameManager Instance { get; private set; }
    [Header("Match")]
    public MatchState state = MatchState.Lobby;
    public float matchDuration = 900f;
    public int maxPlayers = 24;
    [Header("References")]
    public OkapPlayer player;
    public OkapSafeZone safeZone;
    public float TimeRemaining { get; private set; }
    public int Eliminations { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
    }

    private void Start() => StartMatch();

    private void Update()
    {
        if (state != MatchState.Playing) return;
        TimeRemaining = Mathf.Max(0, TimeRemaining - Time.deltaTime);
        if (TimeRemaining <= 0) FinishMatch(true);
    }

    public void StartMatch()
    {
        TimeRemaining = matchDuration;
        state = MatchState.Playing;
        if (safeZone != null) safeZone.Begin();
    }

    public void RegisterElimination() => Eliminations++;

    public void PlayerDied()
    {
        if (state == MatchState.Playing) FinishMatch(false);
    }

    public void FinishMatch(bool timeExpired)
    {
        state = MatchState.Finished;
        Debug.Log(timeExpired ? "MATCH FINI" : "OU ELIJINE");
    }
}
