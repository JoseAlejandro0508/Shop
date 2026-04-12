using Microsoft.AspNetCore.Mvc;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public sealed class CatalogController : ControllerBase
{
    private readonly StoreService _store;

    public CatalogController(StoreService store)
    {
        _store = store;
    }

    [HttpGet]
    public IActionResult GetCatalog() => Ok(_store.GetSnapshot());
}
