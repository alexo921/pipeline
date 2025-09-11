# YourPipeline Analytics V1 - Demo Guide

## 🎯 Demo Overview

This demo showcases the complete YourPipeline Analytics V1 system - an enterprise-grade analytics workspace that transforms healthcare workforce data into actionable insights with embedded interventions.

**North Star Achievement**: Enable facility leaders to identify retention risks and trigger interventions within 5 minutes.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Environment variables configured

### 1. Setup Demo Data
```bash
cd backend/api
npm install
npx ts-node run-demo.ts
```

### 2. Start Frontend
```bash
cd frontend/web-dashboard
npm install
npm run dev
```

### 3. Access Demo
- **Frontend**: http://localhost:3000/analytics
- **Backend API**: http://localhost:3001/api/analytics

---

## 📊 Demo Data Overview

### Facility: St. Mary's Health Center
- **Type**: Hospital
- **Location**: New Haven, CT
- **Employees**: 8 across 3 units (ICU, Rehab, Med-Surg)

### Key Demo Scenarios

#### 🟢 ICU Unit - High Performance
- **Employees**: Sarah Johnson (RN), Michael Chen (RN), Emily Rodriguez (CNA)
- **Retention Risk**: Low (15-25%)
- **Sentiment**: High (80-90%)
- **Status**: Stable, well-managed

#### 🔴 Rehab Unit - At Risk
- **Employees**: David Thompson (RN), Lisa Martinez (LPN), Robert Wilson (CNA)
- **Retention Risk**: High (75-85%)
- **Sentiment**: Low (30-40%)
- **Status**: Critical attention needed

#### 🟡 Med-Surg Unit - Moderate
- **Employees**: Jennifer Davis (RN), Kevin Lee (LPN)
- **Retention Risk**: Medium (30-40%)
- **Sentiment**: Moderate (60%)
- **Status**: Monitoring required

---

## 🎮 Interactive Demo Features

### 1. KPI Snapshot Cards
**Location**: Top of dashboard

**Retention Forecast Card**
- Shows 30/60/90 day retention predictions
- **Demo Value**: 72% (30d), 68% (60d), 65% (90d)
- **Trend**: Down (red indicator)
- **Risk Level**: Medium (yellow)

**No-Show Risk Card**
- Flags candidates at risk of not showing up
- **Demo Value**: 4 flagged out of 25 candidates (16%)
- **Trend**: Up (red indicator)

**Turnover Cost Avoided Card**
- Shows ROI from retention efforts
- **Demo Value**: $24,000 saved, 6 hires retained, 200 hours saved
- **ROI**: 2.4x return

### 2. Insight Feed
**Location**: Left column, top

**Active Insights**:
1. **Retention Forecast Drop** (Warning)
   - "Rehab unit forecast dropped 12 points vs baseline"
   - **Action**: Escalate to Supervisor

2. **Sentiment Decline** (Critical)
   - "Sentiment dropped to 35% in Rehab unit"
   - **Action**: Send Targeted Pulse

3. **Complaint Spike** (Warning)
   - "Complaint frequency doubled this week"
   - **Action**: Escalate to HR

**Interactive Features**:
- Click action buttons to simulate interventions
- Insights auto-generate based on data patterns
- Severity-based color coding (info/warning/critical)

### 3. Cohorts & Funnels
**Location**: Left column, bottom

**Hiring Funnel**:
- **Applicants**: 100 → **Interviews**: 50 → **Offers**: 25 → **Hires**: 20
- **Retention**: 18 (30d) → 16 (60d) → 15 (90d)

**Cohort Analysis Table**:
- **2024-Q1 Cohort**: 15 total hires
- **Retention Rates**: 80% (30d), 73% (60d), 67% (90d)
- **Predicted vs Actual**: 70% predicted, 67% actual (trending down)

### 4. Hotspot Matrix
**Location**: Right column, top

**Unit View** (Default):
- **ICU**: Green (low risk) - High sentiment, high retention
- **Rehab**: Red (high risk) - Low sentiment, low retention
- **Med-Surg**: Yellow (medium risk) - Moderate metrics

**Role View** (Toggle):
- **RN**: Mixed performance across units
- **LPN**: Moderate risk indicators
- **CNA**: Varies by unit assignment

**Interactive Features**:
- Click hotspots for detailed drill-down
- Toggle between unit/role views
- Heatmap color coding shows risk levels

### 5. Action Center
**Location**: Right column, bottom

**Pending Actions**:
1. **Escalate Retention Risk - Rehab Unit** (High Priority)
   - Assigned to: supervisor@stmarys.com
   - Due: Next 24 hours
   - Status: Pending

2. **Send Targeted Pulse - Rehab Unit** (Medium Priority)
   - Assigned to: hr@stmarys.com
   - Due: Next 48 hours
   - Status: Pending

**Completed Actions**:
- **Send Intake Completion Nudge** (Low Priority)
  - Completed 2 days ago
  - Status: Completed

