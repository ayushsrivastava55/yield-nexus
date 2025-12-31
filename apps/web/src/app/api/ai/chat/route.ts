import { streamChatWithAgent, YieldAgentMessage } from "@/lib/ai/agent";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, userContext } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert to message format
    const agentMessages: YieldAgentMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Stream the response
    const result = await streamChatWithAgent(agentMessages, userContext);

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
