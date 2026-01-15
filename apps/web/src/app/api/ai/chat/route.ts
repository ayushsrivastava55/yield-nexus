import { streamChatWithAgent, YieldAgentMessage } from "@/lib/ai/agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages, userContext } = await req.json();

    console.log("[AI Chat] Received request:", { messageCount: messages?.length, hasUserContext: !!userContext });

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI Chat] OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[AI Chat] OpenAI API key is configured, length:", process.env.OPENAI_API_KEY.length);

    // Convert to message format
    const agentMessages: YieldAgentMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    console.log("[AI Chat] Calling streamChatWithAgent with", agentMessages.length, "messages");

    // Stream the response
    const result = await streamChatWithAgent(agentMessages, userContext);

    console.log("[AI Chat] Got stream result, converting to response");

    // Return the stream response with proper headers
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
