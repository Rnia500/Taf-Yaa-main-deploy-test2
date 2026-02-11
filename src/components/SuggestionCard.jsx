import { React, useState } from "react";
import Card from "../layout/containers/Card";
import Row from "../layout/containers/Row";
import Column from "../layout/containers/Column";
import Pill from "./pill";
import { TextArea } from "./Input"
import Text from "./Text";
import Button from "./Button";
import Spacer from "./Spacer";
import Grid from "../layout/containers/Grid";
import Modal from "../layout/containers/Modal";
import { MoveHorizontal, MapPin, GitFork, Info } from "lucide-react";

function SuggestionCard({ suggestion, onAccept, onReject, onFeedback }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedback, setFeedback] = useState(null); // "agree" or "disagree"
    const [comment, setComment] = useState("");

    const getScoreColor = (score) => {
        if (score >= 90) return "var(--color-success-light)";
        if (score >= 70) return "var(--color-info-light)";
        return "var(--color-warning-light)";
    };

    const getConfidenceLabel = (score) => {
        if (score >= 90) return "High";
        if (score >= 70) return "Medium";
        return "Low";
    };

    const handleFeedbackSubmit = () => {
        if (onFeedback) {
            onFeedback({
                suggestionId: suggestion.id,
                feedback,
                comment,
            });
        }
        setFeedback(null);
        setComment("");
        setIsModalOpen(false);
    };

    return (
        <>
            <Card
                padding="14px"
                backgroundColor="var(--color-white)"
                borderColor="var(--color-gray)"
            >
                {/* Top Row - Names and Score */}
                <Row
                    fitContent
                    margin="0px"
                    padding="0px"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Row
                        fitContent
                        gap="8px"
                        margin="0px"
                        padding="0px"
                        alignItems="flex-start"
                        justifyContent="flex-start"
                    >
                        <Row margin="0px" padding="0px" gap="0px" fitContent>
                            <Card size="34px" rounded backgroundColor="var(--color-gray-light)" />
                            <Card size="34px" rounded backgroundColor="var(--color-gray-light)" />
                        </Row>
                        <Column
                            fitContent
                            justifyContent="flex-start"
                            margin="0px"
                            padding="0px"
                            gap="0px"
                        >
                            <Row margin="0px" padding="0px" fitContent gap="10px">
                                <Text as="p" variant="body1" bold>
                                    {suggestion.name1}
                                </Text>
                                <MoveHorizontal size={20} />
                                <Text as="p" variant="body1" bold>
                                    {suggestion.name2}
                                </Text>

                                <Pill backgroundColor={getScoreColor(suggestion.score)}>
                                    <Text
                                        as="p"
                                        color="var(--color-primary1)"
                                        variant="caption1"
                                        bold
                                    >
                                        {suggestion.score}% Match
                                    </Text>
                                </Pill>
                            </Row>
                            <Text as="p" variant="body2" color="secondary-text">
                                {suggestion.relation}
                            </Text>
                        </Column>
                    </Row>
                </Row>

                {/* Meta Information */}
                <Row
                    justifyContent="flex-start"
                    fitContent
                    gap="18px"
                    padding="0px"
                    margin="5px 0px 0px 0px"
                >
                    <Text variant="body2" color="secondary-text">
                        <GitFork size={15} /> Common Ancestor: {suggestion.commonAncestor}
                    </Text>
                    <Text variant="body2" color="secondary-text">
                        🎂 Birth: {suggestion.birth}
                    </Text>
                    <Row
                        padding="0px"
                        margin="0px"
                        fitContent
                        gap="0px"
                        alignItems="center"
                    >
                        <MapPin size={18} color="var(--color-gray)" />
                        <Text variant="body2" color="secondary-text">
                            Location: {suggestion.location}
                        </Text>
                    </Row>
                </Row>

                {/* Action Buttons */}
                <Row
                    padding="0px"
                    margin="0px"
                    fitContent
                    justifyContent="flex-end"
                    gap="10px"
                >
                    <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                        View Details
                    </Button>
                    <Button variant="primary" onClick={onAccept}>
                        Send a Request
                    </Button>
                    <Button variant="danger" onClick={onReject}>
                        Reject
                    </Button>
                </Row>
            </Card>

            {/* Details Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <Card backgroundColor="var(--color-transparent)" fitContent>
                    <Text
                        variant="heading2"
                        underline
                        bold
                        color="var(--color-primary-text)"
                    >
                        Suggested Match
                    </Text>
                </Card>

                <Column margin="20px 0px 0px 0px" gap="12px" padding="0px">
                    {/* Names */}
                    <Row
                        fitContent
                        margin="0px"
                        padding="0px"
                        justifyContent="space-between"
                        alignItems="flex-start"
                    >
                        <Row
                            fitContent
                            gap="8px"
                            margin="0px"
                            padding="0px"
                            alignItems="flex-start"
                            justifyContent="flex-start"
                        >
                            <Row margin="0px" padding="0px" gap="0px" fitContent>
                                <Card size="34px" rounded backgroundColor="var(--color-gray-light)" />
                                <Card size="34px" rounded backgroundColor="var(--color-gray-light)" />
                            </Row>
                            <Column
                                fitContent
                                justifyContent="flex-start"
                                margin="0px"
                                padding="0px"
                                gap="0px"
                            >
                                <Row margin="0px" padding="0px" fitContent gap="10px">
                                    <Text as="p" variant="body1" bold>
                                        {suggestion.name1}
                                    </Text>
                                    <MoveHorizontal size={20} />
                                    <Text as="p" variant="body1" bold>
                                        {suggestion.name2}
                                    </Text>
                                </Row>
                                <Row maxWidth="400px" margin="0px" padding="0px">
                                    <Text as="p" variant="body2" ellipsis color="secondary-text">
                                        {suggestion.relation}
                                    </Text>
                                </Row>
                            </Column>
                        </Row>
                    </Row>

                    <Spacer size="sm" />

                    {/* Facts Comparison */}
                    <Grid columns={2} gap="12px">
                        <Card padding="10px" backgroundColor="var(--color-gray-light)">
                            <Text variant="body2" bold>
                                {suggestion.name1}
                            </Text>
                            <Text variant="body2">Birth: {suggestion.birth1}</Text>
                            <Text variant="body2">Location: {suggestion.location1}</Text>
                            <Text variant="body2">Parent(s): {suggestion.parents1}</Text>
                        </Card>

                        <Card padding="10px" backgroundColor="var(--color-gray-light)">
                            <Text variant="body2" bold>
                                {suggestion.name2}
                            </Text>
                            <Text variant="body2">Birth: {suggestion.birth2}</Text>
                            <Text variant="body2">Location: {suggestion.location2}</Text>
                            <Text variant="body2">Parent(s): {suggestion.parents2}</Text>
                        </Card>
                    </Grid>

                    {/* Confidence Meter */}
                    <Card
                        margin="10px 0"
                        backgroundColor="var(--color-gray-light)"
                        padding="10px"
                    >
                        <Row justifyContent="space-between" alignItems="center">
                            <Text variant="body2" bold>
                                Confidence: {getConfidenceLabel(suggestion.score)}
                            </Text>
                            <div
                                title={`${suggestion.score}% match confidence`}
                                style={{
                                    width: "60px",
                                    height: "20px",
                                    borderRadius: "10px",
                                    background: getScoreColor(suggestion.score),
                                }}
                            />
                            <Info size={16} color="var(--color-gray)" />
                        </Row>
                    </Card>

                    {/* Feedback Section */}
                    <Card padding="10px" backgroundColor="var(--color-gray-light)">
                        <Text variant="body2" bold>
                            Do you agree with this match?
                        </Text>
                        <Spacer size="md" />
                        <Row gap="10px" padding="0px" margin="10px 0px">
                            <Button
                                variant={feedback === "agree" ? "primary" : "secondary"}
                                onClick={() => setFeedback("agree")}
                            >
                                Yes
                            </Button>
                            <Button
                                variant={feedback === "disagree" ? "danger" : "secondary"}
                                onClick={() => setFeedback("disagree")}
                            >
                                No
                            </Button>
                        </Row>
                        {feedback === "disagree" && (
                            <TextArea
                                backgroundColor="var(--color-white)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us why (optional)..."
                                rows={4}
                            />
                        )}
                        {feedback && (
                            <Row justifyContent="flex-end" margin="10px 0 0 0">
                                <Button variant="primary" onClick={handleFeedbackSubmit}>
                                    Submit Feedback
                                </Button>
                            </Row>
                        )}
                    </Card>

                    {/* Accept / Reject Actions */}
                    <Row width="100%" gap="10px">
                        <Button fullWidth variant="primary" onClick={onAccept}>
                            Accept
                        </Button>
                        <Button fullWidth variant="danger" onClick={onReject}>
                            Reject
                        </Button>
                    </Row>
                </Column>
            </Modal>
        </>
    );
}

export default SuggestionCard;
