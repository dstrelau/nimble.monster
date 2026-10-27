# API Documentation

## Overview

The Nimble Monster API follows the [JSON:API v1.1](https://jsonapi.org/format/)
specification. All responses use the `application/vnd.api+json` content type.

Monster responses generally conform to schemas defined in
[nimble-schemas](https://github.com/dstrelau/nimble-schemas). Hazard resources
are currently a Nexus extension: the upstream monster schema does not
yet model `hazard` or statblocks without creature combat stats.

## Endpoints

### GET /api/monsters

List public monsters and hazards with pagination and sorting. Hazards use the
existing `monsters` JSON:API resource type and are identified by
`attributes.hazard: true`.

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor for next page
- `limit` (number, optional): Results per page (1-100, default: 100)
- `sort` (string, optional): Sort order; '-' prefix for descending
  - `name`, `-name`
  - `createdAt`, `-createdAt`
  - `level`, `-level`
- `search` (string, optional): Search by name
- `level` (number, optional): Filter by level
- `type` (string, optional): `all`, `standard`, `legendary`, `minion`, `teams`,
  or `hazard`. `all` excludes hazards; use `hazard` to list hazards.
- `include` (string, optional): Related resources to include (comma-separated).
  Supports:
  - `families` - Include family resources referenced by returned monsters
  - `creator` - Include the user resources that created the returned monsters

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
or more families. The `included` array is present only when `include` is
specified; it contains the requested family resources (`include=families`)
and/or the deduplicated creator user resources (`include=creator`).

### GET /api/monsters/:id

Retrieve a single monster by ID (26-character identifier).

**Query Parameters:**
- `include` (string, optional): Related resources to include (comma-separated).
  Supports:
  - `families` - Include family resources for this monster
  - `creator` - Include the user resource that created this monster

**Response (standard monster):**
```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Goblin",
      "hazard": false,
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

Standard (non-minion) monsters may also include a `bloodied` attribute
(`{ "description": "..." }`) when one is set; it is omitted otherwise.

**Abilities:** Monster, hazard, team-member, companion, and family abilities
contain only `name` and `description` (plus a client-side `id` when editing).
Attack-only fields are not accepted on abilities; describe any triggered damage
or distances in the ability's description.

**Structured attacks:** Actions can carry optional combat metadata, including
actions on team members:

- `target`: exactly one of `{ "reach": 2 }`, `{ "range": 8 }`, or
  `{ "aura": 3 }`. Distances use Nimble spaces, not feet.
- `area`: `{ "shape": "square" | "cone" | "line", "size": 2 }`.
  For a square, `size` is its side; for a cone or line, it is its length.
  Lines also accept a positive-integer `width`, defaulting to `1` when omitted.
  `{ "shape": "line", "size": 6, "width": 3 }` displays as “Line 3×6”
  (width × length). Widthless lines and explicit `width: 1` display as “Line 6”;
  edit validation and JSON exports supply the default `width: 1`.
  Squares and cones do not accept `width`. Cones display as “Cone 4” and
  cannot also specify a ranged target.
- `aoe`: `true` for a printed AoE without a specified shape/size. A supplied
  `area` and `aoe: true` are mutually exclusive; do not invent dimensions
  when the book omits them.
- `attackCount`: a positive integer for a printed repeated attack, such as
  `2` for “Acidic Touch (2×)”. It is not a target count or the number of
  different actions to choose.
- `alternative`: `{ "name": "Shoot", "target": { "range": 8 } }` for an
  inline alternative sharing the primary attack's damage/count. Its range
  belongs to the alternative, not to the primary melee attack.

All distances, dimensions and counts are positive integers. When authoring or
importing, keep damage separate from `description` (`{ "roll": "1d6+6" }` on
creature actions); do not repeat damage, targets, areas or counts in the
name/description.

In creature action responses, `description` keeps its original format for
backwards compatibility: it is always a string, prefixed with the damage roll
(`"2d8+4. (Reach 2) Knock prone on crit."`, or just `"3d6"` for a damage-only
action). Structured fields appear alongside it; they do not replace it.

Legacy `range` strings remain supported but are not converted into structured
targets because their original reach/range meaning is ambiguous. They are
displayed verbatim, without appending units.

```json
{
  "name": "Crush",
  "damage": { "roll": "d88" },
  "area": { "shape": "line", "size": 4 },
  "description": "Damage on a failed DC 18 DEX save."
}
```

**Response (hazard):**
```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Goblin Pit Trap",
      "hazard": true,
      "level": "1",
      "levelInt": 1,
      "abilities": [
        { "name": "Hidden Trap!", "description": "DC 12 Perception to spot it." }
      ],
      "actions": [],
      "actionsInstructions": "",
      "description": ""
    }
  }
}
```

Hazards optionally include `hp`, a positive integer, when fixed HP is set.
It is omitted when the hazard has no HP. Hazards do not include movement,
armor, size, saves, Bloodied, or Last Stand mechanics.

**Response (legendary monster):**
```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Ancient Dragon",
      "hp": 200,
      "hpPerHero": 48,
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

