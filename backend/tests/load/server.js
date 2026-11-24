// Child process for the load test: the API alone, so the load generator does not
// share its event loop. Started by tests/load/run.js.
import mongoose from 'mongoose';
import { createApp } from '../../app.js';

await mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 50 });
const server = createApp().listen(Number(process.env.PORT) || 0, '127.0.0.1', () => {
  process.stdout.write(`READY ${server.address().port}\n`);
});
