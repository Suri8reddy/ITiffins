from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, FoodCategory, FoodItem, Order, OrderItem, Payment
from .permissions import get_user_role

# User & Auth Serializers
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role')

    def get_role(self, obj):
        return get_user_role(obj)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


# Food Category & Item Serializers
class FoodCategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = FoodCategory
        fields = ('id', 'name', 'description', 'items_count', 'created_at')

    def get_items_count(self, obj):
        return obj.items.count()

class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=FoodCategory.objects.all(), source='category', write_only=True
    )
    image_url = serializers.SerializerMethodField()
    price_per_piece = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = FoodItem
        fields = (
            'id', 'name', 'category', 'category_name', 'category_id',
            'price', 'pieces_per_plate', 'price_per_piece', 'description',
            'image', 'image_url', 'is_available', 'created_at', 'updated_at'
        )
        read_only_fields = ('category',)

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# Order & Order Item Serializers
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'food_item', 'item_name', 'quantity', 'unit_price', 'subtotal')
        read_only_fields = ('item_name', 'unit_price', 'subtotal')

class CreateOrderItemInputSerializer(serializers.Serializer):
    food_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class CreateOrderInputSerializer(serializers.Serializer):
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00, required=False)
    apply_gst = serializers.BooleanField(default=False, required=False)
    gst_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=5.00, required=False)
    items = CreateOrderItemInputSerializer(many=True, min_length=1)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    cashier_name = serializers.SerializerMethodField()
    payment_details = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'bill_number', 'cashier', 'cashier_name',
            'subtotal', 'discount', 'tax_rate', 'tax_amount', 'total_amount',
            'payment_status', 'items', 'payment_details', 'created_at'
        )

    def get_cashier_name(self, obj):
        if obj.cashier:
            full_name = f"{obj.cashier.first_name} {obj.cashier.last_name}".strip()
            return full_name if full_name else obj.cashier.username
        return "Unknown"

    def get_payment_details(self, obj):
        if hasattr(obj, 'payment'):
            payment = obj.payment
            return {
                'payment_method': payment.payment_method,
                'amount_received': str(payment.amount_received),
                'change_returned': str(payment.change_returned),
                'transaction_reference': payment.transaction_reference,
                'payment_status': payment.payment_status,
                'paid_at': payment.paid_at
            }
        return None


# Payment Serializers
class ProcessPaymentInputSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['CASH', 'UPI'])
    amount_received = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    transaction_reference = serializers.CharField(max_length=100, required=False, allow_blank=True)

class PaymentSerializer(serializers.ModelSerializer):
    bill_number = serializers.CharField(source='order.bill_number', read_only=True)
    total_amount = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'bill_number', 'total_amount',
            'payment_method', 'amount_received', 'change_returned',
            'transaction_reference', 'payment_status', 'paid_at'
        )
