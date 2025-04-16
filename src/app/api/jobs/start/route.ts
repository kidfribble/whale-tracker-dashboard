import cron from 'node-cron';
import { exec } from 'child_process';

cron.schedule('0 * * * *', () => {
  console.log('⏰ Running whale pool indexer...');

  exec('node scripts/index-whale-pools.ts', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Cron job failed:', stderr);
    } else {
      console.log('✅ Cron job complete:', stdout);
    }
  });
});

// This route exists only to trigger the cron system in dev
export async function GET() {
  return new Response('Cron job initialized');
}