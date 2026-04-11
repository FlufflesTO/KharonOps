# GCP API Enablement

This folder provides two ways to enable and keep required Google APIs in sync.

## Option 1: Bash (fast bootstrap)

```bash
bash infra/gcp/enable-apis.sh --project kharonops
```

Dry run:

```bash
bash infra/gcp/enable-apis.sh --project kharonops --dry-run
```

## Option 2: Terraform (managed state)

```bash
cd infra/gcp
terraform init
terraform apply -var="project_id=kharonops"
```

Destroy behavior defaults to keeping APIs enabled.  
If you want destroy to disable APIs:

```bash
terraform apply -var="project_id=kharonops" -var="disable_on_destroy=true"
```

## API list source of truth

Both Bash and Terraform use:

- `infra/gcp/service-apis.txt`

Edit this file to add or remove APIs.

Note: some Maps Platform services are entitlement-dependent.  
If an API returns `SERVICE_CONFIG_NOT_FOUND_OR_PERMISSION_DENIED`, comment it out in `service-apis.txt` and re-run.
