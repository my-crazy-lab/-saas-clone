# Survey Builder API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "jwt_token"
  },
  "message": "Login successful"
}
```

#### GET /auth/profile
Get current user profile. (Protected)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "_count": {
      "surveys": 5,
      "responses": 12
    }
  }
}
```

### Surveys

#### POST /surveys
Create a new survey. (Protected)

**Request Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our services",
  "isPublic": true,
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "Inter"
  },
  "settings": {
    "allowAnonymous": true,
    "showProgressBar": true,
    "randomizeQuestions": false
  }
}
```

#### GET /surveys
Get user's surveys with pagination. (Protected)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')

#### GET /surveys/:id
Get survey by ID. (Protected)

#### PUT /surveys/:id
Update survey. (Protected)

#### DELETE /surveys/:id
Delete survey. (Protected)

#### POST /surveys/:id/duplicate
Duplicate survey. (Protected)

### Questions

#### POST /surveys/:surveyId/questions
Create a question in a survey. (Protected)

**Request Body:**
```json
{
  "questionText": "How satisfied are you with our service?",
  "type": "LIKERT_SCALE",
  "options": {
    "scale": 5,
    "labels": ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  "isRequired": true,
  "order": 1
}
```

#### GET /surveys/:surveyId/questions
Get all questions for a survey. (Protected)

#### PUT /surveys/:surveyId/questions/:id
Update a question. (Protected)

#### DELETE /surveys/:surveyId/questions/:id
Delete a question. (Protected)

#### POST /surveys/:surveyId/questions/reorder
Reorder questions. (Protected)

**Request Body:**
```json
{
  "questionIds": ["question_id_1", "question_id_2", "question_id_3"]
}
```

### Responses

#### POST /surveys/:surveyId/submit
Submit a response to a survey. (Public with optional auth)

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question_id",
      "answerJson": { "value": 4 },
      "score": 4
    }
  ],
  "metadata": {
    "device": "desktop",
    "startTime": "2023-01-01T00:00:00.000Z",
    "endTime": "2023-01-01T00:05:00.000Z"
  }
}
```

#### GET /surveys/:surveyId/responses
Get responses for a survey. (Protected)

#### GET /surveys/:surveyId/responses/export
Export responses as CSV. (Protected)

#### DELETE /surveys/:surveyId/responses/:id
Delete a response. (Protected)

### Analytics

#### GET /analytics/:surveyId
Get survey analytics. (Protected)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResponses": 100,
    "completionRate": 87.5,
    "averageCompletionTime": 180,
    "responsesByDate": [
      { "date": "2023-01-01", "count": 10 }
    ],
    "questionAnalytics": [
      {
        "questionId": "question_id",
        "questionText": "How satisfied are you?",
        "type": "LIKERT_SCALE",
        "totalAnswers": 95,
        "skipRate": 5,
        "data": {
          "average": 4.2,
          "distribution": { "1": 2, "2": 5, "3": 15, "4": 35, "5": 38 }
        }
      }
    ]
  }
}
```

### Public Endpoints

#### GET /public/survey/:id
Get public survey for filling out.

#### GET /public/survey/:id/qr
Generate QR code for survey.

**Query Parameters:**
- `size` (number): QR code size in pixels (default: 200)

#### GET /public/survey/:id/embed
Generate embed code for survey.

**Query Parameters:**
- `width` (string): Iframe width (default: '100%')
- `height` (string): Iframe height (default: '600px')

## Question Types

### MULTIPLE_CHOICE_SINGLE
Single selection from multiple options.

**Options:**
```json
{
  "choices": ["Option 1", "Option 2", "Option 3"]
}
```

### MULTIPLE_CHOICE_MULTIPLE
Multiple selections from options.

**Options:**
```json
{
  "choices": ["Option 1", "Option 2", "Option 3"]
}
```

### LIKERT_SCALE
Rating scale (1-5 or 1-7).

**Options:**
```json
{
  "scale": 5,
  "labels": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
}
```

### RATING
Star or numeric rating.

**Options:**
```json
{
  "maxRating": 5,
  "icon": "star"
}
```

### SHORT_TEXT / LONG_TEXT
Text input fields.

**Options:**
```json
{
  "placeholder": "Enter your answer...",
  "maxLength": 500
}
```

### NUMBER
Numeric input.

**Options:**
```json
{
  "min": 0,
  "max": 100,
  "step": 1
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
