'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SessionForm = ({ initialData, onSubmit, onCancel, learnerId, learnerName }) => {
  const [formData, setFormData] = useState({
    learner_id: learnerId || initialData?.learner_id || '',
    skill_taught: initialData?.skill_taught || '',
    skill_learned: initialData?.skill_learned || '',
    scheduled_date: initialData?.scheduled_date || '',
    scheduled_time: initialData?.scheduled_time || '',
    duration_minutes: initialData?.duration_minutes || 60,
    notes: initialData?.notes || '',
  });

  // Update learner_id when prop changes
  useEffect(() => {
    if (learnerId) {
      setFormData(prev => ({ ...prev, learner_id: learnerId }));
    }
  }, [learnerId]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set today's date as minimum date
  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const newErrors = {};

    // Check learner_id from formData or prop
    const finalLearnerId = formData.learner_id || learnerId;
    if (!finalLearnerId) {
      newErrors.learner_id = 'Learner is required';
    }
    if (!formData.skill_taught || !formData.skill_taught.trim()) {
      newErrors.skill_taught = 'Skill to teach is required';
    }
    if (!formData.skill_learned || !formData.skill_learned.trim()) {
      newErrors.skill_learned = 'Skill to learn is required';
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required';
    } else {
      const selectedDate = new Date(formData.scheduled_date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (selectedDate < todayDate) {
        newErrors.scheduled_date = 'Date cannot be in the past';
      }
    }
    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Scheduled time is required';
    } else {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.scheduled_time)) {
        newErrors.scheduled_time = 'Time must be in HH:MM format (24-hour)';
      }
    }
    if (!formData.duration_minutes || formData.duration_minutes < 15 || formData.duration_minutes > 480) {
      newErrors.duration_minutes = 'Duration must be between 15 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure learner_id is included in form data
      const submitData = {
        ...formData,
        learner_id: formData.learner_id || learnerId,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {learnerName && (
        <div>
          <Label>Learner</Label>
          <Input
            value={learnerName}
            disabled
            className="bg-muted"
          />
        </div>
      )}

      <div>
        <Label htmlFor="skill_taught">Skill You're Teaching *</Label>
        <Input
          id="skill_taught"
          value={formData.skill_taught}
          onChange={(e) => handleChange('skill_taught', e.target.value)}
          placeholder="e.g., Python Programming"
          className={errors.skill_taught ? 'border-red-500' : ''}
        />
        {errors.skill_taught && (
          <p className="text-sm text-red-500 mt-1">{errors.skill_taught}</p>
        )}
      </div>

      <div>
        <Label htmlFor="skill_learned">Skill They're Learning *</Label>
        <Input
          id="skill_learned"
          value={formData.skill_learned}
          onChange={(e) => handleChange('skill_learned', e.target.value)}
          placeholder="e.g., JavaScript"
          className={errors.skill_learned ? 'border-red-500' : ''}
        />
        {errors.skill_learned && (
          <p className="text-sm text-red-500 mt-1">{errors.skill_learned}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduled_date">Date *</Label>
          <Input
            id="scheduled_date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => handleChange('scheduled_date', e.target.value)}
            min={today}
            className={errors.scheduled_date ? 'border-red-500' : ''}
          />
          {errors.scheduled_date && (
            <p className="text-sm text-red-500 mt-1">{errors.scheduled_date}</p>
          )}
        </div>

        <div>
          <Label htmlFor="scheduled_time">Time *</Label>
          <Input
            id="scheduled_time"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => handleChange('scheduled_time', e.target.value)}
            className={errors.scheduled_time ? 'border-red-500' : ''}
          />
          {errors.scheduled_time && (
            <p className="text-sm text-red-500 mt-1">{errors.scheduled_time}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
        <Input
          id="duration_minutes"
          type="number"
          min="15"
          max="480"
          step="15"
          value={formData.duration_minutes}
          onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 60)}
          className={errors.duration_minutes ? 'border-red-500' : ''}
        />
        {errors.duration_minutes && (
          <p className="text-sm text-red-500 mt-1">{errors.duration_minutes}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 15 minutes, maximum 480 minutes (8 hours)
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Add any additional details about the session..."
          rows={4}
        />
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : (initialData ? 'Update Session' : 'Create Session')}
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;

