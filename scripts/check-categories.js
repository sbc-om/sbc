import { open } from 'lmdb';

const db = open({ path: '.data/lmdb' });
const categories = db.openDB({ name: 'categories' });

let total = 0;
let withoutId = 0;
const samples = [];

for (const { value } of categories.getRange()) {
  total++;
  if (!value || !value.id) {
    withoutId++;
    if (samples.length < 5) {
      samples.push(value);
    }
  }
}

console.log(`Total categories: ${total}`);
console.log(`Categories without id: ${withoutId}`);
if (samples.length > 0) {
  console.log('\nSamples without id:');
  samples.forEach((s, i) => {
    console.log(`${i + 1}.`, JSON.stringify(s, null, 2));
  });
}

db.close();
