// DownloadProfileModal.jsx
import React from "react";
import Card from "../../../layout/containers/Card";
import Row from "../../../layout/containers/Row";
import Text from "../../Text";
import Spacer from "../../Spacer";
import { Download, FileText, Image as ImageIcon, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DownloadProfileModal({ isOpen, onClose, onSelect }) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  const OptionCard = ({
    icon,
    title,
    subtitle,
    features,
    recommended,
    onClick,
    dim,
  }) => (
    <Card
      padding="16px"
      margin="8px 0"
      style={{
        border: "1px solid var(--color-gray, #ccc)",
        borderRadius: 12,
        cursor: "pointer",
        background: "var(--color-white, #fff)",
        boxShadow: "0 2px 4px rgba(0,0,0,.08)",
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-light-blue)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "var(--color-white)"}
    >
      <Row gap="12px" alignItems="center">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-background, #F3EDE0)",
          }}
        >
          {icon}
        </div>
        <div>
          <Row gap="8px" alignItems="center">
            <Text variant="body1" bold style={{ opacity: dim ? 0.6 : 1 }}>
              {title}
            </Text>
            {recommended && (
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--color-primary1, #16a34a)",
                  color: "#fff",
                }}
              >
                {t("modals.recommended")}
              </span>
            )}
          </Row>
          <Text
            variant="caption1"
            color="secondary-text"
            style={{ opacity: dim ? 0.7 : 1 }}
          >
            {subtitle}
          </Text>
        </div>
      </Row>

      <Spacer size="sm" />
      <ul
        style={{
          margin: "6px 0 0 52px",
          padding: 0,
          listStyle: "none",
          opacity: dim ? 0.6 : 1,
        }}
      >
        {features.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "4px 0",
            }}
          >
            <Check size={16} color="var(--color-primary1)" />
            <Text variant="caption1">{f}</Text>
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card
        width="600px"
        padding="16px 16px 20px"
        style={{
          borderRadius: 16,
          background: "var(--color-background, #fff)",
        }}
      >
        {/* Header */}
        <div style={{ position: "relative", paddingRight: "40px" }}>
          <Row gap="10px" alignItems="center">
            <Download color="var(--color-primary1)" />
            <Text variant="heading3" as="h3" style={{ color: "var(--color-primary-text)" }}>
              {t("modals.download_profile")}
            </Text>
          </Row>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              left: 300,
              top: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--color-danger)",
            }}
          >
            <X />
          </button>
        </div>

        <Spacer size="xs" />
        <Text variant="caption1" color="secondary-text">
          {t("modals.choose_format")}
        </Text>

        <Spacer size="md" />

        {/* PDF option */}
        <OptionCard
          icon={<FileText color="var(--color-primary1)" />}
          title={t("modals.pdf_title")}
          subtitle={t("modals.pdf_subtitle")}
          features={[
            t("modals.pdf_feature1"),
            t("modals.pdf_feature2"),
            t("modals.pdf_feature3"),
          ]}
          recommended
          onClick={() => onSelect?.("pdf")}
        />

        {/* PNG option */}
        <OptionCard
          icon={<ImageIcon color="var(--color-secondary1)" />}
          title={t("modals.png_title")}
          subtitle={t("modals.png_subtitle")}
          features={[
            t("modals.png_feature1"),
            t("modals.png_feature2"),
            t("modals.png_feature3"),
          ]}
          onClick={() => onSelect?.("png")}
        />

        <Spacer size="lg" />

        {/* Cancel Button */}
        <Row justifyContent="flex-end">
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-gray)",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--color-primary1)",
              fontWeight: 500,
            }}
          >
            {t("buttons.cancel")}
          </button>
        </Row>
      </Card>
    </div>
  );
}