using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Infrastructure;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly StoreService _store;

    public ProductsController(StoreService store)
    {
        _store = store;
    }

    [HttpPost]
    public IActionResult Create([FromBody] ProductUpsertRequest request)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        var created = _store.AddProduct(request);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public IActionResult Update([FromRoute] string id, [FromBody] ProductUpsertRequest request)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        _store.UpdateProduct(id, request);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete([FromRoute] string id)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        _store.RemoveProduct(id);
        return NoContent();
    }
}
