# Jan AI Integration Setup

## Quick Start

1. **Install Jan on your server:**
```bash
git clone https://github.com/menloresearch/jan
cd jan
make dev
```

2. **Configure Jan for Pipeline:**
   - Open Jan UI at `http://localhost:3000`
   - Download a healthcare-focused model (recommended: Llama 3.1 8B or Qwen2.5 7B)
   - Go to Settings → API Keys and create a new key
   - Update `services/chat.ts` with your API key and model name

3. **Update mobile app configuration:**
```typescript
// In services/chat.ts, update these values:
const JAN_API_URL = 'http://your-server:1337/v1/chat/completions';
'Authorization': 'Bearer your-actual-api-key',
model: 'your-model-name', // e.g., 'llama-3.1-8b-instruct'
```

## Healthcare-Specific Configuration

### System Prompt
The mobile app uses this system prompt for healthcare context:
```
"You are Pipeline, a healthcare workforce assistant. Help workers with shift scheduling, availability, and workforce management. Be helpful, professional, and focused on healthcare staffing needs."
```

### Recommended Models
- **Llama 3.1 8B Instruct** - Good balance of performance and speed
- **Qwen2.5 7B Instruct** - Excellent for structured tasks
- **Gemma 2 9B Instruct** - Fast and efficient

### API Configuration
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 500 (concise responses)
- **Streaming**: Enabled for real-time responses

## Production Deployment

### Docker Setup
```bash
# Run Jan in Docker
docker run -p 1337:1337 -p 3000:3000 jan-ai/jan:latest
```

### Environment Variables
```bash
# .env file
JAN_API_URL=http://your-production-server:1337/v1/chat/completions
JAN_API_KEY=your-production-api-key
JAN_MODEL_NAME=llama-3.1-8b-instruct
```

### Security Considerations
- Use HTTPS in production
- Implement rate limiting
- Add authentication middleware
- Monitor API usage and costs

## Testing the Integration

1. Start Jan server: `make dev`
2. Run mobile app: `npx expo start`
3. Test chat functionality
4. Check Jan logs for API calls

## Troubleshooting

- **Connection refused**: Ensure Jan server is running on port 1337
- **Model not found**: Download the model in Jan UI first
- **API key errors**: Check Jan settings for correct API key
- **Slow responses**: Try a smaller model or reduce max_tokens

## Next Steps

- Add conversation persistence
- Implement user authentication
- Add healthcare-specific training data
- Set up monitoring and analytics
