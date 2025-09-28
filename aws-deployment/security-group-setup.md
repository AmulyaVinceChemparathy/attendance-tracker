# AWS Security Group Configuration

## Inbound Rules
| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP/32 | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Application port |

## Outbound Rules
| Type | Protocol | Port Range | Destination | Description |
|------|----------|------------|-------------|-------------|
| All Traffic | All | All | 0.0.0.0/0 | All outbound traffic |

## Security Best Practices
1. **Restrict SSH access** to your IP only
2. **Use HTTPS** in production (set up SSL certificate)
3. **Consider using Application Load Balancer** for better security
4. **Regular security updates** for the EC2 instance
