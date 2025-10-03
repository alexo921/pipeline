#!/usr/bin/env python3
"""
Knowledge Base Management Script for Pip Chatbot
This script allows you to add documents to the ChromaDB vector database.
"""

import os
import sys
import argparse
import json
from pathlib import Path

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

try:
    from rag_service import rag_service
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"RAG service not available: {e}")
    print("Make sure to install requirements: pip install -r requirements.txt")
    RAG_AVAILABLE = False
    sys.exit(1)

def add_text_document(text: str, category: str, department: str = "all", importance: str = "medium"):
    """Add a text document to the knowledge base."""
    metadata = {
        'category': category,
        'department': department,
        'importance': importance,
        'source': 'manual_input'
    }
    
    success = rag_service.add_document(text, metadata)
    if success:
        print(f"✅ Added document to category: {category}")
    else:
        print(f"❌ Failed to add document")
    return success

def add_file_document(file_path: str, category: str, department: str = "all"):
    """Add a file document to the knowledge base."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract filename for metadata
        filename = Path(file_path).name
        
        metadata = {
            'category': category,
            'department': department,
            'source': 'file',
            'filename': filename
        }
        
        success = rag_service.add_document(content, metadata)
        if success:
            print(f"✅ Added file {filename} to category: {category}")
        else:
            print(f"❌ Failed to add file {filename}")
        return success
        
    except Exception as e:
        print(f"❌ Error reading file {file_path}: {e}")
        return False

def add_healthcare_policies():
    """Add sample healthcare policies to the knowledge base."""
    policies = [
        {
            'text': 'All healthcare workers must complete mandatory safety training annually. This includes infection control, emergency procedures, and patient safety protocols.',
            'category': 'training',
            'department': 'all',
            'importance': 'high'
        },
        {
            'text': 'Overtime requests must be submitted at least 24 hours in advance and require supervisor approval. Emergency overtime may be approved by the shift manager.',
            'category': 'policies',
            'department': 'all',
            'importance': 'high'
        },
        {
            'text': 'Healthcare workers are entitled to a 15-minute break for every 4 hours worked and a 30-minute meal break for shifts over 6 hours.',
            'category': 'policies',
            'department': 'all',
            'importance': 'medium'
        },
        {
            'text': 'Incident reports must be filed within 24 hours of any workplace incident, near miss, or patient safety concern.',
            'category': 'safety',
            'department': 'all',
            'importance': 'high'
        },
        {
            'text': 'Professional development requests should be submitted to HR with supervisor approval. Tuition reimbursement is available for approved courses.',
            'category': 'training',
            'department': 'all',
            'importance': 'medium'
        }
    ]
    
    print("📚 Adding healthcare policies to knowledge base...")
    for policy in policies:
        add_text_document(
            policy['text'],
            policy['category'],
            policy['department'],
            policy['importance']
        )

def main():
    parser = argparse.ArgumentParser(description='Manage Pip Chatbot Knowledge Base')
    parser.add_argument('--add-text', help='Add a text document')
    parser.add_argument('--add-file', help='Add a file document')
    parser.add_argument('--category', default='general', help='Document category')
    parser.add_argument('--department', default='all', help='Department (default: all)')
    parser.add_argument('--add-policies', action='store_true', help='Add sample healthcare policies')
    parser.add_argument('--init-sample', action='store_true', help='Initialize with sample data')
    
    args = parser.parse_args()
    
    if not RAG_AVAILABLE:
        print("❌ RAG service not available. Please check your Pinecone configuration.")
        return
    
    if args.init_sample or args.add_policies:
        print("🚀 Initializing sample healthcare workforce data...")
        rag_service.initialize_sample_data()
        
        if args.add_policies:
            add_healthcare_policies()
        
        print("✅ Sample data initialization complete!")
        
    elif args.add_text:
        print(f"📝 Adding text document to category: {args.category}")
        add_text_document(args.add_text, args.category, args.department)
        
    elif args.add_file:
        print(f"📁 Adding file document to category: {args.category}")
        add_file_document(args.add_file, args.category, args.department)
        
    else:
        print("🤖 Pip Chatbot Knowledge Base Manager")
        print("")
        print("Usage examples:")
        print("  python add_knowledge.py --init-sample")
        print("  python add_knowledge.py --add-text 'Shift changes must be approved by supervisor' --category policies")
        print("  python add_knowledge.py --add-file policy_doc.txt --category policies")
        print("  python add_knowledge.py --add-policies")
        print("")
        print("Categories: documentation, scheduling, policies, training, safety, general")

if __name__ == "__main__":
    main()
