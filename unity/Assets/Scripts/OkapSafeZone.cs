using UnityEngine;

public class OkapSafeZone : MonoBehaviour
{
    public float startRadius = 300f;
    public float finalRadius = 25f;
    public float shrinkDuration = 600f;
    public float damagePerSecondOutside = 8f;
    private float elapsed;
    private bool active;

    public void Begin()
    {
        elapsed = 0;
        active = true;
        ApplyRadius(startRadius);
    }

    private void Update()
    {
        if (!active) return;
        elapsed += Time.deltaTime;
        float t = Mathf.Clamp01(elapsed / shrinkDuration);
        ApplyRadius(Mathf.Lerp(startRadius, finalRadius, t));
        if (OkapGameManager.Instance && OkapGameManager.Instance.player)
        {
            OkapPlayer p = OkapGameManager.Instance.player;
            Vector3 a = p.transform.position; a.y = 0;
            Vector3 b = transform.position; b.y = 0;
            if (Vector3.Distance(a, b) > Mathf.Lerp(startRadius, finalRadius, t))
                p.TakeDamage(damagePerSecondOutside * Time.deltaTime);
        }
    }

    private void ApplyRadius(float radius)
    {
        transform.localScale = new Vector3(radius * 2f, 1f, radius * 2f);
    }
}
