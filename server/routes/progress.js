const express = require('express');
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const FoodLog = require('../models/FoodLog');
const BodyWeight = require('../models/BodyWeight');

const router = express.Router();

// GET /api/progress?days=30
router.get('/', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.userId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString().split('T')[0];

    const [workouts, foodLogs, bodyWeights, allWorkouts] = await Promise.all([
      Workout.find({ userId, date: { $gte: startDateStr } }).sort({ date: 1 }),
      FoodLog.find({ userId, date: { $gte: startDateStr } }).sort({ date: 1 }),
      BodyWeight.find({ userId, date: { $gte: startDateStr } }).sort({ date: 1 }),
      Workout.find({ userId }).sort({ date: 1 }),
    ]);

    // Build PR history per exercise (from all workouts)
    const prHistory = {};
    allWorkouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          if (!prHistory[ex.name]) prHistory[ex.name] = [];
          const last = prHistory[ex.name][prHistory[ex.name].length - 1];
          if (!last || maxWeight > last.weight) {
            prHistory[ex.name].push({ date: workout.date, weight: maxWeight });
          }
        }
      });
    });

    // Volume + calories burned per workout
    const volumeHistory = workouts.map(workout => ({
      date: workout.date,
      volume: workout.exercises.reduce((total, ex) =>
        total + ex.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0),
      caloriesBurned: workout.caloriesBurned || 0,
      duration: workout.duration || 0,
    }));

    // Daily calorie & macro history
    const calorieHistory = foodLogs.map(log => ({
      date: log.date,
      calories: log.entries.reduce((s, e) => s + (e.calories || 0), 0),
      protein: log.entries.reduce((s, e) => s + (e.protein || 0), 0),
      carbs: log.entries.reduce((s, e) => s + (e.carbs || 0), 0),
      fats: log.entries.reduce((s, e) => s + (e.fats || 0), 0),
    }));

    res.json({ prHistory, volumeHistory, calorieHistory, bodyWeights });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/progress/weight — log body weight
router.post('/weight', auth, async (req, res) => {
  try {
    const { date, weight } = req.body;
    if (!date || !weight) return res.status(400).json({ message: 'date and weight required' });

    let entry = await BodyWeight.findOne({ userId: req.user.userId, date });
    if (entry) {
      entry.weight = weight;
      await entry.save();
    } else {
      entry = await BodyWeight.create({ userId: req.user.userId, date, weight });
    }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/progress/exercises — list of all exercise names the user has logged
router.get('/exercises', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user.userId });
    const names = new Set();
    workouts.forEach(w => w.exercises.forEach(ex => names.add(ex.name)));
    res.json([...names].sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
