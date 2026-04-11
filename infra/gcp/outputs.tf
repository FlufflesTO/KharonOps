output "enabled_services" {
  description = "APIs managed by this stack."
  value       = sort(keys(google_project_service.enabled))
}

output "enabled_service_count" {
  description = "Count of APIs managed by this stack."
  value       = length(google_project_service.enabled)
}
