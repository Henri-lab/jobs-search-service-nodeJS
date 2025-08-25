import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 自动加载环境配置文件
const loadEnvConfig = () => {
  const nodeEnv = process.env['NODE_ENV'] || 'development';
  
  // 优先级: .env.local > .env.[NODE_ENV] > .env
  const envFiles = [
    `.env.${nodeEnv}.local`,
    `.env.local`,
    `.env.${nodeEnv}`,
    '.env'
  ];
  
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment config from: ${envFile}`);
      dotenv.config({ path: envPath });
      break;
    }
  }
};

loadEnvConfig();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env['MONGODB_URI'];
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;