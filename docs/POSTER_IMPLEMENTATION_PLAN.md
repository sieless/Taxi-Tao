# TaxiTao Poster & Banner Implementation Plan

This document outlines how to manage the safety posters and branding banners that appear while the map is loading.

## 📁 Where to put your photos
Save your custom images in the following folder:
`public/images/posters/`

Recommended image names:
- `safety.png`
- `share.png`
- `rating.png`
- `coverage.png`

## 🛠️ How to update the content
Open the file `components/MapBanner.tsx`. You will see a `TIPS` array at the top. You can change the text, colors, and image paths there.

### Example Entry:
```javascript
{
  icon: <Shield className="w-8 h-8 text-green-500" />,
  title: "Safety First",
  text: "Always verify the driver's name and car plate number before boarding.",
  color: "bg-green-50",
  image: "/images/posters/safety.png" // Path to your custom photo
}
```

## 🎨 Design Tips
- **Image Size**: Use images that are at least 800x600 pixels.
- **Opacity**: The code automatically makes the image slightly transparent (20% opacity) so that the text remains easy to read.
- **Full Poster Mode**: If you want the image to be the main focus, you can use a high-contrast image and shorten the text.

## 🔄 How it works
1. **Initial View**: The user sees the banner immediately upon landing on the booking page.
2. **Background Loading**: Google Maps starts loading in the background.
3. **Action Trigger**: When the user clicks "Find Drivers", the banner fades out smoothly, and the live map fades in.
