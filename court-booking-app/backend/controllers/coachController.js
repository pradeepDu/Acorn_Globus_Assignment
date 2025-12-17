const Coach = require('../models/Coach');

/**
 * @desc    Get all coaches
 * @route   GET /api/coaches
 * @access  Public
 */
exports.getCoaches = async (req, res) => {
  try {
    const { specialty, available } = req.query;
    
    const query = {};
    if (specialty) query.specialty = specialty;
    if (available === 'true') query.available = true;

    const coaches = await Coach.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: coaches.length,
      coaches
    });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Get coach by ID
 * @route   GET /api/coaches/:id
 * @access  Public
 */
exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      coach
    });
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Create new coach
 * @route   POST /api/coaches
 * @access  Private/Admin
 */
exports.createCoach = async (req, res) => {
  try {
    const coach = await Coach.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Coach created successfully',
      coach
    });
  } catch (error) {
    console.error('Create coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Update coach
 * @route   PUT /api/coaches/:id
 * @access  Private/Admin
 */
exports.updateCoach = async (req, res) => {
  try {
    const coach = await Coach.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coach updated successfully',
      coach
    });
  } catch (error) {
    console.error('Update coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Delete coach
 * @route   DELETE /api/coaches/:id
 * @access  Private/Admin
 */
exports.deleteCoach = async (req, res) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coach deleted successfully'
    });
  } catch (error) {
    console.error('Delete coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
