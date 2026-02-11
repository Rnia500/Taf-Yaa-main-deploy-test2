import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "./Input.jsx";
import Text from "./Text.jsx";
import Card from "../layout/containers/Card.jsx";
import Submenu from "./Submenu.jsx";
import Row from "../layout/containers/Row.jsx";
import Column from "../layout/containers/Column.jsx";

export default function LanguageMenu({ isOpen, onClose, triggerRef }) {
  const { i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);

    // RTL support for Arabic
    if (lng === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // Use setTimeout to ensure the language change completes before closing
    setTimeout(() => {
      onClose?.();
    }, 0);
  };

  // Filter languages based on search term
  const filteredLanguages = languages.filter(lang =>
    lang.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentLang = i18n.language || "en";

  return (
    <Submenu
      isOpen={isOpen}
      onClose={onClose}
      className="language-menu"
      title="Language"
      showHeader={true}
      excludeRefs={triggerRef ? [triggerRef] : []}
    >
      <div>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search languages..."
          backgroundColor="var(--color-white)"
          color="var(--color-primary-text)"
          size="sm"
        />
      </div>

      <div className="language-menu-list">
        {filteredLanguages.length > 0 ? (
          filteredLanguages.map((lang) => (
            <Card
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`language-option ${currentLang.startsWith(lang.code) ? 'active' : ''}`}
              padding="0.25rem"
              margin="0"
              backgroundColor={currentLang.startsWith(lang.code) ? "var(--color-primary-light)" : "transparent"}
              borderColor={currentLang.startsWith(lang.code) ? "var(--color-primary-light)" : "transparent"}
              borderRadius="8px"
              height="auto"
              width="100%"
            >
              <Row fitContent width="100%" justifyContent="space-between" padding="0px" margin="0px">

                <Row fitContent gap="0.25rem" padding="0px" margin="0px">
                  <Text as="p" variant="caption1" bold={currentLang.startsWith(lang.code)}>
                    {lang.label}
                  </Text>
                  <Text as="p" variant="caption2" >
                    {lang.native}
                  </Text>
                </Row>
                {currentLang.startsWith(lang.code) && (
                  <div className="language-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </Row>
            </Card>
          ))
        ) : (
          <div className="language-no-results">
            <Text variant="caption" color="secondary-text">
              No languages found
            </Text>
          </div>
        )}
      </div>
    </Submenu>
  );
}

const languages = [
  {
    code: "en",
    label: "English",
    native: "English",
  },
  {
    code: "fr",
    label: "French",
    native: "Français",
  },
  {
    code: "es",
    label: "Spanish",
    native: "Español",
  },
  {
    code: "ar",
    label: "Arabic",
    native: "العربية",
  },
  // Add more languages for testing
  {
    code: "de",
    label: "German",
    native: "Deutsch",
  },
  {
    code: "it",
    label: "Italian",
    native: "Italiano",
  },
  {
    code: "pt",
    label: "Portuguese",
    native: "Português",
  },
  {
    code: "ru",
    label: "Russian",
    native: "Русский",
  },
  {
    code: "ja",
    label: "Japanese",
    native: "日本語",
  },
  {
    code: "ko",
    label: "Korean",
    native: "한국어",
  },
  {
    code: "zh",
    label: "Chinese",
    native: "中文",
  },
  {
    code: "hi",
    label: "Hindi",
    native: "हिन्दी",
  },
];
