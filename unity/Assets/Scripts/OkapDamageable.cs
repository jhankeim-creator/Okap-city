using UnityEngine;

public class OkapDamageable : MonoBehaviour
{
    public float maxHealth = 100f;
    public float health = 100f;
    public bool destroyOnDeath = true;

    public void ApplyDamage(float amount)
    {
        health -= amount;
        if (health <= 0) Die();
    }

    private void Die()
    {
        OkapBot bot = GetComponent<OkapBot>();
        if (bot && OkapGameManager.Instance) OkapGameManager.Instance.RegisterElimination();
        if (destroyOnDeath) Destroy(gameObject);
        else gameObject.SetActive(false);
    }
}
