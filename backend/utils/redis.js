import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

export async function getRedisClient() {

  if(!redisClient) {
    // Support both socket-based (Redis Cloud) and URL-based (local) connections
    let clientConfig;
    
    if(process.env.REDIS_USERNAME && process.env.REDIS_PASSWORD && process.env.REDIS_HOST && process.env.REDIS_PORT) {
      // Socket-based connection (Redis Cloud)
      clientConfig = {
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      };
    } else {
      // URL-based connection (local Redis or URL format)
      clientConfig = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      };
    }

    redisClient = createClient(clientConfig);

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));

    await redisClient.connect();
  }
  return redisClient;
}

export async function enqueueIngestionTask(tenantId, dataType, data) {
  try {
    const client = await getRedisClient();
    const task = {
      tenantId,
      dataType,
      data,
      timestamp: new Date().toISOString(),
    };

    await client.lPush('ingestion:queue', JSON.stringify(task));

    return true;

  } catch (error) {
    console.error('Error enqueueing ingestion task:', error);
    return false;
  }
}

export async function processIngestionQueue() {
  try {
    const client = await getRedisClient();
    const taskJson = await client.rPop('ingestion:queue');
    
    if(!taskJson) {
      return null;
    }

    return JSON.parse(taskJson);
    
  } catch (error) {
    console.error('Error processing ingestion queue:', error);
    return null;
  }
}

