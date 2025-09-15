import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, RotateCcw, CheckCircle, XCircle, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty_level: number;
}

interface FlashcardProgress {
  flashcard_id: string;
  mastery_level: number;
  correct_count: number;
  incorrect_count: number;
}

export default function Flashcards() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentTitle, setContentTitle] = useState('');

  useEffect(() => {
    if (contentId) {
      fetchFlashcards();
      fetchProgress();
      fetchContentTitle();
    }
  }, [contentId]);

  const fetchContentTitle = async () => {
    const { data } = await supabase
      .from('content')
      .select('title')
      .eq('id', contentId)
      .single();
    
    if (data) {
      setContentTitle(data.title);
    }
  };

  const fetchFlashcards = async () => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('content_id', contentId)
      .order('difficulty_level', { ascending: true });

    if (error) {
      toast.error('Failed to load flashcards');
      return;
    }

    setFlashcards(data || []);
    setLoading(false);
  };

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (data) {
      const progressMap = data.reduce((acc, item) => {
        acc[item.flashcard_id] = item;
        return acc;
      }, {} as Record<string, FlashcardProgress>);
      setProgress(progressMap);
    }
  };

  const updateProgress = async (flashcardId: string, isCorrect: boolean) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const currentProgress = progress[flashcardId] || {
      mastery_level: 0,
      correct_count: 0,
      incorrect_count: 0
    };

    const newProgress = {
      user_id: user.id,
      flashcard_id: flashcardId,
      mastery_level: isCorrect 
        ? Math.min(5, currentProgress.mastery_level + 1)
        : Math.max(0, currentProgress.mastery_level - 1),
      correct_count: isCorrect ? currentProgress.correct_count + 1 : currentProgress.correct_count,
      incorrect_count: isCorrect ? currentProgress.incorrect_count : currentProgress.incorrect_count + 1,
      last_studied_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('flashcard_progress')
      .upsert(newProgress);

    if (!error) {
      setProgress(prev => ({
        ...prev,
        [flashcardId]: newProgress
      }));
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    const currentFlashcard = flashcards[currentIndex];
    updateProgress(currentFlashcard.id, isCorrect);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      toast.success('Study session completed!');
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const getOverallProgress = () => {
    if (flashcards.length === 0) return 0;
    const totalMastery = flashcards.reduce((sum, card) => {
      const cardProgress = progress[card.id];
      return sum + (cardProgress?.mastery_level || 0);
    }, 0);
    return (totalMastery / (flashcards.length * 5)) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Flashcards</h1>
        </div>
        
        <Card className="p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Flashcards Available</h2>
          <p className="text-muted-foreground">
            Flashcards for this content are not available yet.
          </p>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];
  const currentProgress = progress[currentFlashcard.id];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Study Flashcards</h1>
            <p className="text-muted-foreground">{contentTitle}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={resetSession}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Overall Progress: {Math.round(getOverallProgress())}%
          </span>
        </div>
        <Progress value={((currentIndex + 1) / flashcards.length) * 100} className="h-2" />
      </div>

      <Card className="mb-6 min-h-[400px]">
        <CardContent className="p-8">
          <div className="text-center h-full flex flex-col justify-center">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Difficulty: {currentFlashcard.difficulty_level}/5
              </span>
              {currentProgress && (
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">
                    Mastery: {currentProgress.mastery_level}/5 | 
                    Correct: {currentProgress.correct_count} | 
                    Incorrect: {currentProgress.incorrect_count}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {showAnswer ? 'Answer' : 'Question'}
              </h2>
              <div className="text-lg leading-relaxed">
                {showAnswer ? currentFlashcard.answer : currentFlashcard.question}
              </div>
            </div>

            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="mx-auto"
                size="lg"
              >
                Show Answer
              </Button>
            ) : (
              <div className="flex gap-4 justify-center">
                <Button
                  variant="destructive"
                  onClick={() => handleAnswer(false)}
                  className="gap-2"
                  size="lg"
                >
                  <XCircle className="w-5 h-5" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="gap-2"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  Correct
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Study tip: Rate yourself honestly to improve your learning progress!</p>
      </div>
    </div>
  );
}