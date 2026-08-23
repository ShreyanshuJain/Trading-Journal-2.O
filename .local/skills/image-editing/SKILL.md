---
name: image-editing
description: Edit existing images with AI - restyle, retouch, or transform an image file in the project using a text instruction.
---

# Image Editing Skill

Edit an existing image file in the project with a natural-language instruction, saving the result as a new image. The source image is passed to the model together with the instruction, so edits preserve the original content and composition.

## Available Functions

### editImage({imagePath, prompt, outputPath, ...})

Edit one existing image. Await the returned promise before reading the edited file.

**Parameters:**

- `imagePath` (required): Workspace-relative path of the existing image to edit. Supports `.png`, `.jpg`, `.jpeg`, and `.webp` sources.
- `prompt` (required): Instruction describing how to change the image, such as "make the sky sunset orange" or "remove the person on the left".
- `outputPath` (required): Workspace-relative path to save the edited image to. Must end in `.png`, `.jpg`, or `.jpeg`. Use a new path; the source image is left untouched. If the path exists, the result is saved to a suffixed sibling; use the returned `filePath`.
- `summary`: Optional, short 4-5 word description for the return description

**Returns:** A job that resolves to a dict with `filePath` and `description`

**Examples:**

```javascript
// Restyle an existing asset
const edited = await editImage({
  imagePath: 'attached_assets/hero.png',
  prompt: 'make the lighting warm golden hour, keep the composition unchanged',
  outputPath: 'attached_assets/hero_golden.png',
  summary: 'golden hour hero',
});
console.log(`Edited image saved to: ${edited.filePath}`);

// Edit a user-uploaded photo
const cleaned = await editImage({
  imagePath: 'attached_assets/product_photo.jpg',
  prompt: 'remove the clutter in the background, keep the product unchanged',
  outputPath: 'attached_assets/product_photo_clean.jpg',
});
console.log(`Edited image saved to: ${cleaned.filePath}`);
```

## When to Use

- The user wants to change an image that already exists in the project, such as an uploaded photo or a previously generated asset
- Restyling an asset while keeping its content: colors, lighting, mood, season, art style
- Adding, removing, or replacing objects in an image
- Extending or adapting an existing asset for a new context

Use `generateImage` instead when no source image exists. Use `removeImageBackground` for plain background removal; it produces a transparent PNG more reliably than an edit instruction.

## Best Practices

1. **Describe the change, not the whole image**: The model sees the source image; state only what should be different and what must stay the same.
2. **Keep the source**: Save edits to a new `outputPath` so the original stays available for further edits.
3. **Chain edits from the best result**: For iterative refinement, edit the latest output rather than repeating the full instruction against the original.

## Limitations

- Source images larger than 10MB are rejected
- Text in edited images is not reliably rendered
- Very precise pixel-level edits (exact crops, resizes) are better done programmatically
