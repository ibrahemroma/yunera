/**
 * YUNÉRA — Apps Script Backend (نسخة فيها: الأوردرات + لوحة تحكم المنتجات + تسجيل العملاء)
 * ===========================================================================
 * انسخ الكود ده كله وحط بدل اللي في ملف "الكود.gs" في مشروع الـ Apps Script بتاعك
 * (نفس المشروع اللي فيه الرابط: .../exec اللي حاطه في الموقع).
 *
 * خطوات مهمة بعد اللصق:
 * 1) غيّر قيمة ADMIN_PASSWORD تحت لكلمة سر تعرفها إنت بس (كلمة سر لوحة التحكم).
 * 2) من قايمة الدوال فوق (جنب زرار ▷ تشغيل) اختار setupHeaders واضغط تشغيل مرة واحدة بس.
 *    ده هيعمل شيت "Orders" و"Products" و"Customers" بالعناوين الصح، وهيحط 12 منتج
 *    ابتدائي في شيت Products (نفس المنتجات اللي كانت في الموقع) عشان تقدر تعدل عليهم
 *    من لوحة التحكم بدل ما تبدأ من صفر.
 * 3) لازم توافق على الصلاحيات لما يطلب منك (Drive + Sheets) عشان الصور تتحفظ صح.
 * 4) بعدين لازم "تنشر" (Deploy) نسخة جديدة من الويب آب:
 *    نشر (Deploy) > إدارة عمليات النشر (Manage deployments) > تعديل (Edit/القلم) >
 *    اختار "إصدار جديد" (New version) > نشر (Deploy).
 *    (لازم تعمل ده أي مرة تعدل فيها الكود عشان التغيير يشتغل فعليًا).
 * 5) رابط الـ /exec هيفضل هو نفسه، مش هتحتاج تغيّره في الموقع ولا في لوحة التحكم.
 */

const SHEET_ID = '1AFyrHd7NOmMLEAQaY-7n_EjSCLwhOZk1B3k_9ZL0mEY';
const SHEET_NAME = 'Orders';
const PRODUCTS_SHEET_NAME = 'Products';
const CUSTOMERS_SHEET_NAME = 'Customers';
const PROOF_FOLDER_NAME = 'Yunera - إثباتات الدفع';

// ⚠️ غيّر كلمة السر دي لأي حاجة إنت بس عارفها قبل ما تنشر الموقع
const ADMIN_PASSWORD = 'yunera-admin-2026';

const HEADERS = [
  'رقم الأوردر', 'التاريخ', 'الاسم', 'الموبايل', 'المحافظة', 'المنطقة', 'العنوان',
  'لينك اللوكيشن', 'المنتجات', 'سعر القطع', 'التوصيل', 'الإجمالي',
  'طريقة الدفع', 'رقم العملية', 'ملاحظات', 'إثبات الدفع', 'الحالة'
];

const PRODUCT_HEADERS = [
  'ID', 'الاسم', 'القسم', 'السعر', 'النوع', 'اللون', 'الوصف', 'المقاسات', 'الألوان', 'الكمية', 'منشور'
];

const CUSTOMER_HEADERS = [
  'الاسم', 'الموبايل', 'الإيميل', 'كلمة المرور (مشفرة)', 'تاريخ التسجيل'
];

