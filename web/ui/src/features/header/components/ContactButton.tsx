import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ContactModal } from "./ContactModal";

export const ContactButton: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-content-secondary hover:text-accent-blue rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
        aria-label={t("header.contact.buttonAriaLabel")}
        title={t("header.contact.buttonAriaLabel")}
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      {open && <ContactModal onClose={() => setOpen(false)} />}
    </>
  );
};
