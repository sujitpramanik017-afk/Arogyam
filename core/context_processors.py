from products.models import Category, Collection

def site_context(request):
    return {
        'nav_categories': Category.objects.filter(is_active=True)[:6],
        'nav_collections': Collection.objects.filter(is_active=True)[:5],
    }
