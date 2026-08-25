/**
 * YUNÉRA — Apps Script Backend
 * (نسخة فيها: الأوردرات + لوحة تحكم المنتجات + تسجيل العملاء + رفع صور من اللوحة
 *  + خصومات على المنتجات + كوبونات خصم للعملاء المميزين + تتبع أوردر بالموبايل فقط
 *  أو رقم الأوردر فقط أو الاتنين + إصلاح مشكلة الصفر الأول في رقم الموبايل)
 * ===========================================================================
 * انسخ الكود ده كله وحط بدل اللي في ملف "الكود.gs" في مشروع الـ Apps Script بتاعك
 * (نفس المشروع اللي فيه الرابط: .../exec اللي حاطه في الموقع).
 *
 * خطوات مهمة بعد اللصق:
 * 1) غيّر قيمة ADMIN_PASSWORD تحت لكلمة سر تعرفها إنت بس (كلمة سر لوحة التحكم).
 * 2) من قايمة الدوال فوق (جنب زرار ▷ تشغيل) اختار setupHeaders واضغط تشغيل مرة واحدة بس.
 *    ده هيعمل/يظبط شيتات Orders و Products و Customers و Coupons بالعناوين الصح،
 *    وهيضيف أي عمود جديد (زي الخصم والكوبونات) من غير ما يمسح أي بيانات موجودة،
 *    وهيظبط عمود الموبايل في Orders و Customers عشان يتخزن كنص (يحافظ على الصفر الأول).
 * 3) لازم توافق على الصلاحيات لما يطلب منك (Drive + Sheets) عشان الصور تتحفظ صح
 *    (سواء صور المنتجات أو إثباتات الدفع).
 * 4) بعدين لازم "تنشر" (Deploy) نسخة جديدة من الويب آب:
 *    نشر (Deploy) > إدارة عمليات النشر (Manage deployments) > تعديل (Edit/القلم) >
 *    اختار "إصدار جديد" (New version) > نشر (Deploy).
 *    (لازم تعمل ده أي مرة تعدل فيها الكود عشان التغيير يشتغل فعليًا).
 * 5) رابط الـ /exec هيفضل هو نفسه، مش هتحتاج تغيّره في الموقع ولا في لوحة التحكم.
 *
 * ⚠️ ملحوظة عن أرقام الموبايل القديمة: أي أوردر أو عميل اتسجل قبل التحديث ده ولو
 * رقم موبايله اتخزن في الشيت من غير الصفر الأول (المشكلة القديمة)، البحث دلوقتي
 * بيتعامل مع ده تلقائيًا (بيقارن الأرقام بعد تجاهل الصفر الأول). مش محتاج تعدل
 * البيانات القديمة يدويًا.
 */

const SHEET_ID = '1AFyrHd7NOmMLEAQaY-7n_EjSCLwhOZk1B3k_9ZL0mEY';
const SHEET_NAME = 'Orders';
const PRODUCTS_SHEET_NAME = 'Products';
const CUSTOMERS_SHEET_NAME = 'Customers';
const COUPONS_SHEET_NAME = 'Coupons';
const PROOF_FOLDER_NAME = 'Yunera - إثباتات الدفع';
const PRODUCT_IMAGES_FOLDER_NAME = 'Yunera - صور المنتجات';

// ⚠️ غيّر كلمة السر دي لأي حاجة إنت بس عارفها قبل ما تنشر الموقع
const ADMIN_PASSWORD = 'yunera-admin-2026';

const HEADERS = [
  'رقم الأوردر', 'التاريخ', 'الاسم', 'الموبايل', 'المحافظة', 'المنطقة', 'العنوان',
  'لينك اللوكيشن', 'المنتجات', 'سعر القطع', 'التوصيل', 'الإجمالي',
  'طريقة الدفع', 'رقم العملية', 'ملاحظات', 'إثبات الدفع', 'الحالة',
  'كود الخصم', 'قيمة الخصم'
];
/* ملاحظة: 'كود الخصم' و'قيمة الخصم' اتضافوا في الآخر عشان أي شيت شغال فعليًا
   ماتتبهدلش أعمدته القديمة. */

