namespace Tienda.Api;

public sealed class StoreSnapshot
{
    public required StoreSettings Settings { get; init; }
    public required List<Category> Categories { get; init; }
    public required List<Product> Products { get; init; }
}

public sealed class StoreSettings
{
    public string StoreName { get; set; } = "Nova Market";
    public string WhatsappPhone { get; set; } = "573001112233";
    public string Description { get; set; } = "Catálogo configurable con carrito y pedidos por WhatsApp.";
}

public sealed class Category
{
    public required string Id { get; init; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
}

public sealed class Product
{
    public required string Id { get; init; }
    public required string CategoryId { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public required string Image { get; set; }
}

public sealed class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class CategoryCreateRequest
{
    public string Name { get; set; } = string.Empty;
}

public sealed class ProductUpsertRequest
{
    public string CategoryId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Image { get; set; } = string.Empty;
}
