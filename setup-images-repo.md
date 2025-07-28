# Setup Images Repository on GitHub

## Steps to Create the Pipeline Images Repository

### 1. Create a New Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `pipeline-images`
3. Description: `Pipeline application images and assets`
4. Make it **Public** (so images can be accessed via raw URLs)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 2. Push the Images to GitHub
```bash
cd pipeline-images
git remote set-url origin https://github.com/alexo921/pipeline-images.git
git push -u origin main
```

### 3. Verify Images are Accessible
Test these URLs after pushing:
- https://raw.githubusercontent.com/alexo921/pipeline-images/main/images/pipeline_logo.png
- https://raw.githubusercontent.com/alexo921/pipeline-images/main/images/google-logo.svg
- https://raw.githubusercontent.com/alexo921/pipeline-images/main/images/logo-navy.svg

### 4. Alternative: Use GitHub Pages (Optional)
For better performance, you can enable GitHub Pages:
1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: "main"
5. Folder: "/ (root)"
6. Save

Then update URLs to use:
```
https://alexo921.github.io/pipeline-images/images/[filename]
```

## Images Included
- `pipeline_logo.png` - Main Pipeline logo
- `pipeline_logo_p.png` - Pipeline "P" icon  
- `pipeline_logo.svg` - Vector version
- `logo-navy.svg` - Navy version
- `google-logo.svg` - Google OAuth logo
- `nurse.svg` - Nurse icon
- `Frame-1894.svg` - Alternative logo
- `Ellipse 3.png` - UI element
- `Ellipse 3_updated.png` - Updated UI element

## Benefits of GitHub Hosting
- ✅ No server costs
- ✅ Global CDN via GitHub
- ✅ Version control for images
- ✅ Easy updates and rollbacks
- ✅ Public access for email templates
- ✅ Reliable uptime 