const PRODUCT_HEADERS = [
  'ID', 'الاسم', 'القسم', 'السعر', 'النوع', 'اللون', 'الوصف', 'المقاسات', 'الألوان', 'الكمية', 'منشور',
  'الكود', 'الصورة', 'سعر الخصم'
];
/* ملاحظة: 'الكود' و'الصورة' و'سعر الخصم' اتضافوا في الآخر (مش في النص) عشان أي شيت
   شغال فعليًا ماتتبهدلش أعمدته القديمة. لو الشيت اتعمل قبل كده، شغّل setupHeaders
   تاني مرة واحدة بس عشان يضيف العناوين الجداد من غير ما يمس باقي البيانات.
   'سعر الخصم': لو فيه رقم فيه (وأصغر من السعر الأصلي) هيبقى ده السعر المعروض
   والمستخدم في الموقع، والسعر الأصلي هيتشطب عليه كخط. سيبه فاضي أو صفر عشان
   السعر العادي يفضل شغال زي ما هو من غير خصم.
   'الصورة': بقى بيخزن أكتر من صورة (ألبوم عام للمنتج) في شكل JSON، مش رابط واحد بس.
   ولو المنتج قديم ومتخزن فيه رابط واحد كنص عادي، النظام بيتعامل معاه تلقائيًا كأول صورة.
   'الألوان' (JSON) كمان بقى ممكن كل لون فيها ياخد مجموعة صور خاصة بيه لوحده، عن طريق
   خاصية "images" جوه كائن اللون، مش عمود منفصل. */

/* بادئة كود كل قسم حسب "النوع" (نفس القيمة المستخدمة للأيقونة) */
const TYPE_PREFIX = { shirt: 'T', pants: 'P', dress: 'D', jacket: 'J' };
const CODE_PAD = 5; // T-00001, P-00001, ...

const CUSTOMER_HEADERS = [
  'الاسم', 'الموبايل', 'الإيميل', 'كلمة المرور (مشفرة)', 'تاريخ التسجيل'
];

const COUPON_HEADERS = [
  'ID', 'الكود', 'نوع الخصم', 'القيمة', 'نشط',
  'عملاء مميزون فقط (أرقام موبايل مفصولة بفاصلة، سيبه فاضي للكل)',
  'تاريخ الانتهاء (YYYY-MM-DD، اختياري)', 'الحد الأقصى للاستخدام (0 = بلا حدود)', 'عدد مرات الاستخدام'
];
/* 'نوع الخصم' القيم المسموحة: 'نسبة' (خصم %) أو 'مبلغ' (خصم مبلغ ثابت بالجنيه). */

