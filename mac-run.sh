#!/bin/bash

###############################################################################
#                                                                             #
#            🍎 SCALIX CODE - MAC RUN SCRIPT 🍎                             #
#                                                                             #
#  This script sets up and runs Scalix Code on macOS.                       #
#  Usage: ./mac-run.sh [command]                                             #
#                                                                             #
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print header
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    SCALIX CODE - MAC RUN SCRIPT                  ║"
    echo "║                     🚀 Ready to execute 🚀                       ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    local missing=0

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Install from https://nodejs.org/"
        missing=1
    else
        local node_version=$(node --version)
        print_success "Node.js: $node_version"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        missing=1
    else
        local npm_version=$(npm --version)
        print_success "npm: $npm_version"
    fi

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm not found. Installing..."
        npm install -g pnpm
    else
        local pnpm_version=$(pnpm --version)
        print_success "pnpm: $pnpm_version"
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git not found"
        missing=1
    else
        local git_version=$(git --version)
        print_success "git: $git_version"
    fi

    if [ $missing -eq 1 ]; then
        print_error "Missing required tools. Please install them and try again."
        exit 1
    fi

    echo ""
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    cd "$SCRIPT_DIR"
    pnpm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    echo ""
}

# Build core package
build_core() {
    print_info "Building core package..."
    cd "$SCRIPT_DIR/core"
    pnpm run build
    if [ $? -eq 0 ]; then
        print_success "Core package built"
    else
        print_error "Failed to build core package"
        exit 1
    fi
    cd "$SCRIPT_DIR"
    echo ""
}

# Run development mode
run_dev() {
    print_info "Starting development mode (all packages)..."
    print_warning "Press Ctrl+C to stop"
    echo ""
    cd "$SCRIPT_DIR"
    pnpm run dev
}

# Run API server
run_api() {
    print_info "Starting API server..."
    print_warning "Press Ctrl+C to stop"
    echo ""
    cd "$SCRIPT_DIR"
    pnpm --filter @scalix/api run dev
}

# Run CLI
run_cli() {
    print_info "Starting CLI..."
    print_warning "Press Ctrl+C to stop"
    echo ""
    cd "$SCRIPT_DIR"
    pnpm --filter @scalix/cli run dev
}

# Run tests
run_tests() {
    print_info "Running tests..."
    cd "$SCRIPT_DIR"
    pnpm run test
    echo ""
}

# Run tests with coverage
run_coverage() {
    print_info "Running tests with coverage..."
    cd "$SCRIPT_DIR"
    pnpm run test:coverage
    echo ""
}

# Run example
run_example() {
    local example=$1
    if [ -z "$example" ]; then
        example="01-hello-world.ts"
    fi

    print_info "Running example: $example"
    cd "$SCRIPT_DIR"
    npx tsx examples/$example
    echo ""
}

# Show help
show_help() {
    echo -e "${BLUE}"
    echo "Usage: ./mac-run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup              - Install dependencies and build"
    echo "  dev                - Run all packages in watch mode"
    echo "  api                - Run API server only"
    echo "  cli                - Run CLI only"
    echo "  test               - Run test suite"
    echo "  coverage           - Run tests with coverage"
    echo "  example [file]     - Run example (default: 01-hello-world.ts)"
    echo "  build              - Build core package"
    echo "  clean              - Clean build artifacts"
    echo "  help               - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./mac-run.sh setup                      # First time setup"
    echo "  ./mac-run.sh dev                        # Start development"
    echo "  ./mac-run.sh api                        # Run API server"
    echo "  ./mac-run.sh example 02-api-client.ts  # Run specific example"
    echo "  ./mac-run.sh test                       # Run tests"
    echo -e "${NC}"
}

# Main script
main() {
    print_header

    local command=$1

    case "$command" in
        setup)
            check_prerequisites
            install_deps
            build_core
            print_success "Setup complete! Run './mac-run.sh dev' to start"
            ;;
        dev)
            check_prerequisites
            run_dev
            ;;
        api)
            check_prerequisites
            run_api
            ;;
        cli)
            check_prerequisites
            run_cli
            ;;
        test)
            check_prerequisites
            run_tests
            ;;
        coverage)
            check_prerequisites
            run_coverage
            ;;
        example)
            check_prerequisites
            run_example $2
            ;;
        build)
            check_prerequisites
            build_core
            ;;
        clean)
            print_info "Cleaning build artifacts..."
            cd "$SCRIPT_DIR"
            pnpm run clean
            print_success "Clean complete"
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main script
main "$@"
