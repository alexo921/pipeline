# Pip Chatbot Integration Setup

## Quick Start

1. **Install Rasa and activate virtual environment:**
```bash
cd /home/ubuntu/pipeline
source .venv/bin/activate
cd rasa
```

2. **Configure Rasa for Pipeline:**
   - Train the Rasa model: `rasa train`
   - Start Rasa server: `rasa run --enable-api --cors "*"`
   - Start action server: `rasa run actions`

3. **Update mobile app configuration:**
```typescript
// In services/chat.ts, update these values:
const RASA_API_URL = 'http://your-server:5005/webhooks/rest/webhook';
const RASA_WEBHOOK_URL = 'http://your-server:5005/webhooks/rest/webhook';
```

## Healthcare-Specific Configuration

### Pip Chatbot Personality
The Rasa chatbot is configured as Pip, a healthcare workforce assistant:
```
"Hi! I'm Pip, your healthcare workforce assistant. I help workers with shift documentation, 
scheduling questions, and workforce management. I'm here to support you with your healthcare 
career and shift experiences."
```

### Rasa Configuration
- **Language**: English
- **Policies**: TEDPolicy for dialogue management
- **NLU**: DIETClassifier for intent recognition
- **Actions**: Custom Python actions for Llama integration

### Llama Model Integration
- **Model**: llama-3.1-8b-instruct-q4_0.gguf (already downloaded)
- **Integration**: Via custom Rasa actions
- **Context**: Healthcare workforce management

## Production Deployment

### Docker Setup
```bash
# Run Rasa in Docker
docker-compose up rasa-server rasa-actions
```

### Environment Variables
```bash
# .env file
RASA_API_URL=http://your-production-server:5005/webhooks/rest/webhook
RASA_WEBHOOK_URL=http://your-production-server:5005/webhooks/rest/webhook
LLAMA_MODEL_PATH=/app/models/llama-3.1-8b-instruct-q4_0.gguf
```

### Security Considerations
- Use HTTPS in production
- Implement rate limiting
- Add authentication middleware
- Monitor conversation logs

## Testing the Integration

1. Start Rasa server: `rasa run --enable-api --cors "*"`
2. Start action server: `rasa run actions`
3. Run mobile app: `npx expo start`
4. Test chat functionality
5. Check Rasa logs for API calls

## Troubleshooting

- **Connection refused**: Ensure Rasa server is running on port 5005
- **Model not found**: Check Llama model path in actions
- **Intent recognition errors**: Retrain Rasa model with more data
- **Slow responses**: Optimize Llama model parameters

## Next Steps

- Add conversation persistence
- Implement user authentication
- Add healthcare-specific training data
- Set up monitoring and analytics
- Integrate with Pipeline backend API
