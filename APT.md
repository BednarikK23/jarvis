# System Dependencies (APT)

This project runs on Linux (Mint/Ubuntu) and requires specific system packages.

## Core Dependencies
These must be installed via `apt`:

```bash
# Update package list
sudo apt update

# 1. Python 3.12 and Virtual Environment
# Required for the FastAPI backend
sudo apt install python3.12 python3.12-venv python3-pip

# 2. Node.js and npm
# Required for the React Frontend (Phase A)
# Note: Ubuntu repos might have older versions. 
# It is recommended to use NodeSource or NVM, but for apt:
sudo apt install nodejs npm

# 3. Git (likely already installed)
sudo apt install git
```

## AI Engine
**Ollama** is required but is usually installed via their install script, not apt.
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Verify Installations
```bash
python3 --version
node -v
npm -v
ollama --version
```
