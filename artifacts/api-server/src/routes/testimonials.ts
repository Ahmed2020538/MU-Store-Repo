import { Router } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();
let cache: { data: any[]; time: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

const SEED = [
  { customerName: "نور أحمد", customerCity: "القاهرة", rating: 5, reviewText: "I ordered the beige heels and they arrived in 24 hours! The quality is stunning — soft genuine leather and a perfect finish. I've never had shoes this comfortable.", reviewTextAr: "طلبت الهيلز البيج ووصلت في ٢٤ ساعة! الجودة رائعة — جلد طبيعي ناعم وتشطيب مثالي.", productName: "Beige Leather Heels", verifiedPurchase: 1, featured: 1, displayOrder: 0 },
  { customerName: "سارة محمود", customerCity: "الإسكندرية", rating: 5, reviewText: "My new MU bag gets compliments everywhere I go. The craftsmanship is stunning and the price is completely fair for this level of luxury.", reviewTextAr: "حقيبتي الجديدة من MU بتاخد إعجاب كل الناس. الشغل يدوي رائع والسعر مناسب جداً لهذا المستوى من الجودة.", productName: "Champagne Tote Bag", verifiedPurchase: 1, featured: 1, displayOrder: 1 },
  { customerName: "هبة خليل", customerCity: "الغردقة", rating: 4, reviewText: "Beautiful collection with unique designs you won't find anywhere else. Delivery was fast and the packaging felt so luxurious — like opening a gift.", reviewTextAr: "مجموعة جميلة جداً بتصميمات مش هتلاقيها في أي محل. التوصيل كان سريع والتغليف كان فخم جداً.", verifiedPurchase: 1, featured: 1, displayOrder: 2 },
  { customerName: "رنا حسن", customerCity: "المنصورة", rating: 5, reviewText: "The flat sandals are so comfortable — I wore them all day at work without any pain at all. The style is elegant and modern. Highly recommend to everyone!", reviewTextAr: "الصندل الفلات مريح جداً — لبسته يوم كامل في الشغل من غير أي ألم! الشكل أنيق وعصري في نفس الوقت.", productName: "Navy Flat Sandals", verifiedPurchase: 1, featured: 1, displayOrder: 3 },
  { customerName: "مريم مصطفى", customerCity: "أسوان", rating: 5, reviewText: "I ordered as a gift for my mother and she cried tears of joy when she opened it! The packaging alone is presentation-worthy. Thank you MU for making her day special.", reviewTextAr: "أهديت لأمي ودمعت من الفرحة لما فتحت الكرتونة! التغليف لوحده يستاهل. شكراً MU على إسعادها.", verifiedPurchase: 1, featured: 1, displayOrder: 4 },
  { customerName: "دينا عمر", customerCity: "القاهرة", rating: 5, reviewText: "The ankle boots are exactly as shown in photos — maybe even better in person! Premium leather and the gold MU logo inside is such a beautiful detail.", reviewTextAr: "البوت زي بالظبط اللي في الصور — بل أجمل في الواقع! جلد فاخر وشعار MU الذهبي داخل الحذاء تفصيلة جميلة.", productName: "Black Ankle Boots", verifiedPurchase: 1, featured: 1, displayOrder: 5 },
  { customerName: "ياسمين سامي", customerCity: "الإسكندرية", rating: 4, reviewText: "Customer service went above and beyond to help me choose the right size. The shoes fit perfectly! So happy with my purchase — will definitely be ordering again.", reviewTextAr: "خدمة العملاء ساعدتني أختار المقاس الصح. الحذاء جه بالظبط! سعيدة جداً بالشراء وهشتري تاني.", verifiedPurchase: 1, featured: 1, displayOrder: 6 },
  { customerName: "أميرة طارق", customerCity: "القاهرة", rating: 5, reviewText: "Free shipping, lightning-fast delivery, and packaging that looks like it's from a Parisian boutique. MU genuinely treats its customers like royalty.", reviewTextAr: "شحن مجاني، توصيل سريع جداً، وتغليف كأنه من بوتيك باريسي. MU بتعامل عملائها زي الملوك.", verifiedPurchase: 1, featured: 1, displayOrder: 7 },
];

async function ensureSeed() {
  const [existing] = await db.select().from(testimonialsTable).limit(1);
  if (!existing) await db.insert(testimonialsTable).values(SEED);
}

router.get("/testimonials", async (_req, res) => {
  if (cache && Date.now() - cache.time < CACHE_TTL) { res.json(cache.data); return; }
  await ensureSeed();
  const items = await db.select().from(testimonialsTable).where(eq(testimonialsTable.featured, 1)).orderBy(asc(testimonialsTable.displayOrder));
  cache = { data: items, time: Date.now() };
  res.json(items);
});

router.get("/admin/testimonials", requireAdmin, async (_req, res) => {
  const items = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.displayOrder));
  res.json(items);
});

router.post("/admin/testimonials", requireAdmin, async (req, res) => {
  const { customerName, customerCity, customerAvatarUrl, rating, reviewText, reviewTextAr, productName, verifiedPurchase, featured, displayOrder } = req.body;
  const [item] = await db.insert(testimonialsTable).values({ customerName, customerCity, customerAvatarUrl, rating: rating ?? 5, reviewText, reviewTextAr, productName, verifiedPurchase: verifiedPurchase ?? 1, featured: featured ?? 1, displayOrder: displayOrder ?? 0 }).returning();
  cache = null;
  res.json(item);
});

router.put("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const fields = req.body;
  const [item] = await db.update(testimonialsTable).set(fields).where(eq(testimonialsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  cache = null;
  res.json(item);
});

router.delete("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
  cache = null;
  res.json({ success: true });
});

export default router;
