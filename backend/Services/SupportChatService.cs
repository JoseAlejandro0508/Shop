using System.Text;
using System.Text.Json;

namespace Tienda.Api.Services;

public sealed class SupportChatService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly StoreService _store;

    public SupportChatService(HttpClient http, IConfiguration configuration, StoreService store)
    {
        _http = http;
        _configuration = configuration;
        _store = store;
    }

    public async Task<string> GetAssistantReplyAsync(string userMessage, StoreSettings settings, CancellationToken cancellationToken = default)
    {
        var supportConfig = _store.GetSupportConfig();

        var apiKey = !string.IsNullOrWhiteSpace(supportConfig.OpenRouterApiKey)
            ? supportConfig.OpenRouterApiKey
            : _configuration["OPENROUTER_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Falta OPENROUTER_API_KEY en variables de entorno.");

        var model = !string.IsNullOrWhiteSpace(supportConfig.OpenRouterModel)
            ? supportConfig.OpenRouterModel
            : _configuration["OPENROUTER_MODEL"];
        if (string.IsNullOrWhiteSpace(model))
            model = "openai/gpt-4o-mini";

        var systemPrompt = BuildSystemPrompt(settings);

        var payload = new
        {
            model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {apiKey}");
        request.Headers.TryAddWithoutValidation(
            "HTTP-Referer",
            !string.IsNullOrWhiteSpace(supportConfig.OpenRouterSiteUrl)
                ? supportConfig.OpenRouterSiteUrl
                : (_configuration["OPENROUTER_SITE_URL"] ?? "http://localhost:5099"));
        request.Headers.TryAddWithoutValidation(
            "X-Title",
            !string.IsNullOrWhiteSpace(supportConfig.OpenRouterAppName)
                ? supportConfig.OpenRouterAppName
                : (_configuration["OPENROUTER_APP_NAME"] ?? settings.StoreName));

        var json = JsonSerializer.Serialize(payload);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request, cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"OpenRouter error ({(int)response.StatusCode}): {responseText}");

        using var document = JsonDocument.Parse(responseText);
        var content = document
            .RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return string.IsNullOrWhiteSpace(content)
            ? "No pude generar respuesta en este momento. Intenta nuevamente."
            : content;
    }

    private static string BuildSystemPrompt(StoreSettings settings)
    {
        var basePrompt = string.IsNullOrWhiteSpace(settings.SupportPrompt)
            ? "Actúa como personal de atención al cliente de la tienda, responde dudas sobre productos, envíos, pagos y soporte."
            : settings.SupportPrompt.Trim();

        return $"""
{basePrompt}

Contexto de la tienda:
- Nombre: {settings.StoreName}
- Descripción: {settings.Description}
- Canal principal: WhatsApp {settings.WhatsappPhone}

Instrucciones:
- Responde en español claro, cordial y orientado a venta/soporte.
- Si te preguntan por productos, guía al usuario al catálogo y sugiere categorías.
- Si no sabes algo específico, sé transparente y ofrece escalar con un humano.
""";
    }
}
