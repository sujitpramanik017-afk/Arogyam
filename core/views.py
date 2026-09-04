from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_POST
from products.models import Category, Collection, Product
from .models import Banner, ContactMessage, NewsletterSubscriber

def home(request):
    banners = Banner.objects.filter(is_active=True)
    categories = Category.objects.filter(is_active=True)[:8]
    cols = Collection.objects.filter(is_active=True)[:4]
    
    # Fetch best sellers & new arrivals from products
    best_sellers = Product.objects.filter(is_available=True, is_bestseller=True).prefetch_related('images', 'reviews')[:8]
    new_arrivals = Product.objects.filter(is_available=True, is_new=True).prefetch_related('images', 'reviews').order_selection = Product.objects.all().order_by('-created_at')[:8]
    
    # Just standard select to avoid error in case order_selection is not a field
    new_arrivals = Product.objects.filter(is_available=True).prefetch_related('images', 'reviews').order_by('-created_at')[:8]
    
    context = {
        'banners': banners,
        'categories': categories,
        'collections': cols,
        'best_sellers': best_sellers,
        'new_arrivals': new_arrivals,
    }
    return render(request, 'home.html', context)

def about(request):
    return render(request, 'about.html')

def contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        subject = request.POST.get('subject')
        message = request.POST.get('message')

        if name and email and subject and message:
            ContactMessage.objects.create(
                name=name,
                email=email,
                phone=phone,
                subject=subject,
                message=message
            )
            messages.success(request, "Thank you! Your message has been received. We will get back to you shortly.")
            return redirect('contact')
        else:
            messages.error(request, "Please fill in all required fields.")
            
    return render(request, 'contact.html')

@require_POST
def newsletter_subscribe(request):
    email = request.POST.get('email')
    if not email:
        return JsonResponse({'status': 'error', 'message': 'Email address is required.'})
    
    if NewsletterSubscriber.objects.filter(email=email).exists():
        return JsonResponse({'status': 'error', 'message': 'This email is already subscribed.'})
    
    NewsletterSubscriber.objects.create(email=email)
    return JsonResponse({'status': 'success', 'message': 'Thank you for subscribing to Rachana\'s Collection!'})


# Custom Error Views
def handler404(request, exception):
    return render(request, 'errors/404.html', status=404)

def handler403(request, exception=None):
    return render(request, 'errors/403.html', status=403)

def handler500(request):
    return render(request, 'errors/500.html', status=500)
