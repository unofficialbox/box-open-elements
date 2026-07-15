# Box Wire Examples

This document shows the language-neutral JSON contract expected between backend services and `box-open-elements`. These payloads are the intended seam regardless of whether the backend is implemented in Node, Java, Go, or Rust.

## Content Explorer

### Request

```http
GET /api/content-explorer/folders/0/items?limit=25&offset=0
Accept: application/json
Accept-Language: en-US
X-Request-Id: req-123
```

### Response

```json
{
  "breadcrumbs": [
    { "id": "0", "name": "All Files", "type": "folder" }
  ],
  "folder": {
    "id": "0",
    "name": "All Files",
    "type": "folder"
  },
  "folderId": "0",
  "items": [
    {
      "id": "123",
      "name": "Quarterly Plan.pdf",
      "type": "file",
      "size": 248320,
      "modifiedAt": "2026-07-01T12:00:00.000Z",
      "extension": "pdf",
      "owner": { "id": "u_1", "name": "Morgan Lee", "type": "user" },
      "permissions": { "canPreview": true, "canDownload": true, "canShare": true },
      "sharedLink": { "isShared": true, "access": "company", "url": "https://app.box.com/s/example" },
      "preview": { "canPreview": true, "extension": "pdf" },
      "parent": { "id": "0", "name": "All Files" }
    },
    { "id": "456", "name": "Marketing", "type": "folder" }
  ],
  "pagination": {
    "hasMoreItems": true,
    "limit": 25,
    "offset": 0,
    "totalCount": 120
  }
}
```

Optional summary fields on items are additive; three-field items remain valid.

### Search request

```http
GET /api/content-explorer/search?query=plan&ancestorFolderId=0&limit=25&offset=0
Accept: application/json
Accept-Language: en-US
X-Request-Id: req-124
```

### Search response

```json
{
  "query": "plan",
  "ancestorFolderId": "0",
  "items": [
    { "id": "123", "name": "Quarterly Plan.pdf", "type": "file" }
  ],
  "pagination": {
    "hasMoreItems": false,
    "limit": 25,
    "offset": 0,
    "totalCount": 1
  }
}
```

Schema home: `src/patterns/content-explorer/schemas.ts` (`explorerTransportResultSchema`, `explorerSearchResultSchema`).

## Metadata

### Templates request

```http
GET /api/metadata/templates
Accept: application/json
```

### Templates response

```json
[
  {
    "key": "properties",
    "label": "Properties",
    "scope": "enterprise",
    "fields": [
      {
        "key": "status",
        "label": "Status",
        "type": "string",
        "required": false
      }
    ]
  }
]
```

### Instances request

```http
GET /api/metadata/items/file/123/instances
Accept: application/json
```

### Instances response

```json
[
  {
    "scope": "enterprise",
    "templateKey": "properties",
    "values": {
      "status": "active",
      "owner": "marketing"
    }
  }
]
```

### Query request

```http
POST /api/metadata/query
Content-Type: application/json
```

```json
{
  "templateKey": "properties",
  "scope": "enterprise",
  "filters": {
    "status": "active"
  },
  "limit": 25,
  "offset": 0
}
```

### Query response

```json
{
  "entries": [
    {
      "id": "123",
      "name": "Quarterly Plan.pdf",
      "type": "file"
    }
  ],
  "limit": 25,
  "offset": 0,
  "totalCount": 1
}
```

Schema home: `src/patterns/metadata/schemas.ts` (built).

## Share

### Share state request

```http
GET /api/share/items/file/123
Accept: application/json
```

### Share state response

```json
{
  "itemId": "123",
  "itemType": "file",
  "sharedLink": {
    "url": "https://box.com/s/example",
    "access": "company",
    "passwordEnabled": false,
    "canDownload": true,
    "canPreview": true,
    "expiresAt": null
  },
  "collaborators": [
    {
      "id": "u_1",
      "name": "Morgan Lee",
      "type": "user",
      "role": "editor",
      "status": "active"
    }
  ]
}
```

### Update shared link request

```http
PUT /api/share/items/file/123/shared-link
Content-Type: application/json
```

```json
{
  "sharedLink": {
    "access": "collaborators",
    "canDownload": false,
    "canPreview": true,
    "expiresAt": "2026-06-01T00:00:00.000Z"
  }
}
```

Schema home: `src/patterns/share/schemas.ts` (built).

## Integration rule

Backends should return these stable contracts instead of raw Box REST payloads. That keeps:

- SDK churn below the boundary
- backend-language differences below the boundary
- controllers and components stable above the boundary
