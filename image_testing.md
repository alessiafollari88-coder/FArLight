# Image Testing Rules (AI image flows)

- Accepted MIME types for image INPUT to LLM: image/jpeg, image/png, image/webp only — transcode SVG/BMP/HEIC first
- For animated images (GIF/APNG/animated WEBP), extract frame 1 only
- Resize before encoding — avoid multi-MB base64 payloads
- Don't send blank or solid-colour images
- Generated moodboard images are stored in Emergent object storage under farlight/generated/ and served via /api/files/...
- Test: submit a concept request, verify generated image is a valid PNG/JPEG, non-empty, and renders in the account area
