using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Infrastructure;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/admin/support-config")]
public sealed class AdminSupportController : ControllerBase
{
    private readonly StoreService _store;

    public AdminSupportController(StoreService store)
    {
        _store = store;
    }

    [HttpGet]
    public IActionResult Get()
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
            return Unauthorized();

        var config = _store.GetSupportConfig();

        return Ok(new
        {
            openRouterApiKeyMasked = Mask(config.OpenRouterApiKey),
            openRouterModel = config.OpenRouterModel,
            openRouterSiteUrl = config.OpenRouterSiteUrl,
            openRouterAppName = config.OpenRouterAppName
        });
    }

    [HttpPut]
    public IActionResult Update([FromBody] SupportConfigUpdateRequest request)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
            return Unauthorized();

        _store.UpdateSupportConfig(request);
        return NoContent();
    }

    private static string Mask(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        if (value.Length <= 8) return "********";
        return $"{value[..6]}...{value[^4..]}";
    }
}
