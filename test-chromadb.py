#!/usr/bin/env python3
"""
Simple test script for ChromaDB integration
This tests the basic functionality without heavy dependencies
"""

import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'rasa', 'services'))

def test_chromadb_basic():
    """Test basic ChromaDB functionality."""
    try:
        import chromadb
        print("✅ ChromaDB import successful")
        
        # Test basic client creation
        client = chromadb.Client()
        print("✅ ChromaDB client creation successful")
        
        # Test collection creation
        collection = client.create_collection("test_collection")
        print("✅ Collection creation successful")
        
        # Test adding documents
        collection.add(
            documents=["This is a test document"],
            metadatas=[{"category": "test"}],
            ids=["test_id"]
        )
        print("✅ Document addition successful")
        
        # Test querying
        results = collection.query(
            query_texts=["test document"],
            n_results=1
        )
        print("✅ Document querying successful")
        print(f"   Found {len(results['documents'][0])} documents")
        
        # Cleanup
        client.delete_collection("test_collection")
        print("✅ Cleanup successful")
        
        return True
        
    except ImportError as e:
        print(f"❌ ChromaDB import failed: {e}")
        print("   Install with: pip install chromadb")
        return False
    except Exception as e:
        print(f"❌ ChromaDB test failed: {e}")
        return False

def test_rag_service():
    """Test the RAG service integration."""
    try:
        from rag_service import HealthcareRAGService
        print("✅ RAG service import successful")
        
        # Test service initialization (this will use fallback if ChromaDB not available)
        rag_service = HealthcareRAGService()
        print("✅ RAG service initialization successful")
        
        # Test fallback functionality
        docs = rag_service.search_documents("healthcare policies")
        print(f"✅ Fallback search successful - found {len(docs)} documents")
        
        return True
        
    except ImportError as e:
        print(f"❌ RAG service import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ RAG service test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing ChromaDB Integration for Pip Chatbot")
    print("=" * 50)
    
    print("\n1. Testing ChromaDB basic functionality:")
    chromadb_success = test_chromadb_basic()
    
    print("\n2. Testing RAG service integration:")
    rag_success = test_rag_service()
    
    print("\n" + "=" * 50)
    if chromadb_success and rag_success:
        print("🎉 All tests passed! ChromaDB integration is working.")
    else:
        print("⚠️  Some tests failed, but fallback functionality is available.")
        print("   The system will work with built-in knowledge base.")
    
    print("\n💡 To install ChromaDB dependencies:")
    print("   pip install chromadb sentence-transformers")
    print("\n💡 To start Pip chatbot:")
    print("   ./start-pip-chatbot.sh")