/* أول 12 منتج كانوا مكتوبين جوه الموقع مباشرة — بتتحط في شيت Products أول مرة بس */
const SEED_PRODUCTS = [
  [1,'قميص كلاسيك أبيض','رجالي',850,'shirt','#233F35','قميص قطن مصري خالص، قصة كلاسيك تناسب الشغل والمشاوير.','S,M,L,XL,XXL','[{"n":"أبيض","h":"#F4EEDF"},{"n":"أزرق فاتح","h":"#6E7C8C"},{"n":"أسود","h":"#1C1C1C"}]',50,true,'T-00001','',''],
  [2,'تيشرت أوفرسايز كحلي','رجالي',650,'shirt','#375A4B','تيشرت قطن ثقيل بقصة أوفرسايز مريحة، مثالي للإطلالة الكاجوال.','S,M,L,XL','[{"n":"كحلي","h":"#233F35"},{"n":"أسود","h":"#1C1C1C"},{"n":"بيج","h":"#C9A227"}]',50,true,'T-00002','',''],
  [3,'جينز ستريت وايد','رجالي',1290,'pants','#5C5949','جينز بقصة واسعة ستريت، خامة دنيم متينة بلمسة مغسولة.','30,32,34,36,38','[{"n":"أزرق فاتح","h":"#6E7C8C"},{"n":"أزرق غامق","h":"#233F35"}]',50,true,'P-00001','',''],
  [4,'جاكيت دنيم','رجالي',1850,'jacket','#7A2E2E','جاكيت دنيم كلاسيك بتفاصيل معدنية، بيعيش معاك كل موسم.','M,L,XL,XXL','[{"n":"أزرق","h":"#6E7C8C"},{"n":"أسود","h":"#1C1C1C"}]',50,true,'J-00001','',''],
  [5,'فستان صيفي كتان','حريمي',1450,'dress','#A9776B','فستان كتان خفيف بقصة مريحة، مثالي للنهار والمشاوير.','S,M,L,XL','[{"n":"بيج","h":"#E4CD8B"},{"n":"أبيض","h":"#F4EEDF"},{"n":"أخضر","h":"#375A4B"}]',50,true,'D-00001','',''],
  [6,'بلوزة حرير كريمي','حريمي',980,'shirt','#C7A445','بلوزة بخامة حريرية ناعمة، تناسب الشغل والسهرة الخفيفة.','S,M,L','[{"n":"كريمي","h":"#E4CD8B"},{"n":"أسود","h":"#1C1C1C"},{"n":"وردي غامق","h":"#A9776B"}]',50,true,'T-00003','',''],
  [7,'بنطلون تيلورد','حريمي',1150,'pants','#233F35','بنطلون قصة تيلورد أنيقة، خصر عالي وقصة مستقيمة.','S,M,L,XL','[{"n":"أسود","h":"#1C1C1C"},{"n":"بيج","h":"#E4CD8B"}]',50,true,'P-00002','',''],
  [8,'جاكيت بليزر','حريمي',2100,'jacket','#1C1C1C','بليزر بقصة مضبوطة، قطعة أساسية في أي دولاب أنيق.','S,M,L,XL','[{"n":"أسود","h":"#1C1C1C"},{"n":"كحلي","h":"#233F35"}]',50,true,'J-00002','',''],
  [9,'تيشرت أطفال مطبوع','أطفال',350,'shirt','#A9776B','تيشرت قطن ناعم على بشرة الأطفال، طبعة مرحة وألوان زاهية.','2-3,4-5,6-7,8-9','[{"n":"أصفر","h":"#C7A445"},{"n":"أزرق","h":"#6E7C8C"},{"n":"أبيض","h":"#F4EEDF"}]',50,true,'T-00004','',''],
  [10,'طقم أطفال قطن','أطفال',590,'shirt','#375A4B','طقم تيشرت وبنطلون قطن مريح، مناسب للعب طول اليوم.','2-3,4-5,6-7,8-9,10-11','[{"n":"أخضر","h":"#375A4B"},{"n":"رمادي","h":"#8B8674"}]',50,true,'T-00005','',''],
  [11,'جاكيت أطفال شتوي','أطفال',780,'jacket','#233F35','جاكيت دافئ ومقاوم للبرد، مبطن من الداخل براحة تامة.','4-5,6-7,8-9,10-11','[{"n":"كحلي","h":"#233F35"},{"n":"أحمر","h":"#7A2E2E"}]',50,true,'J-00003','',''],
  [12,'فستان بنوتي كاروهات','أطفال',690,'dress','#7A2E2E','فستان قطن بطبعة كاروهات كلاسيك، مناسب للمناسبات واليومي.','2-3,4-5,6-7,8-9','[{"n":"أحمر","h":"#7A2E2E"},{"n":"بيج","h":"#E4CD8B"}]',50,true,'D-00002','','']
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
function getCouponsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(COUPONS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(COUPONS_SHEET_NAME);
  return sheet;
}

/** شغّل الدالة دي مرة واحدة يدويًا من محرر الأبس سكريبت عشان تظبط كل الشيتات والعناوين. */
function setupHeaders() {
  const orders = getSheet_();
  orders.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  // خزّن عمود الموبايل في الأوردرات كنص عشان الصفر الأول ميضيعش
  const ordersPhoneCol = HEADERS.indexOf('الموبايل') + 1;
  const ordersMaxRows = Math.max(orders.getMaxRows() - 1, 1);
  orders.getRange(2, ordersPhoneCol, ordersMaxRows, 1).setNumberFormat('@');

  const products = getProductsSheet_();
  products.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
  if (products.getLastRow() < 2) {
    products.getRange(2, 1, SEED_PRODUCTS.length, PRODUCT_HEADERS.length).setValues(SEED_PRODUCTS);
  }

  const customers = getCustomersSheet_();
  customers.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
  // خزّن عمود الموبايل في العملاء كنص برضو لنفس السبب
  const custPhoneCol = CUSTOMER_HEADERS.indexOf('الموبايل') + 1;
  const custMaxRows = Math.max(customers.getMaxRows() - 1, 1);
  customers.getRange(2, custPhoneCol, custMaxRows, 1).setNumberFormat('@');

  const coupons = getCouponsSheet_();
  coupons.getRange(1, 1, 1, COUPON_HEADERS.length).setValues([COUPON_HEADERS]);
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

/* ---------------- Phone helper ----------------
 * لو جوجل شيت خزّن رقم الموبايل كرقم مش كنص، الصفر الأول بيضيع (01012345678 → 1012345678).
 * الدالة دي بتوحّد أي رقم موبايل (سواء متخزن بالصفر أو من غيره) لنفس الشكل عشان المقارنة تظبط.
 */
function normalizePhone_(v) {
  let s = String(v === null || v === undefined ? '' : v).trim();
  s = s.replace(/\D/g, ''); // أرقام بس
  if (s.length === 10 && s.charAt(0) !== '0') s = '0' + s; // الصفر الأول ضاع
  return s;
}

/* ================= doGet ================= */
/**
 * doGet بيخدم الحالات دي:
 *  - ?action=track&orderId=...&phone=...                 → تتبع أوردر (برقم الأوردر بس، أو الموبايل بس، أو الاتنين)
 *  - ?action=cancelRequest&orderId=...&phone=...          → تسجيل طلب إلغاء/تعديل
 *  - ?action=getProducts                                  → المنتجات المنشورة بس (للموقع العام)
 *  - ?action=adminAuth&password=...                       → التحقق من كلمة سر لوحة التحكم
 *  - ?action=adminGetProducts&password=...                → كل المنتجات (منشورة وغير منشورة) للوحة التحكم
 *  - ?action=adminGetCustomers&password=...                → قايمة العملاء المسجلين
 *  - ?action=adminGetOrders&password=...                   → كل الأوردرات (للوحة التحكم)
 *  - ?action=adminGetCoupons&password=...                  → كل الكوبونات (للوحة التحكم)
 *  - ?action=validateCoupon&code=...&phone=...&subtotal=... → التحقق من كوبون خصم وقت الشراء
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
  if (action === 'adminGetOrders') {
    return handleGetOrders_(e.parameter.password);
  }
  if (action === 'adminGetCoupons') {
    return handleGetCoupons_(e.parameter.password);
  }
  if (action === 'validateCoupon') {
    return handleValidateCoupon_(e);
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
  const phone = normalizePhone_(e.parameter.phone || '');

  if (action === 'track') {
    if (!orderId && !phone) {
      return jsonOut_({ found: false, error: 'اكتب رقم الأوردر أو رقم الموبايل' });
    }
    const matches = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowOrderId = String(row[idxOrderId] || '').trim();
      const rowPhone = normalizePhone_(row[idxPhone]);
      let ok = true;
      if (orderId && rowOrderId !== orderId) ok = false;
      if (phone && rowPhone !== phone) ok = false;
      if (ok) {
        matches.push({
          orderId: row[idxOrderId],
          date: row[idxDate],
          items: row[idxItems],
          total: row[idxTotal],
          paymentMethod: row[idxPayMethod],
          status: row[idxStatus] || 'قيد المراجعة'
        });
      }
    }
    if (matches.length === 0) return jsonOut_({ found: false });
    matches.reverse(); // الأحدث فوق
    // بنرجّع أول نتيجة في المستوى الأساسي برضو عشان يفضل شغال مع أي نسخة قديمة من الموقع
    const first = matches[0];
    const out = { found: true, orders: matches };
    out.orderId = first.orderId; out.date = first.date; out.items = first.items;
    out.total = first.total; out.paymentMethod = first.paymentMethod; out.status = first.status;
    return jsonOut_(out);
  }

  if (action === 'cancelRequest') {
    if (!orderId) {
      return jsonOut_({ ok: false, error: 'محتاجين رقم الأوردر عشان نقدر نلغيه/نعدله' });
    }
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowOrderId = String(row[idxOrderId] || '').trim();
      const rowPhone = normalizePhone_(row[idxPhone]);
      if (rowOrderId === orderId && (!phone || rowPhone === phone)) {
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
    stock: headers.indexOf('الكمية'), pub: headers.indexOf('منشور'),
    code: headers.indexOf('الكود'), image: headers.indexOf('الصورة'),
    discount: headers.indexOf('سعر الخصم')
  };

  const products = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row[idx.id] === '' || row[idx.id] === null || row[idx.id] === undefined) continue;
    const published = row[idx.pub] === true || String(row[idx.pub]).toUpperCase() === 'TRUE';
    if (!isAdmin && !published) continue;

    let colors = [];
    try { colors = JSON.parse(row[idx.colors] || '[]'); } catch (err) { colors = []; }
    colors = colors.map(function (c) {
      return { n: c.n || '', h: c.h || '#233F35', images: Array.isArray(c.images) ? c.images : [] };
    });

    // عمود 'الصورة' بقى بيخزن مصفوفة صور (JSON) بدل رابط واحد بس.
    // لو المنتج قديم ولسه متخزن فيه رابط واحد كنص عادي، بنحوّله تلقائيًا لمصفوفة من صورة واحدة.
    let images = [];
    const rawImg = idx.image > -1 ? String(row[idx.image] || '').trim() : '';
    if (rawImg) {
      try {
        const parsed = JSON.parse(rawImg);
        images = Array.isArray(parsed) ? parsed : [rawImg];
      } catch (err) {
        images = [rawImg]; // كان رابط واحد قديم قبل ميزة الألبوم
      }
    }

    const price = Number(row[idx.price]) || 0;
    const rawDiscount = idx.discount > -1 ? Number(row[idx.discount]) || 0 : 0;
    const discountPrice = (rawDiscount > 0 && rawDiscount < price) ? rawDiscount : 0;

    products.push({
      id: Number(row[idx.id]),
      name: row[idx.name],
      cat: row[idx.cat],
      price: price,
      discountPrice: discountPrice,
      type: row[idx.type] || 'shirt',
      tint: row[idx.tint] || '#233F35',
      desc: row[idx.desc] || '',
      sizes: String(row[idx.sizes] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      colors: colors,
      stock: Number(row[idx.stock]) || 0,
      published: !!published,
      code: idx.code > -1 ? String(row[idx.code] || '') : '',
      images: images,
      image: images[0] || '' // للتوافق مع أي نسخة قديمة بتستخدم p.image لغلاف واحد بس
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

function handleGetOrders_(password) {
  if (!checkAdmin_(password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOut_({ ok: true, orders: [] });

  const headers = values[0];
  const orders = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row[0]) continue; // صف فاضي
    const o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    if (!o['الحالة']) o['الحالة'] = 'قيد المراجعة';
    orders.push(o);
  }
  orders.reverse(); // الأحدث فوق
  return jsonOut_({ ok: true, orders: orders });
}

/* ---------------- Coupons ---------------- */
function couponIdx_(headers) {
  return {
    id: headers.indexOf('ID'),
    code: headers.indexOf('الكود'),
    type: headers.indexOf('نوع الخصم'),
    value: headers.indexOf('القيمة'),
    active: headers.indexOf('نشط'),
    vip: headers.indexOf('عملاء مميزون فقط (أرقام موبايل مفصولة بفاصلة، سيبه فاضي للكل)'),
    expiry: headers.indexOf('تاريخ الانتهاء (YYYY-MM-DD، اختياري)'),
    limit: headers.indexOf('الحد الأقصى للاستخدام (0 = بلا حدود)'),
    used: headers.indexOf('عدد مرات الاستخدام')
  };
}

function handleGetCoupons_(password) {
  if (!checkAdmin_(password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOut_({ ok: true, coupons: [] });
  const idx = couponIdx_(values[0]);
  const coupons = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row[idx.id] === '' || row[idx.id] === null || row[idx.id] === undefined) continue;
    coupons.push({
      id: Number(row[idx.id]),
      code: String(row[idx.code] || ''),
      type: row[idx.type] || 'نسبة',
      value: Number(row[idx.value]) || 0,
      active: row[idx.active] === true || String(row[idx.active]).toUpperCase() === 'TRUE',
      vipPhones: String(row[idx.vip] || ''),
      expiry: row[idx.expiry] ? String(row[idx.expiry]) : '',
      limit: Number(row[idx.limit]) || 0,
      used: Number(row[idx.used]) || 0
    });
  }
  return jsonOut_({ ok: true, coupons: coupons });
}

function handleAddCoupon_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const code = String(data.code || '').trim().toUpperCase();
  if (!code) return jsonOut_({ ok: false, error: 'اكتب كود الكوبون' });

  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  const idx = couponIdx_(values[0]);
  let maxId = 0;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.code] || '').trim().toUpperCase() === code) {
      return jsonOut_({ ok: false, error: 'فيه كوبون بنفس الكود ده خالص' });
    }
    const id = Number(values[r][idx.id]);
    if (id > maxId) maxId = id;
  }
  const newId = maxId + 1;
  const vipPhones = normalizePhoneList_(data.vipPhones);
  sheet.appendRow([
    newId, code, data.type === 'مبلغ' ? 'مبلغ' : 'نسبة', Number(data.value) || 0,
    data.active !== false, vipPhones, data.expiry || '', Number(data.limit) || 0, 0
  ]);
  return jsonOut_({ ok: true, id: newId });
}

