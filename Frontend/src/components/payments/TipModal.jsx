'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { paymentAPI } from '@/lib/api';

export default function TipModal({ isOpen, onClose, toUserId, toUserName }) {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const suggestedAmounts = [5, 10, 25, 50];

  const handleAmountSelect = (value) => {
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setCustomAmount(value);
      setAmount('');
    }
  };

  const handleSubmit = async () => {
    const finalAmount = customAmount || amount;
    
    if (!finalAmount || parseFloat(finalAmount) < 1) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a tip amount of at least $1',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const { url } = await paymentAPI.createTipCheckout(
        toUserId,
        parseFloat(finalAmount),
        message,
        `${baseUrl}/dashboard/payments/success`,
        `${baseUrl}/dashboard/payments/cancel`
      );
      window.location.href = url;
    } catch (error) {
      console.error('Error creating tip checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to process tip. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Send a Tip</h2>
        <p className="text-gray-600 mb-6">
          Show appreciation to <span className="font-semibold">{toUserName}</span> for their help
        </p>

        {/* Suggested Amounts */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Suggested Amounts</Label>
          <div className="grid grid-cols-4 gap-2">
            {suggestedAmounts.map((suggested) => (
              <Button
                key={suggested}
                variant={amount === suggested.toString() ? 'default' : 'outline'}
                onClick={() => handleAmountSelect(suggested)}
              >
                ${suggested}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-4">
          <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
            Or Enter Custom Amount
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">$</span>
            <Input
              id="custom-amount"
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={handleCustomAmountChange}
              min="1"
              max="1000"
              step="0.01"
            />
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <Label htmlFor="message" className="text-sm font-medium mb-2 block">
            Message (Optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Add a personal message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isLoading || (!amount && !customAmount)}
          >
            {isLoading ? 'Processing...' : 'Send Tip'}
          </Button>
        </div>
      </div>
    </div>
  );
}


