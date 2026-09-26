# Infrastructure

Terraform environments live under `infra/environments`.

## Staging foundation

The staging environment creates a two-AZ VPC, security groups, an ECR
repository, and a private single-AZ RDS PostgreSQL instance. The RDS instance
is intentionally staging-sized and incurs charges while running.

```bash
cd infra/environments/staging
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Copy `terraform.tfvars.example` to `terraform.tfvars` only when changing the
defaults. `terraform.tfvars` is ignored because it may contain environment-specific values.

Terraform currently uses local state for learning. Before production, move the
state to an encrypted S3 backend with locking and keep staging and production
state separate.
