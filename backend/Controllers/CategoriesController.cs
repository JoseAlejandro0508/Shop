using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Infrastructure;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly StoreService _store;

    public CategoriesController(StoreService store)
    {
        _store = store;
    }

    [HttpPost]
    public IActionResult Create([FromBody] CategoryCreateRequest request)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        var category = _store.AddCategory(request.Name);
        return Ok(category);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete([FromRoute] string id)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        _store.RemoveCategory(id);
        return NoContent();
    }
}
