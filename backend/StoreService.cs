using Microsoft.Data.Sqlite;

namespace Tienda.Api;

public sealed class StoreService
{
    private readonly string _connectionString;
    private readonly object _sync = new();
    private readonly HashSet<string> _tokens = [];

    public StoreService(IWebHostEnvironment env)
    {
        var appDataDir = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(appDataDir);
        var dbPath = Path.Combine(appDataDir, "store.db");
        _connectionString = $"Data Source={dbPath}";

        InitializeDatabase();
    }

    public bool ValidateAdminCredentials(string email, string password)
        => email == "admin@tienda.com" && password == "123456";

    public string IssueToken()
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        lock (_sync)
        {
            _tokens.Add(token);
        }
        return token;
    }

    public bool ValidateToken(string token)
    {
        lock (_sync)
        {
            return _tokens.Contains(token);
        }
    }

    public StoreSnapshot GetSnapshot()
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            var settings = ReadSettings(connection);
            var categories = ReadCategories(connection);
            var products = ReadProducts(connection);

            return new StoreSnapshot
            {
                Settings = settings,
                Categories = categories,
                Products = products
            };
        }
    }

    public void UpdateSettings(StoreSettings settings)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
UPDATE settings
SET store_name = $store_name,
    whatsapp_phone = $whatsapp_phone,
    description = $description,
    logo_url = $logo_url,
    support_prompt = $support_prompt
WHERE id = 1;";
            command.Parameters.AddWithValue("$store_name", settings.StoreName.Trim());
            command.Parameters.AddWithValue("$whatsapp_phone", settings.WhatsappPhone.Trim());
            command.Parameters.AddWithValue("$description", settings.Description.Trim());
            command.Parameters.AddWithValue("$logo_url", string.IsNullOrWhiteSpace(settings.LogoUrl) ? "/logo.svg" : settings.LogoUrl.Trim());
            command.Parameters.AddWithValue("$support_prompt", settings.SupportPrompt?.Trim() ?? string.Empty);
            command.ExecuteNonQuery();
        }
    }

    public Category AddCategory(string name)
    {
        var clean = name.Trim();
        if (string.IsNullOrWhiteSpace(clean))
            throw new InvalidOperationException("El nombre de categoría no puede estar vacío.");

        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            var category = new Category
            {
                Id = $"cat-{Guid.NewGuid():N}"[..12],
                Name = clean,
                Slug = ToSlug(clean)
            };

            using var command = connection.CreateCommand();
            command.CommandText = @"
INSERT INTO categories (id, name, slug)
VALUES ($id, $name, $slug);";
            command.Parameters.AddWithValue("$id", category.Id);
            command.Parameters.AddWithValue("$name", category.Name);
            command.Parameters.AddWithValue("$slug", category.Slug);
            command.ExecuteNonQuery();

            return category;
        }
    }

    public void RemoveCategory(string id)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            using var tx = connection.BeginTransaction();

            using (var deleteProducts = connection.CreateCommand())
            {
                deleteProducts.Transaction = tx;
                deleteProducts.CommandText = "DELETE FROM products WHERE category_id = $id;";
                deleteProducts.Parameters.AddWithValue("$id", id);
                deleteProducts.ExecuteNonQuery();
            }

            using (var deleteCategory = connection.CreateCommand())
            {
                deleteCategory.Transaction = tx;
                deleteCategory.CommandText = "DELETE FROM categories WHERE id = $id;";
                deleteCategory.Parameters.AddWithValue("$id", id);
                deleteCategory.ExecuteNonQuery();
            }

            tx.Commit();
        }
    }

    public Product AddProduct(ProductUpsertRequest request)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            EnsureCategoryExists(connection, request.CategoryId);

            var product = MapProduct($"prd-{Guid.NewGuid():N}"[..12], request);

            using var command = connection.CreateCommand();
            command.CommandText = @"