/* أول 12 منتج كانوا مكتوبين جوه الموقع مباشرة — بتتحط في شيت Products أول مرة بس */
const SEED_PRODUCTS = [
  [1,'قميص كلاسيك أبيض','رجالي',850,'shirt','#233F35','قميص قطن مصري خالص، قصة كلاسيك تناسب الشغل والمشاوير.','S,M,L,XL,XXL','[{"n":"أبيض","h":"#F4EEDF"},{"n":"أزرق فاتح","h":"#6E7C8C"},{"n":"أسود","h":"#1C1C1C"}]',50,true],
  [2,'تيشرت أوفرسايز كحلي','رجالي',650,'shirt','#375A4B','تيشرت قطن ثقيل بقصة أوفرسايز مريحة، مثالي للإطلالة الكاجوال.','S,M,L,XL','[{"n":"كحلي","h":"#233F35"},{"n":"أسود","h":"#1C1C1C"},{"n":"بيج","h":"#C9A227"}]',50,true],
  [3,'جينز ستريت وايد','رجالي',1290,'pants','#5C5949','جينز بقصة واسعة ستريت، خامة دنيم متينة بلمسة مغسولة.','30,32,34,36,38','[{"n":"أزرق فاتح","h":"#6E7C8C"},{"n":"أزرق غامق","h":"#233F35"}]',50,true],
  [4,'جاكيت دنيم','رجالي',1850,'jacket','#7A2E2E','جاكيت دنيم كلاسيك بتفاصيل معدنية، بيعيش معاك كل موسم.','M,L,XL,XXL','[{"n":"أزرق","h":"#6E7C8C"},{"n":"أسود","h":"#1C1C1C"}]',50,true],
  [5,'فستان صيفي كتان','حريمي',1450,'dress','#A9776B','فستان كتان خفيف بقصة مريحة، مثالي للنهار والمشاوير.','S,M,L,XL','[{"n":"بيج","h":"#E4CD8B"},{"n":"أبيض","h":"#F4EEDF"},{"n":"أخضر","h":"#375A4B"}]',50,true],
  [6,'بلوزة حرير كريمي','حريمي',980,'shirt','#C7A445','بلوزة بخامة حريرية ناعمة، تناسب الشغل والسهرة الخفيفة.','S,M,L','[{"n":"كريمي","h":"#E4CD8B"},{"n":"أسود","h":"#1C1C1C"},{"n":"وردي غامق","h":"#A9776B"}]',50,true],
  [7,'بنطلون تيلورد','حريمي',1150,'pants','#233F35','بنطلون قصة تيلورد أنيقة، خصر عالي وقصة مستقيمة.','S,M,L,XL','[{"n":"أسود","h":"#1C1C1C"},{"n":"بيج","h":"#E4CD8B"}]',50,true],
  [8,'جاكيت بليزر','حريمي',2100,'jacket','#1C1C1C','بليزر بقصة مضبوطة، قطعة أساسية في أي دولاب أنيق.','S,M,L,XL','[{"n":"أسود","h":"#1C1C1C"},{"n":"كحلي","h":"#233F35"}]',50,true],
  [9,'تيشرت أطفال مطبوع','أطفال',350,'shirt','#A9776B','تيشرت قطن ناعم على بشرة الأطفال، طبعة مرحة وألوان زاهية.','2-3,4-5,6-7,8-9','[{"n":"أصفر","h":"#C7A445"},{"n":"أزرق","h":"#6E7C8C"},{"n":"أبيض","h":"#F4EEDF"}]',50,true],
  [10,'طقم أطفال قطن','أطفال',590,'shirt','#375A4B','طقم تيشرت وبنطلون قطن مريح، مناسب للعب طول اليوم.','2-3,4-5,6-7,8-9,10-11','[{"n":"أخضر","h":"#375A4B"},{"n":"رمادي","h":"#8B8674"}]',50,true],
  [11,'جاكيت أطفال شتوي','أطفال',780,'jacket','#233F35','جاكيت دافئ ومقاوم للبرد، مبطن من الداخل براحة تامة.','4-5,6-7,8-9,10-11','[{"n":"كحلي","h":"#233F35"},{"n":"أحمر","h":"#7A2E2E"}]',50,true],
  [12,'فستان بنوتي كاروهات','أطفال',690,'dress','#7A2E2E','فستان قطن بطبعة كاروهات كلاسيك، مناسب للمناسبات واليومي.','2-3,4-5,6-7,8-9','[{"n":"أحمر","h":"#7A2E2E"},{"n":"بيج","h":"#E4CD8B"}]',50,true]
];

/* ---------------- Sheet helpers ---------------- */
function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}
function getProductsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(PRODUCTS_SHEET_NAME);
  return sheet;
}
function getCustomersSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CUSTOMERS_SHEET_NAME);
  return sheet;
}

/** شغّل الدالة دي مرة واحدة يدويًا من محرر الأبس سكريبت عشان تظبط كل الشيتات والعناوين. */
function setupHeaders() {
  const orders = getSheet_();
  orders.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  const products = getProductsSheet_();
  const wasEmpty = products.getDataRange().getNumRows() < 2 && products.getLastRow() < 1;
  products.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
  if (products.getLastRow() < 2) {
    products.getRange(2, 1, SEED_PRODUCTS.length, PRODUCT_HEADERS.length).setValues(SEED_PRODUCTS);
  }

  const customers = getCustomersSheet_();
  customers.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
}

