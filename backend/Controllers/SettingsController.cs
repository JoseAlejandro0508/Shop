using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Infrastructure;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly StoreService _store;

    public SettingsController(StoreService store)
    {
        _store = store;
    }

    [HttpPut]
    public IActionResult Update([FromBody] StoreSettings request)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        _store.UpdateSettings(request);
        return NoContent();
    }
}