INSERT INTO products (id, category_id, name, description, price, stock, image)
VALUES ($id, $category_id, $name, $description, $price, $stock, $image);";
            command.Parameters.AddWithValue("$id", product.Id);
            command.Parameters.AddWithValue("$category_id", product.CategoryId);
            command.Parameters.AddWithValue("$name", product.Name);
            command.Parameters.AddWithValue("$description", product.Description);
            command.Parameters.AddWithValue("$price", product.Price);
            command.Parameters.AddWithValue("$stock", product.Stock);
            command.Parameters.AddWithValue("$image", product.Image);
            command.ExecuteNonQuery();

            return product;
        }
    }

    public void UpdateProduct(string id, ProductUpsertRequest request)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            EnsureCategoryExists(connection, request.CategoryId);
            EnsureProductExists(connection, id);

            var product = MapProduct(id, request);

            using var command = connection.CreateCommand();
            command.CommandText = @"
UPDATE products
SET category_id = $category_id,
    name = $name,
    description = $description,
    price = $price,
    stock = $stock,
    image = $image
WHERE id = $id;";
            command.Parameters.AddWithValue("$id", product.Id);
            command.Parameters.AddWithValue("$category_id", product.CategoryId);
            command.Parameters.AddWithValue("$name", product.Name);
            command.Parameters.AddWithValue("$description", product.Description);
            command.Parameters.AddWithValue("$price", product.Price);
            command.Parameters.AddWithValue("$stock", product.Stock);
            command.Parameters.AddWithValue("$image", product.Image);
            command.ExecuteNonQuery();
        }
    }

    public void RemoveProduct(string id)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM products WHERE id = $id;";
            command.Parameters.AddWithValue("$id", id);
            command.ExecuteNonQuery();
        }
    }

    public SupportConfig GetSupportConfig()
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
SELECT openrouter_api_key, openrouter_model, openrouter_site_url, openrouter_app_name
FROM support_config
WHERE id = 1
LIMIT 1;";

            using var reader = command.ExecuteReader();
            if (!reader.Read())
            {
                return new SupportConfig();
            }

            return new SupportConfig
            {
                OpenRouterApiKey = reader.GetString(0),
                OpenRouterModel = reader.GetString(1),
                OpenRouterSiteUrl = reader.GetString(2),
                OpenRouterAppName = reader.GetString(3)
            };
        }
    }

    public void UpdateSupportConfig(SupportConfigUpdateRequest request)
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            var current = GetSupportConfig();
            var apiKey = string.IsNullOrWhiteSpace(request.OpenRouterApiKey)
                ? current.OpenRouterApiKey
                : request.OpenRouterApiKey.Trim();

            using var command = connection.CreateCommand();
            command.CommandText = @"
UPDATE support_config
SET openrouter_api_key = $api_key,
    openrouter_model = $model,
    openrouter_site_url = $site_url,
    openrouter_app_name = $app_name
