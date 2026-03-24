# Assignment & Submission Feature

## Backend APIs

### Assignment (Teacher)
- `POST /assignments`
- `PUT /assignments/{assignmentId}`
- `DELETE /assignments/{assignmentId}`
- `GET /assignments/{assignmentId}`
- `GET /assignments`
- `GET /assignments/{assignmentId}/submissions`

### Submission (Student/Teacher)
- `POST /submissions`
- `GET /submissions/{submissionId}`
- `PATCH /submissions/{submissionId}/grade`

### Audio
- `POST /assignments/audio` (multipart: `file`)

## PostgreSQL Tables
- `assignments`
- `assignment_questions`
- `assignment_question_options`
- `submissions`
- `submission_answers`
- `audio_files`

## Frontend Routes
- `/assignments`
- `/assignments/:assignmentId`
- `/submissions/:submissionId`
- `/teacher/assignments`
- `/teacher/assignments/:assignmentId/submissions`

## Notes
- MCQ is auto-graded on submit.
- TEXT/AUDIO answers remain `IN_REVIEW` until teacher grading.
- Audio upload stores both URL and transcript text.