/* ---------------- Admin auth ---------------- */
function checkAdmin_(password) {
  return String(password || '') === ADMIN_PASSWORD;
}
function hashPassword_(pw) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pw || ''));
  return digest.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/* ================= doGet ================= */
/**
 * doGet بيخدم الحالات دي:
 *  - ?action=track&orderId=...&phone=...                → حالة وتفاصيل أوردر معين
 *  - ?action=cancelRequest&orderId=...&phone=...         → تسجيل طلب إلغاء/تعديل
 *  - ?action=getProducts                                 → المنتجات المنشورة بس (للموقع العام)
 *  - ?action=adminAuth&password=...                      → التحقق من كلمة سر لوحة التحكم
 *  - ?action=adminGetProducts&password=...               → كل المنتجات (منشورة وغير منشورة) للوحة التحكم
 *  - ?action=adminGetCustomers&password=...               → قايمة العملاء المسجلين
 */
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'track' || action === 'cancelRequest') {
    return handleOrderLookup_(e, action);
  }
  if (action === 'getProducts') {
    return handleGetProducts_(false, '');
  }
  if (action === 'adminAuth') {
    return jsonOut_({ ok: checkAdmin_(e.parameter.password) });
  }
  if (action === 'adminGetProducts') {
    return handleGetProducts_(true, e.parameter.password);
  }
  if (action === 'adminGetCustomers') {
    return handleGetCustomers_(e.parameter.password);
  }

  return jsonOut_({ error: 'unknown action' });
}

function handleOrderLookup_(e, action) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const idxOrderId = headers.indexOf('رقم الأوردر');
  const idxPhone = headers.indexOf('الموبايل');
  const idxStatus = headers.indexOf('الحالة');
  const idxDate = headers.indexOf('التاريخ');
  const idxItems = headers.indexOf('المنتجات');
  const idxTotal = headers.indexOf('الإجمالي');
  const idxPayMethod = headers.indexOf('طريقة الدفع');

  const orderId = String(e.parameter.orderId || '').trim();
  const phone = String(e.parameter.phone || '').trim();

  if (action === 'track') {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (String(row[idxOrderId]).trim() === orderId && String(row[idxPhone]).trim() === phone) {
        return jsonOut_({
          found: true,
          orderId: row[idxOrderId],
          date: row[idxDate],
          items: row[idxItems],
          total: row[idxTotal],
          paymentMethod: row[idxPayMethod],
          status: row[idxStatus] || 'قيد المراجعة'
        });
      }
    }
    return jsonOut_({ found: false });
  }

  if (action === 'cancelRequest') {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (String(row[idxOrderId]).trim() === orderId && String(row[idxPhone]).trim() === phone) {
        sheet.getRange(r + 1, idxStatus + 1).setValue('طلب إلغاء/تعديل من العميل');
        return jsonOut_({ ok: true });
      }
    }
    return jsonOut_({ ok: false, error: 'الأوردر مش موجود' });
  }
}

function handleGetProducts_(isAdmin, password) {
  if (isAdmin && !checkAdmin_(password)) {
    return jsonOut_({ ok: false, error: 'unauthorized' });
  }
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOut_(isAdmin ? { ok: true, products: [] } : []);

  const headers = values[0];
  const idx = {
    id: headers.indexOf('ID'), name: headers.indexOf('الاسم'), cat: headers.indexOf('القسم'),
    price: headers.indexOf('السعر'), type: headers.indexOf('النوع'), tint: headers.indexOf('اللون'),
    desc: headers.indexOf('الوصف'), sizes: headers.indexOf('المقاسات'), colors: headers.indexOf('الألوان'),
    stock: headers.indexOf('الكمية'), pub: headers.indexOf('منشور')
  };

  const products = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row[idx.id] === '' || row[idx.id] === null || row[idx.id] === undefined) continue;
    const published = row[idx.pub] === true || String(row[idx.pub]).toUpperCase() === 'TRUE';
    if (!isAdmin && !published) continue;

    let colors = [];
    try { colors = JSON.parse(row[idx.colors] || '[]'); } catch (err) { colors = []; }

    products.push({
      id: Number(row[idx.id]),
      name: row[idx.name],
      cat: row[idx.cat],
      price: Number(row[idx.price]) || 0,
      type: row[idx.type] || 'shirt',
      tint: row[idx.tint] || '#233F35',
      desc: row[idx.desc] || '',
      sizes: String(row[idx.sizes] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      colors: colors,
      stock: Number(row[idx.stock]) || 0,
      published: !!published
    });
  }
  return jsonOut_(isAdmin ? { ok: true, products: products } : products);
}

