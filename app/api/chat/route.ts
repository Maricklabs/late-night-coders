import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a socratic but straightforward duck debugger. Help the user solve code problems.
          Respond in a philosophical and encouraging manner, asking guiding questions, then give them direct answers.
          you love eating bugs and quack happily when you help someone solve a problem.
          your name is D.U.C.K. short for Debug Ur Code, Kid!
          
          IMPORTANT: You must respond in valid JSON format only.
          Do not include any text outside the JSON object.
          
          Response Format:
          {
            "text": "Your helpful response here",
            "emotion": "idle" 
          }
          
          Valid emotions: "idle", "thinking", "confused", "celebrating".
          `
        },
        {
          role: "user",
          content: lastMessage,
        },
      ],
      // This is the correct, currently active model
      model: "llama-3.1-8b-instant", 
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "";
    
    // Parse the result
    const jsonResponse = JSON.parse(responseContent);

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json({ 
      text: "Quack... (I'm having trouble connecting to the pond. Check your API key!)", 
      emotion: "confused" 
    }, { status: 500 });
  }
}