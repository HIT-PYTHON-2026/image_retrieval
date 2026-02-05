# Image Retrieval System

A scalable image retrieval system built with modern architecture, designed for efficient image search and similarity matching using deep learning models.

## 🚀 Features

- **Deep Learning Powered**: Utilizes pre-trained models for accurate image feature extraction
- **RESTful API**: Clean API design for easy integration
- **Modular Architecture**: Well-separated concerns for maintainability and scalability
- **Efficient Storage**: Optimized image storage and retrieval mechanisms
- **Comprehensive Testing**: Unit tests with pytest framework

## 📁 Project Structure

```
image_retrieval/
├── .github/                 # GitHub configuration (CI/CD, workflows)
├── docs/                    # Documentation files
├── frontend/                # Frontend application (React/Vue/other)
├── models/                  # Pre-trained model weights
├── public/                  # Static assets and public files
├── scripts/                 # Utility scripts and deployment tools
├── src/
│   ├── app/                 # API layer
│   │   ├── app.py          # Main application entry point
│   │   └── router.py       # API route definitions
│   ├── core/               # Core business logic (privileged access)
│   │   ├── models/         # Model loading and inference
│   │   ├── database/       # Database operations
│   │   └── services/       # Business logic services
│   ├── external/           # External service integrations
│   │   ├── api_clients/    # Third-party API clients
│   │   └── services/       # External service wrappers
│   ├── storage/            # Storage layer (direct access by core only)
│   │   ├── image_store.py  # Image storage management
│   │   └── file_manager.py # File handling utilities
│   ├── test/               # Test suite
│   │   ├── unit/           # Unit tests
│   │   ├── integration/    # Integration tests
│   │   └── conftest.py     # Pytest configuration
│   └── utils/              # Utility functions
│       ├── helper.py       # Common helper functions
│       └── constants.py    # Application constants
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🏗️ Architecture

### Layer Design

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│              (frontend/ directory)                   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   API Layer                         │
│              (src/app/ directory)                   │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   app.py     │  │  router.py   │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  Core Layer                          │
│            (src/core/ directory)                    │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Models     │  │  Services    │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                 Storage Layer                       │
│            (src/storage/ directory)                 │
│  (Direct access only via Core layer)               │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Layer Isolation**: Each layer has specific responsibilities
2. **Core Privilege**: Only `core` module can access `storage` directly
3. **Separation of Concerns**: Each module has a clear purpose
4. **Testability**: Modular design facilitates comprehensive testing

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/image_retrieval.git
cd image_retrieval

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

## 📖 Usage

### Running the API Server

```bash
python -m src.app.app
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/search` | Search similar images |
| POST | `/api/v1/upload` | Upload new image |
| GET | `/api/v1/images/{id}` | Get image metadata |

## 🧪 Testing

```bash
# Run all tests
pytest src/test/

# Run with coverage
pytest --cov=src src/test/

# Run specific test file
pytest src/test/unit/test_models.py
```

## 📦 Dependencies

- **Framework**: FastAPI / Flask (to be determined)
- **ML Libraries**: PyTorch / TensorFlow
- **Database**: PostgreSQL / MongoDB
- **Storage**: Local filesystem / S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Pre-trained model providers
- Open source community
- Research papers on image retrieval

---

**Note**: This project follows the architecture where only the `core` module has direct access to the `storage` layer. All storage operations must go through the core logic layer.
