namespace Tienda.Api.Infrastructure;

public static class AdminAuthHelper
{
    public static bool IsAdmin(HttpContext http, StoreService store)
    {
        if (!http.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            return false;
        }

        var value = authHeader.ToString();
        if (!value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var token = value[7..].Trim();
        return store.ValidateToken(token);
    }
}
