# 🎯 YourPipeline Analytics V1 - Live Demo

## 🚀 Quick Demo Setup (5 minutes)

### Step 1: Setup Backend & Demo Data
```bash
cd backend/api
./setup-demo.sh
```

### Step 2: Start Backend Server
```bash
npm run start:dev
```
*Backend runs on: http://localhost:3001*

### Step 3: Start Frontend
```bash
cd ../frontend/web-dashboard
npm run dev
```
*Frontend runs on: http://localhost:3000*

### Step 4: Access Demo
Visit: **http://localhost:3000/analytics**

---

## 🎮 Demo Walkthrough (10 minutes)

### 1. **KPI Dashboard Overview** (2 minutes)
- **Retention Forecast**: Shows 72% (30d), 68% (60d), 65% (90d) - **DOWN trend**
- **No-Show Risk**: 4 flagged candidates (16%) - **UP trend** 
- **Turnover Cost Avoided**: $24,000 saved, 6 hires retained - **ROI 2.4x**

### 2. **Insight Feed** (3 minutes)
- **3 Active Insights** with severity-based alerts:
  - 🔴 **Critical**: Sentiment decline in Rehab unit (35%)
  - 🟡 **Warning**: Retention forecast drop (12 points)
  - 🟡 **Warning**: Complaint spike (doubled this week)
- **Click action buttons** to simulate interventions

### 3. **Cohort Analysis** (2 minutes)
- **Hiring Funnel**: 100 → 50 → 25 → 20 hires
- **Retention Rates**: 80% → 73% → 67% (declining trend)
- **2024-Q1 Cohort**: 15 hires, 67% actual vs 70% predicted

### 4. **Hotspot Matrix** (2 minutes)
- **Unit View**: ICU (green), Rehab (red), Med-Surg (yellow)
- **Click hotspots** for detailed drill-down
- **Toggle unit/role views** to see different perspectives

### 5. **Action Center** (1 minute)
- **3 Pending Actions** with priority levels
- **Filter by status/priority** to focus
- **Click "Start/Complete"** to update action status

---

## 🎯 Key Demo Scenarios

### Scenario A: Daily Operations Check
1. Open analytics dashboard
2. Review KPI cards for immediate alerts
3. Check insight feed for automated recommendations
4. Review action center for pending interventions

### Scenario B: Unit Performance Review
1. Set unit filter to "Rehab"
2. Notice red indicators in hotspot matrix
3. Read detailed insights about retention risks
4. Execute suggested actions (escalate, send pulse)

### Scenario C: Executive Reporting
1. Set date range to "90 days"
2. Export PDF report
3. Review ROI metrics ($24,000 saved)
4. Analyze trends and patterns

---

## 📊 Demo Data Highlights

### **St. Mary's Health Center**
- **8 Employees** across 3 units
- **Realistic scenarios** with varying risk levels
- **Automated insights** generated from data patterns
- **Actionable interventions** ready to execute

### **ICU Unit** (High Performance)
- Low retention risk (15-25%)
- High sentiment scores (80-90%)
- Stable performance indicators

### **Rehab Unit** (At Risk)
- High retention risk (75-85%)
- Low sentiment scores (30-40%)
- Multiple active alerts and interventions

### **Med-Surg Unit** (Moderate)
- Medium retention risk (30-40%)
- Moderate sentiment (60%)
- Monitoring required

---

## 🔧 Interactive Features

### **Global Controls**
- **Date Range**: 7/30/90 days or custom
- **Role Filter**: CNA, LPN, RN, Support
- **Unit Filter**: ICU, Rehab, Med-Surg
- **Export**: CSV/PDF reports
- **Refresh**: Real-time data updates

### **Real-Time Updates**
- **Last Updated**: Shows timestamp
- **Loading States**: Smooth transitions
- **Error Handling**: Graceful fallbacks

### **Responsive Design**
- **Mobile**: Stacked layout
- **Tablet**: Optimized grid
- **Desktop**: Full multi-column

---

## 🎉 Demo Success Metrics

### **What to Highlight**
- ✅ **5-Minute Time-to-Insight**: Problem detection to action
- ✅ **Automated Alerts**: No manual monitoring needed
- ✅ **Clear ROI**: $24,000 saved through retention efforts
- ✅ **Actionable Insights**: Every alert includes next steps
- ✅ **Scalable Design**: Single facility to multi-site

### **Demo Flow**
1. **Problem**: Healthcare retention crisis
2. **Solution**: YourPipeline Analytics dashboard
3. **Value**: Real-time insights and actions
4. **Results**: Measurable improvements and ROI
5. **Action**: Next steps for implementation

---

## 🚨 Troubleshooting

### **Common Issues**
- **"No data"**: Run `./setup-demo.sh` to seed data
- **"Access denied"**: Login with any user account
- **"Loading forever"**: Check backend server status

### **Reset Demo**
```bash
cd backend/api
npx ts-node src/scripts/seed-demo-data.ts
```

---

## 📞 Demo Support

### **Technical Issues**
- Check backend logs: `npm run start:dev`
- Check frontend console: Browser dev tools
- Verify database: `npx prisma studio`

### **Customization**
- Modify seed script for different scenarios
- Adjust employee risk scores and sentiment
- Create additional insights and actions

---

## 🎯 Demo Script

### **Opening (1 minute)**
"Healthcare facilities face a $40,000+ cost per lost employee. Today I'll show you how YourPipeline Analytics transforms this reactive problem into proactive prevention."

### **Problem Demo (2 minutes)**
"Notice the red indicators - Rehab unit has 85% retention risk and 35% sentiment. Without analytics, you'd discover this after employees leave."

### **Solution Demo (5 minutes)**
"With YourPipeline Analytics, we see the problem immediately, understand the root causes, and have specific actions ready to execute."

### **Results Demo (2 minutes)**
"$24,000 saved, 6 hires retained, 200 hours saved. Clear ROI in 5 minutes of analysis."

### **Closing (1 minute)**
"YourPipeline Analytics delivers the retention radar healthcare facilities need. Ready to transform your workforce management?"

---

*This demo showcases the complete YourPipeline Analytics V1 system - from data ingestion to actionable insights in under 5 minutes.*
