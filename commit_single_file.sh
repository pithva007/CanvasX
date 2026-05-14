#!/bin/bash

# =========================================
# Commit ALL changed files individually
# =========================================

# Get current branch
BRANCH=$(git branch --show-current)

# Get all changed files
FILES=$(git status --porcelain | awk '{print $2}')

# Check if files exist
if [ -z "$FILES" ]; then
  echo "No changed files found."
  exit 0
fi

# Loop through each file
for FILE in $FILES
do
  # Skip deleted files
  if [ ! -f "$FILE" ]; then
    echo "Skipping deleted file: $FILE"
    continue
  fi

  # Extract filename
  FILENAME=$(basename "$FILE")

  echo "=================================="
  echo "Committing: $FILE"
  echo "=================================="

  # Add single file
  git add "$FILE"

  # Commit single file
  git commit -m "Added $FILENAME"

done

# Push all commits
git push origin $BRANCH

echo "=================================="
echo "All files committed individually!"
echo "=================================="