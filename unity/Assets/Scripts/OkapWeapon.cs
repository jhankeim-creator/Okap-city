using System.Collections;
using UnityEngine;

public class OkapWeapon : MonoBehaviour
{
    [Header("Stats")]
    public string weaponName = "Soley Wouj";
    public float damage = 24f;
    public float range = 150f;
    public float fireRate = 8f;
    public int magazineSize = 30;
    public int reserveAmmo = 120;
    public float reloadTime = 1.7f;
    [Header("References")]
    public Camera aimCamera;
    public ParticleSystem muzzleFlash;
    public AudioSource audioSource;
    public AudioClip fireClip;
    public AudioClip reloadClip;
    public int AmmoInMagazine { get; private set; }
    public bool IsReloading { get; private set; }
    private float nextFire;

    private void Awake() => AmmoInMagazine = magazineSize;

    public void Fire()
    {
        if (IsReloading || Time.time < nextFire) return;
        if (AmmoInMagazine <= 0) { Reload(); return; }
        nextFire = Time.time + 1f / Mathf.Max(0.01f, fireRate);
        AmmoInMagazine--;
        if (muzzleFlash) muzzleFlash.Play();
        if (audioSource && fireClip) audioSource.PlayOneShot(fireClip);
        Camera cam = aimCamera ? aimCamera : Camera.main;
        if (!cam) return;
        if (Physics.Raycast(cam.transform.position, cam.transform.forward, out RaycastHit hit, range))
        {
            OkapDamageable target = hit.collider.GetComponentInParent<OkapDamageable>();
            if (target) target.ApplyDamage(damage);
        }
    }

    public void Reload()
    {
        if (IsReloading || AmmoInMagazine >= magazineSize || reserveAmmo <= 0) return;
        StartCoroutine(ReloadRoutine());
    }

    private IEnumerator ReloadRoutine()
    {
        IsReloading = true;
        if (audioSource && reloadClip) audioSource.PlayOneShot(reloadClip);
        yield return new WaitForSeconds(reloadTime);
        int needed = magazineSize - AmmoInMagazine;
        int loaded = Mathf.Min(needed, reserveAmmo);
        AmmoInMagazine += loaded;
        reserveAmmo -= loaded;
        IsReloading = false;
    }
}
