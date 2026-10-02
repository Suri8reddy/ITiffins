from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from api.models import UserProfile, FoodCategory, FoodItem, Order, OrderItem, Payment

class TiffinShopTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Manager
        self.manager = User.objects.create_user(username='mgr', password='password123')
        self.manager.profile.role = 'MANAGER'
        self.manager.profile.save()

        # Create Cashier
        self.cashier = User.objects.create_user(username='csh', password='password123')
        self.cashier.profile.role = 'CASHIER'
        self.cashier.profile.save()

        # Create Category & Items
        self.category = FoodCategory.objects.create(name='Tiffins', description='Hot tiffins')
        self.idly = FoodItem.objects.create(name='Idly', category=self.category, price=Decimal('10.00'), is_available=True)
        self.dosa = FoodItem.objects.create(name='Dosa', category=self.category, price=Decimal('40.00'), is_available=True)
        self.vada = FoodItem.objects.create(name='Vada', category=self.category, price=Decimal('15.00'), is_available=True)

    def test_gst_off_order_calculation(self):
        self.client.force_authenticate(user=self.cashier)

        # Create order without GST (GST OFF) -> 2 Dosa (₹80) + 2 Vada (₹30) = ₹110
        order_response = self.client.post('/api/orders/', {
            'discount': '0.00',
            'apply_gst': False,
            'items': [
                {'food_item_id': self.dosa.id, 'quantity': 2},
                {'food_item_id': self.vada.id, 'quantity': 2},
            ]
        }, format='json')

        self.assertEqual(order_response.status_code, 201)
        data = order_response.json()
        self.assertEqual(data['subtotal'], '110.00')
        self.assertEqual(data['tax_amount'], '0.00')
        self.assertEqual(data['total_amount'], '110.00')

    def test_weekly_sales_report_api(self):
        self.client.force_authenticate(user=self.cashier)

        order_res = self.client.post('/api/orders/', {
            'discount': '0.00',
            'apply_gst': True,
            'gst_rate': '5.00',
            'items': [
                {'food_item_id': self.dosa.id, 'quantity': 2},
                {'food_item_id': self.idly.id, 'quantity': 2},
            ]
        }, format='json')
        order_id = order_res.json()['id']

        self.client.post('/api/payments/process/', {
            'order_id': order_id,
            'payment_method': 'CASH',
            'amount_received': '150.00'
        }, format='json')

        self.client.force_authenticate(user=self.manager)
        report_res = self.client.get('/api/reports/weekly-sales/')
        self.assertEqual(report_res.status_code, 200)
        report_data = report_res.json()

        self.assertEqual(report_data['total_revenue'], 105.0)
        self.assertEqual(report_data['paid_orders_count'], 1)

    def test_monthly_sales_report_api(self):
        self.client.force_authenticate(user=self.cashier)

        order_res = self.client.post('/api/orders/', {
            'discount': '0.00',
            'apply_gst': True,
            'gst_rate': '5.00',
            'items': [
                {'food_item_id': self.dosa.id, 'quantity': 2},
                {'food_item_id': self.idly.id, 'quantity': 2},
            ]
        }, format='json')
        order_id = order_res.json()['id']

        self.client.post('/api/payments/process/', {
            'order_id': order_id,
            'payment_method': 'CASH',
            'amount_received': '150.00'
        }, format='json')

        self.client.force_authenticate(user=self.manager)
        report_res = self.client.get('/api/reports/monthly-sales/')
        self.assertEqual(report_res.status_code, 200)
        report_data = report_res.json()

        self.assertEqual(report_data['total_revenue'], 105.0)
        self.assertEqual(report_data['cash_sales'], 105.0)
        self.assertEqual(report_data['paid_orders_count'], 1)
