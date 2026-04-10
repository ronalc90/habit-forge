# ============================================
# HabitForge - Variables de Terraform
# Autor: Ronald
# ============================================

variable "aws_region" {
  description = "Region de AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "habitforge"
}

variable "environment" {
  description = "Ambiente de despliegue"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "El ambiente debe ser development, staging o production."
  }
}

variable "container_image" {
  description = "Imagen Docker del contenedor"
  type        = string
  default     = "ghcr.io/ronalc90/habit-forge:latest"
}

variable "container_port" {
  description = "Puerto del contenedor"
  type        = number
  default     = 3002
}

variable "task_cpu" {
  description = "CPU para la task de ECS (en unidades)"
  type        = string
  default     = "256"
}

variable "task_memory" {
  description = "Memoria para la task de ECS (en MB)"
  type        = string
  default     = "512"
}

variable "desired_count" {
  description = "Numero deseado de tareas ECS"
  type        = number
  default     = 2
}

variable "max_count" {
  description = "Numero maximo de tareas ECS para auto-scaling"
  type        = number
  default     = 6
}

variable "db_host" {
  description = "Host de la base de datos"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
  default     = "habitforge"
}

variable "db_password" {
  description = "Password de la base de datos"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secreto JWT"
  type        = string
  sensitive   = true
}

variable "redis_host" {
  description = "Host de Redis"
  type        = string
  default     = ""
}