function handleUpdateCoupon_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const code = String(data.code || '').trim().toUpperCase();
  if (!code) return jsonOut_({ ok: false, error: 'اكتب كود الكوبون' });

  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  const idx = couponIdx_(values[0]);
  for (let r = 1; r < values.length; r++) {
    if (Number(values[r][idx.id]) === Number(data.id)) {
      // امنع تكرار نفس الكود مع كوبون تاني
      for (let k = 1; k < values.length; k++) {
        if (k !== r && String(values[k][idx.code] || '').trim().toUpperCase() === code) {
          return jsonOut_({ ok: false, error: 'فيه كوبون تاني بنفس الكود ده' });
        }
      }
      const vipPhones = normalizePhoneList_(data.vipPhones);
      const keepUsed = Number(values[r][idx.used]) || 0;
      sheet.getRange(r + 1, 1, 1, COUPON_HEADERS.length).setValues([[
        Number(data.id), code, data.type === 'مبلغ' ? 'مبلغ' : 'نسبة', Number(data.value) || 0,
        data.active !== false, vipPhones, data.expiry || '', Number(data.limit) || 0, keepUsed
      ]]);
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'الكوبون مش موجود' });
}

function handleDeleteCoupon_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  const idx = couponIdx_(values[0]);
  for (let r = 1; r < values.length; r++) {
    if (Number(values[r][idx.id]) === Number(data.id)) {
      sheet.deleteRow(r + 1);
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'الكوبون مش موجود' });
}

