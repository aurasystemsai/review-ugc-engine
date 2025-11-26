const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const ugcRoutes = require('./ugcRoutes');

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'review-ugc-engine', time: new Date().toISOString() });
});

app.use('/api/ugc', ugcRoutes);

app.listen(PORT, () => {
  console.log(`✅ Review UGC Engine running at http://localhost:${PORT}`);
});
