resource "aws_security_group" "load_balancer" {
  name        = "${local.name}-load-balancer"
  description = "Public access to the Kommerce load balancer"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP"
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name}-load-balancer"
  }
}

resource "aws_security_group" "application" {
  name        = "${local.name}-application"
  description = "Internal Kommerce application traffic"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Application traffic from the load balancer"
    protocol        = "tcp"
    from_port       = 3000
    to_port         = 3000
    security_groups = [aws_security_group.load_balancer.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name}-application"
  }
}

resource "aws_security_group" "database" {
  name        = "${local.name}-database"
  description = "Private PostgreSQL access for Kommerce"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "PostgreSQL from the application security group"
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = [aws_security_group.application.id]
  }

  tags = {
    Name = "${local.name}-database"
  }
}