function normalizePhoneList_(str) {
  return String(str || '')
    .split(',')
    .map(function (p) { return normalizePhone_(p); })
    .filter(Boolean)
    .join(',');
}

/** بيتحقق من صلاحية كوبون من غير ما يزوّد عداد الاستخدام (للمعاينة وقت كتابة الكود). */
function handleValidateCoupon_(e) {
  const code = String(e.parameter.code || '').trim().toUpperCase();
  const phone = normalizePhone_(e.parameter.phone || '');
  const subtotal = Number(e.parameter.subtotal) || 0;
  if (!code) return jsonOut_({ ok: true, valid: false, reason: 'اكتب كود الخصم' });

  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOut_({ ok: true, valid: false, reason: 'الكود مش موجود' });
  const idx = couponIdx_(values[0]);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (String(row[idx.code] || '').trim().toUpperCase() === code) {
      const check = checkCouponEligibility_(row, idx, phone);
      if (!check.valid) return jsonOut_({ ok: true, valid: false, reason: check.reason });
      const discount = computeDiscount_(check.type, check.value, subtotal);
      return jsonOut_({ ok: true, valid: true, code: code, type: check.type, value: check.value, discount: discount });
    }
  }
  return jsonOut_({ ok: true, valid: false, reason: 'الكود مش موجود' });
}

