from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Avg, Count
from django.http import JsonResponse
from .models import Product, Category, Collection, ProductImage
from reviews.models import Review
from orders.models import Order, OrderItem

def product_list(request):
    products = Product.objects.filter(is_available=True).prefetch_related('images', 'reviews')
    
    # Filter choices to populate sidebar filters dynamically
    fabrics = Product.objects.values_list('fabric', flat=True).distinct()
    colors = Product.objects.values_list('color', flat=True).distinct()
    occasions = Product.objects.values_list('occasion', flat=True).distinct()
    saree_types = Product.objects.values_list('saree_type', flat=True).distinct()
    categories = Category.objects.filter(is_active=True)
    collections = Collection.objects.filter(is_active=True)

    # 1. Apply Search Query (if any)
    q = request.GET.get('q', '')
    if q:
        products = products.filter(
            Q(name__icontains=q) |
            Q(SKU__icontains=q) |
            Q(fabric__icontains=q) |
            Q(color__icontains=q) |
            Q(occasion__icontains=q) |
            Q(saree_type__icontains=q) |
            Q(description__icontains=q) |
            Q(category__name__icontains=q) |
            Q(collection__name__icontains=q)
        )

    # 2. Apply Sidebar Filters
    category_slug = request.GET.get('category')
    if category_slug:
        products = products.filter(category__slug=category_slug)
        
    collection_slug = request.GET.get('collection')
    if collection_slug:
        products = products.filter(collection__slug=collection_slug)
        
    fabric_filter = request.GET.get('fabric')
    if fabric_filter:
        products = products.filter(fabric__iexact=fabric_filter)
        
    color_filter = request.GET.get('color')
    if color_filter:
        products = products.filter(color__iexact=color_filter)
        
    occasion_filter = request.GET.get('occasion')
    if occasion_filter:
        products = products.filter(occasion__iexact=occasion_filter)
        
    saree_type_filter = request.GET.get('saree_type')
    if saree_type_filter:
        products = products.filter(saree_type__iexact=saree_type_filter)
        
    # Price range filters
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Stock Availability filter
    availability = request.GET.get('availability')
    if availability == 'in_stock':
        products = products.filter(stock_quantity__gt=0)
    elif availability == 'out_of_stock':
        products = products.filter(stock_quantity=0)

    # Rating filter
    rating_filter = request.GET.get('rating')
    if rating_filter:
        products = products.annotate(avg_r=Avg('reviews__rating')).filter(avg_r__gte=rating_filter)

    # 3. Apply Sorting
    sort = request.GET.get('sort', 'newest')
    if sort == 'newest':
        products = products.order_by('-created_at')
    elif sort == 'price_asc':
        products = products.order_by('price')
    elif sort == 'price_desc':
        products = products.order_by('-price')
    elif sort == 'popularity':
        products = products.annotate(rev_count=Count('reviews')).order_by('-rev_count')
    elif sort == 'discount':
        products = products.order_by('-discount')

    total_count = products.count()

    # Empty search results handling
    if q and total_count == 0:
        return render(request, 'products/search_empty.html', {'query': q})

    # Pagination
    paginator = Paginator(products, 12) # 12 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'products_list': page_obj,
        'fabrics': fabrics,
        'colors': colors,
        'occasions': occasions,
        'saree_types': saree_types,
        'categories': categories,
        'collections': collections,
        'total_count': total_count,
        'current_filters': request.GET,
    }
    return render(request, 'products/list.html', context)

def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    
    # 1. Related Products (Same category, excluding current product, limit 4)
    related_products = Product.objects.filter(
        category=product.category, 
        is_available=True
    ).exclude(id=product.id).prefetch_related('images')[:4]
    
    # If not enough in category, fetch from same fabric/type
    if related_products.count() < 4:
        extra = Product.objects.filter(
            fabric=product.fabric,
            is_available=True
        ).exclude(id=product.id).exclude(id__in=[p.id for p in related_products]).prefetch_related('images')
        related_products = list(related_products) + list(extra)[:4 - len(related_products)]

    # 2. Recently Viewed Products (Session based)
    recently_viewed_ids = request.session.get('recently_viewed', [])
    # Get products
    recently_viewed_objs = []
    if recently_viewed_ids:
        # Load products but exclude current product
        recently_viewed_objs = Product.objects.filter(
            id__in=recently_viewed_ids, 
            is_available=True
        ).exclude(id=product.id).prefetch_related('images')[:4]
    
    # Add current product to recently viewed list for next visits
    if product.id not in recently_viewed_ids:
        recently_viewed_ids.insert(0, product.id)
        request.session['recently_viewed'] = recently_viewed_ids[:5] # keep last 5
    else:
        # Move it to the front
        recently_viewed_ids.remove(product.id)
        recently_viewed_ids.insert(0, product.id)
        request.session['recently_viewed'] = recently_viewed_ids[:5]

    # 3. Check if user is a verified purchaser to allow review
    is_verified_buyer = False
    if request.user.is_authenticated:
        is_verified_buyer = Order.objects.filter(
            user=request.user, 
            order_status='Delivered', 
            items__product=product
        ).exists()

    reviews = product.reviews.all().select_related('user')
    
    # Rating Distribution (1-5 stars percentage)
    rating_dist = {i: 0 for i in range(1, 6)}
    total_reviews = reviews.count()
    if total_reviews > 0:
        for r in reviews:
            rating_dist[r.rating] += 1
        for i in range(1, 6):
            rating_dist[i] = int((rating_dist[i] / total_reviews) * 100)

    context = {
        'product': product,
        'related_products': related_products,
        'recently_viewed': recently_viewed_objs,
        'is_verified_buyer': is_verified_buyer,
        'reviews_list': reviews,
        'rating_dist': rating_dist,
    }
    return render(request, 'products/detail.html', context)

@login_required
def add_review(request, slug):
    product = get_object_or_404(Product, slug=slug)
    
    # Verify purchaser condition
    is_verified = Order.objects.filter(
        user=request.user, 
        order_status='Delivered', 
        items__product=product
    ).exists()
    
    if not is_verified:
        messages.error(request, "Only verified purchasers of this saree can write a review.")
        return redirect('product_detail', slug=slug)

    if request.method == 'POST':
        rating = request.POST.get('rating')
        title = request.POST.get('title')
        text = request.POST.get('text')
        image = request.FILES.get('image')

        if rating and title and text:
            # Check if user already reviewed
            existing = Review.objects.filter(product=product, user=request.user).first()
            if existing:
                existing.rating = int(rating)
                existing.title = title
                existing.text = text
                if image:
                    existing.image = image
                existing.save()
                messages.success(request, "Your review has been updated.")
            else:
                Review.objects.create(
                    product=product,
                    user=request.user,
                    rating=int(rating),
                    title=title,
                    text=text,
                    image=image,
                    is_verified_buyer=True
                )
                messages.success(request, "Your review has been submitted successfully.")
        else:
            messages.error(request, "Please fill in all fields to submit your review.")

    return redirect('product_detail', slug=slug)

def search(request):
    # Route search query to product listing view with query parameters
    query = request.GET.get('q', '')
    if query:
        return redirect(f'/products/?q={query}')
    return redirect('product_list')
