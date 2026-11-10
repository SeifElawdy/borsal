// scripts/test-transaction.js
// Tests Mongoose transaction commit and rollback behavior

const mongoose = require('mongoose');
const connectDB = require('../src/db/connect');
const FabricPiece = require('../src/models/FabricPiece');

async function runTransactionTests() {
  let hasFailed = false;

  // Connect to the database
  await connectDB();

  const session = await mongoose.startSession();
  const timestamp = Date.now();
  const testNameA1 = `__tx_test_${timestamp}_A1`;
  const testNameA2 = `__tx_test_${timestamp}_A2`;
  const testNameB = `__tx_test_${timestamp}_B`;

  try {
    // --- Test A: Both inserts succeed and commit ---
    await session.withTransaction(async () => {
      const piece1 = new FabricPiece({
        name: testNameA1,
        fabricType: 'Cotton',
        massGrams: 150,
      });
      await piece1.save({ session });

      const piece2 = new FabricPiece({
        name: testNameA2,
        fabricType: 'Linen',
        massGrams: 200,
      });
      await piece2.save({ session });
    });

    const docA1 = await FabricPiece.findOne({ name: testNameA1 });
    const docA2 = await FabricPiece.findOne({ name: testNameA2 });

    if (docA1 && docA2) {
      console.log('Transaction commit OK');
    } else {
      console.error('Test A failed: One or both documents were not committed.');
      hasFailed = true;
    }

    // --- Test B: Insert one document, throw error, verify rollback ---
    try {
      await session.withTransaction(async () => {
        const pieceB = new FabricPiece({
          name: testNameB,
          fabricType: 'Wool',
          massGrams: 300,
        });
        await pieceB.save({ session });

        // Intentional error to force rollback
        throw new Error('Simulated failure for transaction rollback test');
      });
    } catch {
      // Expected to catch the simulated error thrown from withTransaction
    }

    const docB = await FabricPiece.findOne({ name: testNameB });
    if (!docB) {
      console.log('Transaction rollback OK');
    } else {
      console.error('Test B failed: Document was saved despite transaction rollback.');
      hasFailed = true;
    }
  } catch (err) {
    console.error('Transaction test error:', err.message);
    hasFailed = true;
  } finally {
    // Clean up test documents
    try {
      await FabricPiece.deleteMany({
        name: { $in: [testNameA1, testNameA2, testNameB] },
      });
    } catch (cleanupErr) {
      console.error('Cleanup warning:', cleanupErr.message);
    }

    await session.endSession();
    await mongoose.disconnect();
  }

  if (hasFailed) {
    process.exit(1);
  }
}

runTransactionTests();

