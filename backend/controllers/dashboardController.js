const Decision = require('../models/Decision');

/**
 * Get aggregated dashboard metrics and chart datasets
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const decisions = await Decision.find({}).sort({ createdAt: -1 });

    const totalDecisions = decisions.length;
    let aiAccepted = 0;
    let humanOverrides = 0;
    let alternativeSelected = 0;
    let pendingDecision = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    const outcomeCounts = {
      ACCEPT_AI: 0,
      OVERRIDE_AI: 0,
      SELECT_ALTERNATIVE: 0,
      AWAITING_DECISION: 0,
    };

    const confidenceBuckets = {
      High: 0, // >= 80
      Medium: 0, // 60-79
      Low: 0, // < 60
    };

    const categoryBreakdown = {};

    decisions.forEach((d) => {
      // Category count
      const cat = d.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      // Confidence
      const conf = d.aiAnalysis?.confidence;
      if (typeof conf === 'number') {
        confidenceSum += conf;
        confidenceCount++;
        if (conf >= 80) confidenceBuckets.High++;
        else if (conf >= 60) confidenceBuckets.Medium++;
        else confidenceBuckets.Low++;
      }

      // Outcomes
      if (d.humanDecision && d.humanDecision.type) {
        if (d.humanDecision.type === 'ACCEPT_AI') {
          aiAccepted++;
          outcomeCounts.ACCEPT_AI++;
        } else if (d.humanDecision.type === 'OVERRIDE_AI') {
          humanOverrides++;
          outcomeCounts.OVERRIDE_AI++;
        } else if (d.humanDecision.type === 'SELECT_ALTERNATIVE') {
          alternativeSelected++;
          outcomeCounts.SELECT_ALTERNATIVE++;
        }
      } else {
        pendingDecision++;
        outcomeCounts.AWAITING_DECISION++;
      }
    });

    const averageConfidence = confidenceCount > 0 ? Math.round((confidenceSum / confidenceCount) * 10) / 10 : 85;
    const finalizedCount = aiAccepted + humanOverrides + alternativeSelected;
    const humanOverridePercent = finalizedCount > 0 ? Math.round((humanOverrides / finalizedCount) * 100) : 0;
    const aiAcceptancePercent = finalizedCount > 0 ? Math.round((aiAccepted / finalizedCount) * 100) : 0;

    const recentDecisions = decisions.slice(0, 5).map(d => ({
      _id: d._id,
      title: d.title,
      category: d.category,
      aiRecommendation: d.aiAnalysis?.recommendation?.option || 'N/A',
      confidence: d.aiAnalysis?.confidence || 0,
      humanDecision: d.humanDecision?.option || 'Pending Review',
      decisionType: d.humanDecision?.type || 'AWAITING_REVIEW',
      status: d.status,
      createdAt: d.createdAt,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalDecisions,
          aiAccepted,
          humanOverrides,
          alternativeSelected,
          pendingDecision,
          averageConfidence,
          humanOverridePercent,
          aiAcceptancePercent,
        },
        charts: {
          outcomes: outcomeCounts,
          confidenceDistribution: confidenceBuckets,
          categories: categoryBreakdown,
        },
        recentDecisions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
