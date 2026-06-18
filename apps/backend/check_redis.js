const Redis = require('ioredis');
const redis = new Redis();

async function main() {
  const keys = await redis.keys('*dashboard*');
  console.log('Redis keys:', keys);
  if (keys.length > 0) {
    for (const key of keys) {
       const val = await redis.get(key);
       console.log(key, val);
    }
    await redis.del(...keys);
    console.log('Deleted dashboard keys');
  }
}

main().finally(() => redis.disconnect());
