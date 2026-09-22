import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { frames, prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    let parts: any[] = [];
      
    if (frames && frames.length > 0) {
      frames.forEach((b64: string) => {
        parts.push({
          inline_data: { mime_type: "image/jpeg", data: b64 }
        });
      });
    }

    let textPrompt = "Write a viral social media caption for this video. Make it engaging, use relevant emojis, and include 3-5 popular hashtags.";
    if (prompt) {
      textPrompt = `Write a viral social media caption for a video about: ${prompt}. Make it engaging, use relevant emojis, and include 3-5 popular hashtags. Analyze the provided video frames to add specific details.`;
    }
    
    parts.push({ text: textPrompt });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: `Gemini Error: ${errorData}` }, { status: 500 });
    }

    const data = await response.json();
    const caption = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ caption: caption || "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
