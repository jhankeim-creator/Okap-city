using UnityEngine;

public class OkapVehicle : MonoBehaviour
{
    public float maxSpeed = 22f;
    public float acceleration = 12f;
    public float turnSpeed = 55f;
    public float brake = 18f;
    public float fuel = 100f;
    public float fuelConsumption = 1.5f;
    private float speed;
    private bool driving;

    private void Update()
    {
        if (!driving || fuel <= 0) return;
        float throttle = Input.GetAxis("Vertical");
        float steer = Input.GetAxis("Horizontal");
        speed = Mathf.MoveTowards(speed, throttle * maxSpeed, acceleration * Time.deltaTime);
        if (Mathf.Abs(throttle) < 0.1f)
            speed = Mathf.MoveTowards(speed, 0, brake * Time.deltaTime);
        transform.Translate(Vector3.forward * speed * Time.deltaTime);
        transform.Rotate(Vector3.up, steer * turnSpeed * Time.deltaTime * Mathf.Clamp01(Mathf.Abs(speed) / 4f));
        fuel = Mathf.Max(0, fuel - Mathf.Abs(speed) * fuelConsumption * Time.deltaTime / 100f);
    }

    public void EnterVehicle() => driving = true;
    public void ExitVehicle() { driving = false; speed = 0; }
}