function handleGetCustomers_(password) {
  if (!checkAdmin_(password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getCustomersSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOut_({ ok: true, customers: [] });
  const customers = values.slice(1).filter(function (row) { return row[0] || row[1]; }).map(function (row) {
    return { name: row[0], phone: row[1], email: row[2], registeredAt: row[4] };
  });
  return jsonOut_({ ok: true, customers: customers });
}

/* ================= doPost ================= */
/**
 * doPost بيتعرف على العملية من خلال data.action:
 *  - 'addProduct' / 'updateProduct' / 'deleteProduct'  → عمليات لوحة التحكم (لازم password صحيح)
 *  - 'registerCustomer'                                 → تسجيل عميل جديد (بدون password)
 *  - من غير action (زي ما الموقع بيبعت أوردر عادي)      → تسجيل أوردر جديد (السلوك الأصلي)
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'addProduct') return handleAddProduct_(data);
  if (data.action === 'updateProduct') return handleUpdateProduct_(data);
  if (data.action === 'deleteProduct') return handleDeleteProduct_(data);
  if (data.action === 'registerCustomer') return handleRegisterCustomer_(data);

  return handleNewOrder_(data);
}

function handleNewOrder_(data) {
  const sheet = getSheet_();

  let proofLink = '';
  if (data.payment && data.payment.proofImageBase64) {
    try {
      proofLink = saveProofImage_(data.orderId, data.payment.proofImageBase64, data.payment.proofFileName);
    } catch (err) {
      proofLink = 'تعذر رفع الصورة: ' + err.message;
    }
  }

  sheet.appendRow([
    data.orderId,
    data.date,
    data.customer.name,
    data.customer.phone,
    data.customer.governorate,
    data.customer.area,
    data.customer.address,
    data.customer.locationLink,
    data.items.map(function (i) {
      return i.name + ' (' + i.size + '/' + i.color + ') x' + i.qty;
    }).join(' | '),
    data.subtotal,
    data.shipping,
    data.total,
    data.payment.method,
    data.payment.reference,
    data.note,
    proofLink,
    'قيد المراجعة'
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddProduct_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();
  let maxId = 0;
  for (let r = 1; r < values.length; r++) {
    const id = Number(values[r][0]);
    if (id > maxId) maxId = id;
  }
  const newId = maxId + 1;
  sheet.appendRow([
    newId, data.name || '', data.cat || 'رجالي', Number(data.price) || 0, data.type || 'shirt',
    data.tint || '#233F35', data.desc || '', data.sizes || '', JSON.stringify(data.colors || []),
    Number(data.stock) || 0, data.published !== false
  ]);
  return jsonOut_({ ok: true, id: newId });
}

function handleUpdateProduct_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (Number(values[r][0]) === Number(data.id)) {
      sheet.getRange(r + 1, 1, 1, PRODUCT_HEADERS.length).setValues([[
        Number(data.id), data.name || '', data.cat || 'رجالي', Number(data.price) || 0, data.type || 'shirt',
        data.tint || '#233F35', data.desc || '', data.sizes || '', JSON.stringify(data.colors || []),
        Number(data.stock) || 0, data.published !== false
      ]]);
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'المنتج مش موجود' });
}

function handleDeleteProduct_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (Number(values[r][0]) === Number(data.id)) {
      sheet.deleteRow(r + 1);
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'المنتج مش موجود' });
}

function handleRegisterCustomer_(data) {
  const sheet = getCustomersSheet_();
  sheet.appendRow([
    data.name || '', data.phone || '', data.email || '',
    hashPassword_(data.password || ''), new Date().toLocaleString('ar-EG')
  ]);
  return jsonOut_({ ok: true });
}

/* ---------------- Utilities ---------------- */
function saveProofImage_(orderId, base64DataUrl, fileName) {
  let folder;
  const existing = DriveApp.getFoldersByName(PROOF_FOLDER_NAME);
  folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(PROOF_FOLDER_NAME);

  const match = String(base64DataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  const mime = match ? match[1] : 'image/jpeg';
  const raw = match ? match[2] : base64DataUrl;
  const bytes = Utilities.base64Decode(raw);
  const blob = Utilities.newBlob(bytes, mime, (orderId || 'order') + '_' + (fileName || 'proof.jpg'));
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
