# UniSMS API Reference for LLMs

This document is an LLM-ready normalization of UniSMS documentation from:
- https://unismsapi.com/docs/sms
- Anchor sections under the same page (intro, authentication, endpoints, webhooks, SDK, sender ID)

Last synthesized: 2026-04-26

## 1) Product Scope
UniSMS is an SMS API platform for Philippine developers.
Primary capabilities documented:
- Send single SMS
- Query SMS status
- Blast SMS (same message, many recipients)
- Bulk SMS (different messages, many recipients)
- Send OTP
- Verify OTP
- Receive delivery events via webhooks

## 2) Base URL
https://unismsapi.com/api

## 3) Authentication
All requests use HTTP Basic Authentication.
- Username: API Secret Key
- Password: empty string

Canonical header form:
Authorization: Basic base64("API_SECRET_KEY:")

Equivalent curl style:
- `-u API_SECRET_KEY:`

## 4) Shared Data Contracts
### 4.1 Message Object
Observed shape:
```json
{
  "status": "sent",
  "metadata": {},
  "content": "Welcome to UniSMS",
  "created": "2026-03-16T14:32:44Z",
  "reference_id": "msg_84e8b93b-6315-46af-a686",
  "recipient": "+639055310560",
  "fail_reason": null
}
```

Field notes:
- status: one of `pending | retrying | sent | failed`
- metadata: object, optional on input, echoed in responses
- content: SMS body
- created: ISO-8601 UTC timestamp
- reference_id: unique ID for message tracking
- recipient: E.164 number (example +639...)
- fail_reason: null or failure description

### 4.2 Number Format
Expected: E.164. Docs examples use Philippine mobile numbers like `+639123456789`.

### 4.3 Content Length
Docs specify max 160 characters for SMS content fields.

## 5) Endpoint Index
### 5.1 POST /sms
Purpose: queue one SMS to one recipient.

Request body (minimal):
```json
{
  "content": "Your message here",
  "recipient": "+639123456789"
}
```

Request body (extended):
```json
{
  "metadata": {
    "template": "order_confirmation",
    "order_id": "12345"
  },
  "content": "Your message here",
  "sender_id": "MySender",
  "recipient": "+639123456789"
}
```

Response code set: `201, 400, 401, 422`

Typical response:
```json
{
  "message": {
    "status": "sent",
    "metadata": {
      "source": "onboarding"
    },
    "content": "Welcome to UniSMS",
    "created": "2026-03-16T14:32:44Z",
    "reference_id": "msg_84e8b93b-6315-46af-a686",
    "recipient": "+639055310560",
    "fail_reason": null
  }
}
```

### 5.2 GET /sms/:reference_id
Purpose: get latest status of a specific SMS.

Path params:
- reference_id (string)

Response code set: `200, 401, 404`

Returns:
```json
{ "message": { "status": "pending|retrying|sent|failed", "...": "..." } }
```

### 5.3 POST /blast
Purpose: send one shared content message to multiple recipients.

Request body:
```json
{
  "metadata": {
    "campaign": "spring_sale_2026"
  },
  "content": "Your bulk message here",
  "sender_id": "MySender",
  "recipients": [
    "+639123456789",
    "+639987654321",
    "+639555123456"
  ]
}
```

Response code set: `201, 400, 401, 422`

Response:
```json
{
  "total": 3,
  "blast_id": "blast_4a3f8b2c-9d1e-4f5a-8b7c-2d6e0a1b3c4d"
}
```

### 5.4 GET /blast/:blast_id
Purpose: retrieve all message statuses for a blast request.

Path params:
- blast_id (string)

Response code set: `200, 401, 404`

Response shape:
```json
{
  "messages": [
    { "status": "sent|pending|retrying|failed", "reference_id": "msg_...", "...": "..." }
  ],
  "total": 3
}
```

### 5.5 POST /bulk
Purpose: send personalized messages in one request (different content per recipient).

Request body:
```json
{
  "messages": [
    {
      "content": "Hello John, your order is ready!",
      "recipient": "+639123456789"
    },
    {
      "content": "Hello Maria, your order is ready!",
      "recipient": "+639987654321"
    },
    {
      "metadata": { "order_id": "12345" },
      "content": "Hello Peter, your order is ready!",
      "recipient": "+639555123456"
    }
  ]
}
```

Response code set: `201, 400, 401, 422`

Response:
```json
{
  "total": 3,
  "bulk_id": "bulk_4a3f8b2c-9d1e-4f5a-8b7c-2d6e0a1b3c4d"
}
```

### 5.6 GET /bulk/:bulk_id
Purpose: retrieve all message statuses for a bulk request.

Path params:
- bulk_id (string)

Response code set: `200, 401, 404`

Response shape:
```json
{
  "messages": [
    { "status": "sent|pending|retrying|failed", "reference_id": "msg_...", "...": "..." }
  ],
  "total": 3
}
```

### 5.7 POST /otp
Purpose: generate and send an OTP.

