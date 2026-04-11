variable "project_id" {
  description = "Target Google Cloud project ID."
  type        = string
}

variable "disable_on_destroy" {
  description = "Disable APIs if this Terraform stack is destroyed."
  type        = bool
  default     = false
}
