using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class OkapPlayer : MonoBehaviour
{
    [Header("Movement")]
    public float walkSpeed = 4.5f;
    public float sprintSpeed = 7.5f;
    public float crouchSpeed = 2.3f;
    public float jumpHeight = 1.4f;
    public float gravity = -25f;
    [Header("Vitals")]
    public float maxHealth = 100f;
    public float maxArmor = 100f;
    public float health = 100f;
    public float armor = 0f;
    [Header("References")]
    public Transform cameraTransform;
    public OkapWeapon currentWeapon;
    public bool IsDead { get; private set; }
    public bool IsCrouching { get; private set; }
    private CharacterController controller;
    private Vector3 verticalVelocity;

    private void Awake()
    {
        controller = GetComponent<CharacterController>();
        health = maxHealth;
    }

    private void Update()
    {
        if (IsDead) return;
        HandleMovement();
        HandleKeyboardActions();
    }

    private void HandleMovement()
    {
        float x = OkapMobileInput.Move.x != 0 ? OkapMobileInput.Move.x : Input.GetAxisRaw("Horizontal");
        float z = OkapMobileInput.Move.y != 0 ? OkapMobileInput.Move.y : Input.GetAxisRaw("Vertical");
        Vector3 forward = cameraTransform ? Vector3.Scale(cameraTransform.forward, new Vector3(1, 0, 1)).normalized : transform.forward;
        Vector3 right = cameraTransform ? cameraTransform.right : transform.right;
        Vector3 direction = forward * z + right * x;
        if (direction.sqrMagnitude > 1f) direction.Normalize();
        bool sprint = Input.GetKey(KeyCode.LeftShift) || OkapMobileInput.Sprint;
        float speed = IsCrouching ? crouchSpeed : (sprint ? sprintSpeed : walkSpeed);
        controller.Move(direction * speed * Time.deltaTime);
        if (direction.sqrMagnitude > 0.01f)
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 12f * Time.deltaTime);
        if (controller.isGrounded && verticalVelocity.y < 0) verticalVelocity.y = -2f;
        if ((Input.GetKeyDown(KeyCode.Space) || OkapMobileInput.Jump) && controller.isGrounded)
            verticalVelocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        verticalVelocity.y += gravity * Time.deltaTime;
        controller.Move(verticalVelocity * Time.deltaTime);
    }

    private void HandleKeyboardActions()
    {
        if (Input.GetKeyDown(KeyCode.C)) ToggleCrouch();
        if (Input.GetKeyDown(KeyCode.R) && currentWeapon) currentWeapon.Reload();
        if ((Input.GetMouseButton(0) || OkapMobileInput.Fire) && currentWeapon) currentWeapon.Fire();
        if (Input.GetKeyDown(KeyCode.H)) Heal(35f);
    }

    public void ToggleCrouch() => IsCrouching = !IsCrouching;

    public void TakeDamage(float amount)
    {
        if (IsDead) return;
        float absorbed = Mathf.Min(armor, amount * 0.65f);
        armor -= absorbed;
        health -= amount - absorbed;
        if (health <= 0) Die();
    }

    public void Heal(float amount) => health = Mathf.Clamp(health + amount, 0, maxHealth);
    public void AddArmor(float amount) => armor = Mathf.Clamp(armor + amount, 0, maxArmor);

    private void Die()
    {
        IsDead = true;
        if (OkapGameManager.Instance) OkapGameManager.Instance.PlayerDied();
    }
}
