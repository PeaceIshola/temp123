-- Fix the ambiguous column reference in generate_missing_flashcards function
CREATE OR REPLACE FUNCTION public.generate_missing_flashcards()
RETURNS TABLE(content_id uuid, title text, flashcards_created integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_record RECORD;
  v_flashcards_created integer := 0;
  v_total_created integer := 0;
BEGIN
  -- Only teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Teachers only';
  END IF;

  -- Find all published content that doesn't have flashcards
  -- Fixed the ambiguous column reference by being explicit about table aliases
  FOR v_content_record IN 
    SELECT c.id, c.title, c.content_type
    FROM public.content c
    LEFT JOIN public.flashcards f ON c.id = f.content_id
    WHERE c.is_published = true 
    AND f.content_id IS NULL  -- This explicitly refers to the flashcards table
  LOOP
    -- Generate flashcards for this content
    PERFORM public.generate_auto_flashcards(
      v_content_record.id, 
      v_content_record.title, 
      v_content_record.content_type
    );
    
    -- Count how many flashcards were created
    SELECT COUNT(*) INTO v_flashcards_created
    FROM public.flashcards 
    WHERE content_id = v_content_record.id;
    
    v_total_created := v_total_created + v_flashcards_created;
    
    -- Return the result for this content
    content_id := v_content_record.id;
    title := v_content_record.title;
    flashcards_created := v_flashcards_created;
    
    RETURN NEXT;
  END LOOP;
  
  -- Log the total
  RAISE NOTICE 'Generated flashcards for existing content. Total flashcards created: %', v_total_created;
  
  RETURN;
END;
$$;