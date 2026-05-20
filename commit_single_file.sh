BRANCH=$(git branch --show-current)

FILES=(
"client/src/context/SocketContext.jsx"
"client/src/pages/JoinPage.jsx"
"server/src/index.js"
"server/src/middleware/common.js"
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