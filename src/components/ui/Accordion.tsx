import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="bg-bg-surface border border-border-default rounded-card overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-start cursor-pointer hover:bg-bg-page transition-colors"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-text-main text-sm">{item.question}</span>
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-primary transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-light">
                <div className="pt-4">{item.answer}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
