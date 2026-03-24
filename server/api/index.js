const { GoogleGenerativeAI } = require('@google/generative-ai');

app.get('/api/debug-models', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const result = await genAI.listModels();
    res.json({ models: result.models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/env-check', (req, res) => {
  const keys = Object.keys(process.env).filter(key => 
    key.startsWith('MONGO') || 
    key.startsWith('GEMINI') || 
    key.startsWith('FIREBASE') || 
    key.startsWith('JWT')
  );
  res.json({ keys });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
