from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator

# Dictionary mapping common search/seeding keywords to high quality Unsplash saree/indian fashion photos
MOCK_IMAGES = {
    'silk': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
    'banarasi': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80',
    'cotton': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80',
    'kanjivaram': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
    'georgette': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    'chiffon': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
    'wedding': 'https://images.unsplash.com/photo-1610030470352-78d120a17409?w=800&q=80',
    'festive': 'https://images.unsplash.com/photo-1583391265517-35bbdad01209?w=800&q=80',
    'party': 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80'
}

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        name_lower = self.name.lower()
        for key, url in MOCK_IMAGES.items():
            if key in name_lower:
                return url
        return MOCK_IMAGES['default']

class Collection(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    image = models.ImageField(upload_to='collections/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        name_lower = self.name.lower()
        for key, url in MOCK_IMAGES.items():
            if key in name_lower:
                return url
        return MOCK_IMAGES['default']

class Product(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, blank=True)
    SKU = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0)])
    discount = models.IntegerField(default=0, help_text="Discount percentage")
    
    fabric = models.CharField(max_length=100)
    color = models.CharField(max_length=50)
    occasion = models.CharField(max_length=100)
    saree_type = models.CharField(max_length=100)
    stock_quantity = models.PositiveIntegerField(default=10)
    
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_bestseller = models.BooleanField(default=False)
    is_new = models.BooleanField(default=True)
    
    seo_title = models.CharField(max_length=150, blank=True, null=True)
    seo_description = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Calculate discount safely
        if self.compare_at_price and self.compare_at_price > self.price:
            self.discount = int(((self.compare_at_price - self.price) / self.compare_at_price) * 100)
        else:
            self.discount = 0

        # Update availability based on stock
        if self.stock_quantity == 0:
            self.is_available = False
        else:
            self.is_available = True
            
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0

    @property
    def image_url(self):
        feat_image = self.images.filter(is_feature_image=True).first()
        if not feat_image:
            feat_image = self.images.first()
        
        if feat_image and feat_image.image:
            return feat_image.image.url
            
        # Fallback based on name or category keywords
        name_lower = self.name.lower()
        for key, url in MOCK_IMAGES.items():
            if key in name_lower:
                return url
        if self.category:
            cat_lower = self.category.name.lower()
            for key, url in MOCK_IMAGES.items():
                if key in cat_lower:
                    return url
        return MOCK_IMAGES['default']

    @property
    def rating_info(self):
        # Calculate average rating and review count
        revs = self.reviews.all()
        count = revs.count()
        if count == 0:
            return {'avg': 0, 'count': 0, 'stars': range(5), 'blank_stars': range(5)}
        
        avg = sum(r.rating for r in revs) / count
        avg_round = round(avg, 1)
        stars = int(avg)
        blank_stars = 5 - stars
        return {
            'avg': avg_round,
            'count': count,
            'stars': range(stars),
            'blank_stars': range(blank_stars)
        }

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    alt_text = models.CharField(max_length=150, blank=True, null=True)
    is_feature_image = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.product.name}"
