BRANCH=$(git branch --show-current)

FILES=(
"server/.env.example"
"server/.gitignore"
"server/package-lock.json"
"server/package.json"
"server/src/index.js"
"server/src/middleware/common.js"
"server/src/rooms/RoomManager.js"
"server/src/socket/handlers.js"
"server/src/utils/constants.js"
"server/src/utils/logger.js"
"server/src/utils/validators.js"
)

for FILE in "${FILES[@]}"
do
  if [ -f "$FILE" ]; then

    FILENAME=$(basename "$FILE")

    echo "=================================="
    echo "Adding: $FILE"
    echo "=================================="

    git add "$FILE"

    git commit -m "Added $FILENAME"

  else
    echo "File not found: $FILE"
  fi
done

git push origin $BRANCH

echo "=================================="
echo "All remaining files committed!"
echo "=================================="