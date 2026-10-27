# Public API compatibility

The routes under `app/api` are a public API used by third-party clients. Every
change to a response must be backwards compatible unless the user explicitly
asks for a breaking change.

- Only add things: new optional attributes, relationships, `include` tokens, or
  endpoints. Never remove, rename, retype, or change the meaning or format of an
  existing field, including derived text such as an action's `description`.
- Serializers shared with the app (for example `lib/services/monsters/converters.ts`)
  are part of this contract. Internal model changes must keep the old output.
- Don't make a response fail (4xx/5xx) for data that it used to return.
- If a change might be breaking, stop and ask before making it. When a breaking
  change is approved, document it in `docs/API.md`.
- Cover each documented response shape with a route test that asserts the exact
  field values, so a format change fails a test.
