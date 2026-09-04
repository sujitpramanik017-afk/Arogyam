from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from products.models import Product
from .models import Wishlist, WishlistItem

@login_required
def wishlist_detail(request):
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    items = wishlist.items.all().select_related('product').prefetch_related('product__images')
    return render(request, 'wishlist/wishlist.html', {'wishlist_items': items})

@require_POST
def wishlist_toggle(request, product_id):
    if not request.user.is_authenticated:
        return JsonResponse({
            'status': 'error',
            'message': 'Please Login to add items to your wishlist.'
        })

    product = get_object_or_404(Product, id=product_id)
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    
    item = WishlistItem.objects.filter(wishlist=wishlist, product=product).first()
    if item:
        item.delete()
        action = 'removed'
        message = f"Removed '{product.name}' from your wishlist."
    else:
        WishlistItem.objects.create(wishlist=wishlist, product=product)
        action = 'added'
        message = f"Added '{product.name}' to your wishlist."

    wishlist_count = wishlist.items.count()
    return JsonResponse({
        'status': 'success',
        'action': action,
        'message': message,
        'wishlist_count': wishlist_count
    })