**Response (team monster):**

A team ("legendary duo") is a single stat block containing two or more named
members that share a level, kind, bloodied, and last stand. Teams are
identified by `subtype: "team"` and carry a `members` array; each member holds
its own combat stats and abilities/actions. Top-level `abilities`/`actions`
hold team-wide rules (e.g. the "Legendary Duo" turn-order rule).

```json
{
  "data": {
    "type": "monsters",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Kelebek & Poppy",
      "level": 3,
      "kind": "Bug Druid & His Stinky Pet",
      "legendary": true,
      "subtype": "team",
      "abilities": [
        { "name": "Legendary Duo", "description": "After each hero's turn, choose Kelebek or Poppy to act." }
      ],
      "actions": [],
      "members": [
        {
          "name": "Kelebek",
          "kind": "Entomancer",
          "hp": 0,
          "hpPerHero": 20,
          "armor": "none",
          "size": "medium",
          "saves": { "int": 1, "wil": 1 },
          "abilities": [],
          "actions": [{ "name": "Vinelash", "description": "Move 6, then 2d6..." }]
        },
        {
          "name": "Poppy",
          "kind": "Giant Stinkbug",
          "hp": 0,
          "hpPerHero": 14,
          "armor": "medium",
          "size": "large",
          "abilities": [{ "name": "Stink Cloud", "description": "..." }],
          "actions": [{ "name": "Crushing Mandibles", "description": "..." }]
        }
      ],
      "bloodied": { "description": "When Kelebek is bloodied, Poppy always Interposes for him." },
      "lastStand": { "description": "When Poppy dies, the room fills with noxious gas..." }
    },
    "links": {
      "self": "/api/monsters/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

Each member's `hpPerHero` and `kind` are omitted when unset, mirroring the
top-level monster fields. A member's `saves` field is present only when the
member has saves and uses the same parsed shape as a legendary monster's
`saves`. The top-level `hp` on a team is `0`; per-member HP lives on each
member.

The `hp` field is always present for creatures and holds the monster's fixed
total HP. For hazards it is optional, as described above. Monsters
that scale their HP with party size (the "X/hero" format) additionally include an
`hpPerHero` integer; when present, clients should display HP as `{hpPerHero}/hero`.
The field is omitted when a monster does not use per-hero HP. `hp` remains
populated in both cases for backwards compatibility.

The `saves` field contains parsed ability save modifiers. Values are derived from
the raw save string (e.g., "STR++" becomes `{"str": 2}`, "DEX-" becomes `{"dex": -1}`).

Monsters may also include `paperforgeId` and `paperforgeImageUrl` when a
Paperforge illustration is associated.

Monsters and team members with uploaded artwork instead include `customArtwork`:

```json
{
  "customArtwork": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "imageUrl": "https://example.com/monster-artwork/display-1600.webp",
    "artist": "Morgan Vale",
    "sourceUrl": "https://example.com/artwork"
  }
}
```

`artist` and `sourceUrl` are optional. The image URL serves optimized rectangular
artwork; Nexus displays a centered circular crop. Uploaded image URLs are public,
even when their monster is private. Uploading and attaching artwork require the
creator's `monster-custom-artwork` feature flag; viewing saved artwork does not.
Other users' remixes do not inherit custom artwork. Nimbrew and Markdown exports
continue to export statblock content without artwork.

Monster attributes may include three optional classification arrays. Each field
is omitted from list and detail responses when empty. These are not present on hazards.

```json
{
  "creatureTypes": ["undead", "dragon"],
  "creatureKinds": ["drake"],
  "environments": ["underground", "ruins"]
}
```

Values are curated, lowercase identifiers (multiword values use hyphens).
Each array can contain multiple values:

- `creatureTypes`: Broad creature categories, such as `beast`, `humanoid`, or
  `undead`.
- `creatureKinds`: More specific kinds, such as `goblinoid`, `mind-flayer`,
  or `animated-object`.
- `environments`: Suitable encounter environments, such as `forest`, `dungeon`,
  or `aquatic`.

The existing `kind` attribute remains a free-text descriptor, separate from
these classifications.

The API does not currently support filtering by these fields.

When `include=families` is specified and the monster belongs to families, the
response includes a `relationships.families` field and an `included` array with
the full family resources. When `include=creator` is specified, the creator user
resource is added to the `included` array.

### GET /api/families/:id

Retrieve a single family by ID (26-character identifier).

**Query Parameters:**
- `include` (string, optional): Related resources to include. Supports:
  - `creator` - Include the user resource that created this family

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
- `include` (string, optional): Related resources to include. Supports:
  - `creator` - Include the user resources that created the returned items

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

**Query Parameters:**
- `include` (string, optional): Related resources to include. Supports:
  - `creator` - Include the user resource that created this item

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

### GET /api/custom-rules

List public custom rules (user-authored house rules and variants), sorted by
name.

**Query Parameters:**
- `include` (string, optional): Related resources to include (comma-separated).
  Supports:
  - `creator` - Include the user resources that created the returned rules

**Response:**
```json
{
  "data": [
    {
      "type": "custom-rules",
      "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
      "attributes": {
        "name": "Zone of Control",
        "content": "Moving while adjacent to an enemy costs 1 extra space.",
        "rules": [
          { "slug": "initiative", "relation": "augments" }
        ]
      },
      "relationships": {
        "creator": {
          "data": { "type": "users", "id": "0psvtrh43w8xm9dfbf5b6nkcq1" }
        }
      },
      "links": {
        "self": "/api/custom-rules/0psvtrh43w8xm9dfbf5b6nkcq1"
      }
    }
  ]
}
```

The `attributes.rules` array holds the official rules this custom rule is linked
to. Each entry has a `slug` (a flat rule slug, e.g. `initiative`) and a
`relation` of either `replaces` (the custom rule overrides the official one) or
`augments` (it adds to or clarifies it). Each official rule is readable at
`/rules/<slug>`. The `included` array is present only
when `include=creator` is specified; it contains the deduplicated creator user
resources.

### GET /api/custom-rules/:id

Retrieve a single public custom rule by ID (26-character identifier).

**Query Parameters:**
- `include` (string, optional): Related resources to include. Supports:
  - `creator` - Include the user resource that created this rule

**Response:**
```json
{
  "data": {
    "type": "custom-rules",
    "id": "0psvtrh43w8xm9dfbf5b6nkcq1",
    "attributes": {
      "name": "Zone of Control",
      "content": "Moving while adjacent to an enemy costs 1 extra space.",
      "rules": [
        { "slug": "initiative", "relation": "augments" }
      ]
    },
    "relationships": {
      "creator": {
        "data": { "type": "users", "id": "0psvtrh43w8xm9dfbf5b6nkcq1" }
      }
    },
    "links": {
      "self": "/api/custom-rules/0psvtrh43w8xm9dfbf5b6nkcq1"
    }
  }
}
```

The `attributes.rules` array follows the same shape as the list endpoint:
each entry carries the section `slug` and its `relation` (`replaces` or
`augments`).

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
- `include` (string, optional): Related resources to include. Supports:
  - `creator` - Include the user resources that created the returned collections

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
  - `creator` - Include the user resource that created this collection
  - Values may be combined (comma-separated), e.g. `monsters,items,creator`

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
