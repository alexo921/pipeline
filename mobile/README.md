# Pipeline Mobile App

A React Native mobile application that recreates the YourPipeline Analytics web dashboard with identical styling and functionality.

## 🚀 Features

- **Complete Analytics Dashboard**: Full recreation of the web analytics workspace
- **Action Center**: Comprehensive action management with filtering and status tracking
- **KPI Metrics**: Retention Forecast, No-Show Risk, and Turnover Cost cards
- **Insight Feed**: Real-time insights with actionable recommendations
- **Interactive Modals**: Pulse surveys and candidate reminder functionality
- **Responsive Design**: Optimized for mobile devices with touch-friendly interface
- **Cross-Platform**: Runs on iOS, Android, and Web

## 📱 Screens

### Main Navigation
- **Jobs**: Job listings and management
- **Applicants**: Hiring engine and candidate management  
- **YourPipeline**: Main dashboard with metrics and insights

### Analytics Screens
- **Analytics**: Complete analytics workspace with KPIs, insights, and action center
- **Action Center**: Detailed action management with filtering capabilities

## 🛠️ Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tooling
- **React Navigation**: Navigation library (Stack + Bottom Tab)
- **Ionicons**: Icon library
- **TypeScript**: Type-safe development

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run web      # Web browser
npm run ios      # iOS simulator (macOS only)
npm run android  # Android emulator/device
```

## 🏗️ Project Structure

```
mobile/
├── App.tsx                 # Main app entry point with navigation
├── src/
│   └── screens/
│       ├── JobsScreen.tsx           # Jobs management
│       ├── ApplicantsScreen.tsx    # Hiring engine
│       ├── YourPipelineScreen.tsx   # Main dashboard
│       ├── AnalyticsScreen.tsx      # Analytics workspace
│       └── ActionCenterScreen.tsx   # Action management
├── package.json
└── README.md
```

## 🎨 Design System

The mobile app uses the same design system as the web dashboard:

### Colors
- **Primary Blue**: `#2466D0`
- **Dark Text**: `#01253F`
- **Gray Text**: `#7691A4`
- **Background**: `#F4F4F4`

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Pipeline blue with white text
- **Modals**: Full-screen overlays with Pipeline blue headers
- **Icons**: Ionicons for consistent iconography

## 📊 Analytics Features

### KPI Cards
- **Retention Forecast**: 30/60/90 day predictions with trend indicators
- **No-Show Risk**: Flagged candidates with risk percentages
- **Turnover Cost**: Estimated savings and ROI metrics

### Insight Feed
- Real-time insights with severity levels
- Actionable recommendations
- Interactive action buttons

### Action Center
- Comprehensive action tracking
- Priority and status filtering
- Overdue highlighting
- Assignment management

## 🔧 Development

### Running the App
```bash
# Web version (recommended for development)
npm run web

# iOS (requires macOS)
npm run ios

# Android (requires Android SDK)
npm run android
```

### Building for Production
```bash
# Create production build
npx expo build:android
npx expo build:ios
```

## 📱 Platform Support

- ✅ **Web**: Full functionality in browsers
- ✅ **iOS**: Native iOS app (requires macOS for development)
- ⚠️ **Android**: Native Android app (requires Android SDK setup)

## 🚀 Deployment

### Web Deployment
The web version can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages

### Mobile App Stores
- **iOS**: Apple App Store (requires Apple Developer account)
- **Android**: Google Play Store (requires Google Play Console account)

## 🔍 Testing

### Manual Testing
1. **Navigation**: Test all tab navigation and screen transitions
2. **Analytics**: Verify KPI cards display correctly
3. **Action Center**: Test filtering and action management
4. **Modals**: Test pulse and reminder modal functionality
5. **Responsive**: Test on different screen sizes

### Automated Testing
```bash
# Run tests (when implemented)
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **Dependency conflicts**: Delete `node_modules` and reinstall
3. **Android build failures**: Ensure Android SDK is properly configured
4. **iOS build failures**: Ensure Xcode and iOS Simulator are installed

### Performance Optimization
- Use `FlatList` for large data sets
- Implement proper image optimization
- Use `useMemo` and `useCallback` for expensive operations

## 📈 Future Enhancements

- [ ] Push notifications for critical actions
- [ ] Offline data synchronization
- [ ] Biometric authentication
- [ ] Advanced filtering and search
- [ ] Data export functionality
- [ ] Real-time updates via WebSocket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Pipeline analytics platform.

---

**Note**: This mobile app is a complete recreation of the web analytics dashboard, maintaining visual and functional parity while optimizing for mobile devices.
