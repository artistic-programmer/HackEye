import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { Incident } from '../models/Incident';
import { incidentService } from '../services/incident.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackeye';

async function runIncidentGroupingTests() {
  console.log('=== STARTING INCIDENT GROUPING & CORROBORATION TESTS ===\n');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    // 1. Setup 3 distinct test users (Citizens A, B, C)
    let citizenA = await User.findOne({ email: 'citizen_a@dailybugle.internal' });
    if (!citizenA) {
      citizenA = await User.create({
        name: 'Alice Walker',
        email: 'citizen_a@dailybugle.internal',
        googleId: 'google-alice-12345',
        role: 'USER',
        reputation: 20,
      });
    }

    let citizenB = await User.findOne({ email: 'citizen_b@dailybugle.internal' });
    if (!citizenB) {
      citizenB = await User.create({
        name: 'Bob Martinez',
        email: 'citizen_b@dailybugle.internal',
        googleId: 'google-bob-12345',
        role: 'USER',
        reputation: 25,
      });
    }

    let citizenC = await User.findOne({ email: 'citizen_c@dailybugle.internal' });
    if (!citizenC) {
      citizenC = await User.create({
        name: 'Charlie Davis',
        email: 'citizen_c@dailybugle.internal',
        googleId: 'google-charlie-12345',
        role: 'USER',
        reputation: 30,
      });
    }

    console.log('✓ Test citizens initialized: Alice, Bob, Charlie.');

    // 2. Report 1 by Alice: "Heavy smoke and fire near Patia square"
    const report1 = await Report.create({
      title: 'Heavy smoke and fire near Patia square',
      description: 'Massive black smoke and fire visible behind the commercial complex near Patia square.',
      category: 'Safety',
      location: {
        address: 'Patia Square, Bhubaneswar',
        latitude: 20.3551,
        longitude: 85.8188,
      },
      reporter: citizenA._id,
      status: 'UNDER_REVIEW',
    });

    const res1 = await incidentService.processReportForIncident(report1);
    console.log(`\n✓ Report 1 processed: Created new Incident #${res1.incident._id} (isNew: ${res1.isNewIncident})`);
    console.log(`   - Reports count: ${res1.incident.reports.length}`);
    console.log(`   - Independent reporters: ${res1.incident.independentReportersCount}`);

    if (!res1.isNewIncident || res1.incident.reports.length !== 1) {
      throw new Error('FAIL: First report should create a new Incident with 1 report');
    }

    // 3. Report 2 by Bob (different user, nearby, same incident): "Fire trucks rushing to Patia square fire"
    const report2 = await Report.create({
      title: 'Fire trucks rushing to Patia square fire',
      description: 'Two fire trucks just arrived at Patia square dealing with the smoke and fire.',
      category: 'Safety',
      location: {
        address: 'KIIT Road, 200m from Patia square, Bhubaneswar',
        latitude: 20.3562, // ~130 meters away
        longitude: 85.8192,
      },
      reporter: citizenB._id,
      status: 'UNDER_REVIEW',
    });

    const res2 = await incidentService.processReportForIncident(report2);
    console.log(`\n✓ Report 2 by Bob processed: Grouped into Incident #${res2.incident._id} (isNew: ${res2.isNewIncident})`);
    console.log(`   - Reports count: ${res2.incident.reports.length}`);
    console.log(`   - Independent reporters count: ${res2.incident.independentReportersCount}`);

    if (res2.isNewIncident) {
      throw new Error('FAIL: Report 2 should have been grouped into existing Incident 1');
    }
    if (res2.incident.independentReportersCount !== 2) {
      throw new Error(`FAIL: Expected 2 independent reporters, got ${res2.incident.independentReportersCount}`);
    }

    // 4. Report 3 by Bob AGAIN (Anti-abuse test: same user submitting another report about same incident)
    const report3 = await Report.create({
      title: 'Smoke is clearing slightly near Patia square',
      description: 'Firefighters are actively spraying water on the Patia square fire.',
      category: 'Safety',
      location: {
        address: 'Patia square east side',
        latitude: 20.3555,
        longitude: 85.8190,
      },
      reporter: citizenB._id, // Same reporter as Report 2
      status: 'UNDER_REVIEW',
    });

    const res3 = await incidentService.processReportForIncident(report3);
    console.log(`\n✓ Report 3 (same user Bob) processed:`);
    console.log(`   - Reports count: ${res3.incident.reports.length}`);
    console.log(`   - Independent reporters count: ${res3.incident.independentReportersCount}`);

    if (res3.incident.reports.length !== 3) {
      throw new Error('FAIL: Report 3 should be in reports list');
    }
    if (res3.incident.independentReportersCount !== 2) {
      throw new Error('FAIL: Duplicate reporter should NOT increase independentReportersCount');
    }
    console.log('✓ PASS: Anti-abuse verified — duplicate submission by same user did NOT inflate independent count.');

    // 5. Report 4: Unrelated report at same location (100m away, but category "Traffic" and completely unrelated text)
    const report4 = await Report.create({
      title: 'Traffic signal broken and malfunctioning',
      description: 'The traffic light is completely dead causing long car queues at the intersection.',
      category: 'Traffic',
      location: {
        address: 'Patia square intersection',
        latitude: 20.3552, // 50m away from fire
        longitude: 85.8189,
      },
      reporter: citizenC._id,
      status: 'UNDER_REVIEW',
    });

    const res4 = await incidentService.processReportForIncident(report4);
    console.log(`\n✓ Report 4 (Traffic light at same location) processed:`);
    console.log(`   - Created new Incident #${res4.incident._id} (isNew: ${res4.isNewIncident})`);

    if (!res4.isNewIncident || res4.incident._id.toString() === res1.incident._id.toString()) {
      throw new Error('FAIL: Unrelated report at same location should NOT merge into fire incident!');
    }
    console.log('✓ PASS: Non-merging of unrelated nearby incidents verified.');

    // 6. Report 5: Contradicting report ("No fire or smoke here, false alarm")
    const report5 = await Report.create({
      title: 'False alarm - completely clear at Patia square',
      description: 'I am standing at Patia square right now. There is no fire and no smoke, road is completely clear.',
      category: 'Safety',
      location: {
        address: 'Patia Square',
        latitude: 20.3551,
        longitude: 85.8188,
      },
      reporter: citizenC._id,
      status: 'UNDER_REVIEW',
    });

    const res5 = await incidentService.processReportForIncident(report5);
    console.log(`\n✓ Report 5 (Denial/Contradiction) processed:`);
    console.log(`   - Associated with Incident #${res5.incident._id}`);
    console.log(`   - Contradicting reports count: ${res5.incident.contradictingReports.length}`);

    if (res5.incident.contradictingReports.length === 0) {
      throw new Error('FAIL: Contradicting report was not flagged in incident.contradictingReports!');
    }
    console.log('✓ PASS: Contradiction detection verified without automatically rejecting any report.');

    console.log('\n=== ALL INCIDENT GROUPING & CORROBORATION TESTS PASSED ===');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runIncidentGroupingTests().catch((err) => {
  console.error('Incident grouping test failed:', err);
  process.exit(1);
});
