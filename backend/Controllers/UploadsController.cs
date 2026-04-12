using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Infrastructure;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController : ControllerBase
{
    private readonly StoreService _store;
    private readonly IWebHostEnvironment _environment;

    public UploadsController(StoreService store, IWebHostEnvironment environment)
    {
        _store = store;
        _environment = environment;
    }

    [HttpPost("product-image")]
    public async Task<IActionResult> UploadProductImage([FromForm] IFormFile file)
        => await UploadImage(file);

    [HttpPost("store-logo")]
    public async Task<IActionResult> UploadStoreLogo([FromForm] IFormFile file)
        => await UploadImage(file);

    private async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (!AdminAuthHelper.IsAdmin(HttpContext, _store))
        {
            return Unauthorized();
        }

        if (file.Length == 0)
        {
            return BadRequest(new { message = "El archivo está vacío." });
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Solo se permiten imágenes." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".jpg";
        }

        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        return Ok(new { imageUrl = $"/uploads/{fileName}" });
    }
}
