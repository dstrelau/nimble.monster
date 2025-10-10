# API Documentation

## Overview

The Nimble Monster API follows the [JSON:API v1.1](https://jsonapi.org/format/)
specification. All responses use the `application/vnd.api+json` content type.

Responses conform to schemas defined in
[nimble-schemas](https://github.com/dstrelau/nimble-schemas).

## Endpoints

### GET /api/monsters

List public monsters with pagination and sorting.

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor for next page
- `limit` (number, optional): Results per page (1-100, default: 100)
- `sort` (string, optional): Sort order; '-' prefix for descending
  - `name`, `-name`
  - `created_at`, `-created_at`
  - `level`, `-level`

**Response:**
```json
{
  "data": [
    {
      "type": "monsters",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": { ... },
      "links": {
        "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ],
  "links": {
    "next": "/api/monsters?cursor=..."
  }
}
```

### GET /api/monsters/:id

Retrieve a single monster by ID (26-character identifier).

**Response:**
```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Goblin",
      "hp": 10,
      "level": 1,
      "size": "small",
      "armor": "none",
      "movement": [{ "speed": 6 }],
      "abilities": [],
      "actions": [],
      "effects": [],
      "legendary": false
    },
    "links": {
      "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

## Error Responses

Errors follow JSON:API format:

```json
{
  "errors": [
    {
      "status": "404",
      "title": "Monster not found"
    }
  ]
}
```
