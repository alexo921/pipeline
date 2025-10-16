# Nginx Configuration for Pipeline

## API Subdomain Configuration

The `api.pipelineworkforce.com` subdomain is configured to proxy all requests to the backend API.

### Key Configuration Points:

1. **Proxy Pass**: Routes to `http://localhost:3001/` (without `/api/` suffix)
   - The backend already uses `/api/` prefix, so we don't double it
   - Example: `api.pipelineworkforce.com/api/analytics/...` → `localhost:3001/api/analytics/...`

2. **CORS Headers**: Dynamically set based on request origin
   - Supports both `www.pipelineworkforce.com` and `pipelineworkforce.com`
   - Includes credentials support
   - Single `Access-Control-Allow-Origin` header (no duplicates)

3. **SSL**: Managed by Certbot with Let's Encrypt

### Configuration File Location:
`/etc/nginx/sites-enabled/pipelineworkforce.com`

### Reload Nginx After Changes:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Test CORS:
```bash
curl -H "Origin: https://www.pipelineworkforce.com" \
  -I https://api.pipelineworkforce.com/api/analytics/kpis/test
```

### Test Authentication:
```bash
curl https://api.pipelineworkforce.com/api/analytics/kpis/test
# Should return: {"message":"Unauthorized","statusCode":401}
```
