locals {
  # One source of truth shared with the Bash script.
  service_apis = [
    for raw in split("\n", file("${path.module}/service-apis.txt")) :
    trimspace(raw)
    if trimspace(raw) != "" && !startswith(trimspace(raw), "#")
  ]
}

provider "google" {
  project = var.project_id
}

resource "google_project_service" "enabled" {
  for_each = toset(local.service_apis)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = var.disable_on_destroy
}
