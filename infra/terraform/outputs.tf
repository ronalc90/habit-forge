# ============================================
# HabitForge - Outputs de Terraform
# Autor: Ronald
# ============================================

output "alb_dns_name" {
  description = "DNS del Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL del Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecs_cluster_name" {
  description = "Nombre del cluster ECS"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Nombre del servicio ECS"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "Nombre del log group en CloudWatch"
  value       = aws_cloudwatch_log_group.app.name
}

output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}