function checkCouponEligibility_(row, idx, normalizedPhone) {
  const active = row[idx.active] === true || String(row[idx.active]).toUpperCase() === 'TRUE';
  if (!active) return { valid: false, reason: 'الكوبون متوقف حاليًا' };

  const expiry = row[idx.expiry] ? String(row[idx.expiry]).trim() : '';
  if (expiry) {
    const expiryDate = new Date(expiry);
    if (!isNaN(expiryDate.getTime())) {
      const endOfDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate(), 23, 59, 59);
      if (new Date() > endOfDay) return { valid: false, reason: 'الكوبون منتهي الصلاحية' };
    }
  }

  const limit = Number(row[idx.limit]) || 0;
  const used = Number(row[idx.used]) || 0;
  if (limit > 0 && used >= limit) return { valid: false, reason: 'الكوبون وصل للحد الأقصى للاستخدام' };

  const vipList = String(row[idx.vip] || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
  if (vipList.length > 0) {
    if (!normalizedPhone || vipList.indexOf(normalizedPhone) === -1) {
      return { valid: false, reason: 'الكوبون ده مخصص لعملاء مميزين بس' };
    }
  }

  return { valid: true, type: row[idx.type] || 'نسبة', value: Number(row[idx.value]) || 0 };
}

function computeDiscount_(type, value, subtotal) {
  if (subtotal <= 0) return 0;
  let discount = 0;
  if (type === 'مبلغ') discount = value;
  else discount = (subtotal * value) / 100;
  discount = Math.max(0, Math.min(discount, subtotal));
  return Math.round(discount);
}

