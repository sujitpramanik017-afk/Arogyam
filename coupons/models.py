from django.db import models
from django.utils import timezone

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveIntegerField(help_text="Percentage discount, e.g. 15 for 15%")
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Maximum discount amount limit in INR")
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Minimum purchase amount required")
    start_date = models.DateTimeField()
    expiry_date = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(default=100, help_text="Total number of times this coupon can be used")
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

    def is_valid(self, order_amount=0):
        now = timezone.now()
        if not self.is_active:
            return False, "This coupon is inactive."
        if now < self.start_date:
            return False, "This coupon's validity period has not started yet."
        if now > self.expiry_date:
            return False, "This coupon has expired."
        if self.used_count >= self.usage_limit:
            return False, "This coupon's usage limit has been reached."
        if order_amount < self.min_order_amount:
            return False, f"Minimum order value of INR {self.min_order_amount} is required to use this coupon."
        return True, ""

    def calculate_discount(self, order_amount):
        discount = (self.discount_percent / 100) * float(order_amount)
        if discount > self.max_discount:
            discount = self.max_discount
        return discount
