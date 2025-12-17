const PricingRule = require('../models/PricingRule');

/**
 * @desc    Get all pricing rules
 * @route   GET /api/pricing-rules
 * @access  Public
 */
exports.getPricingRules = async (req, res) => {
  try {
    const { active } = req.query;
    
    const query = {};
    if (active === 'true') query.isActive = true;

    const rules = await PricingRule.find(query).sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('Get pricing rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Get pricing rule by ID
 * @route   GET /api/pricing-rules/:id
 * @access  Public
 */
exports.getPricingRuleById = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    res.status(200).json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Get pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Create new pricing rule
 * @route   POST /api/pricing-rules
 * @access  Private/Admin
 */
exports.createPricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Pricing rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Create pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Update pricing rule
 * @route   PUT /api/pricing-rules/:id
 * @access  Private/Admin
 */
exports.updatePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule updated successfully',
      rule
    });
  } catch (error) {
    console.error('Update pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Delete pricing rule
 * @route   DELETE /api/pricing-rules/:id
 * @access  Private/Admin
 */
exports.deletePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Toggle pricing rule active status
 * @route   PUT /api/pricing-rules/:id/toggle
 * @access  Private/Admin
 */
exports.togglePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.status(200).json({
      success: true,
      message: `Pricing rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
      rule
    });
  } catch (error) {
    console.error('Toggle pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
