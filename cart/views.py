import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from products.models import Product
from .models import Cart, CartItem

def get_or_create_user_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart
    else:
        cart_id = request.session.get('cart_id')
        if cart_id:
            try:
                cart = Cart.objects.get(id=cart_id, user=None)
            except Cart.DoesNotExist:
                cart = Cart.objects.create(user=None)
                request.session['cart_id'] = cart.id
        else:
            cart = Cart.objects.create(user=None)
            request.session['cart_id'] = cart.id
        return cart

def cart_detail(request):
    cart = get_or_create_user_cart(request)
    
    # Check if coupon is in session (coupon application will be validated at checkout or orders)
    coupon_code = request.session.get('coupon_code')
    discount = 0.00
    coupon = None
    
    # Calculate financials
    subtotal = float(cart.total_price)
    shipping = 150.00 if subtotal < 5000.00 else 0.00 # Free shipping above ₹5000
    
    if coupon_code:
        from coupons.models import Coupon
        try:
            coupon = Coupon.objects.get(code=coupon_code)
            is_valid, msg = coupon.is_valid(subtotal)
            if is_valid:
                discount = coupon.calculate_discount(subtotal)
            else:
                del request.session['coupon_code']
        except Coupon.DoesNotExist:
            del request.session['coupon_code']

    total = max(0.00, subtotal + shipping - discount)
    
    context = {
        'cart': cart,
        'subtotal': subtotal,
        'shipping': shipping,
        'discount': discount,
        'coupon': coupon,
        'grand_total': total,
    }
    return render(request, 'cart/cart.html', context)

@require_POST
def cart_add(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    cart = get_or_create_user_cart(request)
    
    try:
        data = json.loads(request.body)
        quantity = int(data.get('quantity', 1))
    except (ValueError, TypeError, json.JSONDecodeError):
        quantity = 1
        
    if quantity <= 0:
        return JsonResponse({'status': 'error', 'message': 'Invalid quantity.'})

    # Check stock
    cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    
    current_qty = cart_item.quantity if not created else 0
    requested_qty = current_qty + quantity if created else quantity # If already existed, increment it by requested qty

    if created:
        cart_item.quantity = quantity
    else:
        cart_item.quantity += quantity
        
    if cart_item.quantity > product.stock_quantity:
        return JsonResponse({
            'status': 'error', 
            'message': f'Sorry, only {product.stock_quantity} items are available in stock. You already have {current_qty} in cart.'
        })

    cart_item.save()
    
    return JsonResponse({
        'status': 'success',
        'message': f"Added '{product.name}' to your shopping cart.",
        'total_items': cart.total_items
    })

@require_POST
def cart_remove(request, item_id):
    cart = get_or_create_user_cart(request)
    item = get_object_or_404(CartItem, id=item_id, cart=cart)
    product_name = item.product.name
    item.delete()

    subtotal = float(cart.total_price)
    shipping = 150.00 if subtotal < 5000.00 else 0.00
    
    # Recalculate discount if coupon applied
    coupon_code = request.session.get('coupon_code')
    discount = 0.00
    if coupon_code:
        from coupons.models import Coupon
        try:
            coupon = Coupon.objects.get(code=coupon_code)
            is_valid, msg = coupon.is_valid(subtotal)
            if is_valid:
                discount = coupon.calculate_discount(subtotal)
            else:
                del request.session['coupon_code']
        except Coupon.DoesNotExist:
            del request.session['coupon_code']
            
    total = max(0.00, subtotal + shipping - discount)

    return JsonResponse({
        'status': 'success',
        'message': f"Removed '{product_name}' from your cart.",
        'total_items': cart.total_items,
        'cart_subtotal': subtotal,
        'shipping': shipping,
        'discount': discount,
        'grand_total': total
    })

@require_POST
def cart_update(request, item_id):
    cart = get_or_create_user_cart(request)
    item = get_object_or_404(CartItem, id=item_id, cart=cart)
    
    try:
        data = json.loads(request.body)
        quantity = int(data.get('quantity', 1))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({'status': 'error', 'message': 'Invalid data.'})

    if quantity <= 0:
        return JsonResponse({'status': 'error', 'message': 'Quantity must be 1 or more.'})

    if quantity > item.product.stock_quantity:
        return JsonResponse({
            'status': 'error', 
            'message': f"Only {item.product.stock_quantity} pieces in stock."
        })

    item.quantity = quantity
    item.save()

    subtotal = float(cart.total_price)
    shipping = 150.00 if subtotal < 5000.00 else 0.00
    
    coupon_code = request.session.get('coupon_code')
    discount = 0.00
    if coupon_code:
        from coupons.models import Coupon
        try:
            coupon = Coupon.objects.get(code=coupon_code)
            is_valid, msg = coupon.is_valid(subtotal)
            if is_valid:
                discount = coupon.calculate_discount(subtotal)
            else:
                del request.session['coupon_code']
        except Coupon.DoesNotExist:
            del request.session['coupon_code']
            
    total = max(0.00, subtotal + shipping - discount)

    return JsonResponse({
        'status': 'success',
        'item_subtotal': float(item.subtotal),
        'total_items': cart.total_items,
        'cart_subtotal': subtotal,
        'shipping': shipping,
        'discount': discount,
        'grand_total': total
    })
