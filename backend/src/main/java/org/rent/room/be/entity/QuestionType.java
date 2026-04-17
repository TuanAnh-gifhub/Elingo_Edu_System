package org.rent.room.be.entity;

public enum QuestionType {
    SINGLE_CHOICE("Single Choice - 1 đáp án đúng"),
    MULTIPLE_CHOICE("Multiple Choice - Nhiều đáp án đúng"),
    TRUE_FALSE("True/False"),
    SHORT_ANSWER("Short Answer");

    private final String description;

    QuestionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
