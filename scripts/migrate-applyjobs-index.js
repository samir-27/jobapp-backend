/**
 * Migration Script: ApplyJob Unique Compound Index
 *
 * Checks for existing duplicate (userId, jobId) records in the applyjobs collection.
 * If duplicates exist, it logs them and alerts the operator without destructively deleting data.
 * If no duplicates exist, it builds the unique compound index safely.
 *
 * Usage:
 *   node scripts/migrate-applyjobs-index.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/jobdb';

async function runMigration() {
  console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('applyjobs');

    console.log('Inspecting collection for duplicate application entries...');
    const duplicates = await collection
      .aggregate([
        {
          $group: {
            _id: { userId: '$userId', jobId: '$jobId' },
            count: { $sum: 1 },
            ids: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.warn(`WARNING: Found ${duplicates.length} duplicate application pairs:`);
      for (const dup of duplicates) {
        console.warn(
          `  - Candidate "${dup._id.userId}" applied to Job "${dup._id.jobId}" ${dup.count} times. Record IDs: ${dup.ids.join(', ')}`
        );
      }
      console.warn(
        'Action required: Resolve duplicate application documents before enforcing unique index.'
      );
      process.exitCode = 1;
      return;
    }

    console.log('No duplicate application records found.');

    const existingIndexes = await collection.indexes();
    const hasIndex = existingIndexes.some(
      (idx) => idx.key && idx.key.userId === 1 && idx.key.jobId === 1 && idx.unique
    );

    if (hasIndex) {
      console.log('Compound unique index (userId: 1, jobId: 1) already exists. Migration complete.');
      return;
    }

    console.log('Creating unique index on (userId: 1, jobId: 1)...');
    await collection.createIndex({ userId: 1, jobId: 1 }, { unique: true, background: true });
    console.log('Index created successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

runMigration();
