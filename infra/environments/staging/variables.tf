variable "aws_region" {
  description = "AWS region for the staging environment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used in resource names and tags"
  type        = string
  default     = "kommerce"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "CIDR block for the staging VPC"
  type        = string
  default     = "10.42.0.0/16"
}

variable "db_name" {
  description = "Initial PostgreSQL database name"
  type        = string
  default     = "kommerce"
}

variable "db_master_username" {
  description = "RDS master username used only for initial database administration"
  type        = string
  default     = "kommerce_admin"
}

variable "db_instance_class" {
  description = "RDS instance class for staging"
  type        = string
  default     = "db.t3.micro"
}
