import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/images/sbc.svg');
const outputDir = path.join(__dirname, '../public');

// آیکن‌های مورد نیاز با سایزهای مختلف
const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

async function generateIcons() {
  console.log('🎨 شروع تولید آیکن‌ها...\n');

  // خواندن محتوای SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // تولید هر آیکن
  for (const icon of iconSizes) {
    try {
      await sharp(svgBuffer)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size}) ساخته شد`);
    } catch (error) {
      console.error(`❌ خطا در ساخت ${icon.name}:`, error.message);
    }
  }

  // تولید favicon.ico با پس‌زمینه شفاف
  try {
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.ico'));
    
    console.log('✅ favicon.ico با پس‌زمینه شفاف ساخته شد');
  } catch (error) {
    console.error('❌ خطا در ساخت favicon.ico:', error.message);
  }

  console.log('\n🎉 تمام آیکن‌ها با موفقیت ساخته شدند!');
}

// تولید site.webmanifest
function generateManifest() {
  const manifest = {
    name: 'SBC',
    short_name: 'SBC',
    description: 'Smart Business Center',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    theme_color: '#0877FB',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    orientation: 'portrait'
  };

  fs.writeFileSync(
    path.join(outputDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✅ site.webmanifest ساخته شد');
}

// اجرای اسکریپت
generateIcons()
  .then(() => {
    generateManifest();
  })
  .catch(error => {
    console.error('❌ خطای کلی:', error);
    process.exit(1);
  });
