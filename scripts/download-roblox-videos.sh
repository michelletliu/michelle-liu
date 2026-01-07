#!/bin/bash

cd /Users/michelleliu/michelle-liu
mkdir -p public/roblox/videos

SITE_ID="609611a17e27302b1d0fc824"

download_video() {
  local VIDEO_ID=$1
  local OUTPUT=$2
  local URL="https://video.squarespace-cdn.com/content/v1/$SITE_ID/$VIDEO_ID/playlist.m3u8"
  
  echo "Downloading: $OUTPUT"
  ffmpeg -allowed_extensions ALL -i "$URL" -c copy -bsf:a aac_adtstoasc "$OUTPUT" -y -loglevel warning
  
  if [ -f "$OUTPUT" ]; then
    SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
    echo "  ✓ Saved: $OUTPUT ($SIZE)"
  else
    echo "  ✗ Failed to download"
  fi
}

download_video "cfb87be0-6d13-45ae-be93-b2b8449c02c1" "public/roblox/videos/video-01.mp4"
download_video "9084e034-d80c-43fe-8f1a-edac043e3860" "public/roblox/videos/video-02.mp4"
download_video "e58fce84-a964-48ab-b722-b00c7028f7ce" "public/roblox/videos/video-03.mp4"
download_video "4f0cc7d6-f1db-43cf-824a-0adc02f8aaf3" "public/roblox/videos/video-04.mp4"
download_video "2d332e67-a78e-49cc-a5f6-51ca008e47ee" "public/roblox/videos/video-05.mp4"
download_video "6c759851-20cb-4caa-9def-ab3502b59db7" "public/roblox/videos/video-06.mp4"
download_video "7c49fdd8-9ec4-4ef1-9435-5c2a827a4780" "public/roblox/videos/video-07.mp4"
download_video "b1de0b8e-7ca6-472f-92fd-f88de4764859" "public/roblox/videos/video-08.mp4"
download_video "e180e46c-0381-4239-85de-9b3105b68bf9" "public/roblox/videos/video-09.mp4"
download_video "4a761790-cc9b-4c23-b072-066459e1f22d" "public/roblox/videos/video-10.mp4"

echo ""
echo "Download complete!"
ls -la public/roblox/videos/
