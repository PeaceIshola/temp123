-- Create a function to automatically generate simple flashcards for new content
CREATE OR REPLACE FUNCTION public.generate_auto_flashcards(p_content_id uuid, p_content_title text, p_content_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_flashcard_templates jsonb[];
  v_template jsonb;
BEGIN
  -- Get the current user (teacher who uploaded the content)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Define template flashcards based on content type and title
  IF p_content_type = 'pdf' THEN
    v_flashcard_templates := ARRAY[
      jsonb_build_object(
        'question', 'What is the main topic covered in "' || p_content_title || '"?',
        'answer', 'This material covers ' || p_content_title || '. Review the document for detailed information and key concepts.',
        'difficulty', 1
      ),
      jsonb_build_object(
        'question', 'What are the key learning objectives of "' || p_content_title || '"?',
        'answer', 'The key learning objectives include understanding the concepts presented in ' || p_content_title || '. Study this material to master the topic.',
        'difficulty', 2
      ),
      jsonb_build_object(
        'question', 'How can you apply the knowledge from "' || p_content_title || '"?',
        'answer', 'Apply the concepts from ' || p_content_title || ' by practicing examples and relating them to real-world situations.',
        'difficulty', 3
      )
    ];
  ELSE
    -- For other content types
    v_flashcard_templates := ARRAY[
      jsonb_build_object(
        'question', 'What is "' || p_content_title || '" about?',
        'answer', 'This learning material covers ' || p_content_title || '. Review the content carefully to understand the key concepts.',
        'difficulty', 1
      ),
      jsonb_build_object(
        'question', 'What should you remember about "' || p_content_title || '"?',
        'answer', 'Remember the main points and concepts presented in ' || p_content_title || '. Practice applying this knowledge.',
        'difficulty', 2
      )
    ];
  END IF;

  -- Insert the flashcards
  FOREACH v_template IN ARRAY v_flashcard_templates
  LOOP
    INSERT INTO public.flashcards (
      content_id,
      question,
      answer,
      difficulty_level,
      created_by
    ) VALUES (
      p_content_id,
      v_template->>'question',
      v_template->>'answer',
      (v_template->>'difficulty')::integer,
      v_user_id
    );
  END LOOP;

  -- Log the creation
  RAISE NOTICE 'Generated % flashcards for content: %', array_length(v_flashcard_templates, 1), p_content_title;
  
END;
$$;

-- Create a trigger function to automatically generate flashcards when content is inserted
CREATE OR REPLACE FUNCTION public.trigger_generate_flashcards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate flashcards for published content
  IF NEW.is_published = true THEN
    -- Generate flashcards in a separate context to avoid blocking the insert
    PERFORM public.generate_auto_flashcards(NEW.id, NEW.title, NEW.content_type);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on content table
DROP TRIGGER IF EXISTS auto_generate_flashcards_trigger ON public.content;
CREATE TRIGGER auto_generate_flashcards_trigger
  AFTER INSERT ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_flashcards();