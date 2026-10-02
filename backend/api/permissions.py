from rest_framework import permissions

def get_user_role(user):
    if not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'MANAGER'
    if hasattr(user, 'profile'):
        return user.profile.role
    return 'CASHIER'

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_user_role(request.user) == 'MANAGER'

class IsCashier(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_user_role(request.user) in ['CASHIER', 'MANAGER']

class IsManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and get_user_role(request.user) == 'MANAGER'
