import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentId, contentTitle, contentText, contentType } = await req.json();

    if (!contentId || !contentTitle) {
      throw new Error('Content ID and title are required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create Supabase client to fetch actual content
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch the actual document content from the database
    let documentContent = contentText;
    if (!documentContent) {
      const { data: contentData, error: contentError } = await supabaseClient
        .from('content')
        .select('description, file_url')
        .eq('id', contentId)
        .single();

      if (contentError) {
        console.error('Error fetching content:', contentError);
      } else if (contentData) {
        documentContent = contentData.description || '';
      }
    }

    if (!documentContent || documentContent.trim().length < 50) {
      throw new Error('Insufficient content to generate flashcards. Please ensure the document has meaningful content.');
    }

    // Create a prompt for generating flashcards based on actual content
    const prompt = `You are creating flashcards to help students test their knowledge and improve memory retention of this learning material.

DOCUMENT TITLE: "${contentTitle}"
DOCUMENT TYPE: ${contentType}

DOCUMENT CONTENT:
${documentContent.substring(0, 5000)}

INSTRUCTIONS:
- Read and analyze the document content carefully
- Create EXACTLY 5 flashcards that test key concepts from this specific material
- Each flashcard should test a specific fact, concept, or idea from the document
- Questions should require recall of information from the document
- Answers should be concise but complete (2-3 sentences)
- Difficulty: 1 (basic recall), 2 (understanding), 3 (application/analysis)
- Make flashcards that help students remember and retrieve this specific information

RESPONSE FORMAT (JSON only, no other text):
[
  {
    "question": "What is [specific concept from document]?",
    "answer": "Concise answer based on document content", 
    "difficulty": 1
  }
]`;

    console.log('Calling Gemini to generate flashcards from document content...');
    console.log(`Document length: ${documentContent.length} characters`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 3000,
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    console.log('Gemini response:', generatedText);

    // Parse the JSON response
    let flashcards;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      flashcards = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!Array.isArray(flashcards)) {
      throw new Error('AI response is not an array of flashcards');
    }

    // Limit to exactly 5 flashcards
    flashcards = flashcards.slice(0, 5);

    // Get the user ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Insert flashcards into the database
    const flashcardInserts = flashcards.map((card: any) => ({
      content_id: contentId,
      question: card.question,
      answer: card.answer,
      difficulty_level: card.difficulty || 1,
      created_by: user.id,
    }));

    const { data: insertedFlashcards, error: insertError } = await supabaseClient
      .from('flashcards')
      .insert(flashcardInserts)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save flashcards: ${insertError.message}`);
    }

    console.log(`Successfully generated and saved ${insertedFlashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ 
        success: true,
        flashcards: insertedFlashcards,
        count: insertedFlashcards.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-ai-flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred generating flashcards';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
