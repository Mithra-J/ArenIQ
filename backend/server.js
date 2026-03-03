// backend/server.js  (optional — you can skip Express if you use Supabase client directly from React)
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://your-project-ref.supabase.co',
  'your-anon-or-service-key'
);

const app = express();
app.use(cors());
app.use(express.json());

// Get all reports (for dashboard)
app.get('/reports', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Optional: POST /report (but citizen app will do this directly)
app.post('/report', async (req, res) => {
  const { type, description, latitude, longitude, image_url } = req.body;
  const { error } = await supabase
    .from('reports')
    .insert({ type, description, latitude, longitude, image_url, source: 'satellite' });

  if (error) return res.status(500).json({ error });
  res.json({ message: 'Report created' });
});

app.listen(5000, () => console.log('Server on 5000'));