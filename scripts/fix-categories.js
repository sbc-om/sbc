import { nanoid } from 'nanoid';
import { open } from 'lmdb';

const db = open({ path: '.data/lmdb' });
const categories = db.openDB({ name: 'categories' });
const categorySlugs = db.openDB({ name: 'categorySlugs' });

console.log('Fixing categories without id...\n');

let fixed = 0;
const toFix = [];

// Find all categories without id
for (const { key, value } of categories.getRange()) {
  if (value && !value.id) {
    toFix.push({ key, value });
  }
}

console.log(`Found ${toFix.length} categories without id`);

// Fix each one
for (const { key, value } of toFix) {
  const newId = nanoid();
  console.log(`\nFixing: ${value.slug}`);
  console.log(`  Old key: ${key}`);
  console.log(`  New id: ${newId}`);
  
  // Remove old entry
  await categories.remove(key);
  
  // Add with proper id
  const fixedCategory = {
    ...value,
    id: newId,
  };
  
  await categories.put(newId, fixedCategory);
  await categorySlugs.put(value.slug, newId);
  
  fixed++;
  console.log(`  ✓ Fixed`);
}

console.log(`\n✅ Fixed ${fixed} categories`);
db.close();
