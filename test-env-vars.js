import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGO_URI from process.env:', process.env.MONGO_URI);

import { db } from './src/utils/database.js';

console.log('MONGO_URI from database service:', db.MONGO_URI);