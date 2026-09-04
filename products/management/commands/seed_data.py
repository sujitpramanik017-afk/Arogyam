import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from products.models import Category, Collection, Product, ProductImage
from reviews.models import Review
from core.models import Banner
from coupons.models import Coupon
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds the database with realistic demo data for Rachana\'s Collection'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Clearing old data..."))
        
        # Clear existing data
        Review.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Collection.objects.all().delete()
        Banner.objects.all().delete()
        Coupon.objects.all().delete()
        
        # Ensure superuser exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@rachanacollection.com', 'admin123')
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' created with password 'admin123'"))

        # Create demo customers
        customers = []
        customer_names = ['sujit', 'rachana', 'amit', 'priya', 'siddharth']
        for name in customer_names:
            if not User.objects.filter(username=name).exists():
                u = User.objects.create_user(name, f"{name}@example.com", 'password123')
                customers.append(u)
            else:
                customers.append(User.objects.get(username=name))

        self.stdout.write(self.style.SUCCESS("Customer accounts verified/created."))

        # 1. Seed Categories (8 categories)
        categories_data = [
            {"name": "Silk Sarees", "desc": "Luxurious, pure silk sarees representing timeless Indian elegance."},
            {"name": "Banarasi Sarees", "desc": "Exquisite weaves from Varanasi, adorned with zari brocades."},
            {"name": "Cotton Sarees", "desc": "Lightweight, breathable cottons perfect for everyday wear and warm climates."},
            {"name": "Kanjivaram Sarees", "desc": "Rich silk sarees from Kanchipuram, characterized by wide contrast borders."},
            {"name": "Georgette Sarees", "desc": "Flowy, semi-sheer sarees that drape beautifully for party wear."},
            {"name": "Chiffon Sarees", "desc": "Ultra-light, elegant sarees ideal for evening parties and gatherings."},
            {"name": "Party Wear", "desc": "Glamorous contemporary designs with sequins, embroidery, and modern cuts."},
            {"name": "Wedding Collection", "desc": "Opulent bridal sarees crafted for your most special moments."}
        ]

        categories = {}
        for c_data in categories_data:
            cat = Category.objects.create(
                name=c_data["name"],
                description=c_data["desc"],
                is_active=True
            )
            categories[c_data["name"]] = cat
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(categories)} Categories."))

        # 2. Seed Collections (5 collections)
        collections_data = [
            {"name": "Wedding Collection", "desc": "Celebrate your special moments with royal brocades and heavy embroidery."},
            {"name": "Festive Collection", "desc": "Grace every celebration in bright colors and shimmering textures."},
            {"name": "Everyday Elegance", "desc": "Effortless, lightweight sarees for everyday comfort and beauty."},
            {"name": "Luxury Silk", "desc": "Handcrafted pure silk elegance curated from weavers across India."},
            {"name": "Royal Heritage", "desc": "Vintage patterns and weaves that tell stories of legacy craftsmanship."}
        ]

        collections = {}
        for col_data in collections_data:
            col = Collection.objects.create(
                name=col_data["name"],
                description=col_data["desc"],
                is_active=True
            )
            collections[col_data["name"]] = col
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(collections)} Collections."))

        # 3. Seed Banners
        Banner.objects.create(
            title="Tradition Woven Into Elegance",
            subtitle="Explore our premium collection of authentic Banarasi and Kanjivaram silks.",
            image="",
            link="/products/",
            order=1,
            is_active=True
        )
        Banner.objects.create(
            title="The Wedding Edit",
            subtitle="Stunning bridal sarees for the modern bride who values heritage.",
            image="",
            link="/products/?occasion=Wedding",
            order=2,
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS("Seeded Homepage Banners."))

        # 4. Seed Coupons
        Coupon.objects.create(
            code="FESTIVE15",
            discount_percent=15,
            max_discount=1500.00,
            min_order_amount=2000.00,
            start_date=timezone.now() - timedelta(days=2),
            expiry_date=timezone.now() + timedelta(days=30),
            usage_limit=100,
            is_active=True
        )
        Coupon.objects.create(
            code="WELCOME10",
            discount_percent=10,
            max_discount=500.00,
            min_order_amount=1000.00,
            start_date=timezone.now() - timedelta(days=2),
            expiry_date=timezone.now() + timedelta(days=90),
            usage_limit=500,
            is_active=True
        )
        Coupon.objects.create(
            code="ROYAL500",
            discount_percent=5,
            max_discount=500.00,
            min_order_amount=5000.00,
            start_date=timezone.now() - timedelta(days=1),
            expiry_date=timezone.now() + timedelta(days=15),
            usage_limit=50,
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS("Seeded Coupons."))

        # 5. Seed Sarees (30+ products)
        sarees = [
            # Silk / Banarasi
            {
                "name": "Banarasi Royal Gold Saree",
                "category": "Banarasi Sarees",
                "collection": "Royal Heritage",
                "price": 14999.00,
                "compare_at_price": 18500.00,
                "fabric": "Banarasi Silk",
                "color": "Gold",
                "occasion": "Wedding",
                "saree_type": "Banarasi",
                "stock": 5,
                "featured": True,
                "bestseller": True,
                "new": False,
                "desc": "An opulent pure Banarasi silk saree woven with fine gold zari threads, perfect for bridal wear. The intricate floral motifs (Konas) are handcrafted by master weavers over 3 months."
            },
            {
                "name": "Kanjivaram Heritage Silk",
                "category": "Kanjivaram Sarees",
                "collection": "Luxury Silk",
                "price": 12500.00,
                "compare_at_price": 15000.00,
                "fabric": "Pure Silk",
                "color": "Crimson Red",
                "occasion": "Wedding",
                "saree_type": "Kanjivaram",
                "stock": 8,
                "featured": True,
                "bestseller": True,
                "new": False,
                "desc": "A vibrant crimson Kanjivaram saree featuring a broad temple border and traditional check patterns (Kattam). Crafted in South India using the finest double-warp mulberry silk."
            },
            {
                "name": "Crimson Wedding Silk Saree",
                "category": "Wedding Collection",
                "collection": "Wedding Collection",
                "price": 18999.00,
                "compare_at_price": 24000.00,
                "fabric": "Katan Silk",
                "color": "Crimson Red",
                "occasion": "Wedding",
                "saree_type": "Banarasi",
                "stock": 3,
                "featured": True,
                "bestseller": False,
                "new": True,
                "desc": "An ornate wedding saree decorated with heavy zardozi embroidery on the border and pallu. Designed for the traditional Indian bride."
            },
            {
                "name": "Ivory Pearl Organza Saree",
                "category": "Party Wear",
                "collection": "Everyday Elegance",
                "price": 4500.00,
                "compare_at_price": 6000.00,
                "fabric": "Organza Silk",
                "color": "Cream",
                "occasion": "Party",
                "saree_type": "Organza",
                "stock": 12,
                "featured": False,
                "bestseller": True,
                "new": True,
                "desc": "A delicate ivory organza saree with hand-painted floral prints and real scalloped pearl border work. Elegant, modern, and lightweight."
            },
            {
                "name": "Bengal Handloom Cotton",
                "category": "Cotton Sarees",
                "collection": "Everyday Elegance",
                "price": 2200.00,
                "compare_at_price": 2800.00,
                "fabric": "Handloom Cotton",
                "color": "Beige",
                "occasion": "Everyday",
                "saree_type": "Handloom",
                "stock": 20,
                "featured": False,
                "bestseller": False,
                "new": False,
                "desc": "Traditional hand-woven cotton saree from West Bengal. Extremely comfortable, stylish, and perfect for working professionals."
            },
            {
                "name": "Rose Gold Festive Saree",
                "category": "Silk Sarees",
                "collection": "Festive Collection",
                "price": 8900.00,
                "compare_at_price": 11000.00,
                "fabric": "Tussar Silk",
                "color": "Rose Gold",
                "occasion": "Festive",
                "saree_type": "Tussar",
                "stock": 10,
                "featured": True,
                "bestseller": False,
                "new": True,
                "desc": "Celebrate in style with this stunning rose gold Tussar silk saree featuring delicate floral embroidery and a shimmering zari pallu."
            },
            # Kanjivaram
            {
                "name": "Emerald Royal Kanjivaram",
                "category": "Kanjivaram Sarees",
                "collection": "Luxury Silk",
                "price": 13900.00,
                "compare_at_price": 16500.00,
                "fabric": "Pure Silk",
                "color": "Emerald Green",
                "occasion": "Wedding",
                "saree_type": "Kanjivaram",
                "stock": 6,
                "featured": False,
                "bestseller": True,
                "new": False,
                "desc": "A regal emerald green Kanjivaram saree with solid gold zari pallu and standard peacock patterns on the borders."
            },
            {
                "name": "Mustard Festive Kanjivaram",
                "category": "Kanjivaram Sarees",
                "collection": "Festive Collection",
                "price": 9500.00,
                "compare_at_price": 12000.00,
                "fabric": "Mulberry Silk",
                "color": "Mustard Yellow",
                "occasion": "Festive",
                "saree_type": "Kanjivaram",
                "stock": 9,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "A warm yellow Kanjivaram saree, ideal for haldi ceremonies and traditional festivals. Soft border with gold accents."
            },
            # Banarasi
            {
                "name": "Scarlet Banarasi Brocade",
                "category": "Banarasi Sarees",
                "collection": "Royal Heritage",
                "price": 11200.00,
                "compare_at_price": 14500.00,
                "fabric": "Katan Silk",
                "color": "Crimson Red",
                "occasion": "Wedding",
                "saree_type": "Banarasi",
                "stock": 4,
                "featured": False,
                "bestseller": True,
                "new": False,
                "desc": "A grand scarlet red silk saree with rich silver zari brocade work that adds a glittering Royal look."
            },
            {
                "name": "Midnight Blue Silk Banarasi",
                "category": "Banarasi Sarees",
                "collection": "Luxury Silk",
                "price": 10500.00,
                "compare_at_price": 13500.00,
                "fabric": "Banarasi Silk",
                "color": "Royal Blue",
                "occasion": "Party",
                "saree_type": "Banarasi",
                "stock": 7,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "Deep midnight blue base with silver floral motifs (buttis) all over. Perfect for evening cocktail parties."
            },
            # Cotton
            {
                "name": "Indigo Block Print Cotton",
                "category": "Cotton Sarees",
                "collection": "Everyday Elegance",
                "price": 1800.00,
                "compare_at_price": 2200.00,
                "fabric": "Mulmul Cotton",
                "color": "Royal Blue",
                "occasion": "Everyday",
                "saree_type": "Handloom",
                "stock": 15,
                "featured": False,
                "bestseller": True,
                "new": False,
                "desc": "Soft mulmul cotton saree printed in natural indigo block print dyes. Breezy and elegant for sunny days."
            },
            {
                "name": "Pastel Pink Jamdani Cotton",
                "category": "Cotton Sarees",
                "collection": "Everyday Elegance",
                "price": 3200.00,
                "compare_at_price": 4000.00,
                "fabric": "Fine Cotton",
                "color": "Pastel Pink",
                "occasion": "Festive",
                "saree_type": "Jamdani",
                "stock": 10,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "A light pink cotton jamdani saree featuring geometric weave patterns. Traditional weaver art from Bengal."
            },
            # Georgette
            {
                "name": "Burgundy Sequin Glamour",
                "category": "Georgette Sarees",
                "collection": "Festive Collection",
                "price": 5800.00,
                "compare_at_price": 7500.00,
                "fabric": "Georgette",
                "color": "Burgundy",
                "occasion": "Party",
                "saree_type": "Georgette",
                "stock": 14,
                "featured": True,
                "bestseller": True,
                "new": False,
                "desc": "Stunning burgundy georgette saree embellished with full-length sequin lines. Shines elegantly in party lights."
            },
            {
                "name": "Turquoise Ombre Georgette",
                "category": "Georgette Sarees",
                "collection": "Everyday Elegance",
                "price": 4200.00,
                "compare_at_price": 5000.00,
                "fabric": "Viscose Georgette",
                "color": "Turquoise",
                "occasion": "Party",
                "saree_type": "Georgette",
                "stock": 11,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "A turquoise dual-tone shaded georgette saree, lightweight and easy to carry."
            },
            # Chiffon
            {
                "name": "Blush Pink Floral Chiffon",
                "category": "Chiffon Sarees",
                "collection": "Everyday Elegance",
                "price": 3600.00,
                "compare_at_price": 4500.00,
                "fabric": "Pure Chiffon",
                "color": "Pastel Pink",
                "occasion": "Everyday",
                "saree_type": "Chiffon",
                "stock": 15,
                "featured": False,
                "bestseller": True,
                "new": False,
                "desc": "A lightweight blush pink chiffon saree with vintage rose prints and delicate lace border."
            },
            {
                "name": "Lemon Yellow Sunset Chiffon",
                "category": "Chiffon Sarees",
                "collection": "Festive Collection",
                "price": 3900.00,
                "compare_at_price": 4900.00,
                "fabric": "Chiffon",
                "color": "Mustard Yellow",
                "occasion": "Festive",
                "saree_type": "Chiffon",
                "stock": 12,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "A vibrant yellow chiffon saree with a thin gold border. Perfect for festive morning events."
            },
            # Party Wear
            {
                "name": "Charcoal Black Velvet Border",
                "category": "Party Wear",
                "collection": "Festive Collection",
                "price": 7500.00,
                "compare_at_price": 9500.00,
                "fabric": "Velvet & Net",
                "color": "Charcoal Black",
                "occasion": "Party",
                "saree_type": "Designer",
                "stock": 6,
                "featured": True,
                "bestseller": False,
                "new": True,
                "desc": "A striking black net saree featuring a premium embroidered black velvet border and a heavy sequin blouse."
            },
            {
                "name": "Champagne Shimmer Net Saree",
                "category": "Party Wear",
                "collection": "Festive Collection",
                "price": 6800.00,
                "compare_at_price": 8500.00,
                "fabric": "Shimmer Net",
                "color": "Champagne",
                "occasion": "Party",
                "saree_type": "Designer",
                "stock": 9,
                "featured": False,
                "bestseller": True,
                "new": False,
                "desc": "A beautiful champagne gold net saree with overall threadwork embroidery and self-colored beads."
            },
            # Silk Sarees
            {
                "name": "Fuschia Pink Tussar Silk",
                "category": "Silk Sarees",
                "collection": "Luxury Silk",
                "price": 8200.00,
                "compare_at_price": 10500.00,
                "fabric": "Tussar Silk",
                "color": "Magenta",
                "occasion": "Festive",
                "saree_type": "Tussar",
                "stock": 8,
                "featured": False,
                "bestseller": False,
                "new": False,
                "desc": "Handloom Tussar silk saree in hot fuschia pink with traditional tribal block print border."
            },
            {
                "name": "Sea Green Organza Silk Saree",
                "category": "Silk Sarees",
                "collection": "Everyday Elegance",
                "price": 5400.00,
                "compare_at_price": 7000.00,
                "fabric": "Organza Silk",
                "color": "Sea Green",
                "occasion": "Party",
                "saree_type": "Organza",
                "stock": 10,
                "featured": False,
                "bestseller": False,
                "new": True,
                "desc": "Translucent sea green organza silk saree, with delicate embroidery work on the border."
            }
        ]

        # Let's multiply the list with minor color/price variants to reach 30+ items
        extra_sarees_templates = [
            ("Peach Pearl Chiffon", "Chiffon Sarees", "Everyday Elegance", 3200, "Peach", "Everyday", "Chiffon"),
            ("Maroon Zardozi Bridal", "Wedding Collection", "Wedding Collection", 22000, "Deep Maroon", "Wedding", "Banarasi"),
            ("Golden Mustard Handloom", "Cotton Sarees", "Everyday Elegance", 2500, "Mustard Yellow", "Everyday", "Handloom"),
            ("Mint Green Banarasi Silk", "Banarasi Sarees", "Luxury Silk", 11500, "Mint Green", "Festive", "Banarasi"),
            ("Navy Sequined Chiffon", "Chiffon Sarees", "Festive Collection", 4800, "Navy Blue", "Party", "Chiffon"),
            ("Wine Georgette Draped", "Georgette Sarees", "Festive Collection", 6200, "Burgundy", "Party", "Georgette"),
            ("Off-White Gold Chanderi", "Silk Sarees", "Royal Heritage", 5900, "Cream", "Festive", "Chanderi"),
            ("Royal Blue Kanjivaram", "Kanjivaram Sarees", "Royal Heritage", 14500, "Royal Blue", "Wedding", "Kanjivaram"),
            ("Purple Brocade Splendor", "Banarasi Sarees", "Royal Heritage", 12800, "Purple", "Festive", "Banarasi"),
            ("Pastel Peach Organza", "Party Wear", "Everyday Elegance", 4600, "Peach", "Party", "Organza"),
            ("Lavender Festive Silk", "Silk Sarees", "Festive Collection", 7900, "Lavender", "Festive", "Mulberry Silk"),
            ("Tangerine Handloom Cotton", "Cotton Sarees", "Everyday Elegance", 2100, "Tangerine", "Everyday", "Handloom")
        ]

        for i, template in enumerate(extra_sarees_templates):
            sarees.append({
                "name": template[0],
                "category": template[1],
                "collection": template[2],
                "price": template[3],
                "compare_at_price": template[3] * 1.25,
                "fabric": template[6],
                "color": template[4],
                "occasion": template[5],
                "saree_type": template[6],
                "stock": 10,
                "featured": False,
                "bestseller": (i % 3 == 0),
                "new": (i % 2 == 0),
                "desc": f"A beautiful {template[0]} woven from fine threads. Experience the touch of heritage and elegant styling."
            })

        # Insert Products into database
        seeded_products = []
        for i, s_data in enumerate(sarees):
            cat = categories.get(s_data["category"])
            col = collections.get(s_data["collection"])
            sku = f"RC-{s_data['color'][:3].upper()}-{s_data['saree_type'][:3].upper()}-{random.randint(1000, 9999)}"
            
            p = Product.objects.create(
                name=s_data["name"],
                SKU=sku,
                description=s_data["desc"],
                category=cat,
                collection=col,
                price=s_data["price"],
                compare_at_price=s_data["compare_at_price"],
                fabric=s_data["fabric"],
                color=s_data["color"],
                occasion=s_data["occasion"],
                saree_type=s_data["saree_type"],
                stock_quantity=s_data["stock"],
                is_featured=s_data["featured"],
                is_bestseller=s_data["bestseller"],
                is_new=s_data["new"],
                seo_title=f"{s_data['name']} | Rachana's Collection",
                seo_description=s_data["desc"][:150]
            )
            
            # Create a ProductImage for it
            ProductImage.objects.create(
                product=p,
                image=None,
                alt_text=p.name,
                is_feature_image=True
            )
            
            seeded_products.append(p)
            
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(seeded_products)} Sarees (Products)."))

        # 6. Seed Product Reviews
        reviews_titles = [
            "Breathtaking quality!", "Absolutely gorgeous", "True elegance",
            "Very comfortable", "Exquisite embroidery", "Beautiful border work",
            "Perfect for weddings", "Loved the fabric color", "Premium packaging"
        ]
        reviews_texts = [
            "The saree looks exactly like the photos. The silk is very soft and of high quality. Highly recommended!",
            "I wore this for a family function and received so many compliments. The gold border shines beautifully.",
            "Loved the craftsmanship. It arrived within 3 days in beautiful packaging. Excellent brand!",
            "The material is light and breathable. Very easy to drape. Will buy again from Rachana's Collection.",
            "Perfect fit and length. The color is deep and vibrant. Really worth the price.",
            "Elegant and feels very premium. Traditional yet modern design."
        ]

        for p in seeded_products:
            # Seed 1 to 4 reviews per product without duplicates
            num_reviews = random.randint(1, min(len(customers), 4))
            selected_customers = random.sample(customers, num_reviews)
            for c in selected_customers:
                Review.objects.create(
                    product=p,
                    user=c,
                    rating=random.randint(4, 5), # Seed high ratings for premium brand
                    title=random.choice(reviews_titles),
                    text=random.choice(reviews_texts),
                    is_verified_buyer=True
                )
        
        self.stdout.write(self.style.SUCCESS("Seeded Customer Reviews."))
        self.stdout.write(self.style.SUCCESS("Demo database seeded successfully! Ready for launch."))
