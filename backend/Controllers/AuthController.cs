using Microsoft.AspNetCore.Mvc;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly StoreService _store;

    public AuthController(StoreService store)
    {
        _store = store;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!_store.ValidateAdminCredentials(request.Email, request.Password))
        {
            return Unauthorized();
        }

        var token = _store.IssueToken();
        return Ok(new { token });
    }
}
