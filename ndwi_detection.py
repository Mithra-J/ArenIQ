import cv2
import numpy as np

# Load two NDWI images
img1 = cv2.imread("ndwi_2023.png", 0)
img2 = cv2.imread("ndwi_2024.png", 0)

# Calculate difference
diff = cv2.absdiff(img1, img2)

# Threshold change
_, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

# Save result
cv2.imwrite("water_change_map.png", thresh)

print("Change detection completed")