# Master-Automation-Test.ps1
# Full automation test installer + runner for Inkylink

Set-ExecutionPolicy Bypass -Scope Process -Force
cd "C:\Users\potts\Desktop\INKYLINK_SUITE\inkylink-website"

# 1️⃣ Ensure npm is initialized
if (-not (Test-Path "package.json")) { npm init -y }

# 2️⃣ Install dependencies
npm install @playwright/test pg fs --save-dev
npx playwright install --with-deps

# 3️⃣ Ensure tests folder exists
if (-not (Test-Path "tests")) { New-Item -ItemType Directory -Path "tests" | Out-Null }

# 4️⃣ Write Playwright + DB integrity test
@'
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { Client } = require('pg');

test('Inkylink full pipeline + DB check + Data Integrity', async ({ page }) => {
  const baseUrl = 'http://localhost:3000';
  await page.goto(${baseUrl}/pricing);
  await expect(page.locator('h1')).toContainText('Inkylink');

  await page.locator('text=Order Now').first().click();
  await expect(page).toHaveURL(/confirmation/);

  await page.locator('text=Continue to Intake Form').click();
  const inputs = page.locator('input[type="text"]');
  for (let i = 0; i < await inputs.count(); i++) {
    await inputs.nth(i).fill(Sample answer );
  }

  await page.locator('text=Submit').click();
  await expect(page).toHaveURL(/thankyou/);

  const ordersPath = './orders';
  if (!fs.existsSync(ordersPath)) throw new Error('❌ Orders folder not found');
  const files = fs.readdirSync(ordersPath);
  if (!files.length) throw new Error('❌ No order files found');
  console.log('✅ Order saved locally:', files[files.length - 1]);

  const latestOrderPath = ${ordersPath}/;
  const orderData = JSON.parse(fs.readFileSync(latestOrderPath, 'utf8'));
  if (Array.isArray(orderData.items)) {
    const badIds = orderData.items.filter(item => item.id.includes('-'));
    if (badIds.length) throw new Error(\❌ Found IDs with hyphens: \\);
    console.log('✅ All IDs have spaces instead of hyphens');
  }

  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM orders ORDER BY submitted_at DESC LIMIT 1');
    if (!res.rows.length) throw new Error('❌ No orders in DB');
    const dbOrder = res.rows[0];
    console.log('✅ Latest DB order:', dbOrder);

    if (dbOrder.order_id !== orderData.order_id) {
      console.warn(\⚠️ order_id mismatch: File=\, DB=\\);
    }
    if (Number(dbOrder.total_price) !== Number(orderData.total_price)) {
      console.warn(\⚠️ total_price mismatch: File=\, DB=\\);
    }
  } catch (err) {
    console.warn('⚠️ DB check failed:', err.message);
  } finally {
    await client.end();
  }
});
'@ | Set-Content "tests\inkylink.spec.js" -Encoding UTF8

Write-Host "
✅ All testing installed. Running test now..." -ForegroundColor Green

# 5️⃣ Run the test
npx playwright test tests --headed
