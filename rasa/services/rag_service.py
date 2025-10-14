"""
RAG (Retrieval-Augmented Generation) Service for Pip Chatbot
This service handles vector database operations and knowledge retrieval for healthcare workforce management.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
from pathlib import Path

# Vector database and embeddings
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
# Note: Using ChromaDB's built-in embeddings to avoid heavy dependencies

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthcareRAGService:
    """RAG service for healthcare workforce management knowledge."""
    
    def __init__(self):
        """Initialize the RAG service with ChromaDB and embeddings."""
        # ChromaDB configuration - use local storage in container
        self.chroma_persist_directory = os.getenv('CHROMA_PERSIST_DIRECTORY', '/tmp/chromadb')
        self.collection_name = os.getenv('CHROMA_COLLECTION_NAME', 'pipeline_healthcare_knowledge')
        
        # Initialize embedding model - try SentenceTransformer first, fallback to default
        try:
            self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
            logger.info("Using SentenceTransformer embeddings")
        except Exception as e:
            logger.warning(f"SentenceTransformer not available, using default embeddings: {e}")
            # Use ChromaDB's default embedding function
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        # Initialize ChromaDB
        self._initialize_chroma()
        
        # Initialize vector store (simplified without LangChain)
        self.vector_store = None
    
    def _initialize_chroma(self):
        """Initialize ChromaDB client."""
        try:
            # Try to connect to ChromaDB service first, fallback to local storage
            chroma_host = os.getenv('CHROMA_HOST', 'chromadb')
            chroma_port = os.getenv('CHROMA_PORT', '8000')
            
            try:
                # Connect to ChromaDB service
                self.chroma_client = chromadb.HttpClient(
                    host=chroma_host,
                    port=chroma_port,
                    settings=Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
                logger.info(f"Connected to ChromaDB service at {chroma_host}:{chroma_port}")
            except Exception as service_error:
                logger.warning(f"Failed to connect to ChromaDB service: {service_error}")
                logger.info("Falling back to local ChromaDB storage")
                
                # Fallback to local storage
                Path(self.chroma_persist_directory).mkdir(parents=True, exist_ok=True)
                self.chroma_client = chromadb.PersistentClient(
                    path=self.chroma_persist_directory,
                    settings=Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
                logger.info(f"Using ChromaDB Persistent client: {self.chroma_persist_directory}")
            
            # Get or create collection
            try:
                self.collection = self.chroma_client.get_collection(
                    name=self.collection_name,
                    embedding_function=self.embedding_function
                )
                logger.info(f"Connected to existing ChromaDB collection: {self.collection_name}")
            except Exception:
                # Create new collection
                self.collection = self.chroma_client.create_collection(
                    name=self.collection_name,
                    embedding_function=self.embedding_function,
                    metadata={"description": "Healthcare workforce management knowledge base"}
                )
                logger.info(f"Created new ChromaDB collection: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            self.chroma_client = None
            self.collection = None
    
    # Note: Using ChromaDB directly instead of LangChain for simplicity
    
    def add_document(self, text: str, metadata: Dict[str, Any], document_id: str = None):
        """Add a document to the vector database."""
        try:
            if not self.collection:
                logger.warning("ChromaDB not initialized. Cannot add document.")
                return False
            
            if not document_id:
                document_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Prepare metadata
            doc_metadata = {
                'timestamp': datetime.now().isoformat(),
                **metadata
            }
            
            # Add to ChromaDB collection
            self.collection.add(
                documents=[text],
                metadatas=[doc_metadata],
                ids=[document_id]
            )
            logger.info(f"Added document: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add document: {e}")
            return False
    
    def search_documents(self, query: str, top_k: int = 5, filter_metadata: Dict = None) -> List[Dict]:
        """Search for relevant documents."""
        try:
            if not self.collection:
                logger.warning("ChromaDB not initialized. Using fallback responses.")
                return self._get_fallback_documents(query)
            
            # Prepare where clause for filtering
            where_clause = None
            if filter_metadata:
                where_clause = filter_metadata
            
            # Search ChromaDB
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=where_clause
            )
            
            # Format results
            documents = []
            if results['documents'] and results['documents'][0]:
                for i, doc_text in enumerate(results['documents'][0]):
                    documents.append({
                        'text': doc_text,
                        'score': results['distances'][0][i] if results['distances'] else 0.0,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                    })
            
            logger.info(f"Found {len(documents)} relevant documents for query: {query}")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            return self._get_fallback_documents(query)
    
    def _get_fallback_documents(self, query: str) -> List[Dict]:
        """Fallback responses when ChromaDB is not available."""
        query_lower = query.lower()
        
        # Healthcare workforce knowledge base
        knowledge_base = {
            'shift': [
                {
                    'text': 'Healthcare workers typically work 8-12 hour shifts. Night shifts are common in hospitals and require special considerations for patient care and worker wellness.',
                    'metadata': {'category': 'shift_management', 'source': 'fallback'}
                },
                {
                    'text': 'Shift documentation should include department, hours worked, patient load, challenges faced, and successes achieved.',
                    'metadata': {'category': 'documentation', 'source': 'fallback'}
                }
            ],
            'schedule': [
                {
                    'text': 'Healthcare scheduling follows strict guidelines to ensure adequate staffing. Workers can request schedule changes through the workforce management system.',
                    'metadata': {'category': 'scheduling', 'source': 'fallback'}
                }
            ],
            'policy': [
                {
                    'text': 'Healthcare facilities have specific policies regarding overtime, breaks, safety protocols, and professional conduct. These policies are designed to protect both workers and patients.',
                    'metadata': {'category': 'policies', 'source': 'fallback'}
                }
            ],
            'training': [
                {
                    'text': 'Healthcare workers have access to continuing education programs, certification courses, and professional development opportunities to enhance their skills.',
                    'metadata': {'category': 'training', 'source': 'fallback'}
                }
            ]
        }
        
        # Find relevant fallback documents
        relevant_docs = []
        for category, docs in knowledge_base.items():
            if category in query_lower or any(keyword in query_lower for keyword in ['help', 'support', 'assist']):
                relevant_docs.extend(docs)
        
        return relevant_docs[:3]  # Return top 3 relevant documents
    
    def get_context_for_query(self, query: str, max_context_length: int = 1000) -> str:
        """Get relevant context for a user query."""
        documents = self.search_documents(query, top_k=3)
        
        if not documents:
            return "I don't have specific information about that topic, but I'm here to help with healthcare workforce management questions."
        
        # Combine relevant documents
        context_parts = []
        current_length = 0
        
        for doc in documents:
            text = doc['text']
            if current_length + len(text) <= max_context_length:
                context_parts.append(text)
                current_length += len(text)
            else:
                break
        
        return " ".join(context_parts)
    
    def initialize_sample_data(self):
        """Initialize the vector database with sample healthcare workforce data."""
        sample_documents = [
            {
                'text': 'Healthcare workers are required to document their shifts including patient interactions, procedures performed, and any incidents that occurred during their shift.',
                'metadata': {'category': 'documentation', 'department': 'all', 'importance': 'high'}
            },
            {
                'text': 'Shift schedules are typically posted 2-3 weeks in advance. Workers can request schedule changes through the workforce management portal or by speaking with their supervisor.',
                'metadata': {'category': 'scheduling', 'department': 'all', 'importance': 'high'}
            },
            {
                'text': 'Overtime policies vary by facility but generally require approval from management. Healthcare workers should be mindful of fatigue management and patient safety.',
                'metadata': {'category': 'policies', 'department': 'all', 'importance': 'medium'}
            },
            {
                'text': 'Professional development and continuing education are encouraged for all healthcare workers. Many facilities offer tuition reimbursement and time off for training.',
                'metadata': {'category': 'training', 'department': 'all', 'importance': 'medium'}
            },
            {
                'text': 'Patient safety is the top priority. Healthcare workers should report any safety concerns, near misses, or incidents immediately through the appropriate channels.',
                'metadata': {'category': 'safety', 'department': 'all', 'importance': 'high'}
            }
        ]
        
        logger.info("Initializing sample healthcare workforce data...")
        for i, doc in enumerate(sample_documents):
            self.add_document(doc['text'], doc['metadata'], f"sample_doc_{i}")
        
        logger.info(f"Added {len(sample_documents)} sample documents to vector database")

# Global RAG service instance
rag_service = HealthcareRAGService()
