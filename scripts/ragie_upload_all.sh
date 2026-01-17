#!/bin/bash
# Background upload script for Ragie books
# Run: ./scripts/ragie_upload_all.sh
# Check progress: cat .ragie/upload.log

set -e
cd /home/tfunk1030/projects/AICaddyPro

LOG=".ragie/upload.log"
export RAGIE_API_KEY='tnt_IKLCCTYyEUq_tnWlKnZq9n0yMWs0JSAUAAQ6gyZftTMIG9vaO4swBmH'

echo "Starting Ragie uploads at $(date)" > $LOG

# Upload LaValle
echo "[$(date)] Uploading LaValle Planning Algorithms..." >> $LOG
curl -X POST \
  "https://api.ragie.ai/documents" \
  -H "Authorization: Bearer $RAGIE_API_KEY" \
  -H "accept: application/json" \
  -F "file=@.ragie/books/LaValle-Planning-Algorithms.pdf" \
  -F "partition=decision-theory" \
  -F 'metadata={"title":"Planning Algorithms","author":"Steven M. LaValle"}' \
  >> $LOG 2>&1
echo "" >> $LOG
echo "[$(date)] LaValle upload complete" >> $LOG

# Upload Sutton & Barto
echo "[$(date)] Uploading Sutton & Barto RL..." >> $LOG
curl -X POST \
  "https://api.ragie.ai/documents" \
  -H "Authorization: Bearer $RAGIE_API_KEY" \
  -H "accept: application/json" \
  -F "file=@.ragie/books/Sutton-Barto-RL.pdf" \
  -F "partition=decision-theory" \
  -F 'metadata={"title":"Reinforcement Learning: An Introduction","author":"Sutton & Barto"}' \
  >> $LOG 2>&1
echo "" >> $LOG
echo "[$(date)] Sutton & Barto upload complete" >> $LOG

echo "[$(date)] ALL UPLOADS COMPLETE" >> $LOG
