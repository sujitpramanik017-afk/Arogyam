from .models import Cart

def cart_context(request):
    cart = None
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        # Merge session cart if exists
        session_cart_id = request.session.get('cart_id')
        if session_cart_id:
            try:
                session_cart = Cart.objects.get(id=session_cart_id, user=None)
                for item in session_cart.items.all():
                    user_item, item_created = cart.items.get_or_create(product=item.product)
                    if item_created:
                        user_item.quantity = item.quantity
                    else:
                        user_item.quantity += item.quantity
                    user_item.save()
                session_cart.delete()
                del request.session['cart_id']
            except Cart.DoesNotExist:
                pass
    else:
        cart_id = request.session.get('cart_id')
        if cart_id:
            try:
                cart = Cart.objects.get(id=cart_id, user=None)
            except Cart.DoesNotExist:
                pass
    return {'cart': cart}
