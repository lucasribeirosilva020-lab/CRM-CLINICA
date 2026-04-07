const fs = require('fs');
const log = fs.readFileSync('/tmp/webhook_monitor.log', 'utf8');
const lines = log.split('\n').filter(l => l.includes('RAW:'));
lines.slice(-20).forEach(l => {
  console.log('---');
  console.log(l);
});
