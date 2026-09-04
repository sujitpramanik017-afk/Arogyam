from .models import Wishlist

def wishlist_context(request):
    wishlist_count = 0
    if request.user.is_authenticated:
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        wishlist_count = wishlist.items.count()
    return {'wishlist_count': wishlist_count}