/** بيتحقق من كوبون ويزوّد عداد الاستخدام — بيتنادى وقت تسجيل أوردر جديد بس. */
function applyCouponToOrder_(codeRaw, phoneRaw, subtotal) {
  const code = String(codeRaw || '').trim().toUpperCase();
  if (!code) return { valid: false };
  const phone = normalizePhone_(phoneRaw);

  const sheet = getCouponsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { valid: false };
  const idx = couponIdx_(values[0]);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (String(row[idx.code] || '').trim().toUpperCase() === code) {
      const check = checkCouponEligibility_(row, idx, phone);
      if (!check.valid) return { valid: false, reason: check.reason };
      const discount = computeDiscount_(check.type, check.value, subtotal);
      const usedCell = sheet.getRange(r + 1, idx.used + 1);
      usedCell.setValue((Number(row[idx.used]) || 0) + 1);
      return { valid: true, code: code, discount: discount };
    }
  }
  return { valid: false };
}

/* ================= doPost ================= */
/**
 * doPost بيتعرف على العملية من خلال data.action:
 *  - 'addProduct' / 'updateProduct' / 'deleteProduct'  → عمليات لوحة التحكم (لازم password صحيح)
 *  - 'uploadProductImage'                               → رفع صورة منتج من اللوحة (لازم password صحيح)
 *  - 'addCoupon' / 'updateCoupon' / 'deleteCoupon'      → عمليات الكوبونات (لازم password صحيح)
 *  - 'registerCustomer'                                 → تسجيل عميل جديد (بدون password)
 *  - 'updateOrderStatus'                                → تغيير حالة أوردر معين (لازم password صحيح)
 *  - من غير action (زي ما الموقع بيبعت أوردر عادي)      → تسجيل أوردر جديد (السلوك الأصلي)
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'addProduct') return handleAddProduct_(data);
  if (data.action === 'updateProduct') return handleUpdateProduct_(data);
  if (data.action === 'deleteProduct') return handleDeleteProduct_(data);
  if (data.action === 'uploadProductImage') return handleUploadProductImage_(data);
  if (data.action === 'addCoupon') return handleAddCoupon_(data);
  if (data.action === 'updateCoupon') return handleUpdateCoupon_(data);
  if (data.action === 'deleteCoupon') return handleDeleteCoupon_(data);
  if (data.action === 'registerCustomer') return handleRegisterCustomer_(data);
  if (data.action === 'updateOrderStatus') return handleUpdateOrderStatus_(data);

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

  let couponCode = '';
  let discountAmount = 0;
  if (data.couponCode) {
    const custPhone = data.customer ? data.customer.phone : '';
    const result = applyCouponToOrder_(data.couponCode, custPhone, Number(data.subtotal) || 0);
    if (result.valid) {
      couponCode = result.code;
      discountAmount = result.discount;
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
    'قيد المراجعة',
    couponCode,
    discountAmount
  ]);

  // خزّن رقم الموبايل صراحة كنص عشان الصفر الأول ميضيعش حتى لو عمود الشيت مش متظبط كـ"نص"
  try {
    const lastRow = sheet.getLastRow();
    const phoneCol = HEADERS.indexOf('الموبايل') + 1;
    const cell = sheet.getRange(lastRow, phoneCol);
    cell.setNumberFormat('@');
    cell.setValue(String(data.customer.phone || ''));
  } catch (err) { /* تجاهل أي خطأ هنا عشان ميوقفش تسجيل الأوردر */ }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, discount: discountAmount }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * بيولّد كود جديد فريد للمنتج حسب نوعه (shirt→T, pants→P, dress→D, jacket→J).
 * بيدور على أكبر رقم متسلسل مستخدم بالفعل مع نفس البادئة في شيت المنتجات ويزود عليه 1.
 */
