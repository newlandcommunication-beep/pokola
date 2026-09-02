import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Heart, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  ThumbsUp, 
  MessageSquareHeart, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AppRatingPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (rating: number, review: string) => void;
  isDarkMode?: boolean;
  viewCount?: number;
}

const RATING_TAGS = [
  '⚡ Fast Loan Turnaround',
  '💰 Clear 25% Interest Terms',
  '📱 Easy M-Pesa / EcoCash Pay',
  '🎓 NMDS Friendly',
  '🔒 Secure & Transparent',
  '🤝 Helpful AI Support'
];

export const AppRatingPrompt: React.FC<AppRatingPromptProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  isDarkMode = false,
  viewCount = 3
}) => {
  const { currentUser, addAuditLog } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setRating(5);
      setSelectedTags([]);
      setFeedbackText('');
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return '🌟 Outstanding & Life-Saving!';
      case 4: return '👍 Very Helpful & Easy';
      case 3: return '🙂 Good Student Experience';
      case 2: return '😐 Needs Improvement';
      case 1: return '🙁 Disappointing';
      default: return 'Rate your POKOLA experience';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    const userId = currentUser?.id || 'guest';
    const userName = currentUser?.fullName || 'Student Borrower';

    // Store completed rating status in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`pokola_app_rated_${userId}`, 'true');
      localStorage.setItem(`pokola_app_rating_val_${userId}`, String(rating));
      localStorage.setItem(`pokola_app_rating_date_${userId}`, new Date().toISOString());
    }

    try {
      // Record audit log for administrative review & analytics
      if (addAuditLog) {
        addAuditLog({
          action: 'SUBMIT_APP_RATING',
          affectedRecordType: 'StudentFeedback',
          affectedRecordId: `rating_${userId}`,
          details: `Student ${userName} rated POKOLA ${rating}/5 stars after ${viewCount} loan status checks. Tags: ${selectedTags.join(', ') || 'None'}. Review: ${feedbackText || 'No comment'}`,
          newValue: JSON.stringify({ rating, tags: selectedTags, feedback: feedbackText }),
          userRole: currentUser?.role || 'student'
        });
      }
    } catch (err) {
      console.warn('Could not record rating audit log:', err);
    }

    if (onSubmitted) {
      onSubmitted(rating, feedbackText);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 2200);
  };

  const handleRemindLater = () => {
    const userId = currentUser?.id || 'guest';
    if (typeof localStorage !== 'undefined') {
      // Set reminder deferral (reset counter to 1 so it re-triggers after 2 more views)
      localStorage.setItem(`pokola_loan_status_view_count_${userId}`, '1');
      localStorage.setItem(`pokola_rating_deferred_at_${userId}`, new Date().toISOString());
    }
    onClose();
  };

  const handleDismissForever = () => {
    const userId = currentUser?.id || 'guest';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`pokola_app_rated_${userId}`, 'dismissed');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="app-rating-prompt-modal"
        className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden transition-all transform scale-100 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">
                  Loan Milestone • View #{viewCount}
                </span>
                <h3 className="text-xs font-black">Enjoying POKOLA?</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemindLater}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isSubmitted ? (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                You've actively tracked your student loan status <strong>3 times</strong>! How has your experience been?
              </p>
              <div className="pt-2">
                <span className="text-xs font-bold text-amber-500 block min-h-[1.25rem]">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* Star Rating Bar */}
            <div className="flex items-center justify-center gap-1.5 py-1" id="rating-stars-container">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transform hover:scale-125 active:scale-95 transition-all focus:outline-none"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star 
                      className={`w-7 h-7 transition-colors ${
                        isActive 
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs' 
                          : isDarkMode ? 'text-slate-700' : 'text-slate-200'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>

            {/* Feature Feedback Tags */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                What do you like most about POKOLA?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RATING_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : isDarkMode 
                            ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800' 
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment Field */}
            <div className="space-y-1">
              <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Feedback or Suggestions (Optional):
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us how we can make student loans easier for Lesotho universities..."
                rows={2}
                className={`w-full p-2.5 rounded-xl border text-xs resize-none focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="submit-rating-btn"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Rating</span>
              </button>

              <div className="flex items-center justify-between text-[11px] px-1">
                <button
                  type="button"
                  onClick={handleRemindLater}
                  className={`hover:underline ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  Remind Me Later
                </button>
                <button
                  type="button"
                  onClick={handleDismissForever}
                  className={`hover:underline ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  Don't Ask Again
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Thank You State */
          <div className="p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black">Kea Leboha! (Thank You!)</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Your rating helps us keep interest rates fair and improve the POKOLA experience for all Lesotho students.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                POKOLA Verified Student Review
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
