from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# 1. User Profile & Roles
class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('MANAGER', 'Manager'),
        ('CASHIER', 'Cashier'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CASHIER')
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        role = 'MANAGER' if instance.is_superuser else 'CASHIER'
        UserProfile.objects.create(user=instance, role=role)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()


# 2. Food Category Model
class FoodCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Food Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class FoodItem(models.Model):
    name = models.CharField(max_length=150)
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='items')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    pieces_per_plate = models.IntegerField(default=1, help_text="Number of items/pieces per plate/serving")
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='food_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (₹{self.price})"

    @property
    def price_per_piece(self):
        if self.pieces_per_plate and self.pieces_per_plate > 0:
            return round(self.price / Decimal(str(self.pieces_per_plate)), 2)
        return self.price


# 4. Order Model (With GST Tax support)
class Order(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    )

    bill_number = models.CharField(max_length=30, unique=True, blank=True)
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.bill_number or self.id} - ₹{self.total_amount} ({self.payment_status})"

    def save(self, *args, **kwargs):
        if not self.bill_number:
            last_order = Order.objects.filter(bill_number__startswith='TIF-').order_by('-id').first()
            if last_order and last_order.bill_number:
                try:
                    last_num = int(last_order.bill_number.split('-')[1])
                    new_num = last_num + 1
                except (IndexError, ValueError):
                    new_num = 1001
            else:
                new_num = 1001
            self.bill_number = f"TIF-{new_num}"
        super().save(*args, **kwargs)


# 5. Order Item Model
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.item_name} @ ₹{self.unit_price}"

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)


# 6. Payment Model
class Payment(models.Model):
    METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('UPI', 'UPI'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    amount_received = models.DecimalField(max_digits=10, decimal_places=2)
    change_returned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.payment_method} for Order {self.order.bill_number} - ₹{self.amount_received}"