WHERE id = 1;";
            command.Parameters.AddWithValue("$api_key", apiKey);
            command.Parameters.AddWithValue("$model", string.IsNullOrWhiteSpace(request.OpenRouterModel) ? "openai/gpt-4o-mini" : request.OpenRouterModel.Trim());
            command.Parameters.AddWithValue("$site_url", string.IsNullOrWhiteSpace(request.OpenRouterSiteUrl) ? "http://localhost:5099" : request.OpenRouterSiteUrl.Trim());
            command.Parameters.AddWithValue("$app_name", string.IsNullOrWhiteSpace(request.OpenRouterAppName) ? "Nova Market" : request.OpenRouterAppName.Trim());
            command.ExecuteNonQuery();
        }
    }

    private Product MapProduct(string id, ProductUpsertRequest request)
    {
        return new Product
        {
            Id = id,
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Price = request.Price,
            Stock = request.Stock,
            Image = string.IsNullOrWhiteSpace(request.Image)
                ? "https://picsum.photos/seed/product/800/600"
                : request.Image.Trim()
        };
    }

    private StoreSettings ReadSettings(SqliteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT store_name, whatsapp_phone, description, logo_url, support_prompt FROM settings WHERE id = 1 LIMIT 1;";
        using var reader = command.ExecuteReader();

        if (!reader.Read())
        {
            return new StoreSettings();
        }

        return new StoreSettings
        {
            StoreName = reader.GetString(0),
            WhatsappPhone = reader.GetString(1),
            Description = reader.GetString(2),
            LogoUrl = reader.GetString(3),
            SupportPrompt = reader.GetString(4)
        };
    }

    private List<Category> ReadCategories(SqliteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, name, slug FROM categories ORDER BY rowid;";
        using var reader = command.ExecuteReader();

        var result = new List<Category>();
        while (reader.Read())
        {
            result.Add(new Category
            {
                Id = reader.GetString(0),
                Name = reader.GetString(1),
                Slug = reader.GetString(2)
            });
        }

        return result;
    }

    private List<Product> ReadProducts(SqliteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, category_id, name, description, price, stock, image FROM products ORDER BY rowid;";
        using var reader = command.ExecuteReader();

        var result = new List<Product>();
        while (reader.Read())
        {
            result.Add(new Product
            {
                Id = reader.GetString(0),
                CategoryId = reader.GetString(1),
                Name = reader.GetString(2),
                Description = reader.GetString(3),
                Price = reader.GetDecimal(4),
                Stock = reader.GetInt32(5),
                Image = reader.GetString(6)
            });
        }

        return result;
    }

    private void EnsureCategoryExists(SqliteConnection connection, string categoryId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT 1 FROM categories WHERE id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", categoryId);
        var exists = command.ExecuteScalar() is not null;

        if (!exists)
            throw new InvalidOperationException("La categoría indicada no existe.");
    }

    private void EnsureProductExists(SqliteConnection connection, string productId)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT 1 FROM products WHERE id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", productId);
        var exists = command.ExecuteScalar() is not null;

        if (!exists)
            throw new InvalidOperationException("Producto no encontrado.");
    }

    private static string ToSlug(string value)
    {
        return value
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }

    private SqliteConnection CreateConnection() => new(_connectionString);

    private void InitializeDatabase()
    {
        lock (_sync)
        {
            using var connection = CreateConnection();
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    store_name TEXT NOT NULL,
    whatsapp_phone TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT NOT NULL DEFAULT '/logo.svg',
    support_prompt TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL,
    image TEXT NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS support_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    openrouter_api_key TEXT NOT NULL,
    openrouter_model TEXT NOT NULL,
    openrouter_site_url TEXT NOT NULL,
    openrouter_app_name TEXT NOT NULL
);
";
            command.ExecuteNonQuery();

            using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText = "ALTER TABLE settings ADD COLUMN support_prompt TEXT NOT NULL DEFAULT '';";
            try
            {
                alterCommand.ExecuteNonQuery();
            }
            catch
            {
                // Columna ya existe
            }

            using var alterLogoCommand = connection.CreateCommand();
            alterLogoCommand.CommandText = "ALTER TABLE settings ADD COLUMN logo_url TEXT NOT NULL DEFAULT '/logo.svg';";
            try
            {
                alterLogoCommand.ExecuteNonQuery();
            }
            catch
            {
                // Columna ya existe
            }

            SeedIfEmpty(connection);
        }
    }

    private void SeedIfEmpty(SqliteConnection connection)
    {
        static long Count(SqliteConnection connection, string table)
        {
            using var c = connection.CreateCommand();
            c.CommandText = $"SELECT COUNT(*) FROM {table};";
            return (long)(c.ExecuteScalar() ?? 0L);
        }

        using var tx = connection.BeginTransaction();

        if (Count(connection, "settings") == 0)
        {
            using var settingsCmd = connection.CreateCommand();
            settingsCmd.Transaction = tx;
            settingsCmd.CommandText = @"
INSERT INTO settings (id, store_name, whatsapp_phone, description)
VALUES (1, $store_name, $whatsapp_phone, $description);";
            settingsCmd.Parameters.AddWithValue("$store_name", "Nova Market");
            settingsCmd.Parameters.AddWithValue("$whatsapp_phone", "573001112233");
            settingsCmd.Parameters.AddWithValue("$description", "Catálogo configurable con carrito y pedidos por WhatsApp.");
            settingsCmd.ExecuteNonQuery();
        }

        using (var promptCmd = connection.CreateCommand())
        {
            promptCmd.Transaction = tx;
            promptCmd.CommandText = @"
UPDATE settings
SET support_prompt = $support_prompt
WHERE id = 1 AND (support_prompt IS NULL OR support_prompt = '');";
            promptCmd.Parameters.AddWithValue("$support_prompt", "Responde como asesor de la tienda. Sé amable, claro y orientado a ayudar al cliente a comprar.");
            promptCmd.ExecuteNonQuery();
        }

        using (var logoCmd = connection.CreateCommand())
        {
            logoCmd.Transaction = tx;
            logoCmd.CommandText = @"
UPDATE settings
SET logo_url = '/logo.svg'
WHERE id = 1 AND (logo_url IS NULL OR logo_url = '');";
            logoCmd.ExecuteNonQuery();
        }

        if (Count(connection, "categories") == 0)
        {
            InsertCategory(connection, tx, "cat-1", "Tecnología", "tecnologia");
            InsertCategory(connection, tx, "cat-2", "Hogar", "hogar");
            InsertCategory(connection, tx, "cat-3", "Accesorios", "accesorios");
        }

        if (Count(connection, "products") == 0)
        {
            InsertProduct(connection, tx, "prd-1", "cat-1", "Auriculares inalámbricos", "Audio claro, controles táctiles y estuche de carga compacto.", 129.9m, 24, "https://picsum.photos/seed/auriculares/800/600");
            InsertProduct(connection, tx, "prd-2", "cat-1", "Teclado mecánico", "Retroiluminación, switches suaves y diseño de alto rendimiento.", 189.5m, 15, "https://picsum.photos/seed/teclado/800/600");
            InsertProduct(connection, tx, "prd-3", "cat-2", "Lámpara minimalista", "Iluminación cálida para escritorio, sala o habitación.", 74.0m, 30, "https://picsum.photos/seed/lampara/800/600");
            InsertProduct(connection, tx, "prd-4", "cat-2", "Difusor aromático", "Ambiente relajante con luces suaves y temporizador.", 58.75m, 18, "https://picsum.photos/seed/difusor/800/600");
            InsertProduct(connection, tx, "prd-5", "cat-3", "Cargador rápido", "Carga eficiente para distintos dispositivos móviles.", 39.9m, 40, "https://picsum.photos/seed/cargador/800/600");
            InsertProduct(connection, tx, "prd-6", "cat-3", "Bolso premium", "Diseño compacto con acabado resistente y versátil.", 96.2m, 10, "https://picsum.photos/seed/bolso/800/600");
        }

        if (Count(connection, "support_config") == 0)
        {
            var defaultApiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY")
                ?? "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";

            using var supportCmd = connection.CreateCommand();
            supportCmd.Transaction = tx;
            supportCmd.CommandText = @"
INSERT INTO support_config (id, openrouter_api_key, openrouter_model, openrouter_site_url, openrouter_app_name)
VALUES (1, $api_key, $model, $site_url, $app_name);";
            supportCmd.Parameters.AddWithValue("$api_key", defaultApiKey);
            supportCmd.Parameters.AddWithValue("$model", "openai/gpt-4o-mini");
            supportCmd.Parameters.AddWithValue("$site_url", "http://localhost:5099");
            supportCmd.Parameters.AddWithValue("$app_name", "Nova Market");
            supportCmd.ExecuteNonQuery();
        }

        tx.Commit();
    }

    private static void InsertCategory(SqliteConnection connection, SqliteTransaction tx, string id, string name, string slug)
    {
        using var cmd = connection.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = "INSERT INTO categories (id, name, slug) VALUES ($id, $name, $slug);";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.Parameters.AddWithValue("$name", name);
        cmd.Parameters.AddWithValue("$slug", slug);
        cmd.ExecuteNonQuery();
    }

    private static void InsertProduct(
        SqliteConnection connection,
        SqliteTransaction tx,
        string id,
        string categoryId,
        string name,
        string description,
        decimal price,
        int stock,
        string image)
    {
        using var cmd = connection.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = @"
INSERT INTO products (id, category_id, name, description, price, stock, image)
VALUES ($id, $category_id, $name, $description, $price, $stock, $image);";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.Parameters.AddWithValue("$category_id", categoryId);
        cmd.Parameters.AddWithValue("$name", name);
        cmd.Parameters.AddWithValue("$description", description);
        cmd.Parameters.AddWithValue("$price", price);
        cmd.Parameters.AddWithValue("$stock", stock);
        cmd.Parameters.AddWithValue("$image", image);
        cmd.ExecuteNonQuery();
    }
}
