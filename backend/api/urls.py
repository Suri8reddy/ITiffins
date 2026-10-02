from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, UserDetailView,
    FoodCategoryViewSet, FoodItemViewSet,
    OrderViewSet, ProcessPaymentView,
    DashboardStatsView, DailySalesReportView, WeeklySalesReportView, MonthlySalesReportView
)

router = DefaultRouter()
router.register('menu/categories', FoodCategoryViewSet, basename='category')
router.register('menu/items', FoodItemViewSet, basename='food-item')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', UserDetailView.as_view(), name='auth-me'),
    
    # Payment processing
    path('payments/process/', ProcessPaymentView.as_view(), name='payment-process'),
    
    # Reports & Analytics
    path('reports/dashboard-stats/', DashboardStatsView.as_view(), name='report-dashboard-stats'),
    path('reports/daily-sales/', DailySalesReportView.as_view(), name='report-daily-sales'),
    path('reports/weekly-sales/', WeeklySalesReportView.as_view(), name='report-weekly-sales'),
    path('reports/monthly-sales/', MonthlySalesReportView.as_view(), name='report-monthly-sales'),
    
    # Router endpoints (menu, categories, orders)
    path('', include(router.urls)),
]