Request body:
```json
{
  "content": "Hi, Your One-Time-Pin is #{PIN} and valid for 5 minutes. Do not share with others.",
  "sender_id": "MySender",
  "recipient": "+639123456789"
}
```

Response code set: `201, 400, 401, 422`

Response follows standard message object envelope:
```json
{ "message": { "reference_id": "msg_...", "status": "sent", "...": "..." } }
```

### 5.8 POST /otp/verify
Purpose: verify submitted PIN for a previously created OTP.

Request body:
```json
{
  "pin": "123456",
  "reference_id": "msg_84e8b93b-6315-46af-a686"
}
```

Response code set: `200, 401, 404, 406, 422`

Success response:
```json
{ "code": 200, "message": "Success" }
```

Incorrect PIN response:
```json
{ "code": 406, "message": "Incorrect Pin." }
```

## 6) Webhooks
### 6.1 Setup Requirements
Webhook URL must:
- Use HTTPS
- Be publicly accessible
- Accept POST

### 6.2 Events
- message.sent
- message.failed
- message.retrying

### 6.3 Payload
```json
{
  "id": "msg_84e8b93b-6315-46af-a686",
  "message": {
    "status": "sent",
    "metadata": {},
    "content": "Welcome to UniSMS",
    "created": "2026-03-16T14:32:44Z",
    "reference_id": "msg_84e8b93b-6315-46af-a686",
    "recipient": "+639055310560",
    "fail_reason": null
  },
  "event": "message.sent"
}
```

## 7) Sender ID and Business Rule
Custom sender_id is documented as available only for verified businesses.
If unavailable, use default sender identity.

## 8) PHP SDK
Official SDK repo:
- https://github.com/unisoftventures/unisms-php

Docs claim no external dependencies.

## 9) Operational Guidance for LLM-Generated Integrations
### 9.1 Send Flow (single SMS)
1. Build Basic auth from `secret_key + ":"`.
2. POST `/sms` with `recipient` and `content`.
3. If created (201), extract `message.reference_id`.
4. Poll GET `/sms/:reference_id` until terminal state (`sent` or `failed`) or timeout.
5. Record `fail_reason` when status is `failed`.

### 9.2 Bulk/Blast Tracking
- POST then store `blast_id`/`bulk_id`.
- Query status endpoints for aggregate delivery states.

### 9.3 OTP Flow
1. POST `/otp` with content containing `#{PIN}` token.
2. Store returned `reference_id`.
3. POST `/otp/verify` with `pin` + `reference_id`.
4. Treat `406` as business failure (wrong PIN), not transport failure.

### 9.4 Error Handling Baseline
At minimum, branch on:
- 400: malformed request
- 401: auth failure
- 404: missing resource/id
- 406: OTP mismatch (verify endpoint)
- 422: semantic validation failure

Include retries only for transient transport failures/timeouts. Do not blindly retry 4xx.

## 10) Ambiguities and Normalization Notes
These are documented inconsistencies/points LLMs should normalize carefully:
- OTP token is shown as `#{PIN}` in example text, but parameter text mentions `#Elixir.PIN variable`.
- Normalize to `#{PIN}` because examples consistently show that format.
- Status `sent` may represent provider acceptance in some systems; production workflows should still consume webhooks or status polling for confidence.

## 11) Minimal OpenAPI-like Summary (compact)
```yaml
openapi: 3.0.0
info:
  title: UniSMS (inferred from docs)
servers:
  - url: https://unismsapi.com/api
security:
  - basicAuth: []
paths:
  /sms:
    post: {responses: {"201": {}, "400": {}, "401": {}, "422": {}}}
  /sms/{reference_id}:
    get: {responses: {"200": {}, "401": {}, "404": {}}}
  /blast:
    post: {responses: {"201": {}, "400": {}, "401": {}, "422": {}}}
  /blast/{blast_id}:
    get: {responses: {"200": {}, "401": {}, "404": {}}}
  /bulk:
    post: {responses: {"201": {}, "400": {}, "401": {}, "422": {}}}
  /bulk/{bulk_id}:
    get: {responses: {"200": {}, "401": {}, "404": {}}}
  /otp:
    post: {responses: {"201": {}, "400": {}, "401": {}, "422": {}}}
  /otp/verify:
    post: {responses: {"200": {}, "401": {}, "404": {}, "406": {}, "422": {}}}
components:
  securitySchemes:
    basicAuth:
      type: http
      scheme: basic
```

## 12) Suggested Prompt Snippet for Other LLMs
Use this when asking another model to generate integration code:

"Build a production-ready UniSMS client for base URL https://unismsapi.com/api.
Use HTTP Basic auth with username=API secret key and empty password.
Implement methods for /sms, /sms/:reference_id, /blast, /blast/:blast_id,
/bulk, /bulk/:bulk_id, /otp, /otp/verify.
Validate E.164 PH numbers (+639XXXXXXXXX), enforce max 160 chars for SMS content,
support metadata object and optional sender_id.
Implement typed errors for 400/401/404/406/422 and include status polling helpers.
For OTP, ensure content includes #{PIN}."
