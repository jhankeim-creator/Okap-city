using UnityEngine;

[RequireComponent(typeof(OkapDamageable))]
public class OkapBot : MonoBehaviour
{
    public float detectionRange = 45f;
    public float attackRange = 25f;
    public float moveSpeed = 3.2f;
    public float attackDamage = 8f;
    public float attackInterval = 0.8f;
    private Transform target;
    private float nextAttack;

    private void Start()
    {
        if (OkapGameManager.Instance && OkapGameManager.Instance.player)
            target = OkapGameManager.Instance.player.transform;
    }

    private void Update()
    {
        if (!target) return;
        float d = Vector3.Distance(transform.position, target.position);
        if (d > detectionRange) return;
        Vector3 flat = target.position - transform.position;
        flat.y = 0;
        if (flat.sqrMagnitude > 0.01f)
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(flat), 6f * Time.deltaTime);
        if (d > attackRange)
            transform.position += transform.forward * moveSpeed * Time.deltaTime;
        else if (Time.time >= nextAttack)
        {
            nextAttack = Time.time + attackInterval;
            OkapPlayer p = target.GetComponent<OkapPlayer>();
            if (p) p.TakeDamage(attackDamage);
        }
    }
}
