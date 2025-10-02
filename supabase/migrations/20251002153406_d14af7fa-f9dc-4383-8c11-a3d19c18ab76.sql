-- ========================================
-- FIX: Quiz Success Rate Calculation
-- ========================================
-- Ensure success rate is always between 0-100%

CREATE OR REPLACE FUNCTION public.get_platform_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subject_count integer;
  student_count integer;
  total_score integer := 0;
  total_possible integer := 0;
  success_rate integer := 0;
BEGIN
  -- Get subject count for core subjects
  SELECT COUNT(*) INTO subject_count
  FROM public.subjects
  WHERE code IN ('BST', 'PVS', 'NV');
  
  -- Get student count (users with student role)
  SELECT COUNT(*) INTO student_count
  FROM public.profiles
  WHERE role = 'student';
  
  -- Calculate success rate from quiz attempts
  SELECT 
    COALESCE(SUM(score), 0),
    COALESCE(SUM(total_questions), 0)
  INTO total_score, total_possible
  FROM public.quiz_attempts;
  
  -- Calculate success rate percentage with bounds checking
  IF total_possible > 0 THEN
    success_rate := ROUND((total_score::decimal / total_possible::decimal) * 100);
    
    -- Ensure success rate is between 0 and 100
    IF success_rate < 0 THEN
      success_rate := 0;
    ELSIF success_rate > 100 THEN
      success_rate := 100;
    END IF;
  ELSE
    -- No quiz attempts yet
    success_rate := 0;
  END IF;
  
  -- Return as JSON
  RETURN jsonb_build_object(
    'subjectCount', subject_count,
    'studentCount', student_count,
    'successRate', success_rate
  );
END;
$$;

COMMENT ON FUNCTION public.get_platform_statistics() IS
'Returns platform statistics including quiz success rate (guaranteed 0-100%)';