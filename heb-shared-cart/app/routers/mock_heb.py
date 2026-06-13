from fastapi import APIRouter, Query

router = APIRouter(prefix="/mock-heb", tags=["mock-heb"])


CATALOG = [
    {"id": "heb-001", "name": "H-E-B Whole Milk, 1 Gallon", "price": 3.48, "category": "Dairy", "image": "🥛"},
    {"id": "heb-002", "name": "H-E-B Large Eggs, Dozen", "price": 2.98, "category": "Dairy", "image": "🥚"},
    {"id": "heb-003", "name": "H-E-B Sliced Sandwich Bread", "price": 2.28, "category": "Bakery", "image": "🍞"},
    {"id": "heb-004", "name": "H-E-B Boneless Chicken Breast, per lb", "price": 3.97, "category": "Meat", "image": "🍗"},
    {"id": "heb-005", "name": "H-E-B Avocados, each", "price": 1.28, "category": "Produce", "image": "🥑"},
    {"id": "heb-006", "name": "H-E-B Bananas, per lb", "price": 0.59, "category": "Produce", "image": "🍌"},
    {"id": "heb-007", "name": "H-E-B Roma Tomatoes, per lb", "price": 1.49, "category": "Produce", "image": "🍅"},
    {"id": "heb-008", "name": "H-E-B Shredded Cheddar Cheese, 8oz", "price": 2.78, "category": "Dairy", "image": "🧀"},
    {"id": "heb-009", "name": "H-E-B Tortilla Chips", "price": 2.98, "category": "Snacks", "image": "🌽"},
    {"id": "heb-010", "name": "H-E-B Salsa, 16oz", "price": 3.28, "category": "Snacks", "image": "🌶️"},
    {"id": "heb-011", "name": "H-E-B Sparkling Water, 12 pack", "price": 4.98, "category": "Beverages", "image": "🥤"},
    {"id": "heb-012", "name": "H-E-B Orange Juice, 59oz", "price": 4.48, "category": "Beverages", "image": "🍊"},
    {"id": "heb-013", "name": "H-E-B Pasta, 16oz", "price": 1.18, "category": "Pantry", "image": "🍝"},
    {"id": "heb-014", "name": "H-E-B Marinara Sauce, 24oz", "price": 2.48, "category": "Pantry", "image": "🍅"},
    {"id": "heb-015", "name": "H-E-B Ground Beef 80/20, per lb", "price": 5.47, "category": "Meat", "image": "🥩"},
    {"id": "heb-016", "name": "H-E-B Frozen Pizza", "price": 4.98, "category": "Frozen", "image": "🍕"},
    {"id": "heb-017", "name": "H-E-B Ice Cream, 48oz", "price": 4.28, "category": "Frozen", "image": "🍦"},
    {"id": "heb-018", "name": "H-E-B Paper Towels, 6 rolls", "price": 8.98, "category": "Household", "image": "🧻"},
    {"id": "heb-019", "name": "H-E-B Laundry Detergent", "price": 9.98, "category": "Household", "image": "🧺"},
    {"id": "heb-020", "name": "H-E-B Coffee, 12oz", "price": 6.98, "category": "Pantry", "image": "☕"},
    {"id": "heb-021", "name": "H-E-B Greek Yogurt, 32oz", "price": 4.78, "category": "Dairy", "image": "🥣"},
    {"id": "heb-022", "name": "H-E-B Bell Peppers, each", "price": 0.98, "category": "Produce", "image": "🫑"},
    {"id": "heb-023", "name": "H-E-B Tortillas, Flour, 10ct", "price": 2.68, "category": "Bakery", "image": "🫓"},
    {"id": "heb-024", "name": "H-E-B Bottled Water, 24 pack", "price": 3.98, "category": "Beverages", "image": "💧"},
    {"id": "heb-025", "name": "H-E-B Cereal, 18oz", "price": 3.98, "category": "Pantry", "image": "🥣"},
]


@router.get("/products")
def search_products(q: str = Query("", description="Search query")):
    if not q:
        return CATALOG
    q_lower = q.lower()
    return [p for p in CATALOG if q_lower in p["name"].lower() or q_lower in p["category"].lower()]


@router.get("/categories")
def list_categories():
    return sorted({p["category"] for p in CATALOG})
