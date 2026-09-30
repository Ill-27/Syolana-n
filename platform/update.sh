#!/bin/sh
# Run from a trusted server terminal after reviewing/merging the deployment branch.
set -eu
cd "$(dirname "$0")/.."
git pull --ff-only
python3 build.py
python3 -m unittest discover -s tests -v
node tests/test_player.mjs
node tests/test_catalog.mjs
cd platform
docker compose up -d --build
