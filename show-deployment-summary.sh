#!/bin/bash

# Pipeline Deployment Summary
# Shows all available deployment commands and current status

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Pipeline Deployment System${NC}"
echo "=============================="
echo ""

echo -e "${GREEN}📋 QUICK COMMANDS${NC}"
echo -e "${YELLOW}Most common scenarios:${NC}"
echo "  ./quick-deploy.sh update-jobs   # Update job data and redeploy frontend"
echo "  ./quick-deploy.sh hotfix        # Quick frontend fix (no rebuild)"
echo "  ./quick-deploy.sh check         # Check system status"
echo "  ./quick-deploy.sh logs          # View recent logs"
echo ""

echo -e "${GREEN}🔧 FULL DEPLOYMENT${NC}"
echo -e "${YELLOW}Component-specific deployments:${NC}"
echo "  ./deploy.sh frontend            # Deploy web dashboard only"
echo "  ./deploy.sh backend             # Deploy API only" 
echo "  ./deploy.sh admin               # Deploy admin panel only"
echo "  ./deploy.sh scraper             # Deploy job scraper only"
echo "  ./deploy.sh migrations          # Run database migrations only"
echo "  ./deploy.sh                     # Deploy everything"
echo ""

echo -e "${GREEN}⚙️ ADVANCED OPTIONS${NC}"
echo -e "${YELLOW}Safety and testing:${NC}"
echo "  ./deploy.sh --dry-run           # See what would be deployed"
echo "  ./deploy.sh --no-build frontend # Deploy without rebuilding (faster)"
echo "  ./deploy.sh --rollback          # Rollback to previous version"
echo ""

echo -e "${GREEN}📊 CURRENT STATUS${NC}"
echo "=============================="
./quick-deploy.sh check
echo ""

echo -e "${GREEN}📖 DOCUMENTATION${NC}"
echo "=============================="
echo "  📄 Full guide: cat DEPLOYMENT.md"
echo "  🆘 Get help:   ./deploy.sh --help"
echo "  🆘 Quick help: ./quick-deploy.sh"
echo ""

echo -e "${CYAN}💡 Pro Tips:${NC}"
echo "• Always test with --dry-run first"
echo "• Use quick-deploy.sh for routine updates"
echo "• Check logs with: tail -f deployment.log"
echo "• Monitor with: watch ./quick-deploy.sh check" 