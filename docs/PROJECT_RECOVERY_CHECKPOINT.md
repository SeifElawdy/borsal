# Verified recovery checkpoint — 14 November 2026

**Status: VERIFIED before implementation.** Phase 6O committed as `8d801165ac5f23a6f39a1ffcd44632c03da36f2d` (`feat: assess product construction fidelity`). Recovery tag: `borsal-pre-model-upgrade-20261114T170313Z`. Development branch created only after verification: `feature/emergency-construction-mvp`.

Private backup root, outside this repository:

`E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\verified-snapshot-final`

## Verified evidence

- `borsal-recovery.bundle`: all project branch/tag history; `git bundle verify`, a separate `--no-checkout` clone, matching recovery-tag commit and `git fsck --full` passed.
- `file-manifest.json`: **2,019** ignored application/configuration/artifact files, **614,259,775 bytes** of original data. Every copy's SHA-256 was checked; source files were rechecked after backup.
- Included original uploads/photos, concept/raw inference results, generated previews, proposal/SVG/reports, shared ledger/campaign locks, local workspace metadata and frontend build artifacts.
- Reproducible `node_modules` and temporary automated-browser `profile`/`.vite` caches were excluded and counted in the manifest. This does not exclude saved application projects or source evidence.
- `.env` and any detected credential-bearing files are Windows **DPAPI CurrentUser** encrypted, not plaintext. Decryption/hash verification passed. Use the same Windows account/profile; on another machine, reconfigure credentials. No secrets were committed or printed.
- **21 Borsal databases** were dumped with official MongoDB Database Tools **100.20.1**, using the existing local `rs0` primary. Each archive is nonempty and hashed. Every database was restored into a new `borsal-restorecheck-20261114t170313z-v2-*-test` namespace, with matching collection document counts, canonical document hashes and index evidence. Original database hashes were rechecked unchanged.
- The local application was stopped for a quiescent snapshot. Per-database dumps intentionally avoid global `--oplog`, which would require a server-wide dump and include unrelated databases. Only Borsal database contents were read. Restore validation namespaces remain available for inspection; no original database was dropped or overwritten.
- `VERIFIED-CHECKPOINT.json` contains exact archive paths, hashes, collections, restore namespaces and bundle commit evidence. Private logs and failed preliminary backup attempts remain preserved outside the repo; their earlier buffer/order-comparison issues did not modify source records.

The backup parent directory has inheritance removed and access restricted to the current Windows identity and SYSTEM. No backup has been published.

## Restore into NEW locations only

```powershell
$backup = 'E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\verified-snapshot-final'
git bundle verify "$backup\borsal-recovery.bundle"
git clone "$backup\borsal-recovery.bundle" 'E:\Borsal-Restored-20261114'
git -C 'E:\Borsal-Restored-20261114' switch -c recovered-work borsal-pre-model-upgrade-20261114T170313Z
```

Copy `application-data` files into the **new** clone according to `file-manifest.json`; encrypted `.dpapi` entries need decryption, not renaming. Do not overwrite an existing repository or `.env`. Under the original Windows account, decrypt a configuration file to a new target only:

```powershell
Add-Type -AssemblyName System.Security
$encrypted = "$backup\application-data\.env.dpapi"
$target = 'E:\Borsal-Restored-20261114\.env'
if (Test-Path -LiteralPath $target) { throw 'Refusing to overwrite configuration' }
$bytes = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($encrypted), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[IO.File]::WriteAllBytes($target, $bytes)
```

MongoDB tool binaries are in the backup parent under `tools\mongodb\mongodb-database-tools-windows-x86_64-100.20.1\bin`. Example restoring the real user workspace to a **new isolated database**, never the original:

```powershell
$tools = 'E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\tools\mongodb\mongodb-database-tools-windows-x86_64-100.20.1\bin'
& "$tools\mongorestore.exe" --uri='mongodb://127.0.0.1:27017/?replicaSet=rs0' --gzip --archive="$backup\mongodb\borsal-local-user-600dd528-2920-4fe0-8412-52b3951f922e.archive.gz" --nsInclude='borsal-local-user-600dd528-2920-4fe0-8412-52b3951f922e.*' --nsFrom='borsal-local-user-600dd528-2920-4fe0-8412-52b3951f922e.*' --nsTo='borsal-recovered-user-20261114-test.*' --stopOnError
```

Choose a new target name that does not exist. **Do not use `--drop` or restore over original namespaces.** Reconfigure the restored copy's workspace metadata/URI explicitly, then compare it with the manifest before use. Absolute photo paths in historical evidence may need an explicitly documented relocation in the restored copy; the original files and hashes are preserved at their backup-relative paths. Never silently rewrite original provenance.

Reinstall reproducible dependencies with `npm ci` and `npm --prefix client ci`; use the restored lockfiles. The backup contains the working frontend build as well. Keep live provider controls disabled while validating a restore. The snapshot's shared ledger is preserved as-is; do not reset it when restoring an active development workspace.

## Verified delivery addendum

`E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\delivery-addendum-20261114T181610136Z`

This separate append-only backup contains Git bundle commit `d7da6df97898f71b629257f8e4608b178c337762`, current shared **19/30** request accounting, the new campaign/receipt, current user-workspace metadata, exported SVG/reports and final screenshots/logs (61 hashed copied files). The current user database (10 collections, 20 documents) was dumped with the same official tools and restored into `borsal-delivery-a325780b-fb5b-4e8a-93a3-1dcc3946b0eb-test`; document/index hashes matched and the source was rechecked unchanged. See its `VERIFIED-DELIVERY-ADDENDUM.json` and `RESTORE.txt`.

Restore the original full artifact/configuration backup together with this addendum into NEW locations only. Prefer the delivery bundle/code and current user database archive, and overlay the latest ledger before enabling anything. Never replace an active ledger with the older 18-request checkpoint. Reproducible new fixture databases/browser caches are excluded from this addendum; their exported demonstration evidence is included. An earlier addendum attempt with an overlong temporary database name was preserved separately; it did not overwrite or delete original data.