function generateProductCode_(type, values) {
  const headers = values[0] || [];
  const idxCode = headers.indexOf('الكود');
  const prefix = TYPE_PREFIX[type] || 'X';
  let maxNum = 0;
  if (idxCode > -1) {
    for (let r = 1; r < values.length; r++) {
      const code = String(values[r][idxCode] || '');
      if (code.indexOf(prefix + '-') === 0) {
        const n = parseInt(code.split('-')[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
  }
  const next = maxNum + 1;
  return prefix + '-' + String(next).padStart(CODE_PAD, '0');
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
  const type = data.type || 'shirt';
  const code = generateProductCode_(type, values);
  sheet.appendRow([
    newId, data.name || '', data.cat || 'رجالي', Number(data.price) || 0, type,
    data.tint || '#233F35', data.desc || '', data.sizes || '', JSON.stringify(data.colors || []),
    Number(data.stock) || 0, data.published !== false,
    code, JSON.stringify(data.images || []), Number(data.discountPrice) || 0
  ]);
  return jsonOut_({ ok: true, id: newId, code: code });
}

function handleUpdateProduct_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idxCode = headers.indexOf('الكود');
  for (let r = 1; r < values.length; r++) {
    if (Number(values[r][0]) === Number(data.id)) {
      const type = data.type || 'shirt';
      // الكود ثابت مدى عمر المنتج؛ لو المنتج القديم مالوش كود لسه (اتضاف قبل الميزة دي) بيتولد له واحد أول مرة يتعدل فيها.
      let code = idxCode > -1 ? String(values[r][idxCode] || '') : '';
      if (!code) code = generateProductCode_(type, values);
      sheet.getRange(r + 1, 1, 1, PRODUCT_HEADERS.length).setValues([[
        Number(data.id), data.name || '', data.cat || 'رجالي', Number(data.price) || 0, type,
        data.tint || '#233F35', data.desc || '', data.sizes || '', JSON.stringify(data.colors || []),
        Number(data.stock) || 0, data.published !== false,
        code, JSON.stringify(data.images || []), Number(data.discountPrice) || 0
      ]]);
      return jsonOut_({ ok: true, code: code });
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

function handleUploadProductImage_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  if (!data.imageBase64) return jsonOut_({ ok: false, error: 'مفيش صورة اتبعتت' });
  try {
    const url = saveProductImage_(data.imageBase64, data.fileName);
    return jsonOut_({ ok: true, url: url });
  } catch (err) {
    return jsonOut_({ ok: false, error: 'حصل خطأ في رفع الصورة: ' + err.message });
  }
}

function handleRegisterCustomer_(data) {
  const sheet = getCustomersSheet_();
  sheet.appendRow([
    data.name || '', data.phone || '', data.email || '',
    hashPassword_(data.password || ''), new Date().toLocaleString('ar-EG')
  ]);
  // خزّن رقم الموبايل كنص عشان الصفر الأول ميضيعش
  try {
    const lastRow = sheet.getLastRow();
    const phoneCol = CUSTOMER_HEADERS.indexOf('الموبايل') + 1;
    const cell = sheet.getRange(lastRow, phoneCol);
    cell.setNumberFormat('@');
    cell.setValue(String(data.phone || ''));
  } catch (err) { /* تجاهل */ }
  return jsonOut_({ ok: true });
}

function handleUpdateOrderStatus_(data) {
  if (!checkAdmin_(data.password)) return jsonOut_({ ok: false, error: 'unauthorized' });
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idxOrderId = headers.indexOf('رقم الأوردر');
  const idxStatus = headers.indexOf('الحالة');
  const orderId = String(data.orderId || '').trim();

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idxOrderId]).trim() === orderId) {
      sheet.getRange(r + 1, idxStatus + 1).setValue(data.status || 'قيد المراجعة');
      return jsonOut_({ ok: true });
    }
  }
  return jsonOut_({ ok: false, error: 'الأوردر مش موجود' });
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

function saveProductImage_(base64DataUrl, fileName) {
  const existing = DriveApp.getFoldersByName(PRODUCT_IMAGES_FOLDER_NAME);
  const folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(PRODUCT_IMAGES_FOLDER_NAME);

  const match = String(base64DataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  const mime = match ? match[1] : 'image/jpeg';
  const raw = match ? match[2] : base64DataUrl;
  const bytes = Utilities.base64Decode(raw);
  const safeName = (fileName || ('product_' + Date.now() + '.jpg')).replace(/[^\w.\-]/g, '_');
  const blob = Utilities.newBlob(bytes, mime, safeName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
