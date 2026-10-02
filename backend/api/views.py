import calendar
from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.contrib.auth import authenticate
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from .models import FoodCategory, FoodItem, Order, OrderItem, Payment
from .permissions import IsManager, IsCashier, IsManagerOrReadOnly
from .serializers import (
    UserSerializer, LoginSerializer,
    FoodCategorySerializer, FoodItemSerializer,
    OrderSerializer, CreateOrderInputSerializer,
    ProcessPaymentInputSerializer, PaymentSerializer
)

# 1. Authentication Views
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'User account is deactivated'}, status=status.HTTP_403_FORBIDDEN)
        
        token, _ = Token.objects.get_or_create(user=user)
        user_serializer = UserSerializer(user)
        
        return Response({
            'token': token.key,
            'user': user_serializer.data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 2. Food Category & Food Item ViewSets
class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        queryset = FoodItem.objects.all()
        category_id = self.request.query_params.get('category')
        available_only = self.request.query_params.get('available_only')

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if available_only and available_only.lower() in ['true', '1']:
            queryset = queryset.filter(is_available=True)

        return queryset

    @action(detail=True, methods=['patch'], permission_classes=[IsManagerOrReadOnly])
    def toggle_availability(self, request, pk=None):
        item = self.get_object()
        item.is_available = not item.is_available
        item.save()
        return Response({
            'id': item.id,
            'name': item.name,
            'is_available': item.is_available,
            'message': f"Item '{item.name}' is now {'available' if item.is_available else 'unavailable'}"
        }, status=status.HTTP_200_OK)


# 3. Order ViewSet
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsCashier]
    serializer_class = OrderSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['bill_number', 'cashier__username']

    def get_queryset(self):
        queryset = Order.objects.all().select_related('cashier', 'payment').prefetch_related('items')
        payment_status = self.request.query_params.get('payment_status')
        date_str = self.request.query_params.get('date')

        if payment_status:
            queryset = queryset.filter(payment_status=payment_status.upper())
        if date_str:
            queryset = queryset.filter(created_at__date=date_str)

        return queryset

    def create(self, request, *args, **kwargs):
        input_serializer = CreateOrderInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = input_serializer.validated_data
        discount = validated_data.get('discount', Decimal('0.00'))
        apply_gst = validated_data.get('apply_gst', False)
        gst_rate = validated_data.get('gst_rate', Decimal('5.00'))
        items_data = validated_data['items']

        food_item_ids = [item['food_item_id'] for item in items_data]
        food_items_db = FoodItem.objects.filter(id__in=food_item_ids).in_bulk()

        missing_ids = [fid for fid in food_item_ids if fid not in food_items_db]
        if missing_ids:
            return Response({'error': f"Food items with IDs {missing_ids} do not exist."}, status=status.HTTP_400_BAD_REQUEST)

        unavailable_items = [db_item.name for fid, db_item in food_items_db.items() if not db_item.is_available]
        if unavailable_items:
            return Response({'error': f"Items unavailable: {', '.join(unavailable_items)}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = Order.objects.create(
                cashier=request.user,
                subtotal=Decimal('0.00'),
                discount=discount,
                tax_rate=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                total_amount=Decimal('0.00'),
                payment_status='PENDING'
            )

            calculated_subtotal = Decimal('0.00')

            for item_data in items_data:
                food_item = food_items_db[item_data['food_item_id']]
                qty = item_data['quantity']
                unit_price = food_item.price
                item_subtotal = unit_price * qty

                OrderItem.objects.create(
                    order=order,
                    food_item=food_item,
                    item_name=food_item.name,
                    quantity=qty,
                    unit_price=unit_price,
                    subtotal=item_subtotal
                )

                calculated_subtotal += item_subtotal

            order.subtotal = calculated_subtotal
            subtotal_after_discount = max(Decimal('0.00'), calculated_subtotal - discount)

            if apply_gst and gst_rate > 0:
                tax_rate = gst_rate
                tax_amount = round(subtotal_after_discount * (tax_rate / Decimal('100.00')), 2)
            else:
                tax_rate = Decimal('0.00')
                tax_amount = Decimal('0.00')

            order.tax_rate = tax_rate
            order.tax_amount = tax_amount
            order.total_amount = subtotal_after_discount + tax_amount
            order.save()

        full_order_serializer = OrderSerializer(order)
        return Response(full_order_serializer.data, status=status.HTTP_201_CREATED)


# 4. Payment Processing View
class ProcessPaymentView(APIView):
    permission_classes = [IsCashier]

    def post(self, request):
        input_serializer = ProcessPaymentInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = input_serializer.validated_data
        order_id = data['order_id']
        payment_method = data['payment_method']
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': f"Order with ID {order_id} does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == 'PAID':
            return Response({'error': f"Order {order.bill_number} has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        amount_received = data.get('amount_received')
        transaction_ref = data.get('transaction_reference', '').strip()

        if payment_method == 'CASH':
            if amount_received is None:
                return Response({'error': "Amount received is required for Cash payments."}, status=status.HTTP_400_BAD_REQUEST)
            if amount_received < order.total_amount:
                return Response({
                    'error': f"Amount received (₹{amount_received}) is less than total bill amount (₹{order.total_amount})."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            change_returned = amount_received - order.total_amount
        else: # UPI
            amount_received = order.total_amount
            change_returned = Decimal('0.00')
            if not transaction_ref:
                transaction_ref = f"UPI-{order.bill_number}"

        with transaction.atomic():
            payment = Payment.objects.create(
                order=order,
                payment_method=payment_method,
                amount_received=amount_received,
                change_returned=change_returned,
                transaction_reference=transaction_ref if payment_method == 'UPI' else None,
                payment_status='COMPLETED'
            )
            order.payment_status = 'PAID'
            order.save()

        order_serializer = OrderSerializer(order)
        return Response({
            'message': 'Payment completed successfully',
            'order': order_serializer.data,
            'payment': PaymentSerializer(payment).data
        }, status=status.HTTP_200_OK)


# 5. Dashboard & Analytics Report Views
class DashboardStatsView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today)
        paid_orders_today = today_orders.filter(payment_status='PAID')

        total_sales_today = paid_orders_today.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        total_orders_count = today_orders.count()
        total_paid_bills_count = paid_orders_today.count()
        total_food_items_count = FoodItem.objects.count()

        recent_orders = Order.objects.all().order_by('-created_at')[:5]
        recent_orders_data = OrderSerializer(recent_orders, many=True).data

        return Response({
            'total_sales_today': float(total_sales_today),
            'total_orders_today': total_orders_count,
            'total_food_items': total_food_items_count,
            'total_paid_bills_today': total_paid_bills_count,
            'recent_transactions': recent_orders_data
        }, status=status.HTTP_200_OK)

class DailySalesReportView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                report_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            report_date = timezone.now().date()

        orders = Order.objects.filter(created_at__date=report_date)
        paid_orders = orders.filter(payment_status='PAID')

        total_revenue = paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        cash_sales = paid_orders.filter(payment__payment_method='CASH').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        upi_sales = paid_orders.filter(payment__payment_method='UPI').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        item_sales = OrderItem.objects.filter(
            order__created_at__date=report_date,
            order__payment_status='PAID'
        ).values('item_name').annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_qty')

        top_items = [
            {
                'item_name': item['item_name'],
                'total_qty': item['total_qty'],
                'total_revenue': float(item['total_revenue'])
            }
            for item in item_sales
        ]

        return Response({
            'date': report_date.strftime('%Y-%m-%d'),
            'total_revenue': float(total_revenue),
            'cash_sales': float(cash_sales),
            'upi_sales': float(upi_sales),
            'total_orders': orders.count(),
            'paid_orders_count': paid_orders.count(),
            'top_items': top_items,
            'orders': OrderSerializer(orders, many=True).data
        }, status=status.HTTP_200_OK)

# 6. Weekly Sales Report View
class WeeklySalesReportView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        date_str = request.query_params.get('start_date')
        if date_str:
            try:
                start_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid start_date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Default to 6 days ago (last 7 days window ending today)
            today = timezone.now().date()
            start_date = today - timedelta(days=6)

        end_date = start_date + timedelta(days=6)

        orders = Order.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        paid_orders = orders.filter(payment_status='PAID')

        total_revenue = paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        cash_sales = paid_orders.filter(payment__payment_method='CASH').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        upi_sales = paid_orders.filter(payment__payment_method='UPI').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        # Aggregate daily breakdown for each of the 7 days in the week
        daily_breakdown = paid_orders.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total_revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('date')

        formatted_daily_breakdown = [
            {
                'date': item['date'].strftime('%Y-%m-%d'),
                'day_name': item['date'].strftime('%A'),
                'orders_count': item['orders_count'],
                'total_revenue': float(item['total_revenue'])
            }
            for item in daily_breakdown
        ]

        item_sales = OrderItem.objects.filter(
            order__created_at__date__gte=start_date,
            order__created_at__date__lte=end_date,
            order__payment_status='PAID'
        ).values('item_name').annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_qty')

        top_items = [
            {
                'item_name': item['item_name'],
                'total_qty': item['total_qty'],
                'total_revenue': float(item['total_revenue'])
            }
            for item in item_sales
        ]

        return Response({
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_revenue': float(total_revenue),
            'cash_sales': float(cash_sales),
            'upi_sales': float(upi_sales),
            'total_orders': orders.count(),
            'paid_orders_count': paid_orders.count(),
            'daily_breakdown': formatted_daily_breakdown,
            'top_items': top_items,
            'orders': OrderSerializer(orders, many=True).data
        }, status=status.HTTP_200_OK)

# 7. Monthly Sales Report View
class MonthlySalesReportView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))

        if month < 1 or month > 12:
            return Response({'error': 'Month must be between 1 and 12.'}, status=status.HTTP_400_BAD_REQUEST)

        orders = Order.objects.filter(created_at__year=year, created_at__month=month)
        paid_orders = orders.filter(payment_status='PAID')

        total_revenue = paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        cash_sales = paid_orders.filter(payment__payment_method='CASH').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        upi_sales = paid_orders.filter(payment__payment_method='UPI').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        daily_breakdown = paid_orders.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total_revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('date')

        formatted_daily_breakdown = [
            {
                'date': item['date'].strftime('%Y-%m-%d'),
                'day_name': item['date'].strftime('%A'),
                'orders_count': item['orders_count'],
                'total_revenue': float(item['total_revenue'])
            }
            for item in daily_breakdown
        ]

        item_sales = OrderItem.objects.filter(
            order__created_at__year=year,
            order__created_at__month=month,
            order__payment_status='PAID'
        ).values('item_name').annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_qty')

        top_items = [
            {
                'item_name': item['item_name'],
                'total_qty': item['total_qty'],
                'total_revenue': float(item['total_revenue'])
            }
            for item in item_sales
        ]

        month_name = calendar.month_name[month]

        return Response({
            'year': year,
            'month': month,
            'month_name': month_name,
            'total_revenue': float(total_revenue),
            'cash_sales': float(cash_sales),
            'upi_sales': float(upi_sales),
            'total_orders': orders.count(),
            'paid_orders_count': paid_orders.count(),
            'daily_breakdown': formatted_daily_breakdown,
            'top_items': top_items,
            'orders': OrderSerializer(orders, many=True).data
        }, status=status.HTTP_200_OK)
