-- Allow students to delete their own homework questions
CREATE POLICY "Students can delete their own homework questions"
ON homework_help_questions
FOR DELETE
USING (auth.uid() = user_id);

-- Allow teachers to delete any homework question
CREATE POLICY "Teachers can delete homework questions"
ON homework_help_questions
FOR DELETE
USING (is_teacher_or_admin());