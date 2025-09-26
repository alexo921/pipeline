# Pipeline Mobile App Deployment Guide

This guide covers multiple deployment options for the Pipeline mobile app.

## Deployment Options

### 1. Web Deployment (Easiest)

Deploy as a Progressive Web App (PWA) that works on all devices:

```bash
# Build for web
npm run web

# Deploy to Vercel (recommended)
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod --dir=dist
```

### 2. Expo Application Services (EAS) - Native Apps

For iOS and Android app store deployment:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Initialize project
eas init

# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### 3. Docker Deployment

Deploy the web version using Docker:

```bash
# Build Docker image
docker build -t pipeline-mobile .

# Run container
docker run -p 3000:3000 pipeline-mobile
```

### 4. Static Hosting

Build and deploy to any static hosting service:

```bash
# Build static files
npx expo export --platform web

# Deploy to GitHub Pages
npx gh-pages -d dist

# Deploy to AWS S3
aws s3 sync dist/ s3://your-bucket-name --delete
```

## Configuration

### Environment Variables

Create `.env` file for production:

```env
EXPO_PUBLIC_API_URL=https://api.pipelineworkforce.com
EXPO_PUBLIC_JAN_API_URL=https://jan.pipelineworkforce.com
EXPO_PUBLIC_ENVIRONMENT=production
```

### API Endpoints

Update API endpoints in `services/chat.ts`:

```typescript
// Production URLs
const JAN_API_URL = process.env.EXPO_PUBLIC_JAN_API_URL || 'https://jan.pipelineworkforce.com/v1/chat/completions';
const PIPELINE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.pipelineworkforce.com';
```

## Build Profiles

### Development
- Fast refresh enabled
- Debug logging
- Local API endpoints

### Preview
- Internal distribution
- APK for Android testing
- TestFlight for iOS

### Production
- Optimized builds
- App store ready
- Production API endpoints

## Platform-Specific Notes

### iOS
- Requires Apple Developer account
- Bundle identifier: `com.pipelineworkforce.mobile`
- App Store Connect setup needed

### Android
- Requires Google Play Console account
- Package name: `com.pipelineworkforce.mobile`
- Play Store setup needed

### Web
- Works as PWA
- Offline capabilities
- Mobile-responsive design

## Monitoring and Analytics

### Expo Analytics
```bash
# Enable analytics
eas analytics:enable
```

### Custom Analytics
Add analytics tracking in the app for user engagement and performance monitoring.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Expo SDK compatibility
   - Update dependencies
   - Clear cache: `expo r -c`

2. **API Connection Issues**
   - Verify environment variables
   - Check CORS settings
   - Test API endpoints

3. **Performance Issues**
   - Optimize images
   - Enable code splitting
   - Monitor bundle size

### Support

- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- React Native: https://reactnative.dev/docs/getting-started