**Interactive Features**:
- Filter by status (All/Pending/In Progress/Completed)
- Filter by priority (All/Critical/High/Medium/Low)
- Click "Start" or "Complete" buttons to update status
- View overdue items (red highlighting)

---

## 🎛️ Global Controls

### Date Range Filter
- **7 days**: Recent trends
- **30 days**: Monthly patterns (default)
- **90 days**: Quarterly analysis
- **Custom**: Flexible date selection

### Role Filter
- **All Roles**: Complete view
- **CNA**: Certified Nursing Assistants
- **LPN**: Licensed Practical Nurses
- **RN**: Registered Nurses
- **Support**: Support staff

### Unit Filter
- **All Units**: Facility-wide view
- **ICU**: Critical Care Unit
- **Rehab**: Rehabilitation Unit
- **Med-Surg**: Medical-Surgical Unit

### Export Options
- **CSV**: Download raw data
- **PDF**: Generate report
- **Refresh**: Update data

---

## 🔧 Technical Demo Features

### Real-Time Data Updates
- **Refresh Button**: Simulates real-time data updates
- **Last Updated**: Shows timestamp of latest data
- **Loading States**: Smooth transitions during data fetch

### Responsive Design
- **Mobile**: Stacked layout for small screens
- **Tablet**: Optimized grid for medium screens
- **Desktop**: Full multi-column layout

### Authentication
- **Login Required**: Access control for analytics
- **Role-Based**: Different views for different user types
- **Admin Access**: Special indicators for admin users

---

## 📈 Demo Scenarios

### Scenario 1: Daily Operations Check
1. **Open Analytics Dashboard**
2. **Review KPI Cards** - Check retention forecasts and risk metrics
3. **Scan Insight Feed** - Look for automated alerts
4. **Check Action Center** - Review pending interventions
5. **Filter by Today** - Focus on immediate priorities

### Scenario 2: Unit Performance Review
1. **Set Unit Filter to "Rehab"**
2. **Review Hotspot Matrix** - See Rehab unit highlighted in red
3. **Check Cohort Analysis** - View retention trends
4. **Examine Insights** - Read detailed analysis
5. **Take Actions** - Click escalation buttons

### Scenario 3: Retention Crisis Management
1. **Notice Red Indicators** - Retention forecast dropping
2. **Read Insight Details** - Understand root causes
3. **Review Employee Data** - Check individual risk scores
4. **Execute Interventions** - Escalate to supervisors
5. **Monitor Progress** - Track action completion

### Scenario 4: Executive Reporting
1. **Set Date Range to "90 days"**
2. **Export PDF Report** - Generate executive summary
3. **Review ROI Metrics** - Show cost avoidance
4. **Analyze Trends** - Compare periods
5. **Share Insights** - Distribute findings

---

## 🎯 Key Demo Messages

### 1. **Proactive vs Reactive**
- **Before**: Discover problems after employees leave
- **After**: Predict and prevent retention issues

### 2. **Data-Driven Decisions**
- **Before**: Gut feelings and manual processes
- **After**: Quantified insights with confidence scores

### 3. **Actionable Intelligence**
- **Before**: Reports that sit on shelves
- **After**: Insights with embedded actions

### 4. **Time to Insight**
- **Before**: Weeks of analysis
- **After**: 5 minutes to identify and act

### 5. **ROI Visibility**
- **Before**: Unknown cost of turnover
- **After**: Clear savings and return metrics

---

## 🚨 Demo Troubleshooting

### Common Issues

**"No data available"**
- Ensure demo data was seeded successfully
- Check database connection
- Verify facility ID in URL

**"Access denied"**
- Login with valid user account
- Check user permissions
- Verify authentication status

**"Loading forever"**
- Check backend server status
- Verify API endpoints
- Check network connectivity

### Reset Demo Data
```bash
cd backend/api
npx ts-node src/scripts/seed-demo-data.ts
```

---

## 📞 Demo Support

### Technical Questions
- **Backend Issues**: Check server logs and API responses
- **Frontend Issues**: Check browser console and network tab
- **Data Issues**: Verify database connection and schema

### Demo Customization
- **Add Facilities**: Modify seed script with new facility data
- **Change Scenarios**: Adjust employee risk scores and sentiment
- **New Insights**: Create additional analytics insights

---

## 🎉 Demo Success Metrics

### What to Highlight
- **5-Minute Time-to-Insight**: From problem detection to action
- **Automated Alerts**: No manual monitoring required
- **Clear ROI**: $24,000 saved through retention efforts
- **Actionable Insights**: Every alert includes specific next steps
- **Scalable Design**: Works for single facilities or multi-site organizations

### Demo Flow
1. **Start with Problem**: Show retention crisis in healthcare
2. **Present Solution**: YourPipeline Analytics dashboard
3. **Demonstrate Value**: Real-time insights and actions
4. **Show Results**: Measurable improvements and ROI
5. **Call to Action**: Next steps for implementation

---

*This demo showcases the complete YourPipeline Analytics V1 system, demonstrating how data-driven insights can transform healthcare workforce retention management.*
