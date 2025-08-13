import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in environment variables');
      return;
    }
    
    // Try to connect to the database directly
    console.log('Attempting to connect to MongoDB...');
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('Database connection successful!');
    
    // Try to list databases
    const db = client.db('Montemorelos');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Close the connection
    await client.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();