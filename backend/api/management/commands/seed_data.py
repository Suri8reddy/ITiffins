from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, FoodCategory, FoodItem

class Command(BaseCommand):
    help = 'Seeds initial database with manager/cashier accounts, complete food categories, and tiffin items'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding database...'))

        # 1. Manager Account
        manager_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Shop',
                'last_name': 'Manager',
                'email': 'admin@tiffin.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            manager_user.set_password('admin123')
            manager_user.save()
            profile = UserProfile.objects.get(user=manager_user)
            profile.role = 'MANAGER'
            profile.save()
            self.stdout.write(self.style.SUCCESS('Created Manager user: admin / admin123'))

        # 2. Cashier Account
        cashier_user, created = User.objects.get_or_create(
            username='cashier',
            defaults={
                'first_name': 'Pos',
                'last_name': 'Cashier',
                'email': 'cashier@tiffin.com',
                'is_staff': False,
                'is_superuser': False
            }
        )
        if created:
            cashier_user.set_password('cashier123')
            cashier_user.save()
            profile = UserProfile.objects.get(user=cashier_user)
            profile.role = 'CASHIER'
            profile.save()
            self.stdout.write(self.style.SUCCESS('Created Cashier user: cashier / cashier123'))

        # 3. Categories
        categories_data = [
            {'name': 'Breakfast Tiffins', 'description': 'Fresh & hot traditional morning tiffins'},
            {'name': 'Lunch & Meals', 'description': 'Full meals, Sambar Rice & Biryani'},
            {'name': 'Snacks & Evening Bites', 'description': 'Crispy Medu Vada, Bonda & Samosa'},
            {'name': 'Dinner Specials', 'description': 'Special Dosa, Parotta & Chapathi'},
            {'name': 'Hot & Cold Beverages', 'description': 'Filter Coffee, Tea & Refreshing Drinks'},
            {'name': 'Sweets & Desserts', 'description': 'Kesari, Payasam & South Indian Sweets'},
        ]

        categories_map = {}
        for cat_info in categories_data:
            cat, _ = FoodCategory.objects.get_or_create(
                name=cat_info['name'],
                defaults={'description': cat_info['description']}
            )
            categories_map[cat.name] = cat

        self.stdout.write(self.style.SUCCESS(f'Categories seeded: {list(categories_map.keys())}'))

        # 4. Food Items with Pieces Per Plate
        items_data = [
            {
                'name': 'Idli Plate (2 Pcs)',
                'category': 'Breakfast Tiffins',
                'price': '40.00',
                'pieces_per_plate': 2,
                'description': 'Steamed rice cakes served with chutney & sambar',
                'image': 'food_items/idly.jpg'
            },
            {
                'name': 'Plain Dosa',
                'category': 'Breakfast Tiffins',
                'price': '40.00',
                'pieces_per_plate': 1,
                'description': 'Crispy golden dosa served with coconut chutney & sambar',
                'image': 'food_items/dosa.jpg'
            },
            {
                'name': 'Masala Dosa',
                'category': 'Breakfast Tiffins',
                'price': '60.00',
                'pieces_per_plate': 1,
                'description': 'Crispy dosa filled with spiced potato masala',
                'image': 'food_items/dosa.jpg'
            },
            {
                'name': 'Medu Vada (2 Pcs)',
                'category': 'Snacks & Evening Bites',
                'price': '40.00',
                'pieces_per_plate': 2,
                'description': 'Crispy lentil vada served with chutney & sambar',
                'image': 'food_items/vada.jpg'
            },
            {
                'name': 'Poori Masala (2 Pcs)',
                'category': 'Breakfast Tiffins',
                'price': '50.00',
                'pieces_per_plate': 2,
                'description': 'Puffed wheat bread served with potato curry',
                'image': 'food_items/poori.jpg'
            },
            {
                'name': 'Rava Upma',
                'category': 'Breakfast Tiffins',
                'price': '35.00',
                'pieces_per_plate': 1,
                'description': 'Savory semolina upma with cashews & curry leaves',
                'image': 'food_items/idly.jpg'
            },
            {
                'name': 'Ghee Ven Pongal',
                'category': 'Breakfast Tiffins',
                'price': '45.00',
                'pieces_per_plate': 1,
                'description': 'Ghee rice & dal porridge with cumin, pepper & cashews',
                'image': 'food_items/idly.jpg'
            },
            {
                'name': 'Mini Tiffin Combo',
                'category': 'Breakfast Tiffins',
                'price': '90.00',
                'pieces_per_plate': 1,
                'description': 'Mini Idli, Vada, Small Dosa, Rava Kesari & Coffee',
                'image': 'food_items/idly.jpg'
            },
            {
                'name': 'South Indian Meals',
                'category': 'Lunch & Meals',
                'price': '110.00',
                'pieces_per_plate': 1,
                'description': 'Rice, Sambar, Rasam, Kara Kuzhambu, Curd, Appalam & Sweet',
                'image': 'food_items/dosa.jpg'
            },
            {
                'name': 'Curd Rice',
                'category': 'Lunch & Meals',
                'price': '50.00',
                'pieces_per_plate': 1,
                'description': 'Seasoned curd rice served with pickle & fried chili',
                'image': 'food_items/idly.jpg'
            },
            {
                'name': 'Onion Uttapam',
                'category': 'Dinner Specials',
                'price': '55.00',
                'pieces_per_plate': 1,
                'description': 'Thick dosa topped with finely chopped onions & cilantro',
                'image': 'food_items/dosa.jpg'
            },
            {
                'name': 'Parotta with Salna (2 Pcs)',
                'category': 'Dinner Specials',
                'price': '60.00',
                'pieces_per_plate': 2,
                'description': 'Flaky layered parotta served with spicy veg salna',
                'image': 'food_items/poori.jpg'
            },
            {
                'name': 'Filter Coffee',
                'category': 'Hot & Cold Beverages',
                'price': '20.00',
                'pieces_per_plate': 1,
                'description': 'Authentic South Indian filter coffee',
                'image': 'food_items/coffee.jpg'
            },
            {
                'name': 'Ginger Tea',
                'category': 'Hot & Cold Beverages',
                'price': '15.00',
                'pieces_per_plate': 1,
                'description': 'Hot spiced Indian milk tea with fresh ginger',
                'image': 'food_items/tea.jpg'
            },
            {
                'name': 'Rava Kesari',
                'category': 'Sweets & Desserts',
                'price': '30.00',
                'pieces_per_plate': 1,
                'description': 'Sweet semolina dessert made with ghee, saffron & nuts',
                'image': 'food_items/idly.jpg'
            }
        ]

        for item_info in items_data:
            cat_obj = categories_map[item_info['category']]
            item, _ = FoodItem.objects.get_or_create(
                name=item_info['name'],
                defaults={
                    'category': cat_obj,
                    'price': item_info['price'],
                    'pieces_per_plate': item_info['pieces_per_plate'],
                    'description': item_info['description'],
                    'image': item_info['image'],
                    'is_available': True
                }
            )

        self.stdout.write(self.style.SUCCESS('Seeded all food categories & items!'))
