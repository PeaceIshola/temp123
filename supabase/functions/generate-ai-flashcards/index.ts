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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a prompt for generating flashcards
    const prompt = `Generate 5-7 educational flashcards for the following learning material titled "${contentTitle}".

${contentText ? `Content: ${contentText.substring(0, 2000)}` : `This is ${contentType} content about ${contentTitle}.`}

Create flashcards that:
- Cover key concepts and important information
- Have clear, focused questions
- Include detailed, educational answers
- Range from easy to challenging (difficulty 1-3)
- Help students understand and remember the material

Return the flashcards as a JSON array with this exact structure:
[
  {
    "question": "Clear question here",
    "answer": "Detailed answer here", 
    "difficulty": 1
  }
]

Make sure the response is ONLY valid JSON, no additional text.`;

    console.log('Calling OpenAI to generate flashcards...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational content creator. Generate high-quality flashcards that help students learn effectively. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('OpenAI response:', generatedText);

    // Parse the JSON response
    let flashcards;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      flashcards = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!Array.isArray(flashcards)) {
      throw new Error('AI response is not an array of flashcards');
    }

    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

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
