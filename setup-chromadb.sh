#!/bin/bash

# ChromaDB Setup Script for Pip Chatbot RAG
# This script helps configure ChromaDB for the RAG system

echo "🔍 Setting up ChromaDB for Pip Chatbot RAG..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file for environment variables..."
    touch .env
else
    echo "📝 .env file already exists, will append ChromaDB configuration..."
fi

echo ""
echo "🔧 ChromaDB Configuration"
echo ""

# Get ChromaDB persist directory
echo "Please enter ChromaDB persist directory (default: ./chroma_db):"
read CHROMA_PERSIST_DIRECTORY

if [ -z "$CHROMA_PERSIST_DIRECTORY" ]; then
    CHROMA_PERSIST_DIRECTORY="./chroma_db"
    echo "Using default directory: $CHROMA_PERSIST_DIRECTORY"
fi

# Get collection name
echo ""
echo "Please enter ChromaDB collection name (default: pipeline_healthcare_knowledge):"
read CHROMA_COLLECTION_NAME

if [ -z "$CHROMA_COLLECTION_NAME" ]; then
    CHROMA_COLLECTION_NAME="pipeline_healthcare_knowledge"
    echo "Using default collection name: $CHROMA_COLLECTION_NAME"
fi

# Create the persist directory
echo ""
echo "📁 Creating ChromaDB persist directory..."
mkdir -p "$CHROMA_PERSIST_DIRECTORY"

# Write configuration to .env file
echo ""
echo "📝 Writing ChromaDB configuration to .env file..."

# Remove existing ChromaDB config if it exists
grep -v "^CHROMA_" .env > .env.tmp 2>/dev/null || touch .env.tmp

# Add new ChromaDB configuration
cat >> .env.tmp << EOF

# ChromaDB Configuration for RAG
CHROMA_PERSIST_DIRECTORY=$CHROMA_PERSIST_DIRECTORY
CHROMA_COLLECTION_NAME=$CHROMA_COLLECTION_NAME
EOF

mv .env.tmp .env

echo "✅ ChromaDB configuration saved to .env file"
echo ""
echo "🚀 Next steps:"
echo "1. Install dependencies: pip install -r requirements.txt"
echo "2. Start the chatbot: ./start-pip-chatbot.sh"
echo "3. The RAG system will automatically initialize with sample data"
echo ""
echo "📚 ChromaDB runs locally - no external API keys needed!"
echo "   The database will be stored in: $CHROMA_PERSIST_DIRECTORY"
echo ""
echo "🎯 Your ChromaDB configuration:"
echo "   Persist Directory: $CHROMA_PERSIST_DIRECTORY"
echo "   Collection Name: $CHROMA_COLLECTION_NAME"
echo ""
echo "💡 Benefits of ChromaDB:"
echo "   • Open source and free"
echo "   • Runs locally (no external dependencies)"
echo "   • Fast and efficient"
echo "   • Easy to backup and migrate"
