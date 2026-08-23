# Video Generation

## Before Generating: Confirm Settings With the User

Video generation is expensive, and aspect ratio and quality change both the result and the price. They are independent settings: resolve each one separately from the user's request. An unambiguous platform or orientation (such as "for TikTok") resolves only the aspect ratio; it says nothing about quality. For a NEW user-requested video, if any setting is still undetermined, call `AskQuestion` directly as a model tool -- not inside `CodeExecution` -- with only the undetermined fields, end the turn, and wait for the answer:

```json
{
  "question": "How should the video be generated?",
  "fields": [
    {
      "kind": "singleSelect",
      "name": "videoAspectRatio",
      "title": "Aspect ratio",
      "required": true,
      "options": [
        { "value": "16:9", "label": "16:9 (YouTube, web, presentations, default)" },
        { "value": "9:16", "label": "9:16 (TikTok, Instagram Reels, Shorts)" }
      ]
    },
    {
      "kind": "singleSelect",
      "name": "videoQuality",
      "title": "Quality",
      "required": true,
      "options": [
        { "value": "standard", "label": "Standard (720p, faster and cheaper, default)" },
        { "value": "high", "label": "High (1080p, slower, costs more)" }
      ]
    }
  ]
}
```

Map the answers onto the call: the selected ratio becomes `aspectRatio`; `standard` means `resolution: "720p"` with `highQuality` unset, and `high` means `resolution: "1080p"` with `highQuality: true`.

Omit a field only when the user already settled that specific setting. Skip the question entirely only when every setting is settled, the user asks to skip it (use the defaults: 16:9, standard quality), you are regenerating a video whose settings were already confirmed, or you are a subagent executing a delegated task -- then use the parameters given in the task.

## Available Functions

### generateVideo({prompt, ...})

Generate short video clips from text descriptions.

**Parameters:**

- `prompt` (str, required): Detailed text description of the desired video
- `outputPath` (str, required): Destination path for the generated video. Use an unused workspace-relative `.mp4`, `.mov`, or `.webm` path.
- `aspectRatio` (str, default "16:9"): "16:9" (landscape) or "9:16" (portrait)
- `resolution` (str, default "720p"): "720p" or "1080p"
- `durationSeconds` (int, default 6): 4, 6, or 8 seconds
- `negativePrompt` (str, optional): Description of what should NOT appear
- `personGeneration` (str, optional): "dont_allow" or "allow_adult" for controlling people
- `highQuality` (bool, optional): Use the higher-quality, slower model

**Returns:** A job that resolves to a dict with `filePath` and `description` keys

**Example:**

```javascript
const videoJob = generateVideo({
    prompt: "A cat playing with a ball of yarn, cute and playful, natural lighting",
    outputPath: "attached_assets/generated_videos/playful-cat.mp4",
    aspectRatio: "16:9",
    durationSeconds: 6
});

// Do unrelated file/code work here.

const result = await videoJob;
console.log(`Video saved to: ${result.filePath}`);
```

## When to Use Each Function

### generateVideo

- Short animated clips or motion graphics
- Video backgrounds or visual effects
- Product animations or demonstrations
- Social media video content

## Aspect Ratio Guidelines

### Videos

- **16:9** - Widescreen landscape, good for web videos, presentations
- **9:16** - Vertical portrait, good for mobile stories, social media shorts

## Output Locations

- Generated videos: `attached_assets/generated_videos/`

## Limitations

- Generated videos: 8 seconds maximum

## Copyright

- Generated videos are created for your use
