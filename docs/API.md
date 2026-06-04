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
  - `createdAt`, `-createdAt`
  - `level`, `-level`
- `search` (string, optional): Search by name
- `level` (number, optional): Filter by level
- `include` (string, optional): Related resources to include. Supports:
  - `families` - Include family resources referenced by returned monsters

**Response:**
```json
{
  "data": [
    {
      "type": "monsters",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": { ... },
      "relationships": {
        "creator": {
          "data": { "type": "users", "id": "0psvtrh43w8xm9dfbf5b6nkcq1" }
        },
        "families": {
          "data": [
            { "type": "families", "id": "..." }
          ]
        }
      },
      "links": {
        "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ],
  "included": [
    {
      "type": "families",
      "id": "...",
      "attributes": { ... },
      "links": { "self": "/api/families/..." }
    }
  ],
  "links": {
    "next": "/api/monsters?cursor=..."
  }
}
```

The `relationships.creator` field is always present. The
`relationships.families` field is present only when the monster belongs to one
or more families. The `included` array is present only when `include=families`
is specified and at least one family exists.

### GET /api/monsters/:id

Retrieve a single monster by ID (26-character identifier).

**Query Parameters:**
- `include` (string, optional): Related resources to include. Supports:
  - `families` - Include family resources for this monster

**Response (standard monster):**
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
      "kind": "humanoid",
      "movement": [{ "speed": 6 }],
      "abilities": [],
      "actions": [],
      "actionsInstructions": "",
      "effects": [],
      "description": "",
      "legendary": false
    },
    "links": {
      "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

**Response (legendary monster):**
```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Ancient Dragon",
      "hp": 200,
      "level": 15,
      "size": "gargantuan",
      "armor": "heavy",
      "kind": "dragon",
      "movement": [{ "speed": 8 }, { "mode": "fly", "speed": 12 }],
      "abilities": [],
      "actions": [],
      "actionsInstructions": "",
      "effects": [],
      "description": "",
      "legendary": true,
      "bloodied": { "description": "..." },
      "lastStand": { "description": "..." },
      "saves": { "str": 2, "dex": 1, "wil": 1 }
    },
    "links": {
      "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

The `saves` field contains parsed ability save modifiers. Values are derived from
the raw save string (e.g., "STR++" becomes `{"str": 2}`, "DEX-" becomes `{"dex": -1}`).

Monsters may also include `paperforgeId` and `paperforgeImageUrl` when a
Paperforge illustration is associated.

When `include=families` is specified and the monster belongs to families, the
response includes a `relationships.families` field and an `included` array with
the full family resources.

### GET /api/families/:id

Retrieve a single family by ID (26-character identifier).

**Response:**
```json
{
  "data": {
    "type": "families",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Goblinoids",
      "description": "A family of goblin-like creatures",
      "monsterCount": 5
    },
    "relationships": {
      "creator": {
        "data": {
          "type": "users",
          "id": "0psvtrh43w8xm9dfbf5b6nkcq1"
        }
      }
    },
    "links": {
      "self": "/api/families/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

### GET /api/items

List public items with pagination and sorting.

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor for next page
- `limit` (number, optional): Results per page (1-100, default: 100)
- `sort` (string, optional): Sort order; '-' prefix for descending
  - `name`, `-name`
  - `createdAt`, `-createdAt`
- `search` (string, optional): Search by name or kind
- `rarity` (string, optional): Filter by rarity
  - `all`, `unspecified`, `common`, `uncommon`, `rare`, `very_rare`, `legendary`

**Response:**
```json
{
  "data": [
    {
      "type": "items",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": {
        "name": "Healing Potion",
        "kind": "Potion",
        "rarity": "common",
        "description": "Restores health when consumed",
        "moreInfo": "..."
      },
      "relationships": {
        "creator": {
          "data": { "type": "users", "id": "0psvtrh43w8xm9dfbf5b6nkcq1" }
        }
      },
      "links": {
        "self": "/api/items/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ],
  "links": {
    "next": "/api/items?cursor=..."
  }
}
```

### GET /api/items/:id

Retrieve a single item by ID (26-character identifier).

**Response:**
```json
{
  "data": {
    "type": "items",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Healing Potion",
      "kind": "Potion",
      "rarity": "common",
      "description": "Restores health when consumed",
      "moreInfo": "..."
    },
    "relationships": {
      "creator": {
        "data": { "type": "users", "id": "0psvtrh43w8xm9dfbf5b6nkcq1" }
      }
    },
    "links": {
      "self": "/api/items/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

### GET /api/users

Look up a user by username. Returns only public profile information. Users are
**not** enumerable — there is no way to list all users, so `username` is
required.

**Query Parameters:**
- `username` (string, required): The exact username to look up. Usernames are
  unique, so the response is a collection containing at most one user. Use this
  to resolve a (mutable) username to a user's stable `id`.

Requests without a `username` return a `400` error.

**Response:**

`GET /api/users?username=gandalf` returns a collection with the single matching
user, or an empty `data` array if no user has that username:

```json
{
  "data": [
    {
      "type": "users",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": {
        "username": "gandalf",
        "displayName": "Gandalf",
        "imageUrl": "https://cdn.discordapp.com/avatars/.../avatar.png"
      },
      "links": {
        "self": "/api/users/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ]
}
```

### GET /api/users/:id

Retrieve a single user by stable identifier (26-character). Returns only public
profile information. Requests using a legacy UUID are redirected to the
canonical identifier.

**Response:**
```json
{
  "data": {
    "type": "users",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "username": "username",
      "displayName": "Display Name",
      "imageUrl": "https://cdn.discordapp.com/avatars/.../avatar.png"
    },
    "links": {
      "self": "/api/users/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

### GET /api/collections

List public collections with pagination and sorting.

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor for next page
- `limit` (number, optional): Results per page (1-100, default: 100)
- `sort` (string, optional): Sort order; '-' prefix for descending
  - `name`, `-name`
  - `createdAt`, `-createdAt`

**Response:**
```json
{
  "data": [
    {
      "type": "collections",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": {
        "name": "Forest Encounters",
        "description": "Monsters for forest adventures",
        "createdAt": "2025-01-15T10:30:00Z",
        "monsterCount": 5,
        "itemCount": 3
      },
      "relationships": {
        "creator": {
          "data": {
            "type": "users",
            "id": "0psvtrh43w8xm9dfbf5b6nkcq1"
          }
        }
      },
      "links": {
        "self": "/api/collections/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ],
  "links": {
    "next": "/api/collections?cursor=..."
  }
}
```

### GET /api/collections/:id

Retrieve a single collection by ID (26-character identifier).

**Query Parameters:**
- `include` (string, optional): Related resources to include. Supports:
  - `monsters` - Include all monsters in the collection
  - `items` - Include all items in the collection
  - `monsters,items` - Include both monsters and items (comma-separated)

**Response (with include=monsters,items):**
```json
{
  "data": {
    "type": "collections",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Forest Encounters",
      "description": "Monsters for forest adventures",
      "createdAt": "2025-01-15T10:30:00Z",
      "monsterCount": 5,
      "itemCount": 3
    },
    "relationships": {
      "creator": {
        "data": {
          "type": "users",
          "id": "0psvtrh43w8xm9dfbf5b6nkcq1"
        }
      },
      "monsters": {
        "data": [
          {
            "type": "monsters",
            "id": "0abc123def456..."
          }
        ]
      },
      "items": {
        "data": [
          {
            "type": "items",
            "id": "0def789ghi012..."
          }
        ]
      }
    },
    "links": {
      "self": "/api/collections/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  },
  "included": [
    {
      "type": "monsters",
      "id": "0abc123def456...",
      "attributes": { ... },
      "links": {
        "self": "/api/monsters/0abc123def456..."
      }
    },
    {
      "type": "items",
      "id": "0def789ghi012...",
      "attributes": { ... },
      "links": {
        "self": "/api/items/0def789ghi012..."
      }
    }
  ]
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
