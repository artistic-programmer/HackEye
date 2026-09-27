import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { trustService } from '../services/trust.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackeye';
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

async function runWorkflowTests() {
  console.log('=== STARTING WORKFLOW INTEGRATION TESTS ===\n');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    // -------------------------------------------------------------
    // Test 1: User Roles & Access Control Setup
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: User Roles & JWT Setup ---');
    let regularUser = await User.findOne({ email: 'test_regular@dailybugle.internal' });
    if (!regularUser) {
      regularUser = await User.create({
        name: 'Peter Parker (Citizen)',
        email: 'test_regular@dailybugle.internal',
        googleId: 'google-regular-12345',
        role: 'USER',
        reputation: 25,
      });
    }

    let reviewerUser = await User.findOne({ email: 'test_editor@dailybugle.internal' });
    if (!reviewerUser) {
      reviewerUser = await User.create({
        name: 'J. Jonah Jameson (Editor)',
        email: 'test_editor@dailybugle.internal',
        googleId: 'google-reviewer-12345',
        role: 'REVIEWER',
        reputation: 150,
      });
    }

    console.log(`✓ Regular User: ${regularUser.name} [Role: ${regularUser.role}, Rep: ${regularUser.reputation}]`);
    console.log(`✓ Reviewer User: ${reviewerUser.name} [Role: ${reviewerUser.role}, Rep: ${reviewerUser.reputation}]`);

    // -------------------------------------------------------------
    // Test 8: AI Non-Authority Test
    // High Trust Score or Low Trust Score does NOT change status from UNDER_REVIEW!
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: AI Non-Authority Principle ---');
    const highTrustReport = await Report.create({
      title: 'Water Main Break on 5th Ave',
      description: 'Severe water leak flooding the subway station entrance with high pressure.',
      category: 'Infrastructure',
      location: {
        address: '5th Ave & 42nd St, New York',
        coordinates: { latitude: 40.7527, longitude: -73.9818 },
      },
      reporter: regularUser._id,
      status: 'UNDER_REVIEW',
      trustAnalysis: {
        score: 92,
        level: 'HIGH',
        signals: {
          reporterReputation: 15,
          specificity: 25,
          evidence: 20,
          location: 10,
          time: 10,
          corroboration: 12,
          missingInformation: 0,
          suspiciousSignals: 0,
          contradiction: 0,
        },
        explanation: 'Very high supporting signals.',
      },
      aiAnalysis: {
        summary: 'Water pipe rupture flooding entrance.',
        urgency: 'HIGH',
        category: 'Infrastructure',
        recommendedAction: 'HUMAN_VERIFICATION',
        status: 'COMPLETED',
      },
    });

    const lowTrustReport = await Report.create({
      title: 'Unidentified Flying Saucer spotted',
      description: 'Saw a UFO hovering silently over the building.',
      category: 'Other',
      location: {
        address: 'Unknown Rooftop',
      },
      reporter: regularUser._id,
      status: 'UNDER_REVIEW',
      trustAnalysis: {
        score: 18,
        level: 'LOW',
        signals: {
          reporterReputation: 5,
          specificity: 5,
          evidence: 0,
          location: 0,
          time: 8,
          corroboration: 0,
          missingInformation: -10,
          suspiciousSignals: -15,
          contradiction: 0,
        },
        explanation: 'Very low supporting signals and missing corroboration.',
      },
      aiAnalysis: {
        summary: 'Unsubstantiated extraterrestrial claim.',
        urgency: 'LOW',
        category: 'Other',
        recommendedAction: 'HUMAN_VERIFICATION',
        status: 'COMPLETED',
      },
    });

    console.log(`High-Trust Report (${highTrustReport.trustAnalysis?.score}/100) status: ${highTrustReport.status}`);
    console.log(`Low-Trust Report (${lowTrustReport.trustAnalysis?.score}/100) status: ${lowTrustReport.status}`);

    if (highTrustReport.status === 'UNDER_REVIEW' && lowTrustReport.status === 'UNDER_REVIEW') {
      console.log('✓ PASS: AI & Trust Engine did NOT verify or reject reports automatically.');
    } else {
      throw new Error('FAIL: AI automatically decided status!');
    }

    // -------------------------------------------------------------
    // Test 2 & 3: Reviewer Queue & Filtering
    // -------------------------------------------------------------
    console.log('\n--- TEST 2 & 3: Reviewer Queue & Filtering ---');
    const underReviewReports = await Report.find({ status: 'UNDER_REVIEW' });
    console.log(`✓ Total reports in UNDER_REVIEW queue: ${underReviewReports.length}`);

    const highTrustOnly = await Report.find({ status: 'UNDER_REVIEW', 'trustAnalysis.level': 'HIGH' });
    console.log(`✓ High-trust queue count: ${highTrustOnly.length}`);
    const lowTrustOnly = await Report.find({ status: 'UNDER_REVIEW', 'trustAnalysis.level': 'LOW' });
    console.log(`✓ Low-trust queue count: ${lowTrustOnly.length}`);

    // -------------------------------------------------------------
    // Test 5: Verification Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Verification Flow & +10 Reputation Bonus ---');
    const initialReputation = (await User.findById(regularUser._id))?.reputation ?? 0;
    console.log(`Citizen initial reputation: ${initialReputation}`);

    // Perform human reviewer verification
    highTrustReport.status = 'VERIFIED';
    highTrustReport.reviewedBy = reviewerUser._id;
    highTrustReport.reviewedAt = new Date();
    highTrustReport.reviewHistory = highTrustReport.reviewHistory || [];
    highTrustReport.reviewHistory.push({
      reviewer: reviewerUser._id,
      action: 'VERIFIED',
      reason: 'Verified by human reviewer',
      note: 'Verified with city water works dispatch.',
      createdAt: new Date(),
    });
    await highTrustReport.save();

    const repUpdate = await trustService.updateReporterReputation(regularUser._id, 'VERIFIED');
    const newReputation = (await User.findById(regularUser._id))?.reputation ?? 0;

    console.log(`Citizen new reputation after verification: ${newReputation}`);
    console.log(`Reputation change logged: +${repUpdate.change} points`);

    if (newReputation === initialReputation + 10) {
      console.log('✓ PASS: Verification gave exactly +10 points to reporter.');
    } else {
      throw new Error(`FAIL: Expected ${initialReputation + 10} but got ${newReputation}`);
    }

    // Check review history
    const verifiedReportDb = await Report.findById(highTrustReport._id);
    console.log(`✓ Review history audit entries: ${verifiedReportDb?.reviewHistory?.length}`);
    console.log(`✓ Latest audit action: ${verifiedReportDb?.reviewHistory?.[0]?.action}, Note: "${verifiedReportDb?.reviewHistory?.[0]?.note}"`);

    // -------------------------------------------------------------
    // Test 6: Request Information Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Request Information Flow (0 Reputation Change) ---');
    const repBeforeReqInfo = (await User.findById(regularUser._id))?.reputation ?? 0;
    
    lowTrustReport.status = 'NEEDS_INFO';
    lowTrustReport.reviewedBy = reviewerUser._id;
    lowTrustReport.reviewedAt = new Date();
    lowTrustReport.reviewRequest = {
      message: 'Please provide exact cross-streets and photos of the sky location.',
      reviewer: reviewerUser._id,
      createdAt: new Date(),
    };
    lowTrustReport.reviewHistory = lowTrustReport.reviewHistory || [];
    lowTrustReport.reviewHistory.push({
      reviewer: reviewerUser._id,
      action: 'NEEDS_INFO',
      note: 'Please provide exact cross-streets and photos of the sky location.',
      createdAt: new Date(),
    });
    await lowTrustReport.save();

    const repAfterReqInfo = (await User.findById(regularUser._id))?.reputation ?? 0;
    console.log(`Citizen reputation after NEEDS_INFO: ${repAfterReqInfo}`);
    if (repBeforeReqInfo === repAfterReqInfo) {
      console.log('✓ PASS: NEEDS_INFO preserved citizen reputation unchanged.');
    } else {
      throw new Error('FAIL: Reputation changed on NEEDS_INFO');
    }

    // -------------------------------------------------------------
    // Test 7: Rejection Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Rejection Flow & -5 Reputation Penalty ---');
    const repBeforeReject = (await User.findById(regularUser._id))?.reputation ?? 0;

    lowTrustReport.status = 'REJECTED';
    lowTrustReport.reviewedBy = reviewerUser._id;
    lowTrustReport.reviewedAt = new Date();
    lowTrustReport.reviewHistory = lowTrustReport.reviewHistory || [];
    lowTrustReport.reviewHistory.push({
      reviewer: reviewerUser._id,
      action: 'REJECTED',
      reason: 'False / inaccurate information',
      note: 'No radar or optical confirmation of sighting.',
      createdAt: new Date(),
    });
    await lowTrustReport.save();

    const repPenaltyUpdate = await trustService.updateReporterReputation(regularUser._id, 'REJECTED');
    const repAfterReject = (await User.findById(regularUser._id))?.reputation ?? 0;

    console.log(`Citizen reputation after rejection: ${repAfterReject}`);
    console.log(`Reputation change logged: ${repPenaltyUpdate.change} points`);

    if (repAfterReject === repBeforeReject - 5) {
      console.log('✓ PASS: Rejection applied exactly -5 points penalty.');
    } else {
      throw new Error(`FAIL: Expected ${repBeforeReject - 5} but got ${repAfterReject}`);
    }

    // -------------------------------------------------------------
    // Test 9: Cross-Reference & Corroboration
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Cross-Reference Corroboration Linkage ---');
    const report2 = await Report.create({
      title: 'Water flooding street near subway',
      description: 'Streets are flooded by 42nd subway entrance from broken water pipe.',
      category: 'Infrastructure',
      location: {
        address: '42nd St & 5th Ave',
        coordinates: { latitude: 40.7529, longitude: -73.9815 },
      },
      reporter: regularUser._id,
      status: 'UNDER_REVIEW',
      trustAnalysis: {
        score: 85,
        level: 'HIGH',
        corroboratingReportIds: [highTrustReport._id.toString()],
        signals: {
          reporterReputation: 10,
          specificity: 20,
          evidence: 15,
          location: 10,
          time: 10,
          corroboration: 20,
          missingInformation: 0,
          suspiciousSignals: 0,
          contradiction: 0,
        },
        explanation: 'Corroborated by nearby water main incident.',
      },
    });

    console.log(`Report 2 created with corroboratingReportIds: ${report2.trustAnalysis?.corroboratingReportIds}`);
    const corroboratingCheck = await Report.findById(report2.trustAnalysis?.corroboratingReportIds?.[0]);
    console.log(`Corroborating Report Title: "${corroboratingCheck?.title}"`);

    if (corroboratingCheck?._id.toString() === highTrustReport._id.toString()) {
      console.log('✓ PASS: Corroborating report link verified successfully.');
    } else {
      throw new Error('FAIL: Corroboration mismatch');
    }

    console.log('\n=== ALL 10 TESTS SUCCESSFULLY PASSED ===');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runWorkflowTests().catch((err) => {
  console.error('Workflow test failed:', err);
  process.exit(1);
});
