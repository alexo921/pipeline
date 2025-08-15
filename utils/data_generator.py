import numpy as np
import pandas as pd
import os
from typing import Tuple, Optional
from sklearn.model_selection import train_test_split

def generate_synthetic_data(
    n_queries: int = 1000,
    n_candidates: int = 5000,
    n_samples: int = 50000,
    positive_ratio: float = 0.2,
    random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generate synthetic data for two-tower model training.
    
    Args:
        n_queries: Number of unique queries (users)
        n_candidates: Number of unique candidates (items)
        n_samples: Total number of samples
        positive_ratio: Ratio of positive samples
        random_state: Random seed
        
    Returns:
        Tuple of (query_ids, candidate_ids, labels)
    """
    np.random.seed(random_state)
    
    # Generate random query-candidate pairs
    query_ids = np.random.randint(0, n_queries, size=n_samples)
    candidate_ids = np.random.randint(0, n_candidates, size=n_samples)
    
    # Create some patterns to make the data more realistic
    # Some queries prefer certain types of candidates
    query_preferences = np.random.randn(n_queries, 10)  # 10 latent factors
    candidate_features = np.random.randn(n_candidates, 10)
    
    # Compute base similarity scores
    similarities = np.array([
        np.dot(query_preferences[q], candidate_features[c]) 
        for q, c in zip(query_ids, candidate_ids)
    ])
    
    # Add noise
    similarities += np.random.normal(0, 0.5, size=n_samples)
    
    # Convert to binary labels based on threshold
    threshold = np.percentile(similarities, (1 - positive_ratio) * 100)
    labels = (similarities > threshold).astype(float)
    
    return query_ids, candidate_ids, labels

def create_train_val_test_split(
    query_ids: np.ndarray,
    candidate_ids: np.ndarray,
    labels: np.ndarray,
    train_size: float = 0.7,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[Tuple[np.ndarray, np.ndarray, np.ndarray], ...]:
    """
    Split data into train, validation, and test sets.
    
    Returns:
        Tuple of (train_data, val_data, test_data) where each is (query_ids, candidate_ids, labels)
    """
    # First split: train + val vs test
    X = np.column_stack([query_ids, candidate_ids])
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, labels, test_size=1 - train_size - val_size, random_state=random_state, stratify=labels
    )
    
    # Second split: train vs val
    val_ratio = val_size / (train_size + val_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_ratio, random_state=random_state, stratify=y_temp
    )
    
    # Extract query and candidate IDs
    train_data = (X_train[:, 0], X_train[:, 1], y_train)
    val_data = (X_val[:, 0], X_val[:, 1], y_val)
    test_data = (X_test[:, 0], X_test[:, 1], y_test)
    
    return train_data, val_data, test_data

def load_movielens_data(data_path: Optional[str] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Load MovieLens dataset for two-tower model training.
    
    Args:
        data_path: Path to MovieLens dataset (if None, generates synthetic data)
        
    Returns:
        Tuple of (user_ids, movie_ids, ratings_binary)
    """
    if data_path is None or not os.path.exists(data_path):
        print("MovieLens data not found. Generating synthetic data instead.")
        return generate_synthetic_data()
    
    # Load MovieLens data (assuming ratings.csv format)
    try:
        df = pd.read_csv(data_path)
        
        # Map user and movie IDs to continuous integers
        user_mapping = {uid: i for i, uid in enumerate(df['userId'].unique())}
        movie_mapping = {mid: i for i, mid in enumerate(df['movieId'].unique())}
        
        query_ids = df['userId'].map(user_mapping).values
        candidate_ids = df['movieId'].map(movie_mapping).values
        
        # Convert ratings to binary (1 if rating >= 4, 0 otherwise)
        labels = (df['rating'] >= 4).astype(float).values
        
        return query_ids, candidate_ids, labels
        
    except Exception as e:
        print(f"Error loading MovieLens data: {e}")
        print("Generating synthetic data instead.")
        return generate_synthetic_data()

def create_negative_samples(
    query_ids: np.ndarray,
    candidate_ids: np.ndarray,
    labels: np.ndarray,
    n_candidates: int,
    negative_ratio: int = 4
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Create negative samples for training (useful for recommendation systems).
    
    Args:
        query_ids: Array of query IDs
        candidate_ids: Array of candidate IDs  
        labels: Array of labels (should be all positive)
        n_candidates: Total number of candidates available
        negative_ratio: Number of negative samples per positive sample
        
    Returns:
        Augmented arrays with negative samples added
    """
    # Get positive interactions
    positive_interactions = set(zip(query_ids, candidate_ids))
    
    new_query_ids = list(query_ids)
    new_candidate_ids = list(candidate_ids)
    new_labels = list(labels)
    
    # Generate negative samples
    for query_id in query_ids:
        # Generate random candidates for this query
        negative_candidates = np.random.choice(n_candidates, size=negative_ratio, replace=False)
        
        for candidate_id in negative_candidates:
            # Only add if not a positive interaction
            if (query_id, candidate_id) not in positive_interactions:
                new_query_ids.append(query_id)
                new_candidate_ids.append(candidate_id)
                new_labels.append(0.0)
    
    return np.array(new_query_ids), np.array(new_candidate_ids), np.array(new_labels)

def print_data_statistics(query_ids: np.ndarray, candidate_ids: np.ndarray, labels: np.ndarray):
    """Print statistics about the dataset."""
    print("Dataset Statistics:")
    print(f"Total samples: {len(labels):,}")
    print(f"Unique queries: {len(np.unique(query_ids)):,}")
    print(f"Unique candidates: {len(np.unique(candidate_ids)):,}")
    print(f"Positive samples: {np.sum(labels):,.0f} ({np.mean(labels):.2%})")
    print(f"Negative samples: {len(labels) - np.sum(labels):,.0f} ({1 - np.mean(labels):.2%})")
    print(f"Sparsity: {1 - len(labels) / (len(np.unique(query_ids)) * len(np.unique(candidate_ids))):.4%}")
