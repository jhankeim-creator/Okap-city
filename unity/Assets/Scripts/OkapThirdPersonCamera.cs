using UnityEngine;

public class OkapThirdPersonCamera : MonoBehaviour
{
    public Transform target;
    public Vector3 offset = new Vector3(0.85f, 2.5f, -5.2f);
    public float followSpeed = 12f;
    public float lookSensitivity = 2.5f;
    public float minPitch = -25f;
    public float maxPitch = 55f;
    private float yaw;
    private float pitch = 12f;

    private void LateUpdate()
    {
        if (!target) return;
        float mx = Input.GetAxis("Mouse X") * lookSensitivity;
        float my = Input.GetAxis("Mouse Y") * lookSensitivity;
        if (Mathf.Abs(mx) > 0.001f || Mathf.Abs(my) > 0.001f)
        {
            yaw += mx;
            pitch = Mathf.Clamp(pitch - my, minPitch, maxPitch);
        }
        Quaternion rot = Quaternion.Euler(pitch, yaw, 0);
        Vector3 desired = target.position + rot * offset;
        transform.position = Vector3.Lerp(transform.position, desired, followSpeed * Time.deltaTime);
        transform.LookAt(target.position + Vector3.up * 1.4f);
        target.rotation = Quaternion.Euler(0, yaw, 0);
    }
}
