const axios = require('axios');

const parseFood = async (text) => {
  const prompt = `You are a precise nutrition expert specializing in Indian and international cuisine. Analyze this meal description and estimate nutritional content.

Meal: "${text}"

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "calories": <total as integer>,
  "protein": <grams as integer>,
  "carbs": <grams as integer>,
  "fats": <grams as integer>,
  "items": [
    { "name": "<food name>", "calories": <integer>, "protein": <integer>, "carbs": <integer>, "fats": <integer> }
  ]
}

Reference values for common Indian foods:
- 1 roti/chapati (medium): 120 kcal, 3g protein, 18g carbs, 4g fat
- 1 cup cooked dal: 180 kcal, 12g protein, 28g carbs, 3g fat
- 1 cup cooked rice: 200 kcal, 4g protein, 45g carbs, 0.5g fat
- 1 samosa (medium): 150 kcal, 3g protein, 18g carbs, 8g fat
- 1 cup chai (with milk+sugar): 60 kcal, 2g protein, 9g carbs, 2g fat
- 1 cup rajma: 220 kcal, 13g protein, 35g carbs, 3g fat
- 1 paratha (plain): 200 kcal, 4g protein, 26g carbs, 9g fat
- 1 banana: 90 kcal, 1g protein, 23g carbs, 0.3g fat
- 1 cup paneer (200g): 340 kcal, 24g protein, 6g carbs, 26g fat
- 1 chicken breast (150g, grilled): 232 kcal, 43g protein, 0g carbs, 5g fat
- 1 egg: 78 kcal, 6g protein, 0.6g carbs, 5g fat`;

  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-pro'
  ];

  let lastError;
  let parsedResult;

  for (const model of models) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            response_mime_type: "application/json",
          },
        }
      );
      
      const rawText = response.data.candidates[0]?.content?.parts[0]?.text;
      if (!rawText) continue;

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      
      parsedResult = JSON.parse(jsonMatch[0]);
      if (parsedResult) break; // Success!
    } catch (err) {
      lastError = err.response?.data || err.message;
      console.error(`Gemini model ${model} failed:`, lastError);
    }
  }

  if (!parsedResult) {
    throw new Error(`All Gemini models failed. Last error: ${JSON.stringify(lastError)}`);
  }

  // Validate and sanitize
  return {
    calories: Math.round(parsedResult.calories || 0),
    protein: Math.round(parsedResult.protein || 0),
    carbs: Math.round(parsedResult.carbs || 0),
    fats: Math.round(parsedResult.fats || 0),
    items: (parsedResult.items || []).map(item => ({
      name: item.name || 'Unknown',
      calories: Math.round(item.calories || 0),
      protein: Math.round(item.protein || 0),
      carbs: Math.round(item.carbs || 0),
      fats: Math.round(item.fats || 0),
    })),
  };
};

module.exports = { parseFood };
