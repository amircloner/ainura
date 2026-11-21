import type { HttpTypes, ProductFashionMetadata } from "@medusajs/types"

export type CatalogBrand = Pick<
  HttpTypes.StoreBrand,
  | "id"
  | "name"
  | "handle"
  | "logo_url"
  | "banner_url"
  | "description"
  | "is_featured"
  | "country"
>
export type CatalogCategory = {
  handle: string
  name: string
  parent?: CatalogCategory
}
export type CatalogReview = Pick<
  HttpTypes.StoreProductReview,
  | "id"
  | "customer_name"
  | "rating"
  | "title"
  | "content"
  | "pros"
  | "cons"
  | "is_recommended"
  | "verified_purchase"
  | "created_at"
>
export type ReviewStats = HttpTypes.StoreProductReviewStats
export type CatalogVariant = {
  id: string
  color: string
  size: string
  price: number
  originalPrice: number
  available: boolean
}
export type CatalogProduct = {
  id: string
  handle: string
  title: string
  description: string
  category: CatalogCategory
  brand: CatalogBrand | null
  images: string[]
  variants: CatalogVariant[]
  metadata: ProductFashionMetadata
  currency?: string
  created_at: string
  featured?: boolean
  bestSeller?: boolean
  demo?: boolean
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=82`
const shoe = photo("1543163521-1bf539c55dd2")
const coat = photo("1543076447-215ad9ba6923")
const bag = photo("1584917865442-de89df76afd3")
const shirt = photo("1521572163474-6864f9cf17ab")
const sneaker = photo("1542291026-7eec264c27ff")
const beauty = photo("1608248543803-ba4f8c70ae0b")
const jewelry = photo("1515562141207-7a88fb7ce338")

export const demoBrands: CatalogBrand[] = [
  ["yelsan", "یلسان", shoe],
  ["dorsa", "درسا", bag],
  ["mashhad-leather", "چرم مشهد", coat],
  ["novin-leather", "نوین چرم", bag],
  ["lc-man", "ال سی من", shirt],
  ["sarak", "سارک", coat],
].map(([handle, name, banner_url]) => ({
  id: `demo_brand_${handle}`,
  name,
  handle,
  banner_url,
  country: "ایران",
  is_featured: true,
  description: `مجموعه‌ای از انتخاب‌های ${name} در آینورا.`,
}))

const women = { handle: "women", name: "زنانه" }
const men = { handle: "men", name: "مردانه" }
const kids = { handle: "kids", name: "بچگانه" }
const care = { handle: "beauty", name: "زیبایی و سلامت" }
const womenShoes = { handle: "women-shoes", name: "کفش زنانه", parent: women }
const casual = {
  handle: "women-casual-shoes",
  name: "کفش روزمره",
  parent: womenShoes,
}
const bags = { handle: "bags-shoes", name: "کیف و کفش", parent: women }
const accessories = { handle: "accessories", name: "اکسسوری", parent: women }
export const demoCategories = [
  women,
  men,
  kids,
  care,
  womenShoes,
  casual,
  bags,
  accessories,
]

const shoeSizes = ["36", "37", "38", "39", "40", "41"]
const apparelSizes = ["S", "M", "L", "XL", "XXL"]
const single = ["تک‌سایز"]
const claraMetadata: ProductFashionMetadata = {
  product_code: "KLR-601",
  specifications: [
    ["جنس رویه", "چرم طبیعی گاوی"],
    ["جنس آستر", "چرم طبیعی"],
    ["جنس زیره", "پلی‌اورتان سبک"],
    ["ارتفاع پاشنه", "۳ سانتی‌متر"],
    ["نوع کفی", "نرم و قابل تعویض"],
    ["فرم پنجه", "گرد"],
    ["نحوه بسته شدن", "بدون بند"],
    ["کشور تولیدکننده", "ایران"],
  ].map(([label, value]) => ({ label, value })),
  size_guide: {
    columns: ["سایز اروپا (EU)", "طول پا (سانتی‌متر)"],
    rows: shoeSizes.map((size, index) => [size, (23 + index * 0.6).toFixed(1)]),
    measurement_note:
      "پاشنه را به دیوار تکیه دهید. فاصله دیوار تا بلندترین انگشت را اندازه بگیرید و اندازه پای بزرگ‌تر را ملاک قرار دهید.",
  },
  seller_name: "فروشنده رسمی برند یلسان",
  warranty: "گارانتی اصالت و سلامت فیزیکی کالا",
  lead_time_days: 1,
  return_policy: "۷ روز ضمانت بازگشت",
}

const items: [
  string,
  string,
  CatalogCategory,
  number,
  string,
  number,
  number,
  string[]?,
][] = [
  [
    "yelsan-clara-klr-601",
    "کفش زنانه چرم یلسان مدل کلارا کد KLR-601",
    casual,
    0,
    shoe,
    2490000,
    3190000,
    shoeSizes,
  ],
  [
    "dorsa-studio-bag",
    "کیف دوشی چرم درسا مدل استودیو",
    bags,
    1,
    bag,
    3790000,
    4490000,
  ],
  [
    "sarak-tailored-coat",
    "مانتو زنانه سارک مدل آوا",
    women,
    5,
    coat,
    1890000,
    2350000,
    apparelSizes,
  ],
  [
    "novin-sienna-flat",
    "کفش تخت چرم زنانه نوین چرم",
    womenShoes,
    3,
    shoe,
    1320000,
    1650000,
    shoeSizes,
  ],
  [
    "mashhad-city-coat",
    "کت مردانه چرم مشهد مدل سیتی",
    men,
    2,
    coat,
    5900000,
    6900000,
    apparelSizes,
  ],
  [
    "lc-linen-shirt",
    "پیراهن لینن مردانه ال سی من",
    men,
    4,
    shirt,
    895000,
    1120000,
    apparelSizes,
  ],
  [
    "lc-classic-tee",
    "تیشرت یقه گرد مردانه ال سی من",
    men,
    4,
    shirt,
    549000,
    549000,
    apparelSizes,
  ],
  ["novin-weekender", "کیف دستی سفر نوین چرم", bags, 3, bag, 4250000, 4900000],
  [
    "yelsan-dena-sneaker",
    "کفش روزمره زنانه یلسان مدل دنا",
    casual,
    0,
    sneaker,
    1950000,
    2290000,
    shoeSizes,
  ],
  [
    "sarak-kids-cotton",
    "تیشرت نخی بچگانه سارک",
    kids,
    5,
    shirt,
    459000,
    590000,
    ["104", "116", "128", "140"],
  ],
  [
    "sarak-kids-jacket",
    "ژاکت بچگانه سارک مدل باران",
    kids,
    5,
    coat,
    990000,
    990000,
    ["104", "116", "128", "140"],
  ],
  [
    "yelsan-kids-trainer",
    "کفش ورزشی بچگانه یلسان",
    kids,
    0,
    sneaker,
    1190000,
    1490000,
    ["28", "29", "30", "31", "32"],
  ],
  [
    "dorsa-silver-necklace",
    "گردنبند مینیمال درسا",
    accessories,
    1,
    jewelry,
    685000,
    685000,
  ],
  [
    "mashhad-leather-wallet",
    "کیف پول چرم مشهد مدل ویرا",
    accessories,
    2,
    bag,
    820000,
    1050000,
  ],
  [
    "sarak-hydrating-cream",
    "کرم آبرسان روزانه سارک",
    care,
    5,
    beauty,
    395000,
    495000,
  ],
  [
    "sarak-care-set",
    "ست مراقبت پوست سارک مدل روتین",
    care,
    5,
    beauty,
    880000,
    960000,
  ],
  [
    "dorsa-evening-bag",
    "کیف مجلسی چرم درسا مدل آینه",
    bags,
    1,
    bag,
    2950000,
    2950000,
  ],
]

export const demoProducts: CatalogProduct[] = items.map(
  (
    [
      handle,
      title,
      category,
      brand,
      image,
      price,
      originalPrice,
      sizes = single,
    ],
    index
  ) => ({
    id: `demo_prod_${handle}`,
    handle,
    title,
    category,
    brand: demoBrands[brand],
    description:
      index === 0
        ? "کلارا با رویه چرم طبیعی گاوی، پنجه گرد و زیره سبک برای استفاده روزمره طراحی شده است. آستر چرمی و کفی نرم به راحتی پا در طول روز کمک می‌کنند."
        : `${title}، انتخابی برای ترکیب‌های روزمره و هدیه. جزئیات و اندازه‌های موجود را در همین صفحه ببینید.`,
    images:
      index === 0
        ? [
            image,
            photo("1515347619252-60a4bf4fff4f"),
            photo("1595950653106-6c9ebd614d3a"),
          ]
        : [image],
    variants: (index === 0
      ? ["زرشکی", "مشکی", "عسلی"]
      : index % 2
        ? ["مشکی", "کرم"]
        : ["مشکی", "سرمه‌ای"]
    ).flatMap((color, colorIndex) =>
      sizes.map((size, sizeIndex) => ({
        id: `demo_variant_${handle}_${colorIndex}_${size}`,
        color,
        size,
        price,
        originalPrice,
        available: sizeIndex !== 5 || colorIndex !== 1,
      }))
    ),
    metadata:
      index === 0
        ? claraMetadata
        : {
            seller_name: `فروشنده رسمی برند ${demoBrands[brand].name}`,
            lead_time_days: 2,
            return_policy: "۷ روز ضمانت بازگشت",
          },
    created_at: new Date(Date.UTC(2026, 9, 31 - index)).toISOString(),
    featured: index < 4,
    bestSeller: index % 3 === 0,
    demo: true,
  })
)

export const demoReviews: CatalogReview[] = [
  [
    "نسترن",
    5,
    "راحت و خوش‌دوخت",
    "بعد از یک روز پیاده‌روی، پاهایم خسته نشد. رنگ زرشکی از نزدیک خیلی زیباست.",
  ],
  [
    "سارا",
    5,
    "کیفیت چرم خوب است",
    "سایز را طبق جدول انتخاب کردم و کاملاً اندازه بود.",
  ],
  [
    "مهسا",
    4,
    "مناسب استفاده روزانه",
    "سبک و نرم است؛ چند بار اول کمی طول کشید تا قالب پا را بگیرد.",
  ],
  ["آیدا", 5, "ارسال سریع", "بسته‌بندی سالم بود و کفش با تصویر مطابقت داشت."],
  ["نیلوفر", 4, "خوش‌فرم", "برای محل کار انتخاب راحتی است."],
  ["پریسا", 5, "خرید دوباره", "رنگ مشکی را هم برای مادرم خریدم."],
  ["تارا", 4, "زیره خوب", "روی سطح صاف لیز نمی‌خورد."],
  [
    "رها",
    2,
    "برای پنجه پهن مناسب نبود",
    "به نظرم بهتر است قبل از خرید راهنمای سایز را دقیق بخوانید.",
  ],
].map(([name, rating, title, content], i) => ({
  id: `demo_review_${i}`,
  customer_name: String(name),
  rating: Number(rating),
  title: String(title),
  content: String(content),
  pros: i < 4 ? ["کیفیت دوخت", "وزن کم"] : [],
  cons: i === 7 ? ["پنجه نسبتاً باریک"] : [],
  is_recommended: i < 7,
  verified_purchase: true,
  created_at: new Date(Date.UTC(2026, 9, 16 - i)).toISOString(),
}))
