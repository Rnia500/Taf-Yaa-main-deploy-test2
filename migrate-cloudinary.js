import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

const APPLY = process.argv.includes('--apply');

// ---------- Firebase Admin ----------
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});
const db = admin.firestore();

// ---------- NEW Cloudinary account ----------
cloudinary.config({
  cloud_name: process.env.NEW_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEW_CLOUDINARY_API_KEY,
  api_secret: process.env.NEW_CLOUDINARY_API_SECRET,
});
const NEW_CLOUD_NAME = process.env.NEW_CLOUDINARY_CLOUD_NAME;

const stats = { migrated: 0, skipped: 0, failed: 0, failures: [] };

function alreadyMigrated(url) {
  return typeof url === 'string' && url.includes(`res.cloudinary.com/${NEW_CLOUD_NAME}/`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Uploads oldUrl to the NEW account (Cloudinary fetches the remote URL itself — no need to download bytes manually). 
async function migrateUrl(oldUrl, folder) {
  if (!oldUrl || alreadyMigrated(oldUrl)) {
    stats.skipped++;
    return { url: oldUrl, cloudinaryId: undefined, changed: false };
  }

  const result = await cloudinary.uploader.upload(oldUrl, {
    folder,
    resource_type: 'auto',
  });

  stats.migrated++;
  return { url: result.secure_url, cloudinaryId: result.public_id, changed: true };
}

// ---------- media collection ----------
async function migrateMedia() {
  const snap = await db.collection('media').get();
  console.log(`\nmedia: ${snap.size} documents`);

  for (const doc of snap.docs) {
    const data = doc.data();
    try {
      const { url, cloudinaryId, changed } = await migrateUrl(data.url, 'migrated/media');
      if (changed) {
        console.log(`  [media/${doc.id}] -> ${url}`);
        if (APPLY) {
          await doc.ref.update({
            url,
            cloudinaryId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      await sleep(200);
    } catch (err) {
      stats.failed++;
      stats.failures.push({ collection: 'media', id: doc.id, error: err.message });
      console.error(`  [media/${doc.id}] FAILED: ${err.message}`);
    }
  }
}

// ---------- stories collection (attachments array) ----------
async function migrateStories() {
  const snap = await db.collection('stories').get();
  console.log(`\nstories: ${snap.size} documents`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    let anyChanged = false;
    const newAttachments = [];

    for (const attachment of attachments) {
      try {
        const { url, cloudinaryId, changed } = await migrateUrl(attachment.url, 'migrated/stories');
        if (changed) anyChanged = true;
        newAttachments.push({
          ...attachment,
          url,
          cloudinaryId: cloudinaryId || attachment.cloudinaryId,
        });
        await sleep(200);
      } catch (err) {
        stats.failed++;
        stats.failures.push({ collection: 'stories', id: doc.id, error: err.message });
        console.error(`  [stories/${doc.id}] attachment FAILED: ${err.message}`);
        newAttachments.push(attachment); // keep the original if this one failed
      }
    }

    if (anyChanged) {
      console.log(`  [stories/${doc.id}] ${newAttachments.length} attachment(s) updated`);
      if (APPLY) {
        await doc.ref.update({
          attachments: newAttachments,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
}

// ---------- people collection (photoUrl + photos[]) ----------
async function migratePeople() {
  const snap = await db.collection('people').get();
  console.log(`\npeople: ${snap.size} documents`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    let anyChanged = false;

    try {
      if (data.photoUrl) {
        const { url, changed } = await migrateUrl(data.photoUrl, 'migrated/people');
        if (changed) {
          updates.photoUrl = url;
          anyChanged = true;
        }
        await sleep(200);
      }

      if (Array.isArray(data.photos) && data.photos.length) {
        const newPhotos = [];
        for (const photo of data.photos) {
          const { url, changed } = await migrateUrl(photo.url, 'migrated/people');
          if (changed) anyChanged = true;
          newPhotos.push({ ...photo, url });
          await sleep(200);
        }
        updates.photos = newPhotos;
      }

      if (anyChanged) {
        console.log(`  [people/${doc.id}] updated`);
        if (APPLY) await doc.ref.update(updates);
      }
    } catch (err) {
      stats.failed++;
      stats.failures.push({ collection: 'people', id: doc.id, error: err.message });
      console.error(`  [people/${doc.id}] FAILED: ${err.message}`);
    }
  }
}

// ---------- trees collection (familyPhoto) ----------
async function migrateTrees() {
  const snap = await db.collection('trees').get();
  console.log(`\ntrees: ${snap.size} documents`);

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.familyPhoto) continue;

    try {
      const { url, changed } = await migrateUrl(data.familyPhoto, 'migrated/trees');
      if (changed) {
        console.log(`  [trees/${doc.id}] -> ${url}`);
        if (APPLY) await doc.ref.update({ familyPhoto: url });
      }
      await sleep(200);
    } catch (err) {
      stats.failed++;
      stats.failures.push({ collection: 'trees', id: doc.id, error: err.message });
      console.error(`  [trees/${doc.id}] FAILED: ${err.message}`);
    }
  }
}

(async () => {
  console.log(
    APPLY
      ? 'Running with --apply: Firestore documents WILL be updated.'
      : 'Running WITHOUT --apply: uploading to the new Cloudinary account for ' +
        'verification, but Firestore will NOT be touched. Re-run with --apply when ready.'
  );

  await migrateMedia();
  await migrateStories();
  await migratePeople();
  await migrateTrees();

  console.log('\n--- Summary ---');
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Skipped (no url, or already on new account): ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  if (stats.failures.length) {
    console.log('Failures:');
    console.log(JSON.stringify(stats.failures, null, 2));
  }

  process.exit(0);
})();