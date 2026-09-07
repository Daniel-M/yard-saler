import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, MessageCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const contacts = [
    {
      icon: <Send className="h-5 w-5" />,
      label: t("header.contact.telegram"),
      href: "https://t.me/danielmejia55",
      color: "text-sky-400 bg-sky-500/10",
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: t("header.contact.whatsapp"),
      href: "https://wa.me/573206543855",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: t("header.contact.email"),
      href: "mailto:danielmejia55@gmail.com",
      color: "text-purple-400 bg-purple-500/10",
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={onClose}
    >
      <div
        className="relative bg-surface border border-border-subtle rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
          aria-label={t("common.buttons.close")}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <h2
          id="contact-modal-title"
          className="text-lg font-bold text-content-primary"
        >
          {t("header.contact.title")}
        </h2>
        <p className="text-sm text-content-secondary -mt-2">
          {t("header.contact.subtitle")}
        </p>

        {/* Contact links */}
        <ul className="space-y-3" role="list">
          {contacts.map(({ icon, label, href, color }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-surface-elevated border border-border-subtle rounded-xl hover:border-border-interactive transition-colors duration-150 group"
              >
                <span
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${color}`}
                >
                  {icon}
                </span>
                <span className="font-medium text-sm text-content-primary group-hover:text-accent-blue transition-colors">
                  {label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
};

