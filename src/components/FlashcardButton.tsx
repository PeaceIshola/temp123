import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FlashcardButtonProps {
  contentId: string;
  contentTitle: string;
  className?: string;
}

export function FlashcardButton({ contentId, contentTitle, className }: FlashcardButtonProps) {
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlashcardCount();
  }, [contentId]);

  const fetchFlashcardCount = async () => {
    const { count } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId);

    setFlashcardCount(count || 0);
    setLoading(false);
  };

  const handleClick = () => {
    navigate(`/flashcards/${contentId}`);
  };

  if (loading || flashcardCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`gap-2 ${className}`}
      size="sm"
    >
      <Brain className="w-4 h-4" />
      Study Flashcards ({flashcardCount})
    </Button>
  );
}