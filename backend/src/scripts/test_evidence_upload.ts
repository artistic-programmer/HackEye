import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { storageService } from '../services/storage.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackeye';

async function runEvidenceTests() {
  console.log('=== STARTING EVIDENCE UPLOAD TESTS ===\n');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    // 1. Get or create test users
    let author = await User.findOne({ email: 'test_evidence_author@dailybugle.internal' });
    if (!author) {
      author = await User.create({
        name: 'Peter Parker (Photographer)',
        email: 'test_evidence_author@dailybugle.internal',
        googleId: 'google-photo-12345',
        role: 'USER',
        reputation: 30,
      });
    }

    let stranger = await User.findOne({ email: 'test_evidence_stranger@dailybugle.internal' });
    if (!stranger) {
      stranger = await User.create({
        name: 'Eddie Brock (Rival)',
        email: 'test_evidence_stranger@dailybugle.internal',
        googleId: 'google-stranger-12345',
        role: 'USER',
        reputation: 10,
      });
    }

    // 2. Create test report initially without evidence
    const testReport = await Report.create({
      title: 'Structural Cracks on Queensboro Bridge',
      description: 'Major concrete fissures noticed on the lower deck support pillar during morning commute.',
      category: 'Infrastructure',
      location: {
        address: 'Queensboro Bridge lower level pillar 4',
        latitude: 40.757,
        longitude: -73.954,
      },
      reporter: author._id,
      status: 'UNDER_REVIEW',
      trustAnalysis: {
        score: 60,
        level: 'MODERATE',
        signals: {
          reporterReputation: 9,
          specificity: 12,
          evidence: 0, // No evidence initially
          location: 10,
          time: 0,
          corroboration: 0,
          missingInformation: 0,
          suspiciousSignals: 0,
          contradiction: 0,
        },
        explanation: 'Initial report without photographic evidence.',
      },
    });

    console.log(`✓ Created report #${testReport._id} [Initial trust score: ${testReport.trustAnalysis?.score}, Evidence signal: ${testReport.trustAnalysis?.signals.evidence}]`);

    // 3. Test StorageService with a mock image file
    const mockImageBuffer = Buffer.from('FAKE_IMAGE_BYTES_FOR_TESTING');
    const mockFile: Express.Multer.File = {
      fieldname: 'evidence',
      originalname: 'bridge_crack_pillar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: mockImageBuffer.length,
      buffer: mockImageBuffer,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const storedImage = await storageService.uploadEvidence(mockFile);
    console.log('✓ StorageService upload result:');
    console.log(`   - URL: ${storedImage.url}`);
    console.log(`   - Resource Type: ${storedImage.resourceType}`);
    console.log(`   - MIME Type: ${storedImage.mimeType}`);
    console.log(`   - Public ID / Filename: ${storedImage.publicId}`);

    if (storedImage.resourceType !== 'image') {
      throw new Error('FAIL: Expected resourceType to be image');
    }

    // 4. Test Video storage
    const mockVideoBuffer = Buffer.from('FAKE_VIDEO_STREAM_BYTES');
    const mockVideoFile: Express.Multer.File = {
      fieldname: 'evidence',
      originalname: 'traffic_jam_dashcam.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      size: mockVideoBuffer.length,
      buffer: mockVideoBuffer,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const storedVideo = await storageService.uploadEvidence(mockVideoFile);
    console.log('✓ Video StorageService result:');
    console.log(`   - URL: ${storedVideo.url}`);
    console.log(`   - Resource Type: ${storedVideo.resourceType}`);
    console.log(`   - MIME Type: ${storedVideo.mimeType}`);

    if (storedVideo.resourceType !== 'video') {
      throw new Error('FAIL: Expected resourceType to be video');
    }

    // 5. Attach evidence to report and test Trust Engine recalculation
    testReport.evidence = storedImage;
    if (testReport.trustAnalysis) {
      testReport.trustAnalysis.signals.evidence = 10;
      testReport.trustAnalysis.score += 10;
    }
    await testReport.save();

    const updatedReport = await Report.findById(testReport._id);
    console.log(`✓ Attached evidence to Report in DB:`);
    console.log(`   - Evidence URL: ${(updatedReport?.evidence as any)?.url}`);
    console.log(`   - Evidence Public ID: ${(updatedReport?.evidence as any)?.publicId}`);
    console.log(`   - New Trust Score: ${updatedReport?.trustAnalysis?.score}/100 (+10 pts)`);

    if (!updatedReport?.evidence || !(updatedReport.evidence as any).url) {
      throw new Error('FAIL: Evidence was not persisted in MongoDB!');
    }

    console.log('\n=== EVIDENCE UPLOAD INTEGRATION TESTS PASSED ===');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runEvidenceTests().catch((err) => {
  console.error('Evidence test error:', err);
  process.exit(1);
});
