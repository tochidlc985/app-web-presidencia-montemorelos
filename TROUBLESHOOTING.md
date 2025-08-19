# Montemorelos Presidency App - Troubleshooting Guide

## Quick Start Guide

### 1. Initial Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# OR run the diagnostic script
node fix-app.js

# Start MongoDB (make sure it's running)
mongod --dbpath /path/to/your/db

# Start the application
npm run dev    # Frontend (Vite)
npm run server # Backend (Express)
```

### 2. Common Issues & Solutions

#### Issue: MongoDB Connection Failed
**Symptoms:**
- App shows "Error connecting to database"
- Server crashes on startup

**Solutions:**
1. **Check MongoDB service:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. **Verify connection string:**
   - Open `.env.local`
   - Ensure `MONGO_URI` is correct
   - For local MongoDB: `mongodb://localhost:27017/montemorelos`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/montemorelos`

3. **Test connection:**
   ```bash
   node check-mongo.js
   ```

#### Issue: Port Already in Use
**Symptoms:**
- Error: "Port 4000 is already in use"
- Error: "Port 5173 is already in use"

**Solutions:**
1. **Find and kill process:**
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:4000 | xargs kill -9
   ```

2. **Change ports:**
   - Backend: Edit `server.js` and change `PORT` variable
   - Frontend: Edit `vite.config.ts` and change `server.port`

#### Issue: CORS Errors
**Symptoms:**
- Frontend can't connect to backend
- Browser shows CORS policy errors

**Solutions:**
1. **Check backend URL in frontend:**
   - Ensure `vite.config.ts` has correct proxy settings
   - Default: `target: 'http://localhost:4000'`

2. **Update CORS configuration:**
   - In `server.js`, check the `cors` middleware configuration
   - Add your frontend URL to allowed origins

#### Issue: Missing Dependencies
**Symptoms:**
- Module not found errors
- Build failures

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use yarn if preferred
yarn install
```

#### Issue: Build Failures
**Symptoms:**
- `npm run build` fails
- TypeScript errors

**Solutions:**
```bash
# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint

# Build with verbose output
npm run build -- --verbose
```

### 3. Environment Variables Setup

Create `.env.local` file:
```env
# Database
MONGO_URI=mongodb://localhost:27017/montemorelos

# Security
JWT_SECRET=your-super-secret-key-change-this-in-production

# Server
NODE_ENV=development
PORT=4000

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. File Upload Issues

**Symptoms:**
- Can't upload images/videos
- Files not saving

**Solutions:**
1. **Check uploads directory:**
   ```bash
   mkdir -p uploads
   chmod 755 uploads  # Linux/Mac
   ```

2. **Check file size limits:**
   - Backend: Check `multer` configuration in `server.js`
   - Default: 20MB limit

### 5. Authentication Issues

**Symptoms:**
- Can't login/register
- JWT token errors

**Solutions:**
1. **Check JWT secret:**
   - Ensure `JWT_SECRET` is set in `.env.local`
   - Must be at least 32 characters for security

2. **Clear browser storage:**
   - Clear localStorage/sessionStorage
   - Clear cookies

### 6. Development Workflow

#### Running in Development:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev

# Terminal 3: MongoDB (if not as service)
mongod --dbpath /path/to/db
```

#### Running Tests:
```bash
# Test database connection
node check-mongo.js

# Test server endpoints
node test-server.js

# Run diagnostic
node fix-app.js
```

### 7. Production Deployment

#### Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Manual Build:
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### 8. Database Setup

#### Initial MongoDB Setup:
```javascript
// Run in MongoDB shell
use montemorelos;
db.createCollection('reportes');
db.createCollection('usuarios');

// Create indexes
db.reportes.createIndex({ email: 1 });
db.reportes.createIndex({ timestamp: -1 });
db.usuarios.createIndex({ email: 1 }, { unique: true });
```

### 9. Debugging Tips

#### Enable Debug Mode:
Add to `.env.local`:
```env
DEBUG=true
```

#### Check Logs:
- Backend logs: Check console output
- Frontend logs: Browser DevTools (F12)
- MongoDB logs: Check MongoDB log files

#### Common Debug Commands:
```bash
# Check if ports are in use
netstat -tulpn | grep :4000  # Linux
netstat -ano | findstr :4000  # Windows

# Check MongoDB status
mongo --eval "db.runCommand('ping')"

# Check file permissions
ls -la uploads/
```

### 10. Getting Help

If issues persist:
1. Run the diagnostic script: `node fix-app.js`
2. Check the GitHub issues page
3. Contact support with:
   - Error messages
   - Environment details
   - Steps to reproduce

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run server` | Start backend server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `node check-mongo.js` | Test MongoDB connection |
| `node test-server.js` | Test API endpoints |
| `node fix-app.js` | Run diagnostic and fix common issues |
