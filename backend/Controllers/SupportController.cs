using Microsoft.AspNetCore.Mvc;
using Tienda.Api.Services;

namespace Tienda.Api.Controllers;

[ApiController]
[Route("api/support")]
public sealed class SupportController : ControllerBase
{
    private readonly StoreService _store;
    private readonly SupportChatService _chat;

    public SupportController(StoreService store, SupportChatService chat)
    {
        _store = store;
        _chat = chat;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] SupportChatRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "El mensaje no puede estar vacío." });

        var snapshot = _store.GetSnapshot();
        var reply = await _chat.GetAssistantReplyAsync(request.Message, snapshot.Settings, cancellationToken);
        return Ok(new { reply });
    }
}
