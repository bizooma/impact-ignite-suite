import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Phone, Mail, DollarSign, HelpCircle } from 'lucide-react';
import { ChatbotWidgetConfig } from '@/types/database';

interface ChatbotFooterProps {
  config: ChatbotWidgetConfig;
  brandColors: { primary: string; accent: string };
  onVolunteerClick: () => void;
  onFaqClick: () => void;
  onTrackEvent: (eventType: string, eventData?: any) => void;
}

export const ChatbotFooter: React.FC<ChatbotFooterProps> = ({
  config,
  brandColors,
  onVolunteerClick,
  onFaqClick,
  onTrackEvent,
}) => {
  const handleContactClick = () => {
    onTrackEvent('contact_clicked', { 
      type: config.phone_contact ? 'phone' : 'email',
      value: config.phone_contact || config.email_contact 
    });
    
    if (config.phone_contact) {
      window.open(`tel:${config.phone_contact}`, '_blank');
    } else if (config.email_contact) {
      window.open(`mailto:${config.email_contact}`, '_blank');
    }
  };

  const handleDonationClick = (button: { label: string; url: string }, buttonNum: number) => {
    onTrackEvent('donate_clicked', { 
      button_label: button.label,
      url: button.url,
      button_number: buttonNum
    });
    window.open(button.url, '_blank', 'noopener,noreferrer');
  };

  const hasContactInfo = config.email_contact || config.phone_contact;
  const hasDonations = config.show_donations && 
    (config.donation_button_1 || config.donation_button_2);

  return (
    <div className="border-t bg-background/70 backdrop-blur-sm p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Volunteer button */}
        <Button
          onClick={() => {
            onTrackEvent('volunteer_opened');
            onVolunteerClick();
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Heart className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Volunteer</span>
        </Button>

        {/* Contact button */}
        {hasContactInfo && (
          <Button
            onClick={handleContactClick}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {config.phone_contact ? (
              <Phone className="w-4 h-4 mr-1" />
            ) : (
              <Mail className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">Contact</span>
          </Button>
        )}

        {/* Donation buttons */}
        {hasDonations && config.donation_button_1 && (
          <Button
            onClick={() => handleDonationClick(config.donation_button_1!, 1)}
            variant="default"
            size="sm"
            className="w-full"
            style={{ backgroundColor: brandColors.accent, color: 'white' }}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            <span className="truncate">{config.donation_button_1.label}</span>
          </Button>
        )}

        {hasDonations && config.donation_button_2 && (
          <Button
            onClick={() => handleDonationClick(config.donation_button_2!, 2)}
            variant="default"
            size="sm"
            className="w-full"
            style={{ backgroundColor: brandColors.accent, color: 'white' }}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            <span className="truncate">{config.donation_button_2.label}</span>
          </Button>
        )}

        {/* FAQ button */}
        <Button
          onClick={() => {
            onTrackEvent('faq_opened');
            onFaqClick();
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">FAQ</span>
        </Button>
      </div>
    </div>
  );
};